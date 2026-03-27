import type { Response } from "express";
import { signToken } from "./jwt.js";
import { AUTH_COOKIE_NAME } from "./cookies.js";

export function setAuthCookie(
  res: Response,
  user: { id: string; role: "user" | "admin"; tokenVersion: number }
) {
  const token = signToken({
    sub: user.id,
    role: user.role,
    tv: user.tokenVersion,
  });
  res.cookie(AUTH_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
}

export function clearAuthCookie(res: Response) {
  res.clearCookie(AUTH_COOKIE_NAME, { sameSite: "lax" });
}
