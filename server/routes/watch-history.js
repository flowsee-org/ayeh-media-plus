/**
 * Server-side watch history — authenticated users only.
 * Upserts one row per (user_id, video_id); soft-references video ids.
 */
import { Router } from 'express';
import { prisma } from '../db.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

/** Soft video ids: UUID or short opaque tokens; reject pathological lengths. */
const VIDEO_ID_MAX_LEN = 128;
const VIDEO_ID_RE = /^[A-Za-z0-9_.:\-]+$/;

function validateVideoId(videoId) {
  if (!videoId || typeof videoId !== 'string') {
    return 'video_id is required';
  }
  const trimmed = videoId.trim();
  if (!trimmed) return 'video_id is required';
  if (trimmed.length > VIDEO_ID_MAX_LEN) {
    return `video_id must be at most ${VIDEO_ID_MAX_LEN} characters`;
  }
  if (!VIDEO_ID_RE.test(trimmed)) {
    return 'video_id contains invalid characters';
  }
  return null;
}

function serializeEntry(row, video = null) {
  const available = Boolean(video);
  return {
    id: row.id,
    video_id: row.video_id,
    title: available ? video.title || row.title : row.title,
    thumbnail_url: available
      ? video.thumbnail_url || row.thumbnail_url
      : row.thumbnail_url,
    watch_seconds: row.watch_seconds,
    completion_percentage: row.completion_percentage,
    watch_count: row.watch_count,
    last_watched_at: row.last_watched_at,
    watched_at: row.last_watched_at
      ? new Date(row.last_watched_at).getTime()
      : null,
    video_available: available,
    video: available
      ? {
          id: video.id,
          title: video.title,
          thumbnail_url: video.thumbnail_url,
          media_url: video.media_url,
          status: video.status,
          duration: video.duration,
        }
      : null,
  };
}

async function enrich(rows) {
  const ids = [...new Set(rows.map((r) => r.video_id).filter(Boolean))];
  const videos = ids.length
    ? await prisma.video.findMany({
        where: { id: { in: ids } },
        select: {
          id: true,
          title: true,
          thumbnail_url: true,
          media_url: true,
          status: true,
          duration: true,
        },
      })
    : [];
  const byId = new Map(videos.map((v) => [v.id, v]));
  return rows.map((r) => serializeEntry(r, byId.get(r.video_id) || null));
}

// GET /api/watch-history — list current user's history
router.get('/', authenticate({ required: true }), async (req, res) => {
  try {
    const take = Math.min(parseInt(req.query.limit, 10) || 100, 200);
    const skip = Math.max(0, parseInt(req.query.skip, 10) || 0);
    const where = { user_id: req.user.id };
    const [rows, total, aggregates] = await Promise.all([
      prisma.watchHistory.findMany({
        where,
        orderBy: { last_watched_at: 'desc' },
        take,
        skip,
      }),
      prisma.watchHistory.count({ where }),
      prisma.watchHistory.aggregate({
        where,
        _sum: { watch_seconds: true },
      }),
    ]);
    const items = await enrich(rows);
    res.json({
      items,
      total,
      has_more: skip + items.length < total,
      total_watch_seconds: aggregates._sum.watch_seconds || 0,
    });
  } catch (err) {
    console.error('Watch history list error:', err);
    res.status(500).json({ message: 'Failed to load watch history' });
  }
});

// POST /api/watch-history — upsert progress for a video
router.post('/', authenticate({ required: true }), async (req, res) => {
  try {
    const {
      video_id,
      title,
      thumbnail_url,
      watch_seconds = 0,
      completion_percentage = 0,
    } = req.body || {};

    const videoIdError = validateVideoId(video_id);
    if (videoIdError) {
      return res.status(400).json({ message: videoIdError });
    }
    const normalizedVideoId = video_id.trim();

    const seconds = Math.max(0, Math.floor(Number(watch_seconds) || 0));
    const completion = Math.min(
      100,
      Math.max(0, Number(completion_percentage) || 0)
    );

    const video = await prisma.video.findUnique({
      where: { id: normalizedVideoId },
      select: { id: true, title: true, thumbnail_url: true, media_url: true, status: true, duration: true },
    });

    const now = new Date();
    // Serialize per-user upserts so concurrent heartbeats don't drop increments.
    const { row, created } = await prisma.$transaction(async (tx) => {
      const existing = await tx.watchHistory.findUnique({
        where: {
          user_id_video_id: { user_id: req.user.id, video_id: normalizedVideoId },
        },
      });

      if (existing) {
        const updated = await tx.watchHistory.update({
          where: { id: existing.id },
          data: {
            title: title || video?.title || existing.title,
            thumbnail_url:
              thumbnail_url || video?.thumbnail_url || existing.thumbnail_url,
            watch_seconds: existing.watch_seconds + seconds,
            completion_percentage: Math.max(
              existing.completion_percentage || 0,
              completion
            ),
            watch_count: existing.watch_count + 1,
            last_watched_at: now,
          },
        });
        return { row: updated, created: false };
      }

      try {
        const createdRow = await tx.watchHistory.create({
          data: {
            user_id: req.user.id,
            video_id: normalizedVideoId,
            title: title || video?.title || null,
            thumbnail_url: thumbnail_url || video?.thumbnail_url || null,
            watch_seconds: seconds,
            completion_percentage: completion,
            watch_count: 1,
            last_watched_at: now,
          },
        });
        return { row: createdRow, created: true };
      } catch (err) {
        // Unique race: another request inserted first — fall back to update.
        if (err?.code !== 'P2002') throw err;
        const raced = await tx.watchHistory.findUnique({
          where: {
            user_id_video_id: { user_id: req.user.id, video_id: normalizedVideoId },
          },
        });
        if (!raced) throw err;
        const updated = await tx.watchHistory.update({
          where: { id: raced.id },
          data: {
            title: title || video?.title || raced.title,
            thumbnail_url:
              thumbnail_url || video?.thumbnail_url || raced.thumbnail_url,
            watch_seconds: raced.watch_seconds + seconds,
            completion_percentage: Math.max(
              raced.completion_percentage || 0,
              completion
            ),
            watch_count: raced.watch_count + 1,
            last_watched_at: now,
          },
        });
        return { row: updated, created: false };
      }
    });

    res.status(created ? 201 : 200).json(serializeEntry(row, video));
  } catch (err) {
    console.error('Watch history upsert error:', err);
    res.status(500).json({ message: 'Failed to save watch history' });
  }
});

// DELETE /api/watch-history — clear all for current user
router.delete('/', authenticate({ required: true }), async (req, res) => {
  try {
    const result = await prisma.watchHistory.deleteMany({
      where: { user_id: req.user.id },
    });
    res.json({ success: true, count: result.count });
  } catch (err) {
    console.error('Watch history clear error:', err);
    res.status(500).json({ message: 'Failed to clear watch history' });
  }
});

// DELETE /api/watch-history/:videoId — remove one entry
router.delete('/:videoId', authenticate({ required: true }), async (req, res) => {
  try {
    const videoIdError = validateVideoId(req.params.videoId);
    if (videoIdError) {
      return res.status(400).json({ message: videoIdError });
    }
    const videoId = req.params.videoId.trim();
    const existing = await prisma.watchHistory.findUnique({
      where: {
        user_id_video_id: {
          user_id: req.user.id,
          video_id: videoId,
        },
      },
    });
    if (!existing) {
      return res.status(404).json({ message: 'History entry not found' });
    }
    await prisma.watchHistory.delete({ where: { id: existing.id } });
    res.json({ success: true, video_id: videoId });
  } catch (err) {
    console.error('Watch history delete error:', err);
    res.status(500).json({ message: 'Failed to delete watch history entry' });
  }
});

export default router;
