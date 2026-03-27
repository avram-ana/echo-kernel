-- AlterTable: CSV-backed catalog (mood + catalog_key); drop mock energy/tags.
ALTER TABLE "songs" ADD COLUMN "mood" TEXT;
ALTER TABLE "songs" ADD COLUMN "catalog_key" TEXT;

UPDATE "songs" SET
  "mood" = 'reflective',
  "catalog_key" = lower(regexp_replace(trim(both from "artist"), '\s+', ' ', 'g')) || '|' || lower(regexp_replace(trim(both from "title"), '\s+', ' ', 'g')) || '|' || "id";

ALTER TABLE "songs" ALTER COLUMN "mood" SET NOT NULL;
ALTER TABLE "songs" ALTER COLUMN "catalog_key" SET NOT NULL;

ALTER TABLE "songs" DROP COLUMN "energy";
ALTER TABLE "songs" DROP COLUMN "mood_tags";
ALTER TABLE "songs" DROP COLUMN "dare_eligible";

CREATE UNIQUE INDEX "songs_catalog_key_key" ON "songs"("catalog_key");
CREATE INDEX "songs_mood_idx" ON "songs"("mood");

ALTER TABLE "song_recommendations" ADD CONSTRAINT "song_recommendations_song_id_fkey" FOREIGN KEY ("song_id") REFERENCES "songs"("id") ON DELETE SET NULL ON UPDATE CASCADE;
