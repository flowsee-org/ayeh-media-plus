-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "password" TEXT,
    "full_name" TEXT,
    "role" TEXT NOT NULL DEFAULT 'user',
    "is_scholar" BOOLEAN NOT NULL DEFAULT false,
    "avatar_url" TEXT,
    "avatar_config" TEXT,
    "bio" TEXT,
    "streak_days" INTEGER NOT NULL DEFAULT 0,
    "max_streak" INTEGER NOT NULL DEFAULT 0,
    "last_active_date" TIMESTAMP(3),
    "total_xp" INTEGER NOT NULL DEFAULT 0,
    "spiritual_level" TEXT NOT NULL DEFAULT 'مستمع',
    "is_banned" BOOLEAN NOT NULL DEFAULT false,
    "banned_reason" TEXT,
    "banned_until" TIMESTAMP(3),
    "email_verified" BOOLEAN NOT NULL DEFAULT false,
    "phone_verified" BOOLEAN NOT NULL DEFAULT false,
    "preferences" TEXT,
    "created_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_date" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Video" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL DEFAULT 'recitation',
    "media_url" TEXT NOT NULL,
    "media_type" TEXT NOT NULL DEFAULT 'video',
    "thumbnail_url" TEXT,
    "duration" TEXT,
    "verse_key" TEXT,
    "verse_arabic" TEXT,
    "translation" TEXT,
    "transliteration" TEXT,
    "tafsir" TEXT,
    "reciter_id" TEXT,
    "reciter_name" TEXT,
    "reciter_bio" TEXT,
    "scholar_id" TEXT,
    "scholar_name" TEXT,
    "competition_id" TEXT,
    "is_live" BOOLEAN NOT NULL DEFAULT false,
    "is_competition" BOOLEAN NOT NULL DEFAULT false,
    "competition_year" TEXT,
    "competition_category" TEXT,
    "venue" TEXT,
    "prize" TEXT,
    "competition_details" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending_review',
    "rejection_reason" TEXT,
    "reviewed_by" TEXT,
    "reviewed_at" TIMESTAMP(3),
    "views_count" INTEGER NOT NULL DEFAULT 0,
    "likes_count" INTEGER NOT NULL DEFAULT 0,
    "dislikes_count" INTEGER NOT NULL DEFAULT 0,
    "comments_count" INTEGER NOT NULL DEFAULT 0,
    "watch_time_minutes" INTEGER NOT NULL DEFAULT 0,
    "completion_rate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "tags" TEXT,
    "language" TEXT NOT NULL DEFAULT 'ar',
    "quality" TEXT NOT NULL DEFAULT '1080p',
    "audio_only_url" TEXT,
    "chapters" TEXT,
    "download_enabled" BOOLEAN NOT NULL DEFAULT false,
    "download_url" TEXT,
    "hls_url" TEXT,
    "qualities" TEXT,
    "source_url" TEXT,
    "source_width" INTEGER,
    "source_height" INTEGER,
    "source_duration" INTEGER,
    "created_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_date" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Video_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Competition" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "title_arabic" TEXT,
    "description" TEXT,
    "type" TEXT NOT NULL DEFAULT 'recitation',
    "prize_title" TEXT,
    "prize_description" TEXT,
    "prize_value" TEXT,
    "rules" TEXT,
    "start_date" TIMESTAMP(3),
    "end_date" TIMESTAMP(3),
    "registration_deadline" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'active',
    "entries_count" INTEGER NOT NULL DEFAULT 0,
    "views_count" INTEGER NOT NULL DEFAULT 0,
    "organizer_id" TEXT,
    "organizer_name" TEXT,
    "venue" TEXT,
    "venue_city" TEXT,
    "venue_country" TEXT,
    "year" TEXT,
    "season" TEXT,
    "theme_color" TEXT,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "is_international" BOOLEAN NOT NULL DEFAULT false,
    "age_category" TEXT,
    "gender_category" TEXT,
    "judging_criteria" TEXT,
    "prizes" TEXT,
    "created_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_date" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Competition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CompetitionEntry" (
    "id" TEXT NOT NULL,
    "competition_id" TEXT NOT NULL,
    "author_id" TEXT NOT NULL,
    "author_name" TEXT NOT NULL,
    "title" TEXT,
    "content" TEXT,
    "media_url" TEXT,
    "media_type" TEXT NOT NULL DEFAULT 'audio',
    "thumbnail_url" TEXT,
    "verse_key" TEXT,
    "verse_arabic" TEXT,
    "duration" TEXT,
    "votes_count" INTEGER NOT NULL DEFAULT 0,
    "rank_position" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'pending_review',
    "rejection_reason" TEXT,
    "reviewed_by" TEXT,
    "reviewed_at" TIMESTAMP(3),
    "score_tajweed" DOUBLE PRECISION DEFAULT 0,
    "score_voice" DOUBLE PRECISION DEFAULT 0,
    "score_accuracy" DOUBLE PRECISION DEFAULT 0,
    "score_total" DOUBLE PRECISION DEFAULT 0,
    "judged_by" TEXT,
    "judged_at" TIMESTAMP(3),
    "views_count" INTEGER NOT NULL DEFAULT 0,
    "likes_count" INTEGER NOT NULL DEFAULT 0,
    "created_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CompetitionEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Vote" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "entry_id" TEXT NOT NULL,
    "competition_id" TEXT NOT NULL,
    "vote_type" TEXT NOT NULL DEFAULT 'upvote',
    "created_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Vote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Comment" (
    "id" TEXT NOT NULL,
    "post_id" TEXT,
    "video_id" TEXT,
    "entry_id" TEXT,
    "parent_id" TEXT,
    "author_id" TEXT NOT NULL,
    "author_name" TEXT NOT NULL,
    "author_avatar" TEXT,
    "content" TEXT NOT NULL,
    "likes_count" INTEGER NOT NULL DEFAULT 0,
    "dislikes_count" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'published',
    "moderated_by" TEXT,
    "moderated_at" TIMESTAMP(3),
    "moderation_reason" TEXT,
    "is_spam" BOOLEAN NOT NULL DEFAULT false,
    "is_flagged" BOOLEAN NOT NULL DEFAULT false,
    "created_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Comment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Like" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "video_id" TEXT,
    "comment_id" TEXT,
    "post_id" TEXT,
    "entry_id" TEXT,
    "type" TEXT NOT NULL DEFAULT 'like',
    "created_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Like_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Bookmark" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "video_id" TEXT,
    "entry_id" TEXT,
    "collection_id" TEXT,
    "note" TEXT,
    "created_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Bookmark_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Follow" (
    "id" TEXT NOT NULL,
    "follower_id" TEXT NOT NULL,
    "follower_name" TEXT,
    "followed_id" TEXT NOT NULL,
    "followed_name" TEXT,
    "created_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Follow_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Report" (
    "id" TEXT NOT NULL,
    "reporter_id" TEXT NOT NULL,
    "reporter_name" TEXT,
    "target_type" TEXT NOT NULL,
    "target_id" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "reason_detail" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "reviewed_by" TEXT,
    "reviewed_at" TIMESTAMP(3),
    "moderation_note" TEXT,
    "action_taken" TEXT,
    "created_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Report_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ModerationAction" (
    "id" TEXT NOT NULL,
    "actor_id" TEXT NOT NULL,
    "actor_name" TEXT,
    "target_type" TEXT NOT NULL,
    "target_id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "reason" TEXT,
    "details" TEXT,
    "created_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ModerationAction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "recipient_id" TEXT NOT NULL,
    "actor_id" TEXT NOT NULL,
    "actor_name" TEXT,
    "type" TEXT NOT NULL DEFAULT 'like',
    "title" TEXT,
    "message" TEXT,
    "post_id" TEXT,
    "post_excerpt" TEXT,
    "video_id" TEXT,
    "comment_id" TEXT,
    "entry_id" TEXT,
    "live_session_id" TEXT,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "read_at" TIMESTAMP(3),
    "created_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Collection" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "theme_color" TEXT,
    "icon" TEXT,
    "cover_pattern" TEXT NOT NULL DEFAULT 'stars',
    "is_public" BOOLEAN NOT NULL DEFAULT true,
    "is_watch_later" BOOLEAN NOT NULL DEFAULT false,
    "verse_keys" TEXT,
    "verse_count" INTEGER NOT NULL DEFAULT 0,
    "user_id" TEXT,
    "created_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Collection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Post" (
    "id" TEXT NOT NULL,
    "author_id" TEXT NOT NULL,
    "author_name" TEXT NOT NULL,
    "author_avatar" TEXT,
    "content" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'reflection',
    "verse_key" TEXT,
    "verse_text" TEXT,
    "verse_arabic" TEXT,
    "verse_translation" TEXT,
    "media_url" TEXT,
    "media_type" TEXT,
    "image_url" TEXT,
    "video_url" TEXT,
    "video_title" TEXT,
    "likes_count" INTEGER NOT NULL DEFAULT 0,
    "liked_by" TEXT,
    "comments_count" INTEGER NOT NULL DEFAULT 0,
    "tags" TEXT,
    "created_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_date" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Post_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Scholar" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "name_arabic" TEXT,
    "title" TEXT,
    "bio" TEXT,
    "birth_year" TEXT,
    "death_year" TEXT,
    "avatar_url" TEXT,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "books" TEXT,
    "sources" TEXT,
    "created_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Scholar_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Topic" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "name_arabic" TEXT,
    "slug" TEXT,
    "description" TEXT,
    "category" TEXT NOT NULL DEFAULT 'ethics',
    "icon" TEXT,
    "theme_color" TEXT,
    "verse_keys" TEXT,
    "verse_count" INTEGER NOT NULL DEFAULT 0,
    "created_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Topic_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Story" (
    "id" TEXT NOT NULL,
    "author_id" TEXT NOT NULL,
    "author_name" TEXT NOT NULL,
    "author_avatar" TEXT,
    "media_url" TEXT,
    "media_type" TEXT NOT NULL DEFAULT 'image',
    "caption" TEXT,
    "verse_key" TEXT,
    "verse_text" TEXT,
    "background_color" TEXT,
    "views_count" INTEGER NOT NULL DEFAULT 0,
    "viewed_by" TEXT,
    "expires_at" TIMESTAMP(3),
    "created_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Story_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LiveSession" (
    "id" TEXT NOT NULL,
    "scholar_id" TEXT NOT NULL,
    "scholar_name" TEXT,
    "scholar_avatar" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'live',
    "viewer_count" INTEGER NOT NULL DEFAULT 0,
    "room_id" TEXT NOT NULL,
    "verse_key" TEXT,
    "created_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LiveSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KhatmSession" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "intention" TEXT,
    "target_type" TEXT NOT NULL DEFAULT 'juz',
    "total_parts" INTEGER NOT NULL DEFAULT 30,
    "is_private" BOOLEAN NOT NULL DEFAULT false,
    "invite_code" TEXT,
    "creator_id" TEXT NOT NULL,
    "creator_name" TEXT,
    "creator_avatar" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "salawat_count" INTEGER NOT NULL DEFAULT 0,
    "deadline" TEXT,
    "created_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_date" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KhatmSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KhatmPart" (
    "id" TEXT NOT NULL,
    "session_id" TEXT NOT NULL,
    "part_number" INTEGER NOT NULL,
    "user_id" TEXT,
    "user_name" TEXT,
    "user_avatar" TEXT,
    "status" TEXT NOT NULL DEFAULT 'available',
    "reserved_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "created_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_date" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KhatmPart_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KhatmDua" (
    "id" TEXT NOT NULL,
    "session_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "user_name" TEXT NOT NULL,
    "user_avatar" TEXT,
    "message" TEXT NOT NULL,
    "created_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "KhatmDua_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Verse" (
    "id" TEXT NOT NULL,
    "surah_number" INTEGER NOT NULL,
    "surah_name_english" TEXT,
    "surah_name_arabic" TEXT,
    "surah_name_transliteration" TEXT,
    "surah_type" TEXT NOT NULL DEFAULT 'meccan',
    "surah_verse_count" INTEGER,
    "verse_number" INTEGER NOT NULL,
    "verse_key" TEXT NOT NULL,
    "arabic" TEXT NOT NULL,
    "translation" TEXT,
    "transliteration" TEXT,
    "audio_url" TEXT,
    "reciter" TEXT,
    "word_analysis" TEXT,
    "tafsir" TEXT,
    "reflections" TEXT,
    "themes" TEXT,
    "linguistic_gems" TEXT,
    "hadith_connections" TEXT,
    "historical_context" TEXT,
    "scholars_lectures" TEXT,
    "videos" TEXT,
    "images" TEXT,
    "tags" TEXT,
    "difficulty_level" TEXT,
    "created_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_date" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Verse_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Podcast" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "scholar_id" TEXT,
    "scholar_name" TEXT,
    "scholar_avatar" TEXT,
    "audio_url" TEXT NOT NULL,
    "cover_image" TEXT,
    "duration" TEXT,
    "description" TEXT,
    "chapters" TEXT,
    "verse_keys" TEXT,
    "views_count" INTEGER NOT NULL DEFAULT 0,
    "likes_count" INTEGER NOT NULL DEFAULT 0,
    "created_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_date" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Podcast_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserBadge" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "badge_id" TEXT NOT NULL,
    "badge_name" TEXT NOT NULL,
    "badge_icon" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "tier" TEXT NOT NULL DEFAULT 'bronze',
    "unlocked_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserBadge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DailyQuestProgress" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "quest_type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "is_completed" BOOLEAN NOT NULL DEFAULT false,
    "progress_value" INTEGER NOT NULL DEFAULT 0,
    "target_value" INTEGER NOT NULL DEFAULT 1,
    "xp_rewarded" INTEGER NOT NULL DEFAULT 0,
    "created_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_date" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DailyQuestProgress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuthOtp" (
    "id" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "code" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuthOtp_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuthCaptcha" (
    "id" TEXT NOT NULL,
    "captcha_id" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuthCaptcha_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_phone_key" ON "User"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_phone_idx" ON "User"("phone");

-- CreateIndex
CREATE INDEX "Video_category_idx" ON "Video"("category");

-- CreateIndex
CREATE INDEX "Video_status_idx" ON "Video"("status");

-- CreateIndex
CREATE INDEX "Video_verse_key_idx" ON "Video"("verse_key");

-- CreateIndex
CREATE INDEX "Video_reciter_name_idx" ON "Video"("reciter_name");

-- CreateIndex
CREATE INDEX "Video_competition_id_idx" ON "Video"("competition_id");

-- CreateIndex
CREATE INDEX "Video_is_live_idx" ON "Video"("is_live");

-- CreateIndex
CREATE INDEX "Video_is_competition_idx" ON "Video"("is_competition");

-- CreateIndex
CREATE INDEX "Video_created_date_idx" ON "Video"("created_date");

-- CreateIndex
CREATE INDEX "Competition_status_idx" ON "Competition"("status");

-- CreateIndex
CREATE INDEX "Competition_type_idx" ON "Competition"("type");

-- CreateIndex
CREATE INDEX "Competition_year_idx" ON "Competition"("year");

-- CreateIndex
CREATE INDEX "Competition_featured_idx" ON "Competition"("featured");

-- CreateIndex
CREATE INDEX "Competition_created_date_idx" ON "Competition"("created_date");

-- CreateIndex
CREATE INDEX "CompetitionEntry_competition_id_idx" ON "CompetitionEntry"("competition_id");

-- CreateIndex
CREATE INDEX "CompetitionEntry_status_idx" ON "CompetitionEntry"("status");

-- CreateIndex
CREATE INDEX "CompetitionEntry_rank_position_idx" ON "CompetitionEntry"("rank_position");

-- CreateIndex
CREATE INDEX "CompetitionEntry_created_date_idx" ON "CompetitionEntry"("created_date");

-- CreateIndex
CREATE INDEX "Vote_entry_id_idx" ON "Vote"("entry_id");

-- CreateIndex
CREATE INDEX "Vote_user_id_idx" ON "Vote"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "Vote_user_id_entry_id_key" ON "Vote"("user_id", "entry_id");

-- CreateIndex
CREATE INDEX "Comment_post_id_idx" ON "Comment"("post_id");

-- CreateIndex
CREATE INDEX "Comment_video_id_idx" ON "Comment"("video_id");

-- CreateIndex
CREATE INDEX "Comment_entry_id_idx" ON "Comment"("entry_id");

-- CreateIndex
CREATE INDEX "Comment_parent_id_idx" ON "Comment"("parent_id");

-- CreateIndex
CREATE INDEX "Comment_author_id_idx" ON "Comment"("author_id");

-- CreateIndex
CREATE INDEX "Comment_status_idx" ON "Comment"("status");

-- CreateIndex
CREATE INDEX "Comment_created_date_idx" ON "Comment"("created_date");

-- CreateIndex
CREATE INDEX "Like_video_id_idx" ON "Like"("video_id");

-- CreateIndex
CREATE INDEX "Like_comment_id_idx" ON "Like"("comment_id");

-- CreateIndex
CREATE INDEX "Like_entry_id_idx" ON "Like"("entry_id");

-- CreateIndex
CREATE UNIQUE INDEX "Like_user_id_video_id_key" ON "Like"("user_id", "video_id");

-- CreateIndex
CREATE UNIQUE INDEX "Like_user_id_comment_id_key" ON "Like"("user_id", "comment_id");

-- CreateIndex
CREATE UNIQUE INDEX "Like_user_id_post_id_key" ON "Like"("user_id", "post_id");

-- CreateIndex
CREATE UNIQUE INDEX "Like_user_id_entry_id_key" ON "Like"("user_id", "entry_id");

-- CreateIndex
CREATE INDEX "Bookmark_user_id_idx" ON "Bookmark"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "Bookmark_user_id_video_id_key" ON "Bookmark"("user_id", "video_id");

-- CreateIndex
CREATE UNIQUE INDEX "Bookmark_user_id_entry_id_key" ON "Bookmark"("user_id", "entry_id");

-- CreateIndex
CREATE INDEX "Follow_follower_id_idx" ON "Follow"("follower_id");

-- CreateIndex
CREATE INDEX "Follow_followed_id_idx" ON "Follow"("followed_id");

-- CreateIndex
CREATE UNIQUE INDEX "Follow_follower_id_followed_id_key" ON "Follow"("follower_id", "followed_id");

-- CreateIndex
CREATE INDEX "Report_target_type_target_id_idx" ON "Report"("target_type", "target_id");

-- CreateIndex
CREATE INDEX "Report_status_idx" ON "Report"("status");

-- CreateIndex
CREATE INDEX "Report_reporter_id_idx" ON "Report"("reporter_id");

-- CreateIndex
CREATE INDEX "Report_created_date_idx" ON "Report"("created_date");

-- CreateIndex
CREATE INDEX "ModerationAction_actor_id_idx" ON "ModerationAction"("actor_id");

-- CreateIndex
CREATE INDEX "ModerationAction_target_type_target_id_idx" ON "ModerationAction"("target_type", "target_id");

-- CreateIndex
CREATE INDEX "ModerationAction_action_idx" ON "ModerationAction"("action");

-- CreateIndex
CREATE INDEX "ModerationAction_created_date_idx" ON "ModerationAction"("created_date");

-- CreateIndex
CREATE INDEX "Notification_recipient_id_idx" ON "Notification"("recipient_id");

-- CreateIndex
CREATE INDEX "Notification_read_idx" ON "Notification"("read");

-- CreateIndex
CREATE INDEX "Notification_created_date_idx" ON "Notification"("created_date");

-- CreateIndex
CREATE INDEX "Collection_user_id_idx" ON "Collection"("user_id");

-- CreateIndex
CREATE INDEX "Collection_is_watch_later_idx" ON "Collection"("is_watch_later");

-- CreateIndex
CREATE INDEX "Verse_surah_number_verse_number_idx" ON "Verse"("surah_number", "verse_number");

-- CreateIndex
CREATE INDEX "Verse_created_date_idx" ON "Verse"("created_date");

-- CreateIndex
CREATE UNIQUE INDEX "Verse_verse_key_key" ON "Verse"("verse_key");

-- CreateIndex
CREATE INDEX "Podcast_scholar_id_idx" ON "Podcast"("scholar_id");

-- CreateIndex
CREATE INDEX "Podcast_created_date_idx" ON "Podcast"("created_date");

-- CreateIndex
CREATE UNIQUE INDEX "AuthOtp_email_key" ON "AuthOtp"("email");

-- CreateIndex
CREATE UNIQUE INDEX "AuthOtp_phone_key" ON "AuthOtp"("phone");

-- CreateIndex
CREATE INDEX "AuthOtp_email_idx" ON "AuthOtp"("email");

-- CreateIndex
CREATE INDEX "AuthOtp_phone_idx" ON "AuthOtp"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "AuthCaptcha_captcha_id_key" ON "AuthCaptcha"("captcha_id");

-- CreateIndex
CREATE INDEX "AuthCaptcha_captcha_id_idx" ON "AuthCaptcha"("captcha_id");

-- AddForeignKey
ALTER TABLE "Video" ADD CONSTRAINT "Video_reciter_id_fkey" FOREIGN KEY ("reciter_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Competition" ADD CONSTRAINT "Competition_organizer_id_fkey" FOREIGN KEY ("organizer_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompetitionEntry" ADD CONSTRAINT "CompetitionEntry_competition_id_fkey" FOREIGN KEY ("competition_id") REFERENCES "Competition"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompetitionEntry" ADD CONSTRAINT "CompetitionEntry_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vote" ADD CONSTRAINT "Vote_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vote" ADD CONSTRAINT "Vote_entry_id_fkey" FOREIGN KEY ("entry_id") REFERENCES "CompetitionEntry"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vote" ADD CONSTRAINT "Vote_competition_id_fkey" FOREIGN KEY ("competition_id") REFERENCES "Competition"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "Post"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_video_id_fkey" FOREIGN KEY ("video_id") REFERENCES "Video"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_entry_id_fkey" FOREIGN KEY ("entry_id") REFERENCES "CompetitionEntry"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "Comment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Like" ADD CONSTRAINT "Like_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Like" ADD CONSTRAINT "Like_video_id_fkey" FOREIGN KEY ("video_id") REFERENCES "Video"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Like" ADD CONSTRAINT "Like_comment_id_fkey" FOREIGN KEY ("comment_id") REFERENCES "Comment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Like" ADD CONSTRAINT "Like_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "Post"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Like" ADD CONSTRAINT "Like_entry_id_fkey" FOREIGN KEY ("entry_id") REFERENCES "CompetitionEntry"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bookmark" ADD CONSTRAINT "Bookmark_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bookmark" ADD CONSTRAINT "Bookmark_video_id_fkey" FOREIGN KEY ("video_id") REFERENCES "Video"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bookmark" ADD CONSTRAINT "Bookmark_entry_id_fkey" FOREIGN KEY ("entry_id") REFERENCES "CompetitionEntry"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bookmark" ADD CONSTRAINT "Bookmark_collection_id_fkey" FOREIGN KEY ("collection_id") REFERENCES "Collection"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Follow" ADD CONSTRAINT "Follow_follower_id_fkey" FOREIGN KEY ("follower_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Follow" ADD CONSTRAINT "Follow_followed_id_fkey" FOREIGN KEY ("followed_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_reporter_id_fkey" FOREIGN KEY ("reporter_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_reviewed_by_fkey" FOREIGN KEY ("reviewed_by") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ModerationAction" ADD CONSTRAINT "ModerationAction_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_recipient_id_fkey" FOREIGN KEY ("recipient_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Collection" ADD CONSTRAINT "Collection_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Post" ADD CONSTRAINT "Post_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserBadge" ADD CONSTRAINT "UserBadge_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailyQuestProgress" ADD CONSTRAINT "DailyQuestProgress_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuthOtp" ADD CONSTRAINT "AuthOtp_email_fkey" FOREIGN KEY ("email") REFERENCES "User"("email") ON DELETE SET NULL ON UPDATE CASCADE;

