import { Router } from "express";
import bcrypt from "bcryptjs";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { prisma } from "../../lib/prisma.js";
import { AppError, sendError } from "../../lib/errors.js";
import { requireAuth, type AuthedRequest } from "../../middleware/auth.js";
import { clearAuthCookie } from "../../lib/auth-cookie.js";

const patchProfileSchema = z.object({
  displayName: z.string().max(80).optional().nullable(),
  avatarUrl: z.string().max(2000).optional().nullable(),
  favoriteGenres: z.array(z.string().max(64)).max(30).optional(),
  favoriteArtists: z.array(z.string().max(120)).max(40).optional(),
  musicIntent: z
    .object({
      comfort: z.boolean().optional(),
      energy: z.boolean().optional(),
      distraction: z.boolean().optional(),
    })
    .optional()
    .nullable(),
  profilePublic: z.boolean().optional(),
  analyticsOptIn: z.boolean().optional(),
});

const deleteAccountSchema = z.object({
  password: z.string().min(1, "Password is required"),
});

const router = Router();

router.use(requireAuth);

router.patch("/me", async (req: AuthedRequest, res) => {
  try {
    const body = patchProfileSchema.parse(req.body);
    const normDisplay =
      body.displayName === undefined
        ? undefined
        : body.displayName === null || body.displayName.trim() === ""
          ? null
          : body.displayName.trim();
    const normAvatar =
      body.avatarUrl === undefined
        ? undefined
        : body.avatarUrl === null || body.avatarUrl.trim() === ""
          ? null
          : body.avatarUrl.trim();
    if (normAvatar != null && !/^https?:\/\//i.test(normAvatar)) {
      throw new AppError(400, "Avatar URL must start with http:// or https://");
    }
    const u = await prisma.user.update({
      where: { id: req.user!.id },
      data: {
        ...(normDisplay !== undefined && { displayName: normDisplay }),
        ...(normAvatar !== undefined && { avatarUrl: normAvatar }),
        ...(body.favoriteGenres !== undefined && { favoriteGenres: body.favoriteGenres }),
        ...(body.favoriteArtists !== undefined && { favoriteArtists: body.favoriteArtists }),
        ...(body.musicIntent !== undefined && {
          musicIntent:
            body.musicIntent === null ? Prisma.JsonNull : (body.musicIntent as Prisma.InputJsonValue),
        }),
        ...(body.profilePublic !== undefined && { profilePublic: body.profilePublic }),
        ...(body.analyticsOptIn !== undefined && { analyticsOptIn: body.analyticsOptIn }),
      },
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
    res.json({ user: u });
  } catch (e) {
    sendError(res, e);
  }
});

router.delete("/me", async (req: AuthedRequest, res) => {
  try {
    const body = deleteAccountSchema.parse(req.body);
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: { id: true, passwordHash: true, role: true },
    });
    if (!user) throw new AppError(401, "Not authenticated");
    if (user.role === "admin") throw new AppError(403, "Admin accounts cannot be deleted here");
    const ok = await bcrypt.compare(body.password, user.passwordHash);
    if (!ok) throw new AppError(400, "Password is incorrect");
    await prisma.user.delete({ where: { id: user.id } });
    clearAuthCookie(res);
    res.json({ ok: true });
  } catch (e) {
    sendError(res, e);
  }
});

export default router;
