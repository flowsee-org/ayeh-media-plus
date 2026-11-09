import express from 'express';
import cors from 'cors';
import path from 'path';
import http from 'http';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// ── Simple in-memory rate limiter for production scaling ──
const rateLimitWindows = new Map();

function rateLimiter(options = {}) {
  const windowMs = options.windowMs || 60 * 1000; // 1 minute
  const maxRequests = options.maxRequests || 100;
  const skipSuccessfulRequests = options.skipSuccessfulRequests || false;
  const skipFailedRequests = options.skipFailedRequests || false;

  return (req, res, next) => {
    // Skip rate limiting in development
    if (process.env.NODE_ENV !== 'production') {
      return next();
    }

    const key = req.ip || req.connection?.remoteAddress || 'unknown';
    const now = Date.now();

    let record = rateLimitWindows.get(key);
    if (!record || now - record.resetAt > windowMs) {
      record = { count: 0, resetAt: now + windowMs };
      rateLimitWindows.set(key, record);
    }

    record.count += 1;

    // Set rate limit headers
    res.setHeader('X-RateLimit-Limit', maxRequests);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, maxRequests - record.count));
    res.setHeader('X-RateLimit-Reset', new Date(record.resetAt).toISOString());

    if (record.count > maxRequests) {
      res.setHeader('Retry-After', Math.ceil((record.resetAt - now) / 1000));
      return res.status(429).json({
        message: 'Too many requests, please try again later.',
        retryAfter: Math.ceil((record.resetAt - now) / 1000),
      });
    }

    // Track whether to skip counting based on response status
    const originalSend = res.send;
    res.send = function (body) {
      const shouldSkip =
        (skipSuccessfulRequests && res.statusCode < 400) ||
        (skipFailedRequests && res.statusCode >= 400);
      if (!shouldSkip) {
        // Already incremented above
      }
      return originalSend.call(this, body);
    };

    next();
  };
}

// Clean up stale rate limit entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of rateLimitWindows.entries()) {
    if (now - record.resetAt > 300000) {
      // 5 min stale cleanup
      rateLimitWindows.delete(key);
    }
  }
}, 300000);

dotenv.config();

import authRoutes from './routes/auth.js';
import entitiesRoutes from './routes/entities.js';
import uploadRoutes from './routes/upload.js';
import aiRoutes from './routes/ai.js';
import gamificationRoutes from './routes/gamification.js';
import logsRoutes from './routes/logs.js';
import videoRoutes from './routes/videos.js';
import competitionRoutes from './routes/competitions.js';
import moderationRoutes from './routes/moderation.js';
import { initSocket } from './socket.js';
import { initGlobalProcessLogging, logError } from './logger.js';

// Setup global error logging for Node uncaught exceptions & rejections
initGlobalProcessLogging();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);

// Initialize Socket.io
initSocket(server);

// Middleware
const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map((o) => o.trim())
  : ['http://localhost:5173', 'http://localhost:5000'];
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (e.g. mobile apps, curl, server-to-server)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error('Not allowed by CORS'), false);
  },
  credentials: true,
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Warn if the well-known default JWT secret is explicitly configured in
// production. Missing secrets already abort startup in server/lib/jwt.js.
if (process.env.NODE_ENV === 'production' && process.env.JWT_SECRET === 'ayeh_default_secret_2026') {
  console.warn('⚠️  WARNING: Using the default JWT_SECRET in production. Set a unique JWT_SECRET in .env');
}

// Serve static uploaded files
const uploadDir = path.join(__dirname, 'uploads');
app.use('/uploads', express.static(uploadDir));

// Compatibility endpoint for Base44 public-settings check in legacy AuthContext
app.get('/api/apps/public/prod/public-settings/by-id/:appId', (req, res) => {
  res.json({
    id: req.params.appId,
    public_settings: {
      auth_required: false,
    },
  });
});

// Apply rate limiting to API routes in production
app.use('/api/', rateLimiter({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 100, // 100 requests per minute per IP
}));

// REST API Routes
app.use('/api/auth', authRoutes);
app.use('/api/entities', entitiesRoutes);
app.use('/api/integrations', uploadRoutes);
app.use('/api/integrations', aiRoutes);
app.use('/api/gamification', gamificationRoutes);
app.use('/api/logs', logsRoutes);
app.use('/api/videos', videoRoutes);
app.use('/api/competitions', competitionRoutes);
app.use('/api/moderation', moderationRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// Express Centralized Error Handling Middleware
app.use((err, req, res, next) => {
  logError({
    source: 'backend',
    type: 'expressError',
    message: err?.message || String(err),
    stack: err?.stack || '',
    route: req.originalUrl || req.url,
    method: req.method,
    statusCode: err?.status || err?.statusCode || 500,
    meta: {
      params: req.params,
      query: req.query,
    },
  });

  if (res.headersSent) {
    return next(err);
  }

  res.status(err?.status || err?.statusCode || 500).json({
    message: err?.message || 'خطای غیرمنتظره در سرور رخ داده است.',
  });
});

// In production, serve frontend dist build if present
const distPath = path.join(__dirname, '..', 'dist');
app.use(express.static(distPath));

// For SPA routing in production: wildcard fallback middleware
app.use((req, res, next) => {
  if (req.method !== 'GET') return next();
  if (req.path.startsWith('/api') || req.path.startsWith('/uploads') || req.path.startsWith('/socket.io')) {
    return next();
  }
  const indexPath = path.join(distPath, 'index.html');
  res.sendFile(indexPath, (err) => {
    if (err) next();
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Ayeh Server running on http://localhost:${PORT}`);
  console.log(`📡 Socket.io ready on /socket.io`);
  console.log(`📁 Uploads served from /uploads`);
});
