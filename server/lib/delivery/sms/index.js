import { DeliveryConfigError } from '../errors.js';
import { createConsoleSmsProvider } from './console.js';
import { createTextBeeSmsProvider } from './textbee.js';
import { createTwilioSmsProvider } from './twilio.js';

let overrideProvider = null;
let cached = null;
let cachedKey = null;

export function setSmsProviderForTests(provider) {
  overrideProvider = provider;
  cached = null;
  cachedKey = null;
}

export function resetSmsProviderCache() {
  overrideProvider = null;
  cached = null;
  cachedKey = null;
}

function isProduction() {
  return process.env.NODE_ENV === 'production';
}

function resolveProviderName() {
  const raw = (process.env.SMS_PROVIDER || '').trim().toLowerCase();
  if (raw) return raw;
  // Production default: TextBee (Android SIM gateway). Twilio remains an explicit opt-in.
  return isProduction() ? 'textbee' : 'console';
}

export function getSmsProvider() {
  if (overrideProvider) return overrideProvider;

  const name = resolveProviderName();
  if (cached && cachedKey === name) return cached;

  if (name === 'console') {
    cached = createConsoleSmsProvider();
  } else if (name === 'textbee') {
    cached = createTextBeeSmsProvider();
  } else if (name === 'twilio') {
    cached = createTwilioSmsProvider();
  } else {
    throw new DeliveryConfigError(
      `Unknown SMS_PROVIDER="${name}". Supported: console (dev only), textbee, twilio.`
    );
  }
  cachedKey = name;
  return cached;
}

export function assertSmsDeliveryConfigured() {
  const name = resolveProviderName();
  if (isProduction() && name === 'console') {
    throw new DeliveryConfigError(
      'Production refuses SMS_PROVIDER=console. Set SMS_PROVIDER=textbee (TEXTBEE_API_KEY + TEXTBEE_DEVICE_ID) or SMS_PROVIDER=twilio with TWILIO_* credentials.'
    );
  }
  getSmsProvider();
}
