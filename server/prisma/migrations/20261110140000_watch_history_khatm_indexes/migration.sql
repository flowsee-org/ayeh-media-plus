-- Task 8: server watch history (soft video_id) + KhatmPart uniqueness/indexes.
-- Additive only; does not rewrite 20261110130000_init_canonical.

-- CreateTable
CREATE TABLE "WatchHistory" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "video_id" TEXT NOT NULL,
    "title" TEXT,
    "thumbnail_url" TEXT,
    "watch_seconds" INTEGER NOT NULL DEFAULT 0,
    "completion_percentage" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "watch_count" INTEGER NOT NULL DEFAULT 1,
    "last_watched_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_date" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WatchHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "WatchHistory_user_id_video_id_key" ON "WatchHistory"("user_id", "video_id");

-- CreateIndex
CREATE INDEX "WatchHistory_user_id_last_watched_at_idx" ON "WatchHistory"("user_id", "last_watched_at");

-- CreateIndex
CREATE INDEX "WatchHistory_video_id_idx" ON "WatchHistory"("video_id");

-- AddForeignKey (user delete cascades history; video_id remains soft / no FK)
ALTER TABLE "WatchHistory" ADD CONSTRAINT "WatchHistory_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- KhatmPart: prevent duplicate part numbers per session + query indexes
CREATE UNIQUE INDEX "KhatmPart_session_id_part_number_key" ON "KhatmPart"("session_id", "part_number");
CREATE INDEX "KhatmPart_session_id_idx" ON "KhatmPart"("session_id");
CREATE INDEX "KhatmPart_status_idx" ON "KhatmPart"("status");
CREATE INDEX "KhatmPart_user_id_idx" ON "KhatmPart"("user_id");
