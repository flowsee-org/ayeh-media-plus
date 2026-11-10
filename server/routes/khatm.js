/**
 * Khatm part reservation — atomic claim / release / complete.
 * Generic /entities/KhatmPart updates that mutate reservation state are blocked.
 */
import { Router } from 'express';
import { prisma } from '../db.js';
import { io } from '../socket.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

/** Stale reservations can be claimed by another user after this TTL. */
export const KHATM_RESERVATION_TTL_MS = 24 * 60 * 60 * 1000;

function emitPart(action, data) {
  if (io) {
    io.emit('entity:change', { entity: 'KhatmPart', action, data });
    io.emit('khatm:part', { action, part: data });
  }
}

function isExpired(part, now = Date.now()) {
  if (part.status !== 'reserved' || !part.reserved_at) return false;
  return now - new Date(part.reserved_at).getTime() >= KHATM_RESERVATION_TTL_MS;
}

// POST /api/khatm/parts/:id/reserve
router.post(
  '/parts/:id/reserve',
  authenticate({ required: true }),
  async (req, res) => {
    try {
      const partId = req.params.id;
      const now = new Date();
      const expiryCutoff = new Date(now.getTime() - KHATM_RESERVATION_TTL_MS);

      const result = await prisma.$transaction(async (tx) => {
        const part = await tx.khatmPart.findUnique({ where: { id: partId } });
        if (!part) return { error: 404, message: 'Part not found' };
        if (part.status === 'completed') {
          return { error: 409, message: 'این سهم قبلاً تکمیل شده است' };
        }
        if (
          part.status === 'reserved' &&
          part.user_id === req.user.id &&
          !isExpired(part, now.getTime())
        ) {
          return { part }; // idempotent re-claim by same user
        }
        if (
          part.status === 'reserved' &&
          part.user_id !== req.user.id &&
          !isExpired(part, now.getTime())
        ) {
          return { error: 409, message: 'این سهم توسط کاربر دیگری رزرو شده است' };
        }

        const updated = await tx.khatmPart.updateMany({
          where: {
            id: partId,
            OR: [
              { status: 'available' },
              { status: 'reserved', reserved_at: { lt: expiryCutoff } },
              { status: 'reserved', reserved_at: null },
              // Same user refreshing an active reservation
              { status: 'reserved', user_id: req.user.id },
            ],
          },
          data: {
            status: 'reserved',
            user_id: req.user.id,
            user_name: req.user.full_name || 'کاربر آیه',
            user_avatar: req.user.avatar_url || null,
            reserved_at: now,
            completed_at: null,
          },
        });

        if (updated.count === 0) {
          return { error: 409, message: 'رزرو همزمان ناموفق بود؛ سهم در دسترس نیست' };
        }

        const fresh = await tx.khatmPart.findUnique({ where: { id: partId } });
        return { part: fresh };
      });

      if (result.error) {
        return res.status(result.error).json({ message: result.message });
      }

      emitPart('update', result.part);
      res.json(result.part);
    } catch (err) {
      console.error('Khatm reserve error:', err);
      res.status(500).json({ message: err.message });
    }
  }
);

// POST /api/khatm/parts/:id/release
router.post(
  '/parts/:id/release',
  authenticate({ required: true }),
  async (req, res) => {
    try {
      const isStaff =
        req.user.role === 'admin' || req.user.role === 'moderator';

      const result = await prisma.$transaction(async (tx) => {
        const part = await tx.khatmPart.findUnique({ where: { id: req.params.id } });
        if (!part) return { error: 404, message: 'Part not found' };
        if (part.status === 'completed') {
          return { error: 409, message: 'سهم تکمیل‌شده قابل آزادسازی نیست' };
        }
        if (part.status !== 'reserved') {
          return { error: 409, message: 'این سهم رزرو نشده است' };
        }
        if (part.user_id !== req.user.id && !isStaff) {
          return { error: 403, message: 'فقط صاحب رزرو می‌تواند آن را لغو کند' };
        }

        const updated = await tx.khatmPart.updateMany({
          where: {
            id: part.id,
            status: 'reserved',
            ...(isStaff ? {} : { user_id: req.user.id }),
          },
          data: {
            status: 'available',
            user_id: null,
            user_name: null,
            user_avatar: null,
            reserved_at: null,
            completed_at: null,
          },
        });
        if (updated.count === 0) {
          return { error: 409, message: 'آزادسازی ناموفق بود' };
        }
        return { part: await tx.khatmPart.findUnique({ where: { id: part.id } }) };
      });

      if (result.error) {
        return res.status(result.error).json({ message: result.message });
      }
      emitPart('update', result.part);
      res.json(result.part);
    } catch (err) {
      console.error('Khatm release error:', err);
      res.status(500).json({ message: err.message });
    }
  }
);

// POST /api/khatm/parts/:id/complete
router.post(
  '/parts/:id/complete',
  authenticate({ required: true }),
  async (req, res) => {
    try {
      const isStaff =
        req.user.role === 'admin' || req.user.role === 'moderator';
      const now = new Date();

      const result = await prisma.$transaction(async (tx) => {
        const part = await tx.khatmPart.findUnique({ where: { id: req.params.id } });
        if (!part) return { error: 404, message: 'Part not found' };
        if (part.status === 'completed') {
          return { part }; // idempotent
        }
        if (part.status !== 'reserved') {
          return { error: 409, message: 'ابتدا باید سهم را رزرو کنید' };
        }
        if (part.user_id !== req.user.id && !isStaff) {
          return { error: 403, message: 'فقط صاحب رزرو می‌تواند اتمام را ثبت کند' };
        }

        const updated = await tx.khatmPart.updateMany({
          where: {
            id: part.id,
            status: 'reserved',
            ...(isStaff ? {} : { user_id: req.user.id }),
          },
          data: {
            status: 'completed',
            completed_at: now,
          },
        });
        if (updated.count === 0) {
          return { error: 409, message: 'ثبت اتمام ناموفق بود' };
        }
        return { part: await tx.khatmPart.findUnique({ where: { id: part.id } }) };
      });

      if (result.error) {
        return res.status(result.error).json({ message: result.message });
      }
      emitPart('update', result.part);
      res.json(result.part);
    } catch (err) {
      console.error('Khatm complete error:', err);
      res.status(500).json({ message: err.message });
    }
  }
);

export default router;
