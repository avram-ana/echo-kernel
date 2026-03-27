import type { Response } from "express";
import { Prisma } from "@prisma/client";
import { ZodError } from "zod";

/** User-facing hint when login/register/etc. fail because there is no DB. */
function prismaConnectionHint(err: unknown): string | null {
  if (err instanceof Prisma.PrismaClientInitializationError) {
    return (
      "Database is not available. Start PostgreSQL, set DATABASE_URL in backend/.env, " +
      "then run: npx prisma migrate deploy && npm run db:seed"
    );
  }
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    // P1001 can't reach server, P1003 database does not exist
    if (err.code === "P1001" || err.code === "P1003") {
      return (
        "Cannot connect to the database. Check that PostgreSQL is running and DATABASE_URL matches " +
        "(see backend/.env.example)."
      );
    }
  }
  return null;
}

export class AppError extends Error {
  constructor(
    public status: number,
    message: string
  ) {
    super(message);
    this.name = "AppError";
  }
}

export function sendError(res: Response, err: unknown) {
  if (err instanceof AppError) {
    return res.status(err.status).json({ error: err.message });
  }
  if (err instanceof ZodError) {
    return res.status(400).json({ error: err.flatten() });
  }
  const dbHint = prismaConnectionHint(err);
  if (dbHint) {
    console.error(err);
    return res.status(503).json({ error: dbHint });
  }
  console.error(err);
  return res.status(500).json({ error: "Something went wrong" });
}
