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

function normalizeBaseUrl(raw) {
  const base = String(raw || 'https://api.textbee.dev/api/v1').trim().replace(/\/+$/, '');
  if (!/^https?:\/\//i.test(base)) {
    throw new DeliveryConfigError('TEXTBEE_BASE_URL must be an absolute http(s) URL');
  }
  return base;
}

/**
 * TextBee hosted SMS gateway (Android phone/SIM).
 *
 * A successful HTTP 200 means TextBee **accepted and queued** the message
 * (`smsBatchId`). It does **not** mean the carrier delivered it.
 * Track delivery via GET /gateway/devices/{deviceId}/sms-batch/{smsBatchId}
 * or GET /gateway/messages?smsBatchId=… (statuses: pending → dispatched →
 * sent → delivered | failed | unknown). Treat `sent` as carrier acceptance;
 * `delivered` is optional carrier confirmation.
 *
 * Docs: https://textbee.dev/docs/sending-sms
 *
 * Operational requirements (not optional for real delivery):
 * - Android 7.0+ device with the TextBee app installed and online
 * - Active SIM that can send SMS; carrier/SIM charges may still apply
 * - Free plan is capped (50 msgs/day, 300/month, 1 device) — not unlimited
 */
export function createTextBeeSmsProvider(overrides = {}) {
  const apiKey = overrides.apiKey || required('TEXTBEE_API_KEY');
  const deviceId = overrides.deviceId || required('TEXTBEE_DEVICE_ID');
  const baseUrl = normalizeBaseUrl(overrides.baseUrl || process.env.TEXTBEE_BASE_URL);
  const timeoutMs = Number(overrides.timeoutMs || process.env.TEXTBEE_TIMEOUT_MS || 15000);
  const fetchImpl = overrides.fetchImpl || fetch;

  if (!apiKey || !String(apiKey).trim()) {
    throw new DeliveryConfigError('TEXTBEE_API_KEY is required');
  }
  if (!deviceId || !String(deviceId).trim()) {
    throw new DeliveryConfigError('TEXTBEE_DEVICE_ID is required (explicit device selection)');
  }
  if (!Number.isFinite(timeoutMs) || timeoutMs <= 0) {
    throw new DeliveryConfigError('TEXTBEE_TIMEOUT_MS must be a positive number');
  }

  async function parseJsonSafe(res) {
    const text = await res.text();
    if (!text) return {};
    try {
      return JSON.parse(text);
    } catch {
      return { _malformed: true, _rawLength: text.length };
    }
  }

  function mapHttpError(status, data) {
    // Never include API keys, recipients, or message bodies in thrown messages.
    if (status === 401 || status === 403) {
      throw new DeliveryAuthError('SMS provider authentication failed', { status });
    }
    if (status === 429) {
      throw new DeliveryError('SMS provider rate limit exceeded', {
        code: 'DELIVERY_RATE_LIMIT',
        status: 429,
        cause: { status },
      });
    }
    if (status === 400) {
      const msg = String(data?.message || data?.error || data?.data?.message || '');
      if (/recipient|phone|letter|invalid.*number/i.test(msg)) {
        throw new DeliveryRecipientError('Invalid SMS recipient', { status });
      }
      throw new DeliveryError('SMS delivery rejected by provider', {
        code: 'DELIVERY_REJECTED',
        status: 502,
        cause: { status },
      });
    }
    if (status >= 500) {
      throw new DeliveryError('SMS provider server error', {
        code: 'DELIVERY_UPSTREAM',
        status: 502,
        cause: { status },
      });
    }
    throw new DeliveryError('SMS delivery failed', {
      cause: { status },
      status: 502,
    });
  }

  return {
    name: 'textbee',
    /**
     * Queue an SMS via TextBee. Does not claim carrier delivery.
     * @returns {{ provider: string, id: string|null, accepted: boolean, queued: boolean, delivered: false, warningCode?: string }}
     */
    async send(msg) {
      if (!msg?.toE164 || !/^\+[1-9]\d{7,14}$/.test(msg.toE164)) {
        throw new DeliveryRecipientError('SMS recipient must be a valid E.164 number');
      }
      if (!msg?.body || !String(msg.body).trim()) {
        throw new DeliveryRecipientError('SMS message body is required');
      }

      const url = `${baseUrl}/gateway/send-sms`;
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);

      try {
        // Single attempt only — no automatic retry (avoids duplicate OTP SMS).
        const res = await fetchImpl(url, {
          method: 'POST',
          headers: {
            'x-api-key': apiKey,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            recipients: [msg.toE164],
            message: msg.body,
            deviceId,
          }),
          signal: controller.signal,
        });

        const data = await parseJsonSafe(res);

        if (!res.ok) {
          mapHttpError(res.status, data);
        }

        if (data?._malformed) {
          throw new DeliveryError('SMS provider returned a malformed response', {
            code: 'DELIVERY_MALFORMED',
            status: 502,
          });
        }

        const payload = data?.data && typeof data.data === 'object' ? data.data : data;
        const smsBatchId = payload?.smsBatchId || null;
        const accepted =
          payload?.success === true || (res.ok && typeof smsBatchId === 'string' && smsBatchId.length > 0);

        if (!accepted || !smsBatchId) {
          throw new DeliveryError('SMS provider accepted HTTP but did not return smsBatchId', {
            code: 'DELIVERY_MALFORMED',
            status: 502,
          });
        }

        // Explicitly not delivered — 200 only means queued/accepted.
        const result = {
          provider: 'textbee',
          id: smsBatchId,
          accepted: true,
          queued: true,
          delivered: false,
        };
        if (payload?.warning?.code) {
          result.warningCode = String(payload.warning.code);
        }
        return result;
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

    /**
     * Optional status poll for operational scripts (not used by OTP send path).
     * Returns batch status fields without logging recipients or message bodies.
     */
    async getBatchStatus(smsBatchId) {
      if (!smsBatchId || !String(smsBatchId).trim()) {
        throw new DeliveryConfigError('smsBatchId is required');
      }
      const url = `${baseUrl}/gateway/devices/${encodeURIComponent(deviceId)}/sms-batch/${encodeURIComponent(String(smsBatchId).trim())}`;
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);
      try {
        const res = await fetchImpl(url, {
          method: 'GET',
          headers: { 'x-api-key': apiKey },
          signal: controller.signal,
        });
        const data = await parseJsonSafe(res);
        if (!res.ok) mapHttpError(res.status, data);
        const batch = data?.data?.batch || data?.batch || data?.data || data;
        return {
          provider: 'textbee',
          id: smsBatchId,
          status: batch?.status || null,
          successCount: batch?.successCount ?? null,
          failureCount: batch?.failureCount ?? null,
          pendingCount: batch?.pendingCount ?? null,
          dispatchedCount: batch?.dispatchedCount ?? null,
          sentCount: batch?.sentCount ?? null,
          deliveredCount: batch?.deliveredCount ?? null,
          // Carrier delivery is only proven when deliveredCount > 0 (or message status=delivered).
          delivered: Number(batch?.deliveredCount || 0) > 0,
          carrierAccepted: Number(batch?.sentCount || 0) + Number(batch?.deliveredCount || 0) > 0,
        };
      } catch (err) {
        if (err?.name === 'AbortError') {
          throw new DeliveryTimeoutError('SMS provider status poll timed out', err);
        }
        if (err?.name?.startsWith('Delivery')) throw err;
        throw new DeliveryError('SMS status poll failed', { cause: err });
      } finally {
        clearTimeout(timer);
      }
    },
  };
}
