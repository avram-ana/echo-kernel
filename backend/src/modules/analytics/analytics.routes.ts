import { Router } from "express";
import { prisma } from "../../lib/prisma.js";
import { sendError } from "../../lib/errors.js";
import { requireAuth, type AuthedRequest } from "../../middleware/auth.js";

const router = Router();

router.get("/", requireAuth, async (req: AuthedRequest, res) => {
  try {
    const userId = req.user!.id;

    const [moods, ratings] = await Promise.all([
      prisma.mood.findMany({
        where: { userId },
        orderBy: { createdAt: "asc" },
        select: { moodScore: true, createdAt: true, emoji: true, color: true },
      }),
      prisma.songRating.findMany({
        where: { userId },
        include: { recommendation: { select: { genre: true } } },
      }),
    ]);

    const totalMoods = moods.length;
    const totalRated = ratings.length;
    const avgMood =
      totalMoods > 0 ? moods.reduce((a, m) => a + m.moodScore, 0) / totalMoods : null;
    const avgSongRating =
      totalRated > 0 ? ratings.reduce((a, r) => a + r.rating, 0) / totalRated : null;

    const genreCounts = new Map<string, { sum: number; n: number }>();
    for (const r of ratings) {
      const g = r.recommendation.genre || "unknown";
      const cur = genreCounts.get(g) || { sum: 0, n: 0 };
      cur.sum += r.rating;
      cur.n += 1;
      genreCounts.set(g, cur);
    }
    const favoriteGenres = [...genreCounts.entries()]
      .map(([genre, { sum, n }]) => ({ genre, avgRating: sum / n, count: n }))
      .sort((a, b) => b.avgRating * b.count - a.avgRating * a.count)
      .slice(0, 8);

    const emojiCounts = new Map<string, number>();
    const colorCounts = new Map<string, number>();
    for (const m of moods) {
      emojiCounts.set(m.emoji, (emojiCounts.get(m.emoji) || 0) + 1);
      colorCounts.set(m.color, (colorCounts.get(m.color) || 0) + 1);
    }
    const topEmojis = [...emojiCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([emoji, count]) => ({ emoji, count }));
    const topColors = [...colorCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([color, count]) => ({ color, count }));

    const moodTrend = moods.map((m) => ({
      date: m.createdAt.toISOString(),
      score: m.moodScore,
    }));

    res.json({
      totalMoods,
      totalSongsRated: totalRated,
      averageMoodScore: avgMood,
      averageSongRating: avgSongRating,
      favoriteGenres,
      topEmojis,
      topColors,
      moodTrend,
    });
  } catch (e) {
    sendError(res, e);
  }
});

export default router;
