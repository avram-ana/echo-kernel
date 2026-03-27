import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../lib/prisma.js";
import { AppError, sendError } from "../../lib/errors.js";
import { requireAuth, type AuthedRequest } from "../../middleware/auth.js";
import { generateRecommendationsForMood } from "../recommendations/recommendation.service.js";

const router = Router();
const getSingleString = (v: unknown): string | undefined => {
  if (typeof v === "string") return v;
  if (Array.isArray(v) && typeof v[0] === "string") return v[0];
  return undefined;
};

const createMoodSchema = z.object({
  description: z.string().min(1).max(2000),
  emoji: z.string().min(1).max(20),
  color: z.string().min(1).max(32),
  moodScore: z.number().int().min(1).max(10),
});

router.post("/", requireAuth, async (req: AuthedRequest, res) => {
  try {
    const body = createMoodSchema.parse(req.body);
    const userId = req.user!.id;

    const mood = await prisma.mood.create({
      data: {
        userId,
        description: body.description,
        emoji: body.emoji,
        color: body.color,
        moodScore: body.moodScore,
      },
    });

    const recData = await generateRecommendationsForMood({
      userId,
      moodId: mood.id,
      moodScore: mood.moodScore,
      description: mood.description,
      emoji: mood.emoji,
      color: mood.color,
    });

    await prisma.$transaction(
      recData.map((r, index) =>
        prisma.songRecommendation.create({
          data: {
            moodId: mood.id,
            userId,
            songId: r.songId,
            title: r.title,
            artist: r.artist,
            genre: r.genre,
            recommendationType: r.recommendationType,
            externalUrl: r.externalUrl,
            explanationLabel: r.explanationLabel,
            displayOrder: index,
          },
        })
      )
    );

    const full = await prisma.mood.findUnique({
      where: { id: mood.id },
      include: { recommendations: { orderBy: { displayOrder: "asc" } } },
    });

    res.status(201).json(full);
  } catch (e) {
    sendError(res, e);
  }
});

router.get("/", requireAuth, async (req: AuthedRequest, res) => {
  try {
    const search = getSingleString(req.query.search)?.trim() ?? "";
    const moods = await prisma.mood.findMany({
      where: {
        userId: req.user!.id,
        ...(search
          ? {
              OR: [
                { description: { contains: search, mode: "insensitive" } },
                { emoji: { contains: search } },
              ],
            }
          : {}),
      },
      orderBy: { createdAt: "desc" },
      include: {
        recommendations: { orderBy: { displayOrder: "asc" } },
      },
    });
    res.json(moods);
  } catch (e) {
    sendError(res, e);
  }
});

router.get("/:id", requireAuth, async (req: AuthedRequest, res) => {
  try {
    const mood = await prisma.mood.findFirst({
      where: { id: getSingleString(req.params.id), userId: req.user!.id },
      include: { recommendations: { orderBy: { displayOrder: "asc" } } },
    });
    if (!mood) throw new AppError(404, "Mood not found");
    res.json(mood);
  } catch (e) {
    sendError(res, e);
  }
});

export default router;
