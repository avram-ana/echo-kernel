import jwt, { type SignOptions } from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change-me";

export type JwtPayload = {
  sub: string;
  role: "user" | "admin";
  /** Token version; must match User.tokenVersion */
  tv: number;
};

export function signToken(payload: JwtPayload, expiresIn: SignOptions["expiresIn"] = "7d") {
  return jwt.sign(payload, JWT_SECRET, { expiresIn });
}

export function verifyToken(token: string): JwtPayload {
  const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload & { tv?: number };
  return {
    sub: decoded.sub,
    role: decoded.role,
    tv: decoded.tv ?? 0,
  };
}
