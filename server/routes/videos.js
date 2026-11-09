/**
 * Ayeh Media Plus — Video Routes with RBAC
 *
 * Dedicated video management endpoints with role-based access control.
 * Complements the generic entities.js with video-specific business logic:
 * approval workflow, view tracking, engagement, chapters, audio-only mode.
 */

import { Router } from 'express';
import { prisma } from '../db.js';
import { io } from '../socket.js';
import { authenticate } from '../middleware/auth.js';
import {
  requirePermission,
  requireRole,
  requireOwnershipOrPermission,
} from '../middleware/rbac/index.js';
import { PERMISSIONS } from '../middleware/rbac/permissions.js';

const router = Router();

// All routes require authentication for writes; reads are public
router.use(authenticate({ required: false }));

// ── Helper: serialize video for API response ──
function serializeVideo(v) {
  return {
    ...v,
    tags: v.tags ? JSON.parse(v.tags) : [],
    chapters: v.chapters ? JSON.parse(v.chapters) : [],
    liked_by: v.liked_by ? JSON.parse(v.liked_by) : [],
    qualities: v.qualities ? JSON.parse(v.qualities) : [],
  };
}

// ── GET /api/videos — List videos (public, filters by status for non-staff) ──
router.get('/', async (req, res) => {
  try {
    const {
      status,
      category,
      reciter_name,
      competition_id,
      verse_key,
      is_live,
      is_competition,
      sort = '-created_date',
      limit = 20,
      skip = 0,
      featured,
    } = req.query;

    const isAdmin = req.user?.role === 'admin';
    const isModerator = req.user?.role === 'moderator';

    const where = {};

    // Status filtering: non-staff only see published/verified
    if (status) {
      where.status = status;
    } else if (!isAdmin && !isModerator) {
      where.status = { in: ['published', 'verified'] };
    }

    if (category) where.category = category;
    if (reciter_name) where.reciter_name = { contains: reciter_name };
    if (competition_id) where.competition_id = competition_id;
    if (verse_key) where.verse_key = verse_key;
    if (is_live !== undefined) where.is_live = is_live === 'true';
    if (is_competition !== undefined) where.is_competition = is_competition === 'true';
    if (featured !== undefined) where.featured = featured === 'true';

    const take = Math.min(parseInt(limit, 10) || 20, 100);
    const offset = Math.max(0, parseInt(skip, 10) || 0);

    // Parse sort
    const isDesc = sort.startsWith('-');
    const field = isDesc ? sort.slice(1) : sort;
    const orderBy = { [field]: isDesc ? 'desc' : 'asc' };

    const [videos, total] = await Promise.all([
      prisma.video.findMany({
        where,
        orderBy,
        take,
        skip: offset,
        include: {
          _count: { select: { likes: true, comments: true, bookmarks: true } },
        },
      }),
      prisma.video.count({ where }),
    ]);

    res.json({
      items: videos.map(serializeVideo),
      has_more: offset + videos.length < total,
      total,
    });
  } catch (err) {
    console.error('List videos error:', err);
    res.status(500).json({ message: err.message });
  }
});

// ── GET /api/videos/:id — Get single video with view tracking ──
router.get('/:id', async (req, res) => {
  try {
    const video = await prisma.video.findUnique({
      where: { id: req.params.id },
      include: {
        _count: { select: { likes: true, comments: true, bookmarks: true } },
      },
    });

    if (!video) {
      return res.status(404).json({ message: 'Video not found' });
    }

    // Status check: only staff can see non-published
    const isStaff = req.user &&
      (req.user.role === 'admin' || req.user.role === 'moderator');
    if (
      video.status !== 'published' &&
      video.status !== 'verified' &&
      !isStaff &&
      video.reciter_id !== req.user?.id
    ) {
      return res.status(403).json({
        message: 'این ویدیو در حال بررسی است و برای عموم قابل نمایش نیست',
      });
    }

    // Increment view count (non-atomic but fine for MVP)
    await prisma.video.update({
      where: { id: req.params.id },
      data: { views_count: { increment: 1 } },
    });

    res.json(serializeVideo(video));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── POST /api/videos — Create/submit a video (creator+) ──
router.post(
  '/',
  authenticate({ required: true }),
  requirePermission(PERMISSIONS.VIDEO_SUBMIT),
  async (req, res) => {
    try {
      const {
        title,
        description,
        category = 'recitation',
        media_url,
        media_type = 'video',
        thumbnail_url,
        duration,
        verse_key,
        verse_arabic,
        translation,
        transliteration,
        tafsir,
        reciter_name,
        reciter_bio,
        scholar_name,
        competition_id,
        is_live = false,
        is_competition = false,
        tags = [],
        language = 'ar',
        quality = '1080p',
        audio_only_url,
        chapters = [],
        download_enabled = false,
      } = req.body;

      if (!title || !media_url) {
        return res.status(400).json({
          message: 'عنوان و لینک محتوا الزامی است',
        });
      }

      // Determine initial status based on role
      const isStaff = req.user.role === 'admin' || req.user.role === 'moderator';
      const initialStatus = isStaff ? 'published' : 'pending_review';

      const video = await prisma.video.create({
        data: {
          title,
          description,
          category,
          media_url,
          media_type,
          thumbnail_url,
          duration,
          verse_key,
          verse_arabic,
          translation,
          transliteration,
          tafsir,
          reciter_id: req.user.id,
          reciter_name: reciter_name || req.user.full_name || 'کاربر آیه',
          reciter_bio: req.user.bio,
          scholar_name,
          competition_id: competition_id || null,
          is_live,
          is_competition,
          status: initialStatus,
          tags: JSON.stringify(tags),
          language,
          quality,
          audio_only_url,
          chapters: chapters.length ? JSON.stringify(chapters) : null,
          download_enabled,
          views_count: 0,
          likes_count: 0,
          dislikes_count: 0,
          comments_count: 0,
        },
      });

      // Broadcast to moderation queue if pending
      if (initialStatus === 'pending_review' && io) {
        io.emit('moderation:new_video', {
          video_id: video.id,
          title: video.title,
          submitted_by: req.user.full_name,
          submitted_at: video.created_date,
        });
      }

      res.status(201).json(serializeVideo(video));
    } catch (err) {
      console.error('Create video error:', err);
      res.status(500).json({ message: err.message });
    }
  }
);

// ── PUT /api/videos/:id — Update video (owner or moderator+) ──
router.put(
  '/:id',
  authenticate({ required: true }),
  requireOwnershipOrPermission('reciter_id', PERMISSIONS.VIDEO_UPDATE_ANY),
  async (req, res) => {
    try {
      const video = await prisma.video.findUnique({
        where: { id: req.params.id },
      });

      if (!video) {
        return res.status(404).json({ message: 'Video not found' });
      }

      // Verify ownership or permission
      const isOwner = video.reciter_id === req.user.id;
      const hasPerm = (() => {
        switch (req.user.role) {
          case 'admin':
          case 'moderator':
            return true;
          default:
            return false;
        }
      })();

      if (!isOwner && !hasPerm) {
        return res.status(403).json({
          message: 'شما مجاز به ویرایش این ویدیو نیستید',
        });
      }

      const {
        title, description, category, media_url, thumbnail_url, duration,
        verse_key, verse_arabic, translation, transliteration, tafsir,
        tags, language, quality, audio_only_url, chapters, download_enabled,
      } = req.body;

      const updateData = {};
      if (title !== undefined) updateData.title = title;
      if (description !== undefined) updateData.description = description;
      if (category !== undefined) updateData.category = category;
      if (media_url !== undefined) updateData.media_url = media_url;
      if (thumbnail_url !== undefined) updateData.thumbnail_url = thumbnail_url;
      if (duration !== undefined) updateData.duration = duration;
      if (verse_key !== undefined) updateData.verse_key = verse_key;
      if (verse_arabic !== undefined) updateData.verse_arabic = verse_arabic;
      if (translation !== undefined) updateData.translation = translation;
      if (transliteration !== undefined) updateData.transliteration = transliteration;
      if (tafsir !== undefined) updateData.tafsir = tafsir;
      if (tags !== undefined) updateData.tags = JSON.stringify(tags);
      if (language !== undefined) updateData.language = language;
      if (quality !== undefined) updateData.quality = quality;
      if (audio_only_url !== undefined) updateData.audio_only_url = audio_only_url;
      if (chapters !== undefined)
        updateData.chapters = chapters.length ? JSON.stringify(chapters) : null;
      if (download_enabled !== undefined)
        updateData.download_enabled = download_enabled;

      // If non-staff edits, reset to pending_review
      if (!hasPerm && video.status === 'published') {
        updateData.status = 'pending_review';
        updateData.reviewed_by = null;
        updateData.reviewed_at = null;
      }

      const updated = await prisma.video.update({
        where: { id: req.params.id },
        data: updateData,
      });

      res.json(serializeVideo(updated));
    } catch (err) {
      console.error('Update video error:', err);
      res.status(500).json({ message: err.message });
    }
  }
);

// ── DELETE /api/videos/:id — Delete video (owner or moderator+) ──
router.delete(
  '/:id',
  authenticate({ required: true }),
  requireOwnershipOrPermission('reciter_id', PERMISSIONS.VIDEO_DELETE_ANY),
  async (req, res) => {
    try {
      const video = await prisma.video.findUnique({
        where: { id: req.params.id },
      });

      if (!video) {
        return res.status(404).json({ message: 'Video not found' });
      }

      const isOwner = video.reciter_id === req.user.id;
      const hasPerm =
        req.user.role === 'admin' || req.user.role === 'moderator';

      if (!isOwner && !hasPerm) {
        return res.status(403).json({
          message: 'شما مجاز به حذف این ویدیو نیستید',
        });
      }

      await prisma.video.delete({ where: { id: req.params.id } });
      res.json({ success: true, id: req.params.id });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }
);

// ── POST /api/videos/:id/view — Record watch time & completion ──
router.post('/:id/view', async (req, res) => {
  try {
    const { watch_seconds, completion_percentage } = req.body;

    await prisma.video.update({
      where: { id: req.params.id },
      data: {
        views_count: { increment: 1 },
        watch_time_minutes: {
          increment: Math.floor((watch_seconds || 0) / 60),
        },
        completion_rate: completion_percentage !== undefined
          ? completion_percentage
          : undefined,
      },
    });

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── GET /api/videos/:id/analytics — Analytics (creator/mod/admin) ──
router.get(
  '/:id/analytics',
  authenticate({ required: true }),
  requirePermission(PERMISSIONS.ANALYTICS_READ_OWN),
  async (req, res) => {
    try {
      const video = await prisma.video.findUnique({
        where: { id: req.params.id },
      });

      if (!video) {
        return res.status(404).json({ message: 'Video not found' });
      }

      // Owners can see their own; staff can see any
      const isOwner = video.reciter_id === req.user.id;
      const isStaff =
        req.user.role === 'admin' || req.user.role === 'moderator';

      if (!isOwner && !isStaff) {
        return res.status(403).json({
          message: 'دسترسی به آنالیтика این ویدیو برای شما مجاز نیست',
        });
      }

      const [
        likes,
        comments,
        bookmarks,
        dailyViews,
      ] = await Promise.all([
        prisma.like.count({ where: { video_id: req.params.id } }),
        prisma.comment.count({ where: { video_id: req.params.id } }),
        prisma.bookmark.count({ where: { video_id: req.params.id } }),
        // Mock daily views for now (would come from analytics table in production)
        Promise.resolve([{ date: new Date().toISOString().split('T')[0], count: video.views_count }]),
      ]);

      res.json({
        video_id: video.id,
        title: video.title,
        views: video.views_count,
        watch_time_minutes: video.watch_time_minutes,
        completion_rate: video.completion_rate,
        likes,
        comments,
        bookmarks,
        daily_views: dailyViews,
        engagement_rate:
          video.views_count > 0
            ? ((likes + comments + bookmarks) / video.views_count) * 100
            : 0,
      });
    } catch (err) {
      console.error('Analytics error:', err);
      res.status(500).json({ message: err.message });
    }
  }
);

export default router;