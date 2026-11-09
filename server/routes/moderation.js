/**
 * Ayeh Media Plus — Moderation Routes with RBAC
 *
 * Moderation queue for reviewing, approving, tagging, or rejecting
 * incoming/aggregated Quranic videos, comments, competition entries,
 * and user reports. Access restricted to moderator+ roles.
 */

import { Router } from 'express';
import { prisma } from '../db.js';
import { io } from '../socket.js';
import { authenticate } from '../middleware/auth.js';
import { requirePermission, requireRole } from '../middleware/rbac/index.js';
import { PERMISSIONS } from '../middleware/rbac/permissions.js';

const router = Router();

// All moderation routes require authentication + moderator role
router.use(authenticate({ required: true }));
router.use(requireRole('moderator'));

// ── GET /api/moderation/queue — Moderation queue ──
router.get('/queue', async (req, res) => {
  try {
    const {
      target_type,
      status = 'pending',
      sort = '-created_date',
      limit = 30,
      skip = 0,
    } = req.query;

    const isAdmin = req.user.role === 'admin';
    const take = Math.min(parseInt(limit, 10) || 30, 100);
    const offset = Math.max(0, parseInt(skip, 10) || 0);

    // Build queue from multiple models
    const queue = [];

    // Pending videos
    if (!target_type || target_type === 'video') {
      const where = { status: 'pending_review' };
      const videos = await prisma.video.findMany({
        where,
        orderBy: { created_date: 'desc' },
        take,
        skip: offset,
        select: {
          id: true, title: true, category: true, status: true,
          created_date: true, reciter_name: true, media_url: true,
          verse_key: true, is_competition: true, competition_id: true,
        },
      });
      for (const v of videos) {
        queue.push({
          id: v.id,
          target_type: 'video',
          target_id: v.id,
          title: v.title,
          category: v.category,
          status: v.status,
          submitted_by: v.reciter_name,
          submitted_at: v.created_date,
          media_url: v.media_url,
          verse_key: v.verse_key,
          is_competition: v.is_competition,
          competition_id: v.competition_id,
        });
      }
    }

    // Pending competition entries
    if (!target_type || target_type === 'entry') {
      const where = { status: 'pending_review' };
      const entries = await prisma.competitionEntry.findMany({
        where,
        orderBy: { created_date: 'desc' },
        take,
        skip: offset,
        include: {
          competition: { select: { id: true, title: true } },
        },
      });
      for (const e of entries) {
        queue.push({
          id: e.id,
          target_type: 'entry',
          target_id: e.id,
          title: e.title || 'بدون عنوان',
          category: 'competition_entry',
          status: e.status,
          submitted_by: e.author_name,
          submitted_at: e.created_date,
          media_url: e.media_url,
          verse_key: e.verse_key,
          competition_id: e.competition_id,
          competition_title: e.competition.title,
        });
      }
    }

    // Pending comments
    if (!target_type || target_type === 'comment') {
      const where = { status: 'pending_review' };
      const comments = await prisma.comment.findMany({
        where,
        orderBy: { created_date: 'desc' },
        take,
        skip: offset,
        select: {
          id: true, content: true, status: true, created_date: true,
          author_name: true, video_id: true, entry_id: true, post_id: true,
        },
      });
      for (const c of comments) {
        queue.push({
          id: c.id,
          target_type: 'comment',
          target_id: c.id,
          title: c.content.length > 60 ? c.content.slice(0, 60) + '...' : c.content,
          category: 'comment',
          status: c.status,
          submitted_by: c.author_name,
          submitted_at: c.created_date,
          video_id: c.video_id,
          entry_id: c.entry_id,
          post_id: c.post_id,
        });
      }
    }

    // Sort combined queue
    const isDesc = sort.startsWith('-');
    const field = sort.replace(/^-/, '');
    queue.sort((a, b) => {
      const aVal = new Date(a[field] || a.submitted_at || 0);
      const bVal = new Date(b[field] || b.submitted_at || 0);
      return isDesc ? bVal - aVal : aVal - bVal;
    });

    const paginated = queue.slice(offset, offset + take);

    res.json({
      items: paginated,
      total: queue.length,
      has_more: offset + paginated.length < queue.length,
    });
  } catch (err) {
    console.error('Moderation queue error:', err);
    res.status(500).json({ message: err.message });
  }
});

// ── POST /api/moderation/:targetType/:targetId/action — Moderation action ──
router.post(
  '/:targetType/:targetId/action',
  requirePermission(PERMISSIONS.MODERATE_QUEUE),
  async (req, res) => {
    try {
      const { targetType, targetId } = req.params;
      const {
        action, // approve | reject | hide | remove | ban | warn | feature | unfeature
        reason,
        details,
      } = req.body;

      if (!action) {
        return res.status(400).json({ message: 'عملیات moderation الزامی است' });
      }

      let target;
      let targetName;

      switch (targetType) {
        case 'video': {
          target = await prisma.video.findUnique({ where: { id: targetId } });
          targetName = target?.title;
          break;
        }
        case 'entry': {
          target = await prisma.competitionEntry.findUnique({ where: { id: targetId } });
          targetName = target?.title;
          break;
        }
        case 'comment': {
          target = await prisma.comment.findUnique({ where: { id: targetId } });
          targetName = target?.content?.slice(0, 50);
          break;
        }
        case 'user': {
          target = await prisma.user.findUnique({ where: { id: targetId } });
          targetName = target?.full_name;
          break;
        }
        default:
          return res.status(400).json({ message: 'نوع هدف نامعتبر است' });
      }

      if (!target) {
        return res.status(404).json({ message: 'هدف یافت نشد' });
      }

      // Record moderation action
      const modAction = await prisma.moderationAction.create({
        data: {
          actor_id: req.user.id,
          actor_name: req.user.full_name || 'مدیر سامانه',
          target_type: targetType,
          target_id: targetId,
          action,
          reason: reason || null,
          details: details ? JSON.stringify(details) : null,
        },
      });

      // Apply the action to the target
      switch (targetType) {
        case 'video': {
          if (action === 'approve') {
            await prisma.video.update({
              where: { id: targetId },
              data: { status: 'verified', reviewed_by: req.user.id, reviewed_at: new Date() },
            });
          } else if (action === 'reject') {
            await prisma.video.update({
              where: { id: targetId },
              data: { status: 'rejected', rejection_reason: reason, reviewed_by: req.user.id, reviewed_at: new Date() },
            });
          } else if (action === 'hide' || action === 'remove') {
            await prisma.video.update({
              where: { id: targetId },
              data: { status: 'archived' },
            });
          } else if (action === 'feature') {
            await prisma.video.update({ where: { id: targetId }, data: { featured: true } });
          } else if (action === 'unfeature') {
            await prisma.video.update({ where: { id: targetId }, data: { featured: false } });
          }
          break;
        }
        case 'entry': {
          if (action === 'approve') {
            await prisma.competitionEntry.update({
              where: { id: targetId },
              data: { status: 'verified', judged_by: req.user.id, judged_at: new Date() },
            });
          } else if (action === 'reject') {
            await prisma.competitionEntry.update({
              where: { id: targetId },
              data: { status: 'rejected', rejection_reason: reason, judged_by: req.user.id, judged_at: new Date() },
            });
          } else if (action === 'disqualify') {
            await prisma.competitionEntry.update({
              where: { id: targetId },
              data: { status: 'disqualified', rejection_reason: reason, judged_by: req.user.id, judged_at: new Date() },
            });
          }
          break;
        }
        case 'comment': {
          if (action === 'approve') {
            await prisma.comment.update({
              where: { id: targetId },
              data: { status: 'published', moderated_by: req.user.id, moderated_at: new Date() },
            });
          } else if (action === 'reject' || action === 'hide') {
            await prisma.comment.update({
              where: { id: targetId },
              data: { status: 'hidden', moderated_by: req.user.id, moderated_at: new Date(), moderation_reason: reason },
            });
          } else if (action === 'remove') {
            await prisma.comment.update({
              where: { id: targetId },
              data: { status: 'removed', moderated_by: req.user.id, moderated_at: new Date(), moderation_reason: reason },
            });
          }
          break;
        }
        case 'user': {
          if (action === 'ban') {
            await prisma.user.update({
              where: { id: targetId },
              data: { is_banned: true, banned_reason: reason },
            });
          } else if (action === 'warn') {
            // Warning recorded in moderation action only
          }
          break;
        }
      }

      // Broadcast via socket
      if (io) {
        io.emit('moderation:action', {
          moderation_action_id: modAction.id,
          target_type: targetType,
          target_id: targetId,
          action,
          actor_name: req.user.full_name,
        });
      }

      res.json({
        success: true,
        action,
        target_type: targetType,
        target_id: targetId,
        target_name: targetName,
        moderation_action_id: modAction.id,
      });
    } catch (err) {
      console.error('Moderation action error:', err);
      res.status(500).json({ message: err.message });
    }
  }
);

// ── GET /api/moderation/reports — List reports ──
router.get('/reports', async (req, res) => {
  try {
    const {
      status = 'pending',
      sort = '-created_date',
      limit = 30,
      skip = 0,
    } = req.query;

    const take = Math.min(parseInt(limit, 10) || 30, 100);
    const offset = Math.max(0, parseInt(skip, 10) || 0);

    const where = {};
    if (status && status !== 'all') where.status = status;

    const [reports, total] = await Promise.all([
      prisma.report.findMany({
        where,
        orderBy: { created_date: 'desc' },
        take,
        skip: offset,
        include: {
          reporter: { select: { id: true, full_name: true, avatar_url: true } },
          reviewer: { select: { id: true, full_name: true } },
        },
      }),
      prisma.report.count({ where }),
    ]);

    res.json({
      items: reports,
      has_more: offset + reports.length < total,
      total,
    });
  } catch (err) {
    console.error('List reports error:', err);
    res.status(500).json({ message: err.message });
  }
});

// ── POST /api/moderation/reports/:id/review — Review a report ──
router.post(
  '/reports/:id/review',
  requirePermission(PERMISSIONS.MODERATE_REPORT),
  async (req, res) => {
    try {
      const { status, moderation_note, action_taken } = req.body;

      const report = await prisma.report.findUnique({ where: { id: req.params.id } });

      if (!report) {
        return res.status(404).json({ message: 'Report not found' });
      }

      const updated = await prisma.report.update({
        where: { id: req.params.id },
        data: {
          status: status || 'reviewed',
          reviewed_by: req.user.id,
          reviewed_at: new Date(),
          moderation_note: moderation_note || null,
          action_taken: action_taken || null,
        },
        include: {
          reporter: { select: { id: true, full_name: true } },
          reviewer: { select: { id: true, full_name: true } },
        },
      });

      // Record moderation action
      await prisma.moderationAction.create({
        data: {
          actor_id: req.user.id,
          actor_name: req.user.full_name || 'مدیر سامانه',
          target_type: 'report',
          target_id: req.params.id,
          action: 'review',
          reason: moderation_note || null,
        },
      });

      if (io) {
        io.emit('moderation:report_reviewed', {
          report_id: req.params.id,
          status: updated.status,
          reviewer: req.user.full_name,
        });
      }

      res.json(updated);
    } catch (err) {
      console.error('Review report error:', err);
      res.status(500).json({ message: err.message });
    }
  }
);

// ── GET /api/moderation/audit-log — Audit log of moderation actions ──
router.get('/audit-log', async (req, res) => {
  try {
    const {
      sort = '-created_date',
      limit = 50,
      skip = 0,
      actor_id,
      action,
    } = req.query;

    const take = Math.min(parseInt(limit, 10) || 50, 100);
    const offset = Math.max(0, parseInt(skip, 10) || 0);

    const where = {};
    if (actor_id) where.actor_id = actor_id;
    if (action) where.action = action;

    const [actions, total] = await Promise.all([
      prisma.moderationAction.findMany({
        where,
        orderBy: { created_date: 'desc' },
        take,
        skip: offset,
        include: {
          actor: { select: { id: true, full_name: true, avatar_url: true } },
        },
      }),
      prisma.moderationAction.count({ where }),
    ]);

    res.json({
      items: actions,
      has_more: offset + actions.length < total,
      total,
    });
  } catch (err) {
    console.error('Audit log error:', err);
    res.status(500).json({ message: err.message });
  }
});

export default router;