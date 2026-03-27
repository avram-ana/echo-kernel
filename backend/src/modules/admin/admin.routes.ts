import { Router } from "express";
import { z } from "zod";
import { TimeOfDay } from "@prisma/client";
import { prisma } from "../../lib/prisma.js";
import { AppError, sendError } from "../../lib/errors.js";
import { requireAuth, requireAdmin, type AuthedRequest } from "../../middleware/auth.js";

const router = Router();
const getSingleString = (v: unknown): string | undefined => {
  if (typeof v === "string") return v;
  if (Array.isArray(v) && typeof v[0] === "string") return v[0];
  return undefined;
};

router.use(requireAuth, requireAdmin);

router.get("/users", async (_req, res) => {
  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        createdAt: true,
        _count: {
          select: { moods: true, songRatings: true, greetings: true },
        },
      },
    });
    res.json(users);
  } catch (e) {
    sendError(res, e);
  }
});

router.delete("/users/:id", async (req: AuthedRequest, res) => {
  try {
    const id = getSingleString(req.params.id);
    if (!id) throw new AppError(400, "Invalid user id");
    if (id === req.user!.id) throw new AppError(400, "Cannot delete yourself");
    const u = await prisma.user.findUnique({ where: { id }, select: { id: true, email: true, role: true } });
    if (!u) throw new AppError(404, "User not found");
    if (u.role === "admin") throw new AppError(403, "Admin accounts cannot be deleted");
    await prisma.user.delete({ where: { id } });
    await prisma.adminLog.create({
      data: {
        adminId: req.user!.id,
        action: "delete_user",
        targetType: "user",
        targetId: id,
        metadata: JSON.stringify({ email: u.email }),
      },
    });
    res.json({ ok: true });
  } catch (e) {
    sendError(res, e);
  }
});

router.get("/greetings", async (req, res) => {
  try {
    const timeOfDay = getSingleString(req.query.timeOfDay);
    const userId = getSingleString(req.query.userId);
    const search = getSingleString(req.query.search)?.trim() ?? "";

    const where: NonNullable<Parameters<typeof prisma.greeting.findMany>[0]>["where"] = {};
    if (timeOfDay && Object.values(TimeOfDay).includes(timeOfDay as TimeOfDay)) {
      where.timeOfDay = timeOfDay as TimeOfDay;
    }
    if (userId) where.userId = userId;
    if (search) where.content = { contains: search, mode: "insensitive" };

    const list = await prisma.greeting.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: { user: { select: { id: true, username: true, email: true } } },
    });
    res.json(list);
  } catch (e) {
    sendError(res, e);
  }
});

router.delete("/greetings/:id", async (req: AuthedRequest, res) => {
  try {
    const id = getSingleString(req.params.id);
    if (!id) throw new AppError(400, "Invalid greeting id");
    const g = await prisma.greeting.findUnique({ where: { id } });
    if (!g) throw new AppError(404, "Greeting not found");
    await prisma.greeting.delete({ where: { id } });
    await prisma.adminLog.create({
      data: {
        adminId: req.user!.id,
        action: "delete_greeting",
        targetType: "greeting",
        targetId: id,
        metadata: JSON.stringify({ ownerId: g.userId }),
      },
    });
    res.json({ ok: true });
  } catch (e) {
    sendError(res, e);
  }
});

const promoteSchema = z.object({ role: z.enum(["user", "admin"]) });

router.patch("/users/:id/role", async (req: AuthedRequest, res) => {
  try {
    const body = promoteSchema.parse(req.body);
    const id = getSingleString(req.params.id);
    if (!id) throw new AppError(400, "Invalid user id");
    if (id === req.user!.id && body.role === "user") {
      throw new AppError(400, "Cannot demote yourself");
    }
    const u = await prisma.user.update({
      where: { id },
      data: { role: body.role },
      select: { id: true, username: true, email: true, role: true },
    });
    await prisma.adminLog.create({
      data: {
        adminId: req.user!.id,
        action: "role_change",
        targetType: "user",
        targetId: id,
        metadata: JSON.stringify({ role: body.role }),
      },
    });
    res.json(u);
  } catch (e) {
    sendError(res, e);
  }
});

export default router;
