import { Router } from "express";
import { z } from "zod";
import { TimeOfDay } from "@prisma/client";
import { prisma } from "../../lib/prisma.js";
import { AppError, sendError } from "../../lib/errors.js";
import { requireAuth, type AuthedRequest } from "../../middleware/auth.js";

const router = Router();
const getSingleString = (v: unknown): string | undefined => {
  if (typeof v === "string") return v;
  if (Array.isArray(v) && typeof v[0] === "string") return v[0];
  return undefined;
};

const createSchema = z.object({
  content: z.string().min(1).max(500),
  timeOfDay: z.nativeEnum(TimeOfDay),
});

router.get("/", requireAuth, async (req: AuthedRequest, res) => {
  try {
    const cat = getSingleString(req.query.timeOfDay);
    const search = getSingleString(req.query.search)?.trim() ?? "";
    const where: NonNullable<Parameters<typeof prisma.greeting.findMany>[0]>["where"] = {
      userId: req.user!.id,
    };
    if (cat && Object.values(TimeOfDay).includes(cat as TimeOfDay)) {
      where.timeOfDay = cat as TimeOfDay;
    }
    if (search) {
      where.content = { contains: search, mode: "insensitive" };
    }
    const list = await prisma.greeting.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });
    res.json(list);
  } catch (e) {
    sendError(res, e);
  }
});

router.post("/", requireAuth, async (req: AuthedRequest, res) => {
  try {
    const body = createSchema.parse(req.body);
    const g = await prisma.greeting.create({
      data: {
        userId: req.user!.id,
        content: body.content,
        timeOfDay: body.timeOfDay,
      },
    });
    res.status(201).json(g);
  } catch (e) {
    sendError(res, e);
  }
});

router.delete("/:id", requireAuth, async (req: AuthedRequest, res) => {
  try {
    const g = await prisma.greeting.findFirst({
      where: { id: getSingleString(req.params.id), userId: req.user!.id },
    });
    if (!g) throw new AppError(404, "Greeting not found");
    await prisma.greeting.delete({ where: { id: g.id } });
    res.json({ ok: true });
  } catch (e) {
    sendError(res, e);
  }
});

export default router;
