-- CreateEnum
CREATE TYPE "Role" AS ENUM ('user', 'admin');

-- CreateEnum
CREATE TYPE "TimeOfDay" AS ENUM ('morning', 'afternoon', 'evening', 'night');

-- CreateEnum
CREATE TYPE "RecommendationType" AS ENUM ('mood_match', 'dare', 'taste_based');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'user',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "moods" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "emoji" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "mood_score" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "moods_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "songs" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "artist" TEXT NOT NULL,
    "genre" TEXT NOT NULL,
    "energy" INTEGER NOT NULL,
    "mood_tags" TEXT NOT NULL,
    "external_url" TEXT,
    "dare_eligible" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "songs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "song_recommendations" (
    "id" TEXT NOT NULL,
    "mood_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "song_id" TEXT,
    "title" TEXT NOT NULL,
    "artist" TEXT NOT NULL,
    "genre" TEXT,
    "recommendation_type" "RecommendationType" NOT NULL,
    "external_url" TEXT,
    "explanation_label" TEXT NOT NULL,
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "song_recommendations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "song_ratings" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "recommendation_id" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "song_ratings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "greetings" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "time_of_day" "TimeOfDay" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "greetings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admin_logs" (
    "id" TEXT NOT NULL,
    "admin_id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "target_type" TEXT NOT NULL,
    "target_id" TEXT,
    "metadata" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "admin_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "moods_user_id_created_at_idx" ON "moods"("user_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "song_recommendations_user_id_created_at_idx" ON "song_recommendations"("user_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "song_recommendations_mood_id_idx" ON "song_recommendations"("mood_id");

-- CreateIndex
CREATE UNIQUE INDEX "song_ratings_user_id_recommendation_id_key" ON "song_ratings"("user_id", "recommendation_id");

-- CreateIndex
CREATE INDEX "song_ratings_user_id_idx" ON "song_ratings"("user_id");

-- CreateIndex
CREATE INDEX "greetings_user_id_time_of_day_idx" ON "greetings"("user_id", "time_of_day");

-- CreateIndex
CREATE INDEX "admin_logs_admin_id_created_at_idx" ON "admin_logs"("admin_id", "created_at" DESC);

-- AddForeignKey
ALTER TABLE "moods" ADD CONSTRAINT "moods_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "song_recommendations" ADD CONSTRAINT "song_recommendations_mood_id_fkey" FOREIGN KEY ("mood_id") REFERENCES "moods"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "song_recommendations" ADD CONSTRAINT "song_recommendations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "song_ratings" ADD CONSTRAINT "song_ratings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "song_ratings" ADD CONSTRAINT "song_ratings_recommendation_id_fkey" FOREIGN KEY ("recommendation_id") REFERENCES "song_recommendations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "greetings" ADD CONSTRAINT "greetings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admin_logs" ADD CONSTRAINT "admin_logs_admin_id_fkey" FOREIGN KEY ("admin_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
