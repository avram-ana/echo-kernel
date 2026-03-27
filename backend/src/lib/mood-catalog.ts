/**
 * Canonical taxonomy for Echo Kernel catalog + mood logs.
 * CSV "mood" values are normalized into these labels via aliases.
 */
export const CANONICAL_MOODS = [
  "nostalgic",
  "melancholic",
  "dreamy",
  "emotional",
  "playful",
  "brooding",
  "hopeful",
  "empowering",
  "romantic",
  "confident",
  "epic",
  "raw",
  "majestic",
  "heartbroken",
  "energetic",
  "defiant",
  "intense",
  "adventurous",
  "tender",
  "warm",
  "passionate",
  "reflective",
  "joyful",
  "rebellious",
  "eerie",
  "carefree",
  "dark",
  "soft",
  "groovy",
  "psychedelic",
  "party",
] as const;

export type CanonicalMood = (typeof CANONICAL_MOODS)[number];

const CANONICAL_SET = new Set<string>(CANONICAL_MOODS);

/** Rough energy 1–10 used for dare / contrast picks (deterministic, not ML). */
export const MOOD_ENERGY: Record<string, number> = {
  nostalgic: 4,
  melancholic: 3,
  dreamy: 4,
  emotional: 5,
  playful: 6,
  brooding: 3,
  hopeful: 6,
  empowering: 7,
  romantic: 5,
  confident: 7,
  epic: 8,
  raw: 7,
  majestic: 8,
  heartbroken: 2,
  energetic: 8,
  defiant: 7,
  intense: 8,
  adventurous: 7,
  tender: 4,
  warm: 5,
  passionate: 7,
  reflective: 4,
  joyful: 8,
  rebellious: 7,
  eerie: 4,
  carefree: 7,
  dark: 3,
  soft: 3,
  groovy: 6,
  psychedelic: 6,
  party: 9,
};

/**
 * CSV mood strings (and close variants) -> canonical label.
 * Anything unlisted still passes through fuzzy match against CANONICAL_MOODS.
 */
export const MOOD_ALIASES: Record<string, CanonicalMood> = {
  // direct / near-direct
  angsty: "brooding",
  existential: "reflective",
  moody: "brooding",
  yearning: "tender",
  chaotic: "intense",
  euphoric: "joyful",
  uplifting: "hopeful",
  motivational: "empowering",
  triumphant: "empowering",
  resilient: "hopeful",
  comforting: "warm",
  wistful: "nostalgic",
  bright: "joyful",
  swagger: "confident",
  aggressive: "intense",
  furious: "intense",
  hyped: "energetic",
  disturbed: "dark",
  grieving: "heartbroken",
  obsessed: "intense",
  restless: "reflective",
  cool: "confident",
  sensual: "romantic",
  sultry: "passionate",
  seductive: "passionate",
  somber: "melancholic",
  lonely: "melancholic",
  devastated: "heartbroken",
  hurt: "heartbroken",
  tormented: "dark",
  haunting: "eerie",
  gothic: "dark",
  mystical: "dreamy",
  mysterious: "eerie",
  nocturnal: "dark",
  dissociative: "dreamy",
  dramatic: "epic",
  industrial: "raw",
  wild: "energetic",
  urgent: "intense",
  electric: "energetic",
  adrenaline: "energetic",
  heavy: "raw",
  volatile: "intense",
  ominous: "eerie",
  desperate: "emotional",
  edgy: "rebellious",
  disco: "party",
  chill: "soft",
  floating: "dreamy",
  cozy: "warm",
  obsessive: "intense",
  hyped_up: "energetic",
  hypnotic: "dreamy",
};

/** Description tokens -> bump these canonical moods */
export const DESCRIPTION_MOOD_HINTS: { words: string[]; moods: CanonicalMood[] }[] = [
  { words: ["sad", "cry", "tears", "blue", "down", "lost", "empty"], moods: ["melancholic", "heartbroken"] },
  { words: ["love", "crush", "kiss", "heart"], moods: ["romantic", "tender"] },
  { words: ["angry", "mad", "rage", "fight"], moods: ["defiant", "intense", "rebellious"] },
  { words: ["calm", "peace", "soft", "gentle"], moods: ["soft", "tender", "dreamy"] },
  { words: ["hype", "dance", "party", "move"], moods: ["party", "energetic", "groovy"] },
  { words: ["nostalgia", "remember", "memory", "past"], moods: ["nostalgic"] },
  { words: ["hope", "better", "tomorrow", "light"], moods: ["hopeful", "empowering"] },
  { words: ["dark", "night", "shadow"], moods: ["dark", "brooding", "eerie"] },
  { words: ["dream", "float", "haze"], moods: ["dreamy", "psychedelic"] },
  { words: ["fun", "silly", "play"], moods: ["playful", "joyful"] },
  { words: ["epic", "big", "cinematic"], moods: ["epic", "majestic"] },
  { words: ["raw", "honest", "real"], moods: ["raw", "emotional"] },
  { words: ["adventure", "road", "travel"], moods: ["adventurous", "carefree"] },
  { words: ["weird", "strange", "creepy"], moods: ["eerie", "psychedelic"] },
];

function similarity(a: string, b: string): number {
  if (a === b) return 1;
  if (a.includes(b) || b.includes(a)) return 0.85;
  const longer = a.length > b.length ? a : b;
  const shorter = a.length > b.length ? b : a;
  if (!longer.length) return 0;
  let matches = 0;
  for (const c of shorter) if (longer.includes(c)) matches++;
  return matches / longer.length;
}

function nearestCanonical(raw: string): CanonicalMood {
  const k = raw.trim().toLowerCase();
  let best: CanonicalMood = "reflective";
  let bestScore = 0;
  for (const c of CANONICAL_MOODS) {
    const s = similarity(k, c);
    if (s > bestScore) {
      bestScore = s;
      best = c;
    }
  }
  return bestScore >= 0.35 ? best : "reflective";
}

export function normalizeRawMoodToCanonical(raw: string): CanonicalMood {
  const k = raw.trim().toLowerCase().replace(/\s+/g, "_");
  const simple = raw.trim().toLowerCase();
  if (CANONICAL_SET.has(simple)) return simple as CanonicalMood;
  if (MOOD_ALIASES[simple]) return MOOD_ALIASES[simple];
  if (MOOD_ALIASES[k]) return MOOD_ALIASES[k];
  return nearestCanonical(simple);
}

function normalizeText(s: string) {
  return s.toLowerCase().replace(/[^\w\s]/g, " ");
}

const EMOJI_MOOD_BOOSTS: Record<string, Partial<Record<string, number>>> = {
  "🐦‍🔥": { intense: 2, epic: 2, energetic: 1, defiant: 1 },
  "🎸": { raw: 2, rebellious: 2, energetic: 1 },
  "💫": { dreamy: 2, psychedelic: 1, soft: 1 },
  "💢": { defiant: 2, intense: 2, rebellious: 1 },
  "🥀": { melancholic: 2, heartbroken: 2, tender: 1 },
  "💔": { heartbroken: 3, emotional: 1 },
  "💥": { energetic: 2, party: 1, intense: 1 },
  "🎧": { reflective: 2, soft: 1, groovy: 1 },
  "🪇": { groovy: 2, party: 2, playful: 1 },
  "🩷": { romantic: 2, tender: 2, warm: 1 },
  "💅🏻": { confident: 2, playful: 2, carefree: 1 },
  "🫏": { reflective: 1, brooding: 1, tender: 1 },
};

function hexToMoodHints(hex: string): Partial<Record<string, number>> {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return {};
  const h = m[1]!;
  const r = parseInt(h.slice(0, 2), 16) / 255;
  const g = parseInt(h.slice(2, 4), 16) / 255;
  const b = parseInt(h.slice(4, 6), 16) / 255;
  const lum = r * 0.299 + g * 0.587 + b * 0.114;
  const out: Partial<Record<string, number>> = {};
  if (lum < 0.28) {
    out.dark = 2;
    out.brooding = 1;
  }
  if (lum > 0.78) {
    out.joyful = 1;
    out.hopeful = 1;
  }
  if (r > g + 0.12 && r > b + 0.12) {
    out.passionate = 1;
    out.intense = 1;
  }
  if (b > r + 0.1 && b > g + 0.1) {
    out.melancholic = 1;
    out.dreamy = 1;
  }
  if (g > r + 0.05 && g > b + 0.05) {
    out.soft = 1;
    out.hopeful = 1;
  }
  return out;
}

/** Score canonical moods from log fields; highest wins as primary. */
export function scoreMoodsFromLog(input: {
  description: string;
  emoji: string;
  color: string;
  moodScore: number;
}): Map<string, number> {
  const scores = new Map<string, number>();
  for (const m of CANONICAL_MOODS) scores.set(m, 0);

  const bump = (mood: string, n: number) => {
    if (!CANONICAL_SET.has(mood)) return;
    scores.set(mood, (scores.get(mood) || 0) + n);
  };

  // Energy slider
  const s = input.moodScore;
  if (s <= 2) {
    ["melancholic", "heartbroken", "dark", "brooding"].forEach((m) => bump(m, 2));
  } else if (s <= 4) {
    ["tender", "reflective", "soft", "dreamy"].forEach((m) => bump(m, 1.5));
  } else if (s <= 6) {
    ["emotional", "hopeful", "warm", "groovy"].forEach((m) => bump(m, 1.5));
  } else if (s <= 8) {
    ["energetic", "confident", "passionate", "intense"].forEach((m) => bump(m, 2));
  } else {
    ["party", "energetic", "joyful", "defiant", "epic"].forEach((m) => bump(m, 2));
  }

  const text = normalizeText(input.description);
  for (const hint of DESCRIPTION_MOOD_HINTS) {
    if (hint.words.some((w) => w.length >= 3 && text.includes(w))) {
      for (const m of hint.moods) bump(m, 2);
    }
  }
  // also boost if user literally types a canonical mood name
  for (const m of CANONICAL_MOODS) {
    if (text.includes(m)) bump(m, 3);
  }

  const emojiBoost = EMOJI_MOOD_BOOSTS[input.emoji.trim()] ?? {};
  for (const [k, v] of Object.entries(emojiBoost)) {
    if (typeof v === "number" && CANONICAL_SET.has(k)) bump(k, v);
  }
  // substring match for composite emoji keys
  if (!emojiBoost || Object.keys(emojiBoost).length === 0) {
    for (const [em, partial] of Object.entries(EMOJI_MOOD_BOOSTS)) {
      if (input.emoji.includes(em)) {
        for (const [k, v] of Object.entries(partial)) {
          if (typeof v === "number" && CANONICAL_SET.has(k)) bump(k, v);
        }
        break;
      }
    }
  }

  const colorBoost = hexToMoodHints(input.color);
  for (const [k, v] of Object.entries(colorBoost)) {
    if (typeof v === "number") bump(k, v);
  }

  return scores;
}

export function primaryMoodFromScores(scores: Map<string, number>): CanonicalMood {
  let best: CanonicalMood = "reflective";
  let bestN = -1;
  for (const m of CANONICAL_MOODS) {
    const n = scores.get(m) || 0;
    if (n > bestN) {
      bestN = n;
      best = m;
    }
  }
  return best;
}

export function dareMoodFromPrimary(primary: CanonicalMood, moodScore: number): CanonicalMood {
  const targetEnergy = 11 - moodScore;
  let best: CanonicalMood = "party";
  let bestDist = 999;
  for (const m of CANONICAL_MOODS) {
    if (m === primary) continue;
    const e = MOOD_ENERGY[m] ?? 5;
    const d = Math.abs(e - targetEnergy);
    if (d < bestDist) {
      bestDist = d;
      best = m;
    }
  }
  if (best === primary) {
    return CANONICAL_MOODS.find((x) => x !== primary) ?? "party";
  }
  return best;
}
