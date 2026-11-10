import { DeliveryConfigError } from '../errors.js';

/**
 * Development-only email provider. Explicitly forbidden in production.
 */
export function createConsoleEmailProvider() {
  if (process.env.NODE_ENV === 'production') {
    throw new DeliveryConfigError(
      'EMAIL_PROVIDER=console is not allowed in production. Configure SMTP (EMAIL_PROVIDER=smtp).'
    );
  }

  return {
    name: 'console',
    /**
     * @param {{ to: string, subject: string, text: string, html?: string }} msg
     */
    async send(msg) {
      // Intentionally omit OTP/code bodies from structured logs — print a redacted notice.
      const redacted = String(msg.text || '')
        .replace(/\b\d{4,8}\b/g, '[otp]')
        .replace(/token=[^\s&]+/gi, 'token=[redacted]');
      console.log(`[EMAIL:console] to=${msg.to} subject=${msg.subject}`);
      if (process.env.EMAIL_CONSOLE_VERBOSE === 'true') {
        console.log(`[EMAIL:console] body=${redacted}`);
      }
      return { provider: 'console', id: `console-${Date.now()}` };
    },
  };
}
