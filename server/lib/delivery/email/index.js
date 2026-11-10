import { DeliveryConfigError } from '../errors.js';
import { createConsoleEmailProvider } from './console.js';
import { createSmtpEmailProvider } from './smtp.js';

let overrideProvider = null;
let cached = null;
let cachedKey = null;

export function setEmailProviderForTests(provider) {
  overrideProvider = provider;
  cached = null;
  cachedKey = null;
}

export function resetEmailProviderCache() {
  overrideProvider = null;
  cached = null;
  cachedKey = null;
}

function isProduction() {
  return process.env.NODE_ENV === 'production';
}

function resolveProviderName() {
  const raw = (process.env.EMAIL_PROVIDER || '').trim().toLowerCase();
  if (raw) return raw;
  return isProduction() ? 'smtp' : 'console';
}

/**
 * Lazy email provider factory. Reads env at call time (not import time).
 */
export function getEmailProvider() {
  if (overrideProvider) return overrideProvider;

  const name = resolveProviderName();
  if (cached && cachedKey === name) return cached;

  if (name === 'console') {
    cached = createConsoleEmailProvider();
  } else if (name === 'smtp') {
    cached = createSmtpEmailProvider();
  } else {
    throw new DeliveryConfigError(
      `Unknown EMAIL_PROVIDER="${name}". Supported: console (dev only), smtp.`
    );
  }
  cachedKey = name;
  return cached;
}

export function assertEmailDeliveryConfigured() {
  const name = resolveProviderName();
  if (isProduction() && name === 'console') {
    throw new DeliveryConfigError(
      'Production refuses EMAIL_PROVIDER=console. Set EMAIL_PROVIDER=smtp with SMTP_* and EMAIL_FROM.'
    );
  }
  // Force validation of required env for the selected provider.
  getEmailProvider();
}
