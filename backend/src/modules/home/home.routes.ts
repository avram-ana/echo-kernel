import { Router } from "express";
import { prisma } from "../../lib/prisma.js";
import { sendError } from "../../lib/errors.js";
import { requireAuth, type AuthedRequest } from "../../middleware/auth.js";
import { getCurrentTimeOfDay } from "../../lib/timeOfDay.js";

const router = Router();

const FALLBACK_GREETINGS: Record<string, string[]> = {
  morning: ["Soft light on your thoughts.", "A gentle start — breathe in sound."],
  afternoon: ["Midday glow. What’s your tempo?", "Carry your mood like a melody."],
  evening: ["Golden hour for your inner playlist.", "Wind down, tune in."],
  night: ["Stars and synths. You’re home.", "Quiet hours, loud feelings."],
};

router.get("/summary", requireAuth, async (req: AuthedRequest, res) => {
  try {
    const userId = req.user!.id;
    const bucket = getCurrentTimeOfDay();

    const greetings = await prisma.greeting.findMany({
      where: { userId, timeOfDay: bucket },
    });
    let greetingText: string;
    if (greetings.length) {
      greetingText = greetings[Math.floor(Math.random() * greetings.length)]!.content;
    } else {
      const fb = FALLBACK_GREETINGS[bucket];
      greetingText = fb[Math.floor(Math.random() * fb.length)]!;
    }

    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    const [latestMood, weekMoods, recCount] = await Promise.all([
      prisma.mood.findFirst({
        where: { userId },
        orderBy: { createdAt: "desc" },
      }),
      prisma.mood.findMany({
        where: { userId, createdAt: { gte: weekAgo } },
        select: { moodScore: true },
      }),
      prisma.songRecommendation.count({ where: { userId } }),
    ]);

    const weeklyAvg =
      weekMoods.length > 0
        ? weekMoods.reduce((a, m) => a + m.moodScore, 0) / weekMoods.length
        : null;

    res.json({
      timeOfDay: bucket,
      greeting: greetingText,
      latestMood,
      weeklyAvgMoodScore: weeklyAvg,
      soundtrackSongCount: recCount,
    });
  } catch (e) {
    sendError(res, e);
  }
});

export default router;
