import {
  DeliveryAuthError,
  DeliveryConfigError,
  DeliveryError,
  DeliveryRecipientError,
  DeliveryTimeoutError,
} from '../errors.js';

function required(name) {
  const v = process.env[name];
  if (!v || !String(v).trim()) {
    throw new DeliveryConfigError(`Missing required environment variable: ${name}`);
  }
  return String(v).trim();
}

/**
 * Twilio REST SMS via fetch (no Twilio SDK dependency).
 */
export function createTwilioSmsProvider(overrides = {}) {
  const accountSid = overrides.accountSid || required('TWILIO_ACCOUNT_SID');
  const authToken = overrides.authToken || required('TWILIO_AUTH_TOKEN');
  const from = overrides.from || required('TWILIO_FROM_NUMBER');
  const timeoutMs = Number(overrides.timeoutMs || process.env.TWILIO_TIMEOUT_MS || 15000);
  const fetchImpl = overrides.fetchImpl || fetch;

  if (!/^\+[1-9]\d{7,14}$/.test(from)) {
    throw new DeliveryConfigError('TWILIO_FROM_NUMBER must be E.164 (e.g. +15005550006)');
  }

  return {
    name: 'twilio',
    async send(msg) {
      if (!msg?.toE164 || !/^\+[1-9]\d{7,14}$/.test(msg.toE164)) {
        throw new DeliveryRecipientError('SMS recipient must be a valid E.164 number');
      }

      const url = `https://api.twilio.com/2010-04-01/Accounts/${encodeURIComponent(accountSid)}/Messages.json`;
      const body = new URLSearchParams({
        To: msg.toE164,
        From: from,
        Body: msg.body,
      });

      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);

      try {
        const res = await fetchImpl(url, {
          method: 'POST',
          headers: {
            Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString('base64')}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body,
          signal: controller.signal,
        });

        const text = await res.text();
        let data = {};
        try {
          data = text ? JSON.parse(text) : {};
        } catch {
          data = { raw: text };
        }

        if (!res.ok) {
          const twilioCode = data.code;
          const msgText = data.message || `Twilio HTTP ${res.status}`;
          if (res.status === 401 || res.status === 403 || twilioCode === 20003) {
            throw new DeliveryAuthError('SMS provider authentication failed', data);
          }
          if (
            res.status === 400 &&
            (twilioCode === 21211 || twilioCode === 21614 || /not a valid/i.test(msgText))
          ) {
            throw new DeliveryRecipientError('Invalid SMS recipient', data);
          }
          throw new DeliveryError('SMS delivery failed', { cause: data, status: 502 });
        }

        return { provider: 'twilio', id: data.sid || null };
      } catch (err) {
        if (err?.name === 'AbortError') {
          throw new DeliveryTimeoutError('SMS provider timed out', err);
        }
        if (err?.name?.startsWith('Delivery')) throw err;
        throw new DeliveryError('SMS delivery failed', { cause: err });
      } finally {
        clearTimeout(timer);
      }
    },
  };
}
