import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { normalizeRawMoodToCanonical } from "./mood-catalog.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export type CatalogSongRow = {
  artist: string;
  title: string;
  mood: string;
  catalogKey: string;
};

export function catalogKey(artist: string, title: string): string {
  const norm = (s: string) =>
    s
      .trim()
      .toLowerCase()
      .replace(/\s+/g, " ");
  return `${norm(artist)}|${norm(title)}`;
}

/** Minimal CSV row parser (supports quoted fields). */
export function parseCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i]!;
    if (c === '"') {
      inQuotes = !inQuotes;
    } else if (c === "," && !inQuotes) {
      out.push(cur.trim());
      cur = "";
    } else {
      cur += c;
    }
  }
  out.push(cur.trim());
  return out;
}

/** Default: `backend/data/echo_kernel_artist_songs_moods.csv` next to compiled `dist`. */
export function defaultCatalogPath(): string {
  const root = path.join(__dirname, "..", "..");
  return path.join(root, "data", "echo_kernel_artist_songs_moods.csv");
}

export function loadSongCatalogFromCsv(filePath: string): CatalogSongRow[] {
  const raw = fs.readFileSync(filePath, "utf8");
  const lines = raw.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length < 2) return [];
  const rows: CatalogSongRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const parts = parseCsvLine(lines[i]!);
    if (parts.length < 3) continue;
    const artist = parts[0]!;
    const song = parts[1]!;
    const moodRaw = parts[2]!;
    if (!artist || !song) continue;
    const mood = normalizeRawMoodToCanonical(moodRaw);
    rows.push({
      artist,
      title: song,
      mood,
      catalogKey: catalogKey(artist, song),
    });
  }
  return rows;
}

export function resolveCatalogPath(explicit?: string): string {
  if (explicit && fs.existsSync(explicit)) return explicit;
  const env = process.env.SONG_CATALOG_CSV;
  if (env && fs.existsSync(env)) return env;
  const def = defaultCatalogPath();
  if (fs.existsSync(def)) return def;
  throw new Error(
    `Song catalog CSV not found. Set SONG_CATALOG_CSV or add ${def} (copy from echo_kernel_artist_songs_moods.csv).`
  );
}
