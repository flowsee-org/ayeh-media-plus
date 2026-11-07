// Single source of truth for the JWT signing secret.
//
// In production the app must never fall back to the well-known development
// secret: doing so would let anyone forge tokens. We fail fast at boot instead
// of silently running insecurely.
const DEFAULT_SECRET = 'ayeh_default_secret_2026';

export const IS_PRODUCTION = process.env.NODE_ENV === 'production';

if (IS_PRODUCTION && !process.env.JWT_SECRET) {
  throw new Error(
    'JWT_SECRET environment variable is required in production. Refusing to start with the default secret.'
  );
}

export const JWT_SECRET = process.env.JWT_SECRET || DEFAULT_SECRET;
