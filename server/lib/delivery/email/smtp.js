import nodemailer from 'nodemailer';
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

function isProduction() {
  return process.env.NODE_ENV === 'production';
}

function envBool(name, defaultValue) {
  const raw = process.env[name];
  if (raw == null || String(raw).trim() === '') return defaultValue;
  return String(raw).toLowerCase() === 'true';
}

/**
 * Nodemailer SMTP provider (Brevo-compatible).
 *
 * Brevo relay defaults: host smtp-relay.brevo.com, port 587, SMTP_SECURE=false
 * (STARTTLS). Production always requires SMTP_USER + SMTP_PASS and never falls
 * back to console. From address must match a sender verified in Brevo.
 */
export function createSmtpEmailProvider(overrides = {}) {
  const host = overrides.host || required('SMTP_HOST');
  const port = Number(overrides.port || process.env.SMTP_PORT || 587);
  const user = overrides.user ?? process.env.SMTP_USER;
  const pass = overrides.pass ?? process.env.SMTP_PASS;
  const from = overrides.from || required('EMAIL_FROM');
  const secure =
    overrides.secure ??
    (String(process.env.SMTP_SECURE || '').toLowerCase() === 'true' || port === 465);
  const timeoutMs = Number(overrides.timeoutMs || process.env.SMTP_TIMEOUT_MS || 15000);

  // Port 587 (Brevo) uses STARTTLS; port 465 uses implicit TLS (secure=true).
  // Local MailHog (e.g. 1025) leaves requireTLS false unless SMTP_REQUIRE_TLS=true.
  const requireTLS =
    overrides.requireTLS ??
    (envBool('SMTP_REQUIRE_TLS', false) || (!secure && port === 587));

  // Certificate validation is on by default. Never disable in real Brevo/prod use.
  const rejectUnauthorized =
    overrides.rejectUnauthorized ?? envBool('SMTP_TLS_REJECT_UNAUTHORIZED', true);

  if (!Number.isFinite(port) || port <= 0) {
    throw new DeliveryConfigError('SMTP_PORT must be a positive number');
  }
  if (!Number.isFinite(timeoutMs) || timeoutMs <= 0) {
    throw new DeliveryConfigError('SMTP_TIMEOUT_MS must be a positive number');
  }

  // Production fail-closed: authenticated SMTP is mandatory (Brevo login + SMTP key).
  // Local Docker MailHog smoke must still supply non-empty placeholders.
  if (isProduction()) {
    if (!user || !String(user).trim() || pass == null || !String(pass).trim()) {
      throw new DeliveryConfigError(
        'Production SMTP requires SMTP_USER and SMTP_PASS (e.g. Brevo SMTP login). Missing credentials refuse startup — no console fallback.'
      );
    }
  }

  const transporter =
    overrides.transporter ||
    nodemailer.createTransport({
      host,
      port,
      secure,
      requireTLS,
      auth: user ? { user: String(user).trim(), pass: String(pass ?? '') } : undefined,
      connectionTimeout: timeoutMs,
      greetingTimeout: timeoutMs,
      socketTimeout: timeoutMs,
      tls: {
        // Enforce certificate validation for STARTTLS / TLS sessions.
        rejectUnauthorized,
        minVersion: 'TLSv1.2',
      },
    });

  return {
    name: 'smtp',
    async send(msg) {
      try {
        const info = await transporter.sendMail({
          from,
          to: msg.to,
          subject: msg.subject,
          text: msg.text,
          html: msg.html || undefined,
        });
        // SMTP acceptance ≠ mailbox delivery proof; callers must not treat this as read receipt.
        return {
          provider: 'smtp',
          id: info.messageId || null,
          accepted: true,
          delivered: false,
        };
      } catch (err) {
        const message = err?.message || String(err);
        const code = err?.code || err?.responseCode;
        if (code === 'EAUTH' || code === 535) {
          throw new DeliveryAuthError('Email provider authentication failed', err);
        }
        if (
          code === 'ESOCKET' ||
          code === 'CERT_HAS_EXPIRED' ||
          code === 'UNABLE_TO_VERIFY_LEAF_SIGNATURE' ||
          code === 'DEPTH_ZERO_SELF_SIGNED_CERT' ||
          /certificate|SSL|TLS|self[- ]signed|unable to verify/i.test(message)
        ) {
          throw new DeliveryError('Email provider TLS/certificate failure', {
            code: 'DELIVERY_TLS',
            status: 502,
            cause: err,
          });
        }
        if (code === 'ETIMEDOUT' || /timeout/i.test(message)) {
          throw new DeliveryTimeoutError('Email provider timed out', err);
        }
        if (code === 'EENVELOPE' || /recipient|mailbox/i.test(message)) {
          throw new DeliveryRecipientError('Invalid email recipient', err);
        }
        throw new DeliveryError('Email delivery failed', { cause: err });
      }
    },
  };
}
