import { Router } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { PlaylistPreset } from "@prisma/client";
import { prisma } from "../../lib/prisma.js";
import { AppError, sendError } from "../../lib/errors.js";
import { requireAuth, type AuthedRequest } from "../../middleware/auth.js";
import { setAuthCookie, clearAuthCookie } from "../../lib/auth-cookie.js";
import { strongPasswordSchema, changePasswordSchema } from "../../lib/password.js";

const router = Router();

const musicIntentSchema = z
  .object({
    comfort: z.boolean().optional(),
    energy: z.boolean().optional(),
    distraction: z.boolean().optional(),
  })
  .optional();

const registerSchema = z.object({
  username: z.string().min(2).max(40),
  email: z.string().email(),
  password: strongPasswordSchema,
  favoriteGenres: z.array(z.string().max(64)).max(30).optional(),
  favoriteArtists: z.array(z.string().max(120)).max(40).optional(),
  musicIntent: musicIntentSchema,
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

function debugPwLog(hypothesisId: string, location: string, message: string, data: Record<string, unknown>) {
  // #region agent log
  fetch("http://127.0.0.1:7896/ingest/a1dc9076-9451-41ba-866e-6f3b6df12a5f", {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "461ef4" },
    body: JSON.stringify({
      sessionId: "461ef4",
      runId: "pw-debug-1",
      hypothesisId,
      location,
      message,
      data,
      timestamp: Date.now(),
    }),
  }).catch(() => {});
  // #endregion
}

router.post("/register", async (req, res) => {
  try {
    const body = registerSchema.parse(req.body);
    const exists = await prisma.user.findUnique({ where: { email: body.email } });
    if (exists) throw new AppError(400, "Email already registered");
    const passwordHash = await bcrypt.hash(body.password, 12);

    const user = await prisma.$transaction(async (tx) => {
      const u = await tx.user.create({
        data: {
          username: body.username,
          email: body.email,
          passwordHash,
          role: "user",
          favoriteGenres: body.favoriteGenres?.length ? body.favoriteGenres : undefined,
          favoriteArtists: body.favoriteArtists?.length ? body.favoriteArtists : undefined,
          musicIntent: body.musicIntent ?? undefined,
        },
        select: {
          id: true,
          username: true,
          email: true,
          role: true,
          tokenVersion: true,
        },
      });
      await tx.playlist.createMany({
        data: [
          { userId: u.id, name: "Comfort songs", preset: PlaylistPreset.comfort },
          { userId: u.id, name: "Late-night songs", preset: PlaylistPreset.late_night },
          {
            userId: u.id,
            name: "Melancholic",
            preset: PlaylistPreset.emotional_wreck,
          },
          { userId: u.id, name: "Villain arc starters", preset: PlaylistPreset.villain_arc },
        ],
      });
      return u;
    });

    setAuthCookie(res, {
      id: user.id,
      role: user.role as "user" | "admin",
      tokenVersion: user.tokenVersion,
    });

    res.status(201).json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
    });
  } catch (e) {
    sendError(res, e);
  }
});

router.post("/login", async (req, res) => {
  try {
    const body = loginSchema.parse(req.body);
    const user = await prisma.user.findUnique({ where: { email: body.email } });
    if (!user) throw new AppError(401, "Invalid email or password");
    const ok = await bcrypt.compare(body.password, user.passwordHash);
    if (!ok) throw new AppError(401, "Invalid email or password");
    setAuthCookie(res, {
      id: user.id,
      role: user.role as "user" | "admin",
      tokenVersion: user.tokenVersion,
    });
    res.json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
    });
  } catch (e) {
    sendError(res, e);
  }
});

router.post("/logout", (_req, res) => {
  clearAuthCookie(res);
  res.json({ ok: true });
});

router.get("/me", requireAuth, async (req: AuthedRequest, res) => {
  try {
    const u = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        displayName: true,
        avatarUrl: true,
        favoriteGenres: true,
        favoriteArtists: true,
        musicIntent: true,
        profilePublic: true,
        analyticsOptIn: true,
        showListeningActivity: true,
        emailVerifiedAt: true,
        createdAt: true,
      },
    });
    if (!u) throw new AppError(401, "Not authenticated");
    res.json({ user: u });
  } catch (e) {
    sendError(res, e);
  }
});

router.post("/change-password", requireAuth, async (req: AuthedRequest, res) => {
  try {
    const body = changePasswordSchema.parse(req.body);
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: { id: true, passwordHash: true, tokenVersion: true },
    });
    if (!user) throw new AppError(401, "Not authenticated");
    const match = await bcrypt.compare(body.currentPassword, user.passwordHash);
    if (!match) throw new AppError(400, "Current password is incorrect");
    const newHash = await bcrypt.hash(body.newPassword, 12);
    const updated = await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash: newHash,
        tokenVersion: { increment: 1 },
      },
      select: { tokenVersion: true, role: true },
    });
    setAuthCookie(res, {
      id: user.id,
      role: updated.role as "user" | "admin",
      tokenVersion: updated.tokenVersion,
    });
    res.json({ ok: true });
  } catch (e) {
    sendError(res, e);
  }
});

export default router;
