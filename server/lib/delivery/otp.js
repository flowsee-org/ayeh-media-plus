import '../../loadEnv.js';
import crypto from 'crypto';
import { DeliveryConfigError } from './errors.js';

export const DEV_EMAIL_OTP = '123456';
export const DEV_PHONE_OTP = '12345';
export const DEV_OTP_PEPPER = 'ayeh_dev_otp_pepper';
/** Mirrors server/lib/jwt.js DEFAULT — kept local to avoid import cycles. */
const WELL_KNOWN_JWT_DEFAULT = 'ayeh_default_secret_2026';

export const EMAIL_OTP_TTL_MS = 15 * 60 * 1000;
export const PHONE_OTP_TTL_MS = 5 * 60 * 1000;

const OTP_HASH_PREFIX = 'h1:';
const WEAK_PEPPERS = new Set([DEV_OTP_PEPPER, WELL_KNOWN_JWT_DEFAULT, 'changeme', 'secret', '']);

function isProduction() {
  return process.env.NODE_ENV === 'production';
}

function otpPepper() {
  // Prefer a dedicated pepper; fall back to JWT_SECRET so production always
  // has a non-default secret when JWT_SECRET is required.
  return process.env.OTP_PEPPER || process.env.JWT_SECRET || DEV_OTP_PEPPER;
}

/**
 * Production must never hash OTPs with a missing/weak pepper.
 * Call at process start (and from tests) before accepting traffic.
 */
export function assertOtpSecretsConfigured() {
  if (!isProduction()) return { pepperSource: process.env.OTP_PEPPER ? 'OTP_PEPPER' : 'dev-or-jwt' };

  const pepper = otpPepper();
  if (!pepper || WEAK_PEPPERS.has(String(pepper).trim()) || String(pepper).trim().length < 16) {
    throw new DeliveryConfigError(
      'Production requires a strong OTP_PEPPER (or a non-default JWT_SECRET of at least 16 characters). Refusing weak/default OTP pepper.'
    );
  }
  return {
    pepperSource: process.env.OTP_PEPPER ? 'OTP_PEPPER' : 'JWT_SECRET',
  };
}

export function getMaxOtpVerifyAttempts() {
  const n = Number(process.env.AUTH_OTP_VERIFY_MAX || 5);
  return Number.isFinite(n) && n > 0 ? n : 5;
}

/** @deprecated Prefer getMaxOtpVerifyAttempts() — kept for existing imports. */
export const MAX_OTP_VERIFY_ATTEMPTS = getMaxOtpVerifyAttempts();

/** Cryptographically strong numeric OTP (always used in production). */
export function generateNumericOtp(digits) {
  const max = 10 ** digits;
  const n = crypto.randomInt(0, max);
  return String(n).padStart(digits, '0');
}

/**
 * Email OTP generation is separated from delivery.
 * Fixed demo codes are development-only and never used when NODE_ENV=production.
 */
export function generateEmailOtpCode() {
  if (isProduction()) return generateNumericOtp(6);
  return DEV_EMAIL_OTP;
}

export function generatePhoneOtpCode() {
  if (isProduction()) return generateNumericOtp(5);
  // Non-production still stores a random code so SMS console logs are realistic,
  // while verify also accepts DEV_PHONE_OTP for local UX/tests.
  return generateNumericOtp(5);
}

export function emailOtpExpiresAt(now = Date.now()) {
  return new Date(now + EMAIL_OTP_TTL_MS);
}

export function phoneOtpExpiresAt(now = Date.now()) {
  return new Date(now + PHONE_OTP_TTL_MS);
}

/**
 * Store OTPs as HMAC-SHA256 (prefix `h1:`) so DB dumps do not expose codes.
 * Legacy plaintext rows (no prefix) remain verifiable during the upgrade window.
 */
export function hashOtpCode(code) {
  const digest = crypto.createHmac('sha256', otpPepper()).update(String(code), 'utf8').digest('hex');
  return `${OTP_HASH_PREFIX}${digest}`;
}

export function isHashedOtp(stored) {
  return typeof stored === 'string' && stored.startsWith(OTP_HASH_PREFIX);
}

function timingSafeEqualString(a, b) {
  const bufA = Buffer.from(String(a));
  const bufB = Buffer.from(String(b));
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

export function otpCodesMatch(stored, candidate) {
  if (!stored || candidate == null || candidate === '') return false;
  if (isHashedOtp(stored)) {
    return timingSafeEqualString(stored, hashOtpCode(candidate));
  }
  // Legacy plaintext compatibility (pre-hash rows until they expire).
  return timingSafeEqualString(stored, String(candidate));
}

/**
 * @param {{ code: string, expires_at: Date, attempts?: number } | null} record
 * @param {string} candidate
 * @param {{ allowDevFallback?: boolean, devCode?: string }} [opts]
 */
export function evaluateOtpAttempt(record, candidate, opts = {}) {
  const allowDevFallback = opts.allowDevFallback ?? !isProduction();
  const devCode = opts.devCode;
  const maxAttempts = getMaxOtpVerifyAttempts();

  if (record && (record.attempts || 0) >= maxAttempts) {
    return { ok: false, reason: 'locked' };
  }

  const matchesStored =
    !!record &&
    otpCodesMatch(record.code, candidate) &&
    new Date(record.expires_at) >= new Date();

  if (matchesStored) return { ok: true, reason: 'stored' };

  if (allowDevFallback && devCode && candidate === devCode) {
    return { ok: true, reason: 'dev_fallback' };
  }

  if (record && new Date(record.expires_at) < new Date()) {
    return { ok: false, reason: 'expired' };
  }

  return { ok: false, reason: 'invalid' };
}
