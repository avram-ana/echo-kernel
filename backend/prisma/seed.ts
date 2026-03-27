import { PrismaClient, TimeOfDay, RecommendationType, PlaylistPreset } from "@prisma/client";
import bcrypt from "bcryptjs";
import { loadSongCatalogFromCsv, resolveCatalogPath } from "../src/lib/song-csv";

const prisma = new PrismaClient();

async function main() {
  await prisma.playlistItem.deleteMany();
  await prisma.playlist.deleteMany();
  await prisma.emailVerificationToken.deleteMany();
  await prisma.passwordResetToken.deleteMany();
  await prisma.songRating.deleteMany();
  await prisma.songRecommendation.deleteMany();
  await prisma.mood.deleteMany();
  await prisma.greeting.deleteMany();
  await prisma.adminLog.deleteMany();
  await prisma.user.deleteMany();
  await prisma.song.deleteMany();

  const catalogPath = resolveCatalogPath();
  const catalogRows = loadSongCatalogFromCsv(catalogPath);
  if (!catalogRows.length) {
    throw new Error(`No rows loaded from ${catalogPath}`);
  }

  await prisma.song.createMany({
    data: catalogRows.map((r) => ({
      artist: r.artist,
      title: r.title,
      mood: r.mood,
      catalogKey: r.catalogKey,
      genre: "catalog",
      externalUrl: `https://www.youtube.com/results?search_query=${encodeURIComponent(`${r.title} ${r.artist}`)}`,
    })),
  });

  const demoPass = await bcrypt.hash("Demo12345", 12);
  const adminPass = await bcrypt.hash("Admin12345", 12);

  const demo = await prisma.user.create({
    data: {
      username: "demo",
      email: "demo@echokernel.app",
      passwordHash: demoPass,
      role: "user",
      emailVerifiedAt: new Date(),
    },
  });

  const admin = await prisma.user.create({
    data: {
      username: "admin",
      email: "admin@echokernel.app",
      passwordHash: adminPass,
      role: "admin",
      emailVerifiedAt: new Date(),
    },
  });

  const presetPlaylists = (userId: string) => [
    { userId, name: "Comfort songs", preset: PlaylistPreset.comfort },
    { userId, name: "Late-night songs", preset: PlaylistPreset.late_night },
    { userId, name: "Melancholic", preset: PlaylistPreset.emotional_wreck },
    { userId, name: "Villain arc starters", preset: PlaylistPreset.villain_arc },
  ];
  await prisma.playlist.createMany({ data: presetPlaylists(demo.id) });
  await prisma.playlist.createMany({ data: presetPlaylists(admin.id) });

  const greetingSeeds: { content: string; timeOfDay: TimeOfDay; userId: string }[] = [
    { content: "Morning haze, soft beats — you’re allowed to begin gently.", timeOfDay: TimeOfDay.morning, userId: demo.id },
    { content: "Rise slow. The soundtrack will meet you halfway.", timeOfDay: TimeOfDay.morning, userId: demo.id },
    { content: "Afternoon shimmer — turn the volume on your feelings.", timeOfDay: TimeOfDay.afternoon, userId: demo.id },
    { content: "Midday pulse: name the mood, keep the melody.", timeOfDay: TimeOfDay.afternoon, userId: demo.id },
    { content: "Evening glass light — what color is your calm?", timeOfDay: TimeOfDay.evening, userId: demo.id },
    { content: "Golden hour journal: one line, one song.", timeOfDay: TimeOfDay.evening, userId: demo.id },
    { content: "Night mode: neon soft, heart loud.", timeOfDay: TimeOfDay.night, userId: demo.id },
    { content: "Stars out — let the quiet have a bassline.", timeOfDay: TimeOfDay.night, userId: demo.id },
    { content: "Admin dawn check-in.", timeOfDay: TimeOfDay.morning, userId: admin.id },
    { content: "Admin midnight static.", timeOfDay: TimeOfDay.night, userId: admin.id },
  ];

  for (const g of greetingSeeds) {
    await prisma.greeting.create({ data: g });
  }

  const songs = await prisma.song.findMany();
  const pick = (i: number) => songs[i % songs.length]!;

  const mood1 = await prisma.mood.create({
    data: {
      userId: demo.id,
      description: "Feeling floaty but a little anxious — want something honest.",
      emoji: "🌙",
      color: "#a7f3d0",
      moodScore: 6,
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    },
  });

  const m1s = [pick(0), pick(12), pick(3)];
  const recs1 = await Promise.all(
    [
      { type: RecommendationType.mood_match, label: "picked for your mood", order: 0 },
      { type: RecommendationType.dare, label: "your dare track", order: 1 },
      { type: RecommendationType.taste_based, label: "based on your taste", order: 2 },
    ].map((meta, idx) =>
      prisma.songRecommendation.create({
        data: {
          moodId: mood1.id,
          userId: demo.id,
          songId: m1s[idx]!.id,
          title: m1s[idx]!.title,
          artist: m1s[idx]!.artist,
          genre: m1s[idx]!.mood,
          recommendationType: meta.type,
          externalUrl: m1s[idx]!.externalUrl,
          explanationLabel: meta.label,
          displayOrder: meta.order,
          createdAt: mood1.createdAt,
        },
      })
    )
  );

  await prisma.songRating.create({
    data: {
      userId: demo.id,
      recommendationId: recs1[2]!.id,
      rating: 5,
      note: "Yes — more like this please",
    },
  });

  const mood2 = await prisma.mood.create({
    data: {
      userId: demo.id,
      description: "High energy, need to move.",
      emoji: "⚡",
      color: "#bef264",
      moodScore: 9,
      createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    },
  });
  const m2s = [pick(5), pick(Math.min(28, songs.length - 1)), pick(7)];
  await Promise.all(
    [
      { type: RecommendationType.mood_match, label: "picked for your mood", order: 0 },
      { type: RecommendationType.dare, label: "your dare track", order: 1 },
      { type: RecommendationType.taste_based, label: "based on your taste", order: 2 },
    ].map((meta, idx) =>
      prisma.songRecommendation.create({
        data: {
          moodId: mood2.id,
          userId: demo.id,
          songId: m2s[idx]!.id,
          title: m2s[idx]!.title,
          artist: m2s[idx]!.artist,
          genre: m2s[idx]!.mood,
          recommendationType: meta.type,
          externalUrl: m2s[idx]!.externalUrl,
          explanationLabel: meta.label,
          displayOrder: meta.order,
          createdAt: mood2.createdAt,
        },
      })
    )
  );
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
