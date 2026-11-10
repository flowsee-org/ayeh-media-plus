#!/usr/bin/env node
/**
 * Gated live Brevo SMTP + TextBee SMS verification.
 *
 * This is NOT a user-account OTP flow and is NOT run by CI.
 * Mocked `pnpm test:delivery` must never be described as live proof.
 *
 * Required:
 *   ALLOW_LIVE_DELIVERY_TEST=true
 *   LIVE_DELIVERY_EMAIL=...   (explicit destination)
 *   LIVE_DELIVERY_PHONE=+...  (E.164)
 *   SMTP_* / EMAIL_FROM for Brevo (or compatible SMTP)
 *   TEXTBEE_API_KEY + TEXTBEE_DEVICE_ID (when probing TextBee)
 *
 * Sends exactly one test email and one test SMS. Never prints credentials,
 * OTPs, or full phone/email beyond a redacted summary.
 */
import '../server/loadEnv.js';
import { createSmtpEmailProvider } from '../server/lib/delivery/email/smtp.js';
import { createTextBeeSmsProvider } from '../server/lib/delivery/sms/textbee.js';
import { normalizePhoneNumber } from '../server/lib/delivery/phone.js';

function redactEmail(email) {
  const s = String(email || '');
  const at = s.indexOf('@');
  if (at < 1) return '[redacted-email]';
  return `${s[0]}…${s.slice(at)}`;
}

function redactPhone(e164) {
  const s = String(e164 || '');
  if (s.length < 6) return '[redacted-phone]';
  return `${s.slice(0, 3)}…${s.slice(-2)}`;
}

function missing(name) {
  const v = process.env[name];
  return !v || !String(v).trim();
}

function fail(msg) {
  console.error(`REFUSED: ${msg}`);
  process.exit(2);
}

async function main() {
  console.log('Live delivery verification (gated)\n');

  if (String(process.env.ALLOW_LIVE_DELIVERY_TEST || '').toLowerCase() !== 'true') {
    fail('Set ALLOW_LIVE_DELIVERY_TEST=true to enable. No messages were sent.');
  }

  const destEmail = (process.env.LIVE_DELIVERY_EMAIL || '').trim();
  const destPhoneRaw = (process.env.LIVE_DELIVERY_PHONE || '').trim();
  if (!destEmail || !destPhoneRaw) {
    fail(
      'Both LIVE_DELIVERY_EMAIL and LIVE_DELIVERY_PHONE are required. Send nothing if either is missing.'
    );
  }

  const phone = normalizePhoneNumber(destPhoneRaw);
  if (!phone.ok) {
    fail(`LIVE_DELIVERY_PHONE invalid: ${phone.message}`);
  }

  const credentialGaps = [];
  for (const k of ['SMTP_HOST', 'SMTP_USER', 'SMTP_PASS', 'EMAIL_FROM']) {
    if (missing(k)) credentialGaps.push(k);
  }
  for (const k of ['TEXTBEE_API_KEY', 'TEXTBEE_DEVICE_ID']) {
    if (missing(k)) credentialGaps.push(k);
  }
  if (credentialGaps.length) {
    fail(
      `Missing provider credentials: ${credentialGaps.join(', ')}. Configure Brevo SMTP + TextBee, then retry. No messages were sent.`
    );
  }

  const stamp = new Date().toISOString();
  const emailSubject = `Ayeh live delivery check ${stamp}`;
  const emailBody =
    'Ayeh Media Plus gated live delivery verification.\nThis is not an account OTP.\n';
  const smsBody = `Ayeh live SMS check ${stamp}. Not an account OTP.`;

  console.log('Destinations (redacted):');
  console.log(`  email: ${redactEmail(destEmail)}`);
  console.log(`  phone: ${redactPhone(phone.e164)}`);
  console.log('');

  // Exactly one email
  let emailResult;
  try {
    const email = createSmtpEmailProvider();
    emailResult = await email.send({
      to: destEmail,
      subject: emailSubject,
      text: emailBody,
    });
    console.log('EMAIL:');
    console.log(`  provider: ${emailResult.provider}`);
    console.log(`  smtp_accepted: ${emailResult.accepted === true}`);
    console.log(`  message_id_present: ${Boolean(emailResult.id)}`);
    console.log(
      '  note: SMTP acceptance is not mailbox-delivery proof. Confirm inbox/spam manually.'
    );
  } catch (err) {
    console.error('EMAIL: FAILED');
    console.error(`  error_name: ${err?.name || 'Error'}`);
    console.error(`  error_code: ${err?.code || 'n/a'}`);
    // Do not print err.message if it might contain secrets; keep generic.
    process.exit(1);
  }

  // Exactly one SMS
  let smsResult;
  let statusResult = null;
  try {
    const sms = createTextBeeSmsProvider();
    smsResult = await sms.send({ toE164: phone.e164, body: smsBody });
    console.log('SMS:');
    console.log(`  provider: ${smsResult.provider}`);
    console.log(`  api_accepted: ${smsResult.accepted === true}`);
    console.log(`  queued: ${smsResult.queued === true}`);
    console.log(`  batch_id_present: ${Boolean(smsResult.id)}`);
    console.log(`  delivered_claimed_by_send: ${smsResult.delivered === true}`);
    console.log(
      '  note: TextBee HTTP 200 / smsBatchId means accepted/queued, NOT carrier delivery.'
    );

    if (smsResult.id && typeof sms.getBatchStatus === 'function') {
      // Brief poll — still may be pending; report honestly.
      await new Promise((r) => setTimeout(r, 2000));
      statusResult = await sms.getBatchStatus(smsResult.id);
      console.log('SMS STATUS POLL:');
      console.log(`  status: ${statusResult.status ?? 'unknown'}`);
      console.log(`  carrier_accepted: ${statusResult.carrierAccepted === true}`);
      console.log(`  delivered: ${statusResult.delivered === true}`);
      console.log(
        `  counts: success=${statusResult.successCount} pending=${statusResult.pendingCount} sent=${statusResult.sentCount} delivered=${statusResult.deliveredCount} failed=${statusResult.failureCount}`
      );
    }
  } catch (err) {
    console.error('SMS: FAILED');
    console.error(`  error_name: ${err?.name || 'Error'}`);
    console.error(`  error_code: ${err?.code || 'n/a'}`);
    process.exit(1);
  }

  console.log('\nSummary labels:');
  console.log(
    `  email: ${emailResult?.accepted ? 'Real message accepted (SMTP)' : 'Not verified'}`
  );
  console.log(
    `  sms_api: ${smsResult?.accepted ? 'Real message accepted (TextBee API)' : 'Not verified'}`
  );
  console.log(
    `  sms_delivered: ${statusResult?.delivered ? 'Real message delivered' : 'Not verified'}`
  );
  console.log(
    'Manual: confirm the email inbox and the handset. Android TextBee app + SIM must stay online.'
  );
}

main().catch((err) => {
  console.error('Unexpected failure (credentials not printed).');
  console.error(`  error_name: ${err?.name || 'Error'}`);
  process.exit(1);
});
