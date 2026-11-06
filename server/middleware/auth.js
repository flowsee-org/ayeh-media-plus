import jwt from 'jsonwebtoken';
import { prisma } from '../db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'ayeh_default_secret_2026';

export const authenticate = (options = { required: true }) => {
  return async (req, res, next) => {
    try {
      const authHeader = req.headers.authorization;
      const token = authHeader?.startsWith('Bearer ')
        ? authHeader.slice(7)
        : req.query.token || req.headers['x-access-token'];

      if (!token) {
        if (options.required) {
          return res.status(401).json({ message: 'Authentication required' });
        }
        req.user = null;
        return next();
      }

      const decoded = jwt.verify(token, JWT_SECRET);
      const user = await prisma.user.findUnique({
        where: { id: decoded.id },
        select: {
          id: true,
          phone: true,
          email: true,
          full_name: true,
          role: true,
          is_scholar: true,
          avatar_config: true,
          avatar_url: true,
          bio: true,
          streak_days: true,
          max_streak: true,
          last_active_date: true,
          total_xp: true,
          spiritual_level: true,
          created_date: true,
        },
      });

      if (!user) {
        if (options.required) {
          return res.status(401).json({ message: 'User not found' });
        }
        req.user = null;
        return next();
      }

      req.user = user;
      next();
    } catch (err) {
      if (options.required) {
        return res.status(401).json({ message: 'Invalid or expired token', error: err.message });
      }
      req.user = null;
      next();
    }
  };
};

export const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }
  next();
};
