import { Router } from "express";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { prisma } from "../../lib/prisma.js";
import { AppError, sendError } from "../../lib/errors.js";
import { requireAuth, type AuthedRequest } from "../../middleware/auth.js";
import { PlaylistPreset } from "@prisma/client";

const router = Router();
router.use(requireAuth);

const paramId = (v: unknown): string | undefined => {
  if (typeof v === "string") return v;
  if (Array.isArray(v) && typeof v[0] === "string") return v[0];
  return undefined;
};

const createSchema = z.object({
  name: z.string().min(1).max(120),
  preset: z.nativeEnum(PlaylistPreset).optional().nullable(),
});

const addItemSchema = z.object({
  songRecommendationId: z.string().min(1),
});

router.get("/", async (req: AuthedRequest, res) => {
  try {
    const list = await prisma.playlist.findMany({
      where: { userId: req.user!.id },
      orderBy: { createdAt: "asc" },
      include: {
        items: {
          include: {
            songRecommendation: {
              include: { mood: { select: { id: true, description: true, emoji: true, createdAt: true } } },
            },
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });
    res.json(list);
  } catch (e) {
    sendError(res, e);
  }
});

router.post("/", async (req: AuthedRequest, res) => {
  try {
    const body = createSchema.parse(req.body);
    const exists = body.preset
      ? await prisma.playlist.findFirst({
          where: { userId: req.user!.id, preset: body.preset },
        })
      : await prisma.playlist.findFirst({
          where: { userId: req.user!.id, name: body.name, preset: null },
        });
    if (exists) throw new AppError(400, "A playlist like this already exists");
    const p = await prisma.playlist.create({
      data: {
        userId: req.user!.id,
        name: body.name,
        preset: body.preset ?? undefined,
      },
    });
    res.status(201).json(p);
  } catch (e) {
    sendError(res, e);
  }
});

router.post("/:id/items", async (req: AuthedRequest, res) => {
  try {
    const playlistId = paramId(req.params.id);
    if (!playlistId) throw new AppError(400, "Invalid playlist id");
    const body = addItemSchema.parse(req.body);
    const pl = await prisma.playlist.findFirst({
      where: { id: playlistId, userId: req.user!.id },
    });
    if (!pl) throw new AppError(404, "Playlist not found");
    const rec = await prisma.songRecommendation.findFirst({
      where: { id: body.songRecommendationId, userId: req.user!.id },
    });
    if (!rec) throw new AppError(404, "Recommendation not found");
    try {
      const item = await prisma.playlistItem.create({
        data: {
          playlistId: pl.id,
          songRecommendationId: rec.id,
        },
        include: {
          songRecommendation: {
            include: { mood: { select: { id: true, description: true, emoji: true, createdAt: true } } },
          },
        },
      });
      res.status(201).json(item);
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
        throw new AppError(400, "This track is already in that playlist");
      }
      throw e;
    }
  } catch (e) {
    sendError(res, e);
  }
});

router.delete("/:id/items/:itemId", async (req: AuthedRequest, res) => {
  try {
    const pid = paramId(req.params.id);
    const iid = paramId(req.params.itemId);
    if (!pid || !iid) throw new AppError(400, "Invalid id");
    const pl = await prisma.playlist.findFirst({
      where: { id: pid, userId: req.user!.id },
    });
    if (!pl) throw new AppError(404, "Playlist not found");
    const item = await prisma.playlistItem.findFirst({
      where: { id: iid, playlistId: pl.id },
    });
    if (!item) throw new AppError(404, "Item not found");
    await prisma.playlistItem.delete({ where: { id: item.id } });
    res.json({ ok: true });
  } catch (e) {
    sendError(res, e);
  }
});

router.delete("/:id", async (req: AuthedRequest, res) => {
  try {
    const pid = paramId(req.params.id);
    if (!pid) throw new AppError(400, "Invalid playlist id");
    const pl = await prisma.playlist.findFirst({
      where: { id: pid, userId: req.user!.id },
    });
    if (!pl) throw new AppError(404, "Playlist not found");
    await prisma.playlist.delete({ where: { id: pl.id } });
    res.json({ ok: true });
  } catch (e) {
    sendError(res, e);
  }
});

export default router;
