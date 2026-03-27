import "dotenv/config";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { ZodError } from "zod";
import authRoutes from "./modules/auth/auth.routes.js";
import moodsRoutes from "./modules/moods/moods.routes.js";
import ratingsRoutes from "./modules/ratings/ratings.routes.js";
import greetingsRoutes from "./modules/greetings/greetings.routes.js";
import homeRoutes from "./modules/home/home.routes.js";
import analyticsRoutes from "./modules/analytics/analytics.routes.js";
import adminRoutes from "./modules/admin/admin.routes.js";
import usersRoutes from "./modules/users/users.routes.js";
import playlistsRoutes from "./modules/playlists/playlists.routes.js";
import { AppError, sendError } from "./lib/errors.js";

const app = express();
const PORT = Number(process.env.PORT) || 4000;
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || "http://localhost:5173";

app.use(
  cors({
    origin: CLIENT_ORIGIN,
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

app.get("/api/health", (_req, res) => res.json({ ok: true }));

app.use("/api/auth", authRoutes);
app.use("/api/users", usersRoutes);
app.use("/api/playlists", playlistsRoutes);
app.use("/api/moods", moodsRoutes);
app.use("/api/ratings", ratingsRoutes);
app.use("/api/greetings", greetingsRoutes);
app.use("/api/home", homeRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/admin", adminRoutes);

app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  if (err instanceof ZodError) {
    return res.status(400).json({ error: err.flatten() });
  }
  sendError(res, err);
});

app.listen(PORT, () => {
  console.log(`Echo Kernel API listening on http://localhost:${PORT}`);
});
