/**
 * In-memory auth rate limiting (per-process).
 *
 * Suitable for single-node / local development / single-instance staging.
 * Multi-instance deployments share neither this Map nor resend cooldowns —
 * limits reset independently on every Node process. Do not claim cross-node
 * protection. Put a shared store (only if the deploy target already provides
 * one) or an edge/API-gateway rate limiter in front before scaling horizontally.
 * Documented in docs/DEPLOYMENT_RUNBOOK.md.
 */

import '../../loadEnv.js';
import { DeliveryConfigError } from './errors.js';

const buckets = new Map();

function isProduction() {
  return process.env.NODE_ENV === 'production';
}

function envInt(name, fallback) {
  const n = Number(process.env[name]);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

function rateLimitDisabled() {
  // Production must never silently disable abuse controls.
  if (isProduction()) return false;
  return process.env.AUTH_RATE_LIMIT_DISABLED === 'true';
}

/** Live-read limits so tests / runtime env changes are honored. */
export function getAuthRateLimits() {
  return {
    windowMs: envInt('AUTH_RATE_LIMIT_WINDOW_MS', 15 * 60 * 1000),
    loginMax: envInt('AUTH_LOGIN_MAX_ATTEMPTS', 20),
    otpSendMax: envInt('AUTH_OTP_SEND_MAX', 8),
    otpVerifyMax: envInt('AUTH_OTP_VERIFY_MAX', 5),
    resendCooldownMs: envInt('AUTH_OTP_RESEND_COOLDOWN_MS', 60 * 1000),
  };
}

/** @deprecated Prefer getAuthRateLimits() — snapshot at first import for compat. */
export const AUTH_RATE_LIMITS = getAuthRateLimits();

export function resetAuthRateLimitStateForTests() {
  buckets.clear();
}

/**
 * Refuse AUTH_RATE_LIMIT_DISABLED=true under NODE_ENV=production.
 */
export function assertAuthRateLimitSafe() {
  if (isProduction() && process.env.AUTH_RATE_LIMIT_DISABLED === 'true') {
    throw new DeliveryConfigError(
      'AUTH_RATE_LIMIT_DISABLED=true is not allowed when NODE_ENV=production.'
    );
  }
  return { inMemoryOnly: true, multiInstanceSafe: false };
}

function getBucket(key, windowMs) {
  const now = Date.now();
  let b = buckets.get(key);
  if (!b || now >= b.resetAt) {
    b = { count: 0, resetAt: now + windowMs, lastAt: 0 };
    buckets.set(key, b);
  }
  return b;
}

/**
 * @returns {{ allowed: true } | { allowed: false, retryAfterSec: number, message: string }}
 */
export function consumeRateLimit(key, max) {
  if (rateLimitDisabled()) {
    return { allowed: true };
  }
  const limits = getAuthRateLimits();
  const b = getBucket(key, limits.windowMs);
  b.count += 1;
  if (b.count > max) {
    const retryAfterSec = Math.max(1, Math.ceil((b.resetAt - Date.now()) / 1000));
    return {
      allowed: false,
      retryAfterSec,
      message: 'Too many attempts. Please try again later.',
    };
  }
  return { allowed: true };
}

/**
 * Resend / send cooldown per destination (independent of windowed counters).
 * @returns {{ allowed: true } | { allowed: false, retryAfterSec: number, message: string }}
 */
export function consumeResendCooldown(destinationKey, cooldownMs) {
  if (rateLimitDisabled()) {
    return { allowed: true };
  }
  const ms = cooldownMs ?? getAuthRateLimits().resendCooldownMs;
  const key = `cooldown:${destinationKey}`;
  const now = Date.now();
  const prev = buckets.get(key);
  if (prev && now - prev.lastAt < ms) {
    const retryAfterSec = Math.max(1, Math.ceil((ms - (now - prev.lastAt)) / 1000));
    return {
      allowed: false,
      retryAfterSec,
      message: 'Please wait before requesting another code.',
    };
  }
  buckets.set(key, { count: 0, resetAt: now + ms, lastAt: now });
  return { allowed: true };
}

/** Destination-scoped key helpers (email / phone), independent of client IP. */
export function destinationEmailKey(email, suffix = 'send') {
  return `dest:email:${String(email || '').trim().toLowerCase()}:${suffix}`;
}

export function destinationPhoneKey(phoneStorageKey, suffix = 'send') {
  return `dest:sms:${String(phoneStorageKey || '')}:${suffix}`;
}

export function accountLoginKey(email) {
  return `acct:login:${String(email || '').trim().toLowerCase()}`;
}

export function clientKey(req, suffix = '') {
  const ip = req.ip || req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown';
  return `${String(ip).split(',')[0].trim()}:${suffix}`;
}

export function rejectRateLimited(res, result) {
  res.setHeader('Retry-After', String(result.retryAfterSec));
  return res.status(429).json({
    message: result.message,
    retryAfter: result.retryAfterSec,
  });
}
