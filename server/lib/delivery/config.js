import { assertEmailDeliveryConfigured } from './email/index.js';
import { assertSmsDeliveryConfigured } from './sms/index.js';
import { DeliveryConfigError } from './errors.js';

function isProduction() {
  return process.env.NODE_ENV === 'production';
}

/**
 * Whether missing/invalid delivery config must abort the process.
 * - Production: always required (AUTH_DELIVERY_REQUIRED=false is ignored / refused)
 * - Development: default false (warn + continue in index.js)
 * - Non-production override: AUTH_DELIVERY_REQUIRED=true|false
 */
export function isDeliveryRequired() {
  if (isProduction()) {
    // Fail closed: production authentication depends on email/SMS delivery.
    // An operator override must never silently disable mandatory validation.
    return true;
  }
  if (process.env.AUTH_DELIVERY_REQUIRED != null) {
    return String(process.env.AUTH_DELIVERY_REQUIRED).toLowerCase() === 'true';
  }
  return false;
}

/**
 * Validate delivery configuration at process start.
 * Always attempts to construct the selected providers (no silent skip).
 * Callers decide whether a thrown DeliveryConfigError is fatal.
 */
export function assertDeliveryConfigured() {
  if (
    isProduction() &&
    process.env.AUTH_DELIVERY_REQUIRED != null &&
    String(process.env.AUTH_DELIVERY_REQUIRED).toLowerCase() === 'false'
  ) {
    throw new DeliveryConfigError(
      'AUTH_DELIVERY_REQUIRED=false is not allowed when NODE_ENV=production. Production must validate email/SMS providers.'
    );
  }
  assertEmailDeliveryConfigured();
  assertSmsDeliveryConfigured();
  return {
    email: (process.env.EMAIL_PROVIDER || (isProduction() ? 'smtp' : 'console')).toLowerCase(),
    // Production default is TextBee; Twilio remains an explicit opt-in.
    sms: (process.env.SMS_PROVIDER || (isProduction() ? 'textbee' : 'console')).toLowerCase(),
  };
}

export function appPublicUrl() {
  return (
    process.env.APP_PUBLIC_URL ||
    process.env.CORS_ORIGIN?.split(',')[0]?.trim() ||
    'http://localhost:5173'
  ).replace(/\/$/, '');
}

export function shouldExposeDevDeliveryHints() {
  return !isProduction();
}
