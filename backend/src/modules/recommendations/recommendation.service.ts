import type { Song, SongRecommendation } from "@prisma/client";
import { prisma } from "../../lib/prisma.js";
import {
  CANONICAL_MOODS,
  dareMoodFromPrimary,
  primaryMoodFromScores,
  scoreMoodsFromLog,
  type CanonicalMood,
} from "../../lib/mood-catalog.js";

/**
 * Deterministic recommendations from the Echo Kernel CSV catalog.
 * User log (text, emoji, color, energy) -> canonical moods -> songs by `Song.mood`.
 * Past recommendations per mood are rotated until the mood pool is exhausted, then reuse.
 */

const EXPLANATION = {
  mood_match: "picked for your mood",
  dare: "your dare track",
  taste_based: "based on your taste",
} as const;

async function loadSongs(): Promise<Song[]> {
  return prisma.song.findMany();
}

/** For each canonical mood, song ids this user has already been recommended (any session). */
async function getUsedSongIdsByMood(userId: string): Promise<Map<string, Set<string>>> {
  const recs = await prisma.songRecommendation.findMany({
    where: { userId, songId: { not: null } },
    select: { songId: true },
  });
  const ids = [...new Set(recs.map((r) => r.songId).filter(Boolean))] as string[];
  if (!ids.length) return new Map();

  const songs = await prisma.song.findMany({
    where: { id: { in: ids } },
    select: { id: true, mood: true },
  });

  const map = new Map<string, Set<string>>();
  for (const s of songs) {
    if (!map.has(s.mood)) map.set(s.mood, new Set());
    map.get(s.mood)!.add(s.id);
  }
  return map;
}

function pickFromMoodPool(pool: Song[], usedIds: Set<string>, rng: () => number): Song {
  const fresh = pool.filter((s) => !usedIds.has(s.id));
  if (fresh.length) return fresh[Math.floor(rng() * fresh.length)]!;
  return pool[Math.floor(rng() * pool.length)]!;
}

/** Weight moods the user rated highly (via linked catalog row). */
export async function getUserMoodWeights(userId: string): Promise<Map<string, number>> {
  const ratings = await prisma.songRating.findMany({
    where: { userId },
    include: { recommendation: true },
  });
  const songIds = [
    ...new Set(
      ratings.map((r) => r.recommendation.songId).filter((x): x is string => typeof x === "string" && x.length > 0)
    ),
  ];
  if (!songIds.length) return new Map();

  const songs = await prisma.song.findMany({
    where: { id: { in: songIds } },
    select: { id: true, mood: true },
  });
  const idToMood = new Map(songs.map((s) => [s.id, s.mood]));

  const map = new Map<string, number>();
  for (const r of ratings) {
    const sid = r.recommendation.songId;
    if (!sid) continue;
    const mood = idToMood.get(sid);
    if (!mood) continue;
    map.set(mood, (map.get(mood) || 0) + r.rating);
  }
  return map;
}

export async function generateRecommendationsForMood(params: {
  userId: string;
  moodId: string;
  moodScore: number;
  description: string;
  emoji: string;
  color: string;
}): Promise<
  Pick<
    SongRecommendation,
    | "title"
    | "artist"
    | "genre"
    | "recommendationType"
    | "externalUrl"
    | "explanationLabel"
    | "songId"
  >[]
> {
  const songs = await loadSongs();
  if (!songs.length) {
    throw new Error("No songs in catalog — run prisma db seed (loads data/echo_kernel_artist_songs_moods.csv)");
  }

  const byMood = new Map<string, Song[]>();
  for (const s of songs) {
    if (!byMood.has(s.mood)) byMood.set(s.mood, []);
    byMood.get(s.mood)!.push(s);
  }

  const scores = scoreMoodsFromLog({
    description: params.description,
    emoji: params.emoji,
    color: params.color,
    moodScore: params.moodScore,
  });
  let primary: CanonicalMood = primaryMoodFromScores(scores);
  if (!byMood.has(primary) || byMood.get(primary)!.length === 0) {
    const fallback = [...byMood.keys()].sort(
      (a, b) => (byMood.get(b)!.length || 0) - (byMood.get(a)!.length || 0)
    )[0];
    if (fallback) primary = fallback as CanonicalMood;
  }

  let dareMood: CanonicalMood = dareMoodFromPrimary(primary, params.moodScore);
  if (!byMood.has(dareMood) || byMood.get(dareMood)!.length === 0) {
    dareMood =
      [...CANONICAL_MOODS].find((m) => byMood.has(m) && m !== primary && byMood.get(m)!.length > 0) ?? primary;
  }

  const usedByMood = await getUsedSongIdsByMood(params.userId);
  const rng = Math.random;

  const poolPrimary = byMood.get(primary) ?? songs;
  const poolDare = byMood.get(dareMood) ?? songs.filter((s) => s.mood !== primary);
  const usedPrimary = usedByMood.get(primary) ?? new Set();
  const usedDare = usedByMood.get(dareMood) ?? new Set();

  const moodPick = pickFromMoodPool(poolPrimary, usedPrimary, rng);
  const used = new Set<string>([moodPick.id]);

  const dareCandidates = poolDare.filter((s) => !used.has(s.id));
  const darePick = pickFromMoodPool(
    dareCandidates.length ? dareCandidates : songs.filter((s) => !used.has(s.id)),
    usedDare,
    rng
  );
  used.add(darePick.id);

  const moodWeights = await getUserMoodWeights(params.userId);
  let tastePick: Song | null = null;

  const tastePool = songs.filter((s) => !used.has(s.id));
  if (moodWeights.size > 0 && tastePool.length) {
    let best: Song = tastePool[0]!;
    let bestW = -1;
    for (const s of tastePool) {
      const mw = moodWeights.get(s.mood) || 0;
      const affinity = s.mood === primary ? 1.5 : 0;
      const w = mw + affinity + rng() * 0.35;
      if (w > bestW) {
        bestW = w;
        best = s;
      }
    }
    tastePick = best;
  }

  if (!tastePick) {
    const usedTaste = usedByMood.get(primary) ?? new Set();
    const primaryTastePool = tastePool.filter((s) => s.mood === primary);
    tastePick = pickFromMoodPool(
      primaryTastePool.length ? primaryTastePool : tastePool.length ? tastePool : songs.filter((s) => !used.has(s.id)),
      usedTaste,
      rng
    );
  }
  used.add(tastePick.id);

  const rowFor = (s: Song, type: "mood_match" | "dare" | "taste_based") => ({
    songId: s.id,
    title: s.title,
    artist: s.artist,
    genre: s.mood,
    recommendationType: type,
    externalUrl: s.externalUrl,
    explanationLabel: EXPLANATION[type],
  });

  return [
    rowFor(moodPick, "mood_match"),
    rowFor(darePick, "dare"),
    rowFor(tastePick, "taste_based"),
  ];
}
