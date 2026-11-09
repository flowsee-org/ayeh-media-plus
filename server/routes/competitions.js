/**
 * Ayeh Media Plus — Competition Routes with RBAC
 *
 * Quranic competition management: recitation, memorization, tafsir, qirat.
 * Supports submission, voting, judging, and full approval workflow.
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
router.use(authenticate({ required: false }));

// ── Helper: serialize competition ──
function serializeComp(c) {
  return {
    ...c,
    rules: c.rules ? JSON.parse(c.rules) : [],
    prizes: c.prizes ? JSON.parse(c.prizes) : [],
  };
}

// ── Helper: serialize entry ──
function serializeEntry(e) {
  return {
    ...e,
    votes: e.votes ? JSON.parse(e.votes) : [],
  };
}

// ── GET /api/competitions — List competitions ──
router.get('/', async (req, res) => {
  try {
    const {
      status = 'active',
      type,
      year,
      featured,
      is_international,
      sort = '-created_date',
      limit = 20,
      skip = 0,
    } = req.query;

    const isStaff = req.user &&
      (req.user.role === 'admin' || req.user.role === 'moderator');

    const where = {};
    if (status && status !== 'all') where.status = status;
    if (type) where.type = type;
    if (year) where.year = year;
    if (featured !== undefined) where.featured = featured === 'true';
    if (is_international !== undefined)
      where.is_international = is_international === 'true';

    // Non-staff can't see draft/cancelled unless it's their own
    if (!isStaff && !where.status) {
      where.status = { in: ['active', 'completed'] };
    }

    const take = Math.min(parseInt(limit, 10) || 20, 100);
    const offset = Math.max(0, parseInt(skip, 10) || 0);
    const isDesc = sort.startsWith('-');
    const field = isDesc ? sort.slice(1) : sort;
    const orderBy = { [field]: isDesc ? 'desc' : 'asc' };

    const [comps, total] = await Promise.all([
      prisma.competition.findMany({
        where,
        orderBy,
        take,
        skip: offset,
        include: {
          _count: { select: { entries: true } },
          organizer: {
            select: { id: true, full_name: true, avatar_url: true, role: true },
          },
        },
      }),
      prisma.competition.count({ where }),
    ]);

    res.json({
      items: comps.map(serializeComp),
      has_more: offset + comps.length < total,
      total,
    });
  } catch (err) {
    console.error('List competitions error:', err);
    res.status(500).json({ message: err.message });
  }
});

// ── GET /api/competitions/:id — Get single competition ──
router.get('/:id', async (req, res) => {
  try {
    const comp = await prisma.competition.findUnique({
      where: { id: req.params.id },
      include: {
        organizer: {
          select: { id: true, full_name: true, avatar_url: true, role: true },
        },
        _count: { select: { entries: true } },
      },
    });

    if (!comp) {
      return res.status(404).json({ message: 'Competition not found' });
    }

    res.json(serializeComp(comp));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── POST /api/competitions — Create competition (creator+) ──
router.post(
  '/',
  authenticate({ required: true }),
  requirePermission(PERMISSIONS.COMPETITION_CREATE),
  async (req, res) => {
    try {
      const {
        title,
        title_arabic,
        description,
        type = 'recitation',
        prize_title,
        prize_description,
        prize_value,
        rules = [],
        start_date,
        end_date,
        registration_deadline,
        venue,
        venue_city,
        venue_country,
        year,
        season,
        theme_color,
        age_category,
        gender_category,
        judging_criteria,
        prizes = [],
      } = req.body;

      if (!title) {
        return res.status(400).json({ message: 'عنوان مسابقه الزامی است' });
      }

      const comp = await prisma.competition.create({
        data: {
          title,
          title_arabic,
          description,
          type,
          prize_title,
          prize_description,
          prize_value,
          rules: rules.length ? JSON.stringify(rules) : null,
          start_date: start_date ? new Date(start_date) : null,
          end_date: end_date ? new Date(end_date) : null,
          registration_deadline: registration_deadline
            ? new Date(registration_deadline)
            : null,
          organizer_id: req.user.id,
          organizer_name: req.user.full_name || 'کاربر آیه',
          venue,
          venue_city,
          venue_country,
          year,
          season,
          theme_color,
          age_category,
          gender_category,
          judging_criteria:
            judging_criteria !== undefined
              ? typeof judging_criteria === 'string'
                ? judging_criteria
                : JSON.stringify(judging_criteria)
              : null,
          prizes: prizes.length ? JSON.stringify(prizes) : null,
          status: 'active',
          entries_count: 0,
        },
      });

      res.status(201).json(serializeComp(comp));
    } catch (err) {
      console.error('Create competition error:', err);
      res.status(500).json({ message: err.message });
    }
  }
);

// ── PUT /api/competitions/:id — Update competition (organizer or staff) ──
router.put(
  '/:id',
  authenticate({ required: true }),
  requireOwnershipOrPermission('organizer_id', PERMISSIONS.COMPETITION_UPDATE_ANY),
  async (req, res) => {
    try {
      const comp = await prisma.competition.findUnique({
        where: { id: req.params.id },
      });

      if (!comp) {
        return res.status(404).json({ message: 'Competition not found' });
      }

      const isOwner = comp.organizer_id === req.user.id;
      const isStaff =
        req.user.role === 'admin' || req.user.role === 'moderator';

      if (!isOwner && !isStaff) {
        return res.status(403).json({
          message: 'شما مجاز به ویرایش این مسابقه نیستید',
        });
      }

      const updateData = { ...req.body };
      // Remove fields we handle specially
      delete updateData.id;
      delete updateData.organizer_id;

      if (updateData.rules && Array.isArray(updateData.rules)) {
        updateData.rules = JSON.stringify(updateData.rules);
      }
      if (updateData.prizes && Array.isArray(updateData.prizes)) {
        updateData.prizes = JSON.stringify(updateData.prizes);
      }
      if (updateData.start_date) updateData.start_date = new Date(updateData.start_date);
      if (updateData.end_date) updateData.end_date = new Date(updateData.end_date);
      if (updateData.registration_deadline)
        updateData.registration_deadline = new Date(updateData.registration_deadline);

      const updated = await prisma.competition.update({
        where: { id: req.params.id },
        data: updateData,
      });

      res.json(serializeComp(updated));
    } catch (err) {
      console.error('Update competition error:', err);
      res.status(500).json({ message: err.message });
    }
  }
);

// ── DELETE /api/competitions/:id ──
router.delete(
  '/:id',
  authenticate({ required: true }),
  requireOwnershipOrPermission('organizer_id', PERMISSIONS.COMPETITION_DELETE_ANY),
  async (req, res) => {
    try {
      const comp = await prisma.competition.findUnique({
        where: { id: req.params.id },
      });

      if (!comp) {
        return res.status(404).json({ message: 'Competition not found' });
      }

      const isOwner = comp.organizer_id === req.user.id;
      const isStaff =
        req.user.role === 'admin' || req.user.role === 'moderator';

      if (!isOwner && !isStaff) {
        return res.status(403).json({
          message: 'شما مجاز به حذف این مسابقه نیستید',
        });
      }

      await prisma.competition.delete({ where: { id: req.params.id } });
      res.json({ success: true, id: req.params.id });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }
);

// ── GET /api/competitions/:id/entries — List entries for a competition ──
router.get('/:id/entries', async (req, res) => {
  try {
    const { status, sort = '-created_date', limit = 50, skip = 0 } = req.query;

    const isStaff = req.user &&
      (req.user.role === 'admin' || req.user.role === 'moderator');

    const where = { competition_id: req.params.id };
    if (status && status !== 'all') where.status = status;
    else if (!isStaff) where.status = 'published'; // public only sees published

    const take = Math.min(parseInt(limit, 10) || 50, 100);
    const offset = Math.max(0, parseInt(skip, 10) || 0);
    const isDesc = sort.startsWith('-');
    const field = isDesc ? sort.slice(1) : sort;
    const orderBy = { [field]: isDesc ? 'desc' : 'asc' };

    const [entries, total] = await Promise.all([
      prisma.competitionEntry.findMany({
        where,
        orderBy,
        take,
        skip: offset,
        include: {
          _count: { select: { votes: true, comments: true } },
          author: { select: { id: true, full_name: true, avatar_url: true, role: true } },
        },
      }),
      prisma.competitionEntry.count({ where }),
    ]);

    res.json({
      items: entries.map(serializeEntry),
      has_more: offset + entries.length < total,
      total,
    });
  } catch (err) {
    console.error('List entries error:', err);
    res.status(500).json({ message: err.message });
  }
});

// ── POST /api/competitions/:id/entries — Submit entry (user+) ──
router.post(
  '/:id/entries',
  authenticate({ required: true }),
  requirePermission(PERMISSIONS.COMPETITION_SUBMIT_ENTRY),
  async (req, res) => {
    try {
      const competition = await prisma.competition.findUnique({
        where: { id: req.params.id },
      });

      if (!competition) {
        return res.status(404).json({ message: 'Competition not found' });
      }

      if (competition.status !== 'active') {
        return res.status(400).json({
          message: 'این مسابقه در حال حاضر برای ارسالEffect فعّال نیست',
        });
      }

      const {
        title,
        content,
        media_url,
        media_type = 'audio',
        thumbnail_url,
        verse_key,
        verse_arabic,
        duration,
      } = req.body;

      if (!media_url) {
        return res.status(400).json({ message: 'لینک محتوا الزامی است' });
      }

      // Check if user already submitted
      const existing = await prisma.competitionEntry.findFirst({
        where: {
          competition_id: req.params.id,
          author_id: req.user.id,
        },
      });

      if (existing) {
        return res.status(400).json({
          message: 'شما قبلاً برای این مسابقه اثر ارسال کرده‌اید',
        });
      }

      // Determine status: auto-publish for staff, pending for others
      const isStaff = req.user.role === 'admin' || req.user.role === 'moderator';
      const initialStatus = isStaff ? 'published' : 'pending_review';

      const entry = await prisma.competitionEntry.create({
        data: {
          competition_id: req.params.id,
          author_id: req.user.id,
          author_name: req.user.full_name || 'کاربر آیه',
          title,
          content,
          media_url,
          media_type,
          thumbnail_url,
          verse_key,
          verse_arabic,
          duration,
          status: initialStatus,
          votes_count: 0,
        },
      });

      // Increment competition entry count
      await prisma.competition.update({
        where: { id: req.params.id },
        data: { entries_count: { increment: 1 } },
      });

      // Notify moderation queue
      if (initialStatus === 'pending_review' && io) {
        io.emit('moderation:new_entry', {
          entry_id: entry.id,
          competition_id: req.params.id,
          competition_title: competition.title,
          submitted_by: req.user.full_name,
        });
      }

      res.status(201).json(serializeEntry(entry));
    } catch (err) {
      console.error('Create entry error:', err);
      res.status(500).json({ message: err.message });
    }
  }
);

// ── POST /api/competitions/:id/entries/:entryId/vote — Vote on entry ──
router.post(
  '/:id/entries/:entryId/vote',
  authenticate({ required: true }),
  requirePermission(PERMISSIONS.COMPETITION_VOTE),
  async (req, res) => {
    try {
      const { vote_type = 'upvote' } = req.body;

      const entry = await prisma.competitionEntry.findUnique({
        where: { id: req.params.entryId },
      });

      if (!entry) {
        return res.status(404).json({ message: 'Entry not found' });
      }

      if (entry.competition_id !== req.params.id) {
        return res.status(400).json({ message: 'Entry does not belong to this competition' });
      }

      // Check if already voted
      const existingVote = await prisma.vote.findUnique({
        where: {
          user_id_entry_id: {
            user_id: req.user.id,
            entry_id: req.params.entryId,
          },
        },
      });

      let newVoteCount = entry.votes_count;

      if (existingVote) {
        // Change vote or remove
        if (existingVote.vote_type === vote_type) {
          // Remove vote (toggle off)
          await prisma.vote.delete({
            where: {
              user_id_entry_id: {
                user_id: req.user.id,
                entry_id: req.params.entryId,
              },
            },
          });
          newVoteCount = Math.max(0, entry.votes_count - 1);
        } else {
          // Change vote type
          await prisma.vote.update({
            where: {
              user_id_entry_id: {
                user_id: req.user.id,
                entry_id: req.params.entryId,
              },
            },
            data: { vote_type },
          });
          // Count stays same (just changed type)
        }
      } else {
        // Create new vote
        await prisma.vote.create({
          data: {
            user_id: req.user.id,
            entry_id: req.params.entryId,
            competition_id: req.params.id,
            vote_type,
          },
        });
        newVoteCount = entry.votes_count + 1;
      }

      await prisma.competitionEntry.update({
        where: { id: req.params.entryId },
        data: { votes_count: newVoteCount },
      });

      const effectiveVote = existingVote
        ? (existingVote.vote_type === vote_type ? null : vote_type)
        : vote_type;
      res.json({ success: true, votes_count: newVoteCount, user_vote: effectiveVote });
    } catch (err) {
      console.error('Vote error:', err);
      res.status(500).json({ message: err.message });
    }
  }
);

// ── POST /api/competitions/entries/:entryId/judge — Judge entry (moderator+) ──
router.post(
  '/entries/:entryId/judge',
  authenticate({ required: true }),
  requirePermission(PERMISSIONS.COMPETITION_JUDGE),
  async (req, res) => {
    try {
      const {
        score_tajweed,
        score_voice,
        score_accuracy,
        score_total,
        rank_position,
        status = 'verified',
        rejection_reason,
      } = req.body;

      const entry = await prisma.competitionEntry.findUnique({
        where: { id: req.params.entryId },
        include: { competition: true },
      });

      if (!entry) {
        return res.status(404).json({ message: 'Entry not found' });
      }

      const updated = await prisma.competitionEntry.update({
        where: { id: req.params.entryId },
        data: {
          score_tajweed: score_tajweed !== undefined ? score_tajweed : entry.score_tajweed,
          score_voice: score_voice !== undefined ? score_voice : entry.score_voice,
          score_accuracy: score_accuracy !== undefined ? score_accuracy : entry.score_accuracy,
          score_total: score_total !== undefined ? score_total : entry.score_total,
          rank_position,
          status,
          rejection_reason: rejection_reason || null,
          judged_by: req.user.id,
          judged_at: new Date(),
        },
      });

      // If verified/published, notify
      if ((status === 'published' || status === 'verified') && io) {
        io.emit('moderation:entry_approved', {
          entry_id: entry.id,
          competition_id: entry.competition_id,
          competition_title: entry.competition.title,
          author_name: entry.author_name,
        });
      }

      res.json(serializeEntry(updated));
    } catch (err) {
      console.error('Judge error:', err);
      res.status(500).json({ message: err.message });
    }
  }
);

export default router;