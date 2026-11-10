import { DeliveryConfigError } from '../errors.js';

/**
 * Development-only SMS provider. Explicitly forbidden in production.
 */
export function createConsoleSmsProvider() {
  if (process.env.NODE_ENV === 'production') {
    throw new DeliveryConfigError(
      'SMS_PROVIDER=console is not allowed in production. Configure TextBee (SMS_PROVIDER=textbee) or Twilio (SMS_PROVIDER=twilio).'
    );
  }

  return {
    name: 'console',
    /**
     * @param {{ toE164: string, body: string }} msg
     */
    async send(msg) {
      const redacted = String(msg.body || '').replace(/\b\d{4,8}\b/g, '[otp]');
      console.log(`[SMS:console] to=${msg.toE164}`);
      if (process.env.SMS_CONSOLE_VERBOSE === 'true') {
        console.log(`[SMS:console] body=${redacted}`);
      }
      return { provider: 'console', id: `console-${Date.now()}` };
    },
  };
}
