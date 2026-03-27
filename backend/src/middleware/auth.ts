import type { Request, Response, NextFunction } from "express";
import { verifyToken } from "../lib/jwt.js";
import { AppError } from "../lib/errors.js";
import { prisma } from "../lib/prisma.js";
import { AUTH_COOKIE_NAME } from "../lib/cookies.js";

export type AuthedRequest = Request & {
  user?: { id: string; role: "user" | "admin"; email: string; username: string };
};

export { AUTH_COOKIE_NAME };

export function getTokenFromReq(req: Request): string | null {
  const c = req.cookies?.[AUTH_COOKIE_NAME];
  if (c && typeof c === "string") return c;
  const h = req.headers.authorization;
  if (h?.startsWith("Bearer ")) return h.slice(7);
  return null;
}

export async function requireAuth(
  req: AuthedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const token = getTokenFromReq(req);
    if (!token) throw new AppError(401, "Not authenticated");
    const payload = verifyToken(token);
    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, role: true, email: true, username: true, tokenVersion: true },
    });
    if (!user) throw new AppError(401, "Invalid session");
    if (payload.tv !== user.tokenVersion) {
      throw new AppError(401, "Session expired — please sign in again");
    }
    req.user = {
      id: user.id,
      role: user.role as "user" | "admin",
      email: user.email,
      username: user.username,
    };
    next();
  } catch {
    next(new AppError(401, "Not authenticated"));
  }
}

export function requireAdmin(req: AuthedRequest, res: Response, next: NextFunction) {
  if (!req.user || req.user.role !== "admin") {
    return next(new AppError(403, "Admin only"));
  }
  next();
}
