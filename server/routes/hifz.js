import { Router } from 'express';
import { prisma } from '../db.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

/**
 * SM-2 Calculation helper
 * @param {number} grade - Quality of review (0 to 5)
 * @param {number} repetitions - Consecutive successful reviews count
 * @param {number} easeFactor - Current ease factor (min 1.3)
 * @param {number} intervalDays - Current interval in days
 */
export function calculateSM2(grade, repetitions = 0, easeFactor = 2.5, intervalDays = 1) {
  let nextRepetitions = repetitions;
  let nextEaseFactor = easeFactor;
  let nextIntervalDays = intervalDays;

  if (grade >= 3) {
    if (repetitions === 0) {
      nextIntervalDays = 1;
    } else if (repetitions === 1) {
      nextIntervalDays = 3;
    } else {
      nextIntervalDays = Math.round(intervalDays * easeFactor);
    }
    nextRepetitions = repetitions + 1;
  } else {
    nextRepetitions = 0;
    nextIntervalDays = 1;
  }

  nextEaseFactor = easeFactor + (0.1 - (5 - grade) * (0.08 + (5 - grade) * 0.02));
  if (nextEaseFactor < 1.3) {
    nextEaseFactor = 1.3;
  }

  const nextReviewAt = new Date();
  nextReviewAt.setDate(nextReviewAt.getDate() + nextIntervalDays);

  let status = 'LEARNING';
  if (nextRepetitions >= 5) {
    status = 'MASTERED';
  } else if (grade < 3) {
    status = 'NEEDS_REVIEW';
  }

  return {
    repetitions: nextRepetitions,
    ease_factor: Number(nextEaseFactor.toFixed(2)),
    interval_days: nextIntervalDays,
    next_review_at: nextReviewAt,
    status,
  };
}

// ── GET /api/hifz/progress (Get user progress & review queue) ──
router.get('/progress', authenticate({ required: true }), async (req, res) => {
  try {
    const userId = req.user.id;
    const now = new Date();

    const [allProgress, dueReviews, stats] = await Promise.all([
      prisma.hifzProgress.findMany({
        where: { user_id: userId },
        orderBy: [{ surah_number: 'asc' }, { verse_number: 'asc' }],
      }),
      prisma.hifzProgress.findMany({
        where: {
          user_id: userId,
          next_review_at: { lte: now },
        },
        orderBy: { next_review_at: 'asc' },
      }),
      prisma.hifzProgress.groupBy({
        by: ['status'],
        where: { user_id: userId },
        _count: { id: true },
      }),
    ]);

    const statusCounts = {
      LEARNING: 0,
      MASTERED: 0,
      NEEDS_REVIEW: 0,
    };
    stats.forEach((s) => {
      statusCounts[s.status] = s._count.id;
    });

    res.json({
      items: allProgress,
      due_reviews: dueReviews,
      stats: {
        total_memorized: statusCounts.MASTERED + statusCounts.LEARNING,
        mastered: statusCounts.MASTERED,
        learning: statusCounts.LEARNING,
        needs_review: statusCounts.NEEDS_REVIEW,
        due_today: dueReviews.length,
      },
    });
  } catch (error) {
    console.error('Error fetching hifz progress:', error);
    res.status(500).json({ message: 'خطا در دریافت اطلاعات پیشرفت حفظ' });
  }
});

// ── POST /api/hifz/review (Submit verse review grading) ──
router.post('/review', authenticate({ required: true }), async (req, res) => {
  try {
    const userId = req.user.id;
    const { surah_number, verse_number, grade, loop_count = 0 } = req.body;

    if (!surah_number || !verse_number || grade === undefined) {
      return res.status(400).json({ message: 'اطلاعات ارزیابی آیه نامعتبر است' });
    }

    const numericGrade = Number(grade);
    if (numericGrade < 0 || numericGrade > 5) {
      return res.status(400).json({ message: 'نمره ارزیابی باید بین ۰ تا ۵ باشد' });
    }

    const existing = await prisma.hifzProgress.findUnique({
      where: {
        user_id_surah_number_verse_number: {
          user_id: userId,
          surah_number: Number(surah_number),
          verse_number: Number(verse_number),
        },
      },
    });

    const currentReps = existing ? existing.repetitions : 0;
    const currentEase = existing ? existing.ease_factor : 2.5;
    const currentInterval = existing ? existing.interval_days : 1;
    const currentLoopPlays = existing ? existing.total_loop_plays : 0;

    const sm2 = calculateSM2(numericGrade, currentReps, currentEase, currentInterval);

    const saved = await prisma.hifzProgress.upsert({
      where: {
        user_id_surah_number_verse_number: {
          user_id: userId,
          surah_number: Number(surah_number),
          verse_number: Number(verse_number),
        },
      },
      update: {
        repetitions: sm2.repetitions,
        ease_factor: sm2.ease_factor,
        interval_days: sm2.interval_days,
        next_review_at: sm2.next_review_at,
        last_reviewed_at: new Date(),
        status: sm2.status,
        total_loop_plays: currentLoopPlays + Number(loop_count || 0),
      },
      create: {
        user_id: userId,
        surah_number: Number(surah_number),
        verse_number: Number(verse_number),
        repetitions: sm2.repetitions,
        ease_factor: sm2.ease_factor,
        interval_days: sm2.interval_days,
        next_review_at: sm2.next_review_at,
        last_reviewed_at: new Date(),
        status: sm2.status,
        total_loop_plays: Number(loop_count || 0),
      },
    });

    res.json({ progress: saved, sm2 });
  } catch (error) {
    console.error('Error recording hifz review:', error);
    res.status(500).json({ message: 'خطا در ثبت ارزیابی حفظ' });
  }
});

// ── POST /api/hifz/sync (Two-way batch sync for offline items) ──
router.post('/sync', authenticate({ required: true }), async (req, res) => {
  try {
    const userId = req.user.id;
    const { items = [] } = req.body;

    if (!Array.isArray(items)) {
      return res.status(400).json({ message: 'فرمت داده‌های همگام‌سازی نامعتبر است' });
    }

    const updates = [];
    for (const item of items) {
      if (!item.surah_number || !item.verse_number) continue;

      const p = prisma.hifzProgress.upsert({
        where: {
          user_id_surah_number_verse_number: {
            user_id: userId,
            surah_number: Number(item.surah_number),
            verse_number: Number(item.verse_number),
          },
        },
        update: {
          repetitions: item.repetitions ?? undefined,
          ease_factor: item.ease_factor ?? undefined,
          interval_days: item.interval_days ?? undefined,
          next_review_at: item.next_review_at ? new Date(item.next_review_at) : undefined,
          last_reviewed_at: item.last_reviewed_at ? new Date(item.last_reviewed_at) : undefined,
          status: item.status ?? undefined,
          total_loop_plays: item.total_loop_plays !== undefined
            ? { increment: Number(item.total_loop_plays) }
            : undefined,
        },
        create: {
          user_id: userId,
          surah_number: Number(item.surah_number),
          verse_number: Number(item.verse_number),
          repetitions: item.repetitions || 0,
          ease_factor: item.ease_factor || 2.5,
          interval_days: item.interval_days || 1,
          next_review_at: item.next_review_at ? new Date(item.next_review_at) : new Date(),
          last_reviewed_at: item.last_reviewed_at ? new Date(item.last_reviewed_at) : new Date(),
          status: item.status || 'LEARNING',
          total_loop_plays: Number(item.total_loop_plays || 0),
        },
      });
      updates.push(p);
    }

    if (updates.length > 0) {
      await prisma.$transaction(updates);
    }

    // Return the fresh full user state after sync
    const allProgress = await prisma.hifzProgress.findMany({
      where: { user_id: userId },
      orderBy: [{ surah_number: 'asc' }, { verse_number: 'asc' }],
    });

    res.json({ synced: true, items: allProgress });
  } catch (error) {
    console.error('Error syncing hifz progress:', error);
    res.status(500).json({ message: 'خطا در همگام‌سازی پیشرفت حفظ' });
  }
});

// ── Goals Endpoints ──
// GET /api/hifz/goals
router.get('/goals', authenticate({ required: true }), async (req, res) => {
  try {
    const userId = req.user.id;
    const goals = await prisma.hifzGoal.findMany({
      where: { user_id: userId },
      orderBy: { created_at: 'desc' },
    });
    res.json({ items: goals });
  } catch (error) {
    console.error('Error fetching hifz goals:', error);
    res.status(500).json({ message: 'خطا در دریافت اهداف حفظ' });
  }
});

// POST /api/hifz/goals
router.post('/goals', authenticate({ required: true }), async (req, res) => {
  try {
    const userId = req.user.id;
    const { title, target_type, surah_number, start_verse, end_verse, daily_target_verses } = req.body;

    if (!title || !target_type) {
      return res.status(400).json({ message: 'عنوان و نوع هدف الزامی است' });
    }

    const goal = await prisma.hifzGoal.create({
      data: {
        user_id: userId,
        title,
        target_type,
        surah_number: surah_number ? Number(surah_number) : null,
        start_verse: start_verse ? Number(start_verse) : null,
        end_verse: end_verse ? Number(end_verse) : null,
        daily_target_verses: Number(daily_target_verses || 3),
      },
    });

    res.status(201).json({ goal });
  } catch (error) {
    console.error('Error creating hifz goal:', error);
    res.status(500).json({ message: 'خطا در ایجاد هدف حفظ' });
  }
});

export default router;
