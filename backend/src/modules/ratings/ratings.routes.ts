import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../lib/prisma.js";
import { AppError, sendError } from "../../lib/errors.js";
import { requireAuth, type AuthedRequest } from "../../middleware/auth.js";

const router = Router();

const upsertSchema = z.object({
  recommendationId: z.string(),
  rating: z.number().int().min(1).max(5),
  note: z.string().max(500).optional(),
});

router.get("/pending", requireAuth, async (req: AuthedRequest, res) => {
  try {
    const userId = req.user!.id;
    const recs = await prisma.songRecommendation.findMany({
      where: {
        userId,
        ratings: { none: { userId } },
      },
      orderBy: { createdAt: "desc" },
      include: { mood: true },
    });
    res.json(recs);
  } catch (e) {
    sendError(res, e);
  }
});

router.get("/history", requireAuth, async (req: AuthedRequest, res) => {
  try {
    const ratings = await prisma.songRating.findMany({
      where: { userId: req.user!.id },
      orderBy: { createdAt: "desc" },
      include: { recommendation: { include: { mood: true } } },
    });
    res.json(ratings);
  } catch (e) {
    sendError(res, e);
  }
});

router.post("/", requireAuth, async (req: AuthedRequest, res) => {
  try {
    const body = upsertSchema.parse(req.body);
    const userId = req.user!.id;
    const rec = await prisma.songRecommendation.findFirst({
      where: { id: body.recommendationId, userId },
    });
    if (!rec) throw new AppError(404, "Recommendation not found");

    const rating = await prisma.songRating.upsert({
      where: {
        userId_recommendationId: { userId, recommendationId: body.recommendationId },
      },
      create: {
        userId,
        recommendationId: body.recommendationId,
        rating: body.rating,
        note: body.note ?? null,
      },
      update: {
        rating: body.rating,
        ...(typeof body.note !== "undefined" ? { note: body.note ?? null } : {}),
      },
      include: { recommendation: true },
    });
    res.json(rating);
  } catch (e) {
    sendError(res, e);
  }
});

export default router;
