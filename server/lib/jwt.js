// Ensure `.env` is loaded before reading NODE_ENV / JWT_SECRET. Safe when this
// module is imported from scripts or tests that skip `server/index.js`.
import '../loadEnv.js';

// Single source of truth for the JWT signing secret.
//
// In production the app must never fall back to (or explicitly use) the
// well-known development secret: doing so would let anyone forge tokens.
// We fail fast at boot instead of silently running insecurely.
export const DEFAULT_JWT_SECRET = 'ayeh_default_secret_2026';
const DEFAULT_SECRET = DEFAULT_JWT_SECRET;

export const IS_PRODUCTION = process.env.NODE_ENV === 'production';

if (IS_PRODUCTION) {
  const configured = process.env.JWT_SECRET;
  if (!configured || !String(configured).trim()) {
    throw new Error(
      'JWT_SECRET environment variable is required in production. Refusing to start with the default secret.'
    );
  }
  if (String(configured).trim() === DEFAULT_SECRET) {
    throw new Error(
      'JWT_SECRET must not equal the well-known development default in production. Set a unique secret.'
    );
  }
}

export const JWT_SECRET = process.env.JWT_SECRET || DEFAULT_SECRET;
