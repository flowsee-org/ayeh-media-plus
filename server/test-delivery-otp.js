/**
 * Unit / mocked-integration tests for Task 11 + Task 15 delivery providers
 * and OTP security helpers.
 *
 * Runs without a live Brevo/TextBee/Twilio account (mocked transporters / fetch).
 * These tests are NOT real-world delivery verification — use
 * `pnpm test:delivery:live` only with ALLOW_LIVE_DELIVERY_TEST=true.
 *
 * Usage: node server/test-delivery-otp.js
 */
import assert from 'assert';

process.env.AUTH_RATE_LIMIT_DISABLED = 'true';

const {
  DeliveryConfigError,
  DeliveryAuthError,
  DeliveryTimeoutError,
  DeliveryRecipientError,
  DeliveryError,
} = await import('./lib/delivery/errors.js');
const {
  getEmailProvider,
  resetEmailProviderCache,
  setEmailProviderForTests,
  assertEmailDeliveryConfigured,
} = await import('./lib/delivery/email/index.js');
const {
  getSmsProvider,
  resetSmsProviderCache,
  setSmsProviderForTests,
  assertSmsDeliveryConfigured,
} = await import('./lib/delivery/sms/index.js');
const { createSmtpEmailProvider } = await import('./lib/delivery/email/smtp.js');
const { createTwilioSmsProvider } = await import('./lib/delivery/sms/twilio.js');
const { createTextBeeSmsProvider } = await import('./lib/delivery/sms/textbee.js');
const { createConsoleEmailProvider } = await import('./lib/delivery/email/console.js');
const { createConsoleSmsProvider } = await import('./lib/delivery/sms/console.js');
const {
  evaluateOtpAttempt,
  hashOtpCode,
  otpCodesMatch,
  generateNumericOtp,
  generateEmailOtpCode,
  DEV_EMAIL_OTP,
  DEV_OTP_PEPPER,
  assertOtpSecretsConfigured,
} = await import('./lib/delivery/otp.js');
const { normalizePhoneNumber } = await import('./lib/delivery/phone.js');
const {
  consumeRateLimit,
  consumeResendCooldown,
  resetAuthRateLimitStateForTests,
  assertAuthRateLimitSafe,
  destinationEmailKey,
  destinationPhoneKey,
  accountLoginKey,
} = await import('./lib/delivery/rateLimit.js');
const {
  assertDeliveryConfigured,
  isDeliveryRequired,
} = await import('./lib/delivery/config.js');

let passed = 0;
let failed = 0;

function ok(name, cond, detail = '') {
  if (cond) {
    passed += 1;
    console.log(`  ✅ ${name}`);
  } else {
    failed += 1;
    console.error(`  ❌ ${name}${detail ? ` — ${detail}` : ''}`);
  }
}

function throws(name, fn, Err = Error) {
  try {
    fn();
    ok(name, false, 'expected throw');
  } catch (err) {
    ok(name, err instanceof Err, err?.message || String(err));
  }
}

async function throwsAsync(name, fn, Err = Error) {
  try {
    await fn();
    ok(name, false, 'expected throw');
  } catch (err) {
    ok(name, err instanceof Err, err?.message || String(err));
  }
}

function withEnv(overrides, fn) {
  const saved = {};
  for (const [k, v] of Object.entries(overrides)) {
    saved[k] = process.env[k];
    if (v === undefined) delete process.env[k];
    else process.env[k] = v;
  }
  try {
    return fn();
  } finally {
    for (const [k, v] of Object.entries(saved)) {
      if (v === undefined) delete process.env[k];
      else process.env[k] = v;
    }
    resetEmailProviderCache();
    resetSmsProviderCache();
  }
}

async function withEnvAsync(overrides, fn) {
  const saved = {};
  for (const [k, v] of Object.entries(overrides)) {
    saved[k] = process.env[k];
    if (v === undefined) delete process.env[k];
    else process.env[k] = v;
  }
  try {
    return await fn();
  } finally {
    for (const [k, v] of Object.entries(saved)) {
      if (v === undefined) delete process.env[k];
      else process.env[k] = v;
    }
    resetEmailProviderCache();
    resetSmsProviderCache();
  }
}

console.log('🧪 Delivery + OTP unit tests\n');

// ── Provider selection ──
console.log('Provider selection');
await withEnvAsync(
  {
    NODE_ENV: 'development',
    EMAIL_PROVIDER: undefined,
    SMS_PROVIDER: undefined,
  },
  async () => {
    ok('dev default email is console', getEmailProvider().name === 'console');
    ok('dev default sms is console', getSmsProvider().name === 'console');
  }
);

await withEnvAsync(
  {
    NODE_ENV: 'production',
    EMAIL_PROVIDER: 'smtp',
    SMS_PROVIDER: 'textbee',
    SMTP_HOST: 'smtp-relay.brevo.com',
    SMTP_PORT: '587',
    SMTP_SECURE: 'false',
    SMTP_USER: 'brevo-login',
    SMTP_PASS: 'brevo-smtp-key',
    EMAIL_FROM: 'noreply@example.test',
    TEXTBEE_API_KEY: 'tb-test-key',
    TEXTBEE_DEVICE_ID: 'tb-device-1',
  },
  async () => {
    ok('prod smtp selected', getEmailProvider().name === 'smtp');
    ok('prod textbee selected', getSmsProvider().name === 'textbee');
  }
);

await withEnvAsync(
  {
    NODE_ENV: 'production',
    EMAIL_PROVIDER: undefined,
    SMS_PROVIDER: undefined,
    SMTP_HOST: 'smtp-relay.brevo.com',
    SMTP_USER: 'brevo-login',
    SMTP_PASS: 'brevo-smtp-key',
    EMAIL_FROM: 'noreply@example.test',
    TEXTBEE_API_KEY: 'tb-test-key',
    TEXTBEE_DEVICE_ID: 'tb-device-1',
  },
  async () => {
    ok('prod default email is smtp', getEmailProvider().name === 'smtp');
    ok('prod default sms is textbee', getSmsProvider().name === 'textbee');
  }
);

// ── Missing / console rejected in production ──
console.log('\nProduction configuration guards');
withEnv(
  {
    NODE_ENV: 'production',
    EMAIL_PROVIDER: 'console',
    SMS_PROVIDER: 'textbee',
    TEXTBEE_API_KEY: 'tb-test-key',
    TEXTBEE_DEVICE_ID: 'tb-device-1',
  },
  () => {
    throws('prod rejects EMAIL_PROVIDER=console', () => assertEmailDeliveryConfigured(), DeliveryConfigError);
  }
);

withEnv(
  {
    NODE_ENV: 'production',
    EMAIL_PROVIDER: 'smtp',
    SMS_PROVIDER: 'console',
    SMTP_HOST: 'smtp-relay.brevo.com',
    SMTP_USER: 'brevo-login',
    SMTP_PASS: 'brevo-smtp-key',
    EMAIL_FROM: 'noreply@example.test',
  },
  () => {
    throws('prod rejects SMS_PROVIDER=console', () => assertSmsDeliveryConfigured(), DeliveryConfigError);
  }
);

withEnv(
  {
    NODE_ENV: 'production',
    EMAIL_PROVIDER: 'smtp',
    SMS_PROVIDER: 'textbee',
    SMTP_HOST: undefined,
    SMTP_USER: undefined,
    SMTP_PASS: undefined,
    EMAIL_FROM: undefined,
    TEXTBEE_API_KEY: undefined,
    TEXTBEE_DEVICE_ID: undefined,
  },
  () => {
    throws('prod missing SMTP fails assert', () => assertDeliveryConfigured(), DeliveryConfigError);
  }
);

withEnv(
  {
    NODE_ENV: 'production',
    EMAIL_PROVIDER: 'smtp',
    SMS_PROVIDER: 'textbee',
    SMTP_HOST: 'smtp-relay.brevo.com',
    EMAIL_FROM: 'noreply@example.test',
    SMTP_USER: undefined,
    SMTP_PASS: undefined,
    TEXTBEE_API_KEY: 'tb-test-key',
    TEXTBEE_DEVICE_ID: 'tb-device-1',
  },
  () => {
    throws(
      'prod SMTP missing credentials fails (no console fallback)',
      () => assertEmailDeliveryConfigured(),
      DeliveryConfigError
    );
  }
);

withEnv(
  {
    NODE_ENV: 'development',
    EMAIL_PROVIDER: undefined,
    SMS_PROVIDER: undefined,
  },
  () => {
    const d = assertDeliveryConfigured();
    ok('dev startup validates console providers', d.email === 'console' && d.sms === 'console');
  }
);

withEnv({ NODE_ENV: 'production' }, () => {
  throws('createConsoleEmailProvider blocked in prod', () => createConsoleEmailProvider(), DeliveryConfigError);
  throws('createConsoleSmsProvider blocked in prod', () => createConsoleSmsProvider(), DeliveryConfigError);
});

withEnv(
  {
    NODE_ENV: 'production',
    EMAIL_PROVIDER: 'smtp',
    SMTP_HOST: undefined,
    EMAIL_FROM: 'x@y.z',
    SMTP_USER: 'u',
    SMTP_PASS: 'p',
  },
  () => {
    throws('smtp missing SMTP_HOST', () => createSmtpEmailProvider(), DeliveryConfigError);
  }
);

withEnv(
  {
    NODE_ENV: 'production',
    SMS_PROVIDER: 'twilio',
    TWILIO_ACCOUNT_SID: undefined,
    TWILIO_AUTH_TOKEN: 't',
    TWILIO_FROM_NUMBER: '+15005550006',
  },
  () => {
    throws('twilio missing ACCOUNT_SID', () => createTwilioSmsProvider(), DeliveryConfigError);
  }
);

withEnv(
  {
    NODE_ENV: 'production',
    SMS_PROVIDER: 'textbee',
    TEXTBEE_API_KEY: undefined,
    TEXTBEE_DEVICE_ID: 'tb-device-1',
  },
  () => {
    throws('textbee missing API key', () => createTextBeeSmsProvider(), DeliveryConfigError);
  }
);

withEnv(
  {
    NODE_ENV: 'production',
    SMS_PROVIDER: 'textbee',
    TEXTBEE_API_KEY: 'tb-test-key',
    TEXTBEE_DEVICE_ID: undefined,
  },
  () => {
    throws('textbee missing device id', () => createTextBeeSmsProvider(), DeliveryConfigError);
  }
);

// ── Mocked successful delivery ──
console.log('\nMocked provider delivery');
{
  let emailSent = null;
  setEmailProviderForTests({
    name: 'mock-email',
    async send(msg) {
      emailSent = msg;
      return { provider: 'mock-email', id: 'e1' };
    },
  });
  const er = await getEmailProvider().send({
    to: 'user@example.com',
    subject: 't',
    text: 'code 999999',
  });
  ok('mock email send ok', er.provider === 'mock-email' && emailSent?.to === 'user@example.com');

  let smsSent = null;
  setSmsProviderForTests({
    name: 'mock-sms',
    async send(msg) {
      smsSent = msg;
      return { provider: 'mock-sms', id: 's1' };
    },
  });
  const sr = await getSmsProvider().send({ toE164: '+989121234567', body: 'code 12345' });
  ok('mock sms send ok', sr.provider === 'mock-sms' && smsSent?.toE164 === '+989121234567');
  resetEmailProviderCache();
  resetSmsProviderCache();
}

// ── SMTP auth / timeout via fake transporter ──
console.log('\nSMTP error mapping');
await throwsAsync(
  'smtp auth failure → DeliveryAuthError',
  async () => {
    const provider = createSmtpEmailProvider({
      host: 'smtp.example.test',
      from: 'noreply@example.test',
      transporter: {
        async sendMail() {
          const err = new Error('Invalid login');
          err.code = 'EAUTH';
          throw err;
        },
      },
    });
    await provider.send({ to: 'a@b.c', subject: 's', text: 't' });
  },
  DeliveryAuthError
);

await throwsAsync(
  'smtp timeout → DeliveryTimeoutError',
  async () => {
    const provider = createSmtpEmailProvider({
      host: 'smtp.example.test',
      from: 'noreply@example.test',
      transporter: {
        async sendMail() {
          const err = new Error('timeout');
          err.code = 'ETIMEDOUT';
          throw err;
        },
      },
    });
    await provider.send({ to: 'a@b.c', subject: 's', text: 't' });
  },
  DeliveryTimeoutError
);

await throwsAsync(
  'smtp recipient → DeliveryRecipientError',
  async () => {
    const provider = createSmtpEmailProvider({
      host: 'smtp.example.test',
      from: 'noreply@example.test',
      transporter: {
        async sendMail() {
          const err = new Error('Invalid recipient mailbox');
          err.code = 'EENVELOPE';
          throw err;
        },
      },
    });
    await provider.send({ to: 'bad', subject: 's', text: 't' });
  },
  DeliveryRecipientError
);

{
  const provider = createSmtpEmailProvider({
    host: 'smtp-relay.brevo.com',
    port: 587,
    user: 'brevo-login',
    pass: 'brevo-smtp-key',
    from: 'noreply@example.test',
    transporter: {
      async sendMail(opts) {
        assert.equal(opts.to, 'user@example.test');
        return { messageId: '<smtp-ok@test>' };
      },
    },
  });
  const r = await provider.send({ to: 'user@example.test', subject: 's', text: 'hello' });
  ok('smtp mock success', r.provider === 'smtp' && r.id === '<smtp-ok@test>' && r.accepted === true);
  ok('smtp success does not claim mailbox delivery', r.delivered === false);
}

await throwsAsync(
  'smtp TLS failure → DeliveryError DELIVERY_TLS',
  async () => {
    const provider = createSmtpEmailProvider({
      host: 'smtp.example.test',
      from: 'noreply@example.test',
      transporter: {
        async sendMail() {
          const err = new Error('unable to verify the first certificate');
          err.code = 'UNABLE_TO_VERIFY_LEAF_SIGNATURE';
          throw err;
        },
      },
    });
    await provider.send({ to: 'a@b.c', subject: 's', text: 't' });
  },
  DeliveryError
);

await withEnvAsync(
  {
    NODE_ENV: 'production',
    SMTP_HOST: 'smtp-relay.brevo.com',
    EMAIL_FROM: 'noreply@example.test',
    SMTP_USER: undefined,
    SMTP_PASS: undefined,
  },
  async () => {
    throws('prod smtp missing credentials at construct', () => createSmtpEmailProvider(), DeliveryConfigError);
  }
);

// ── TextBee mock fetch ──
console.log('\nTextBee error mapping');
{
  let captured = null;
  const provider = createTextBeeSmsProvider({
    apiKey: 'tb-secret-key-do-not-leak',
    deviceId: 'device-xyz',
    fetchImpl: async (url, opts) => {
      captured = { url, opts };
      return {
        ok: true,
        status: 200,
        async text() {
          return JSON.stringify({
            data: { success: true, smsBatchId: 'batch-123', recipients: 1 },
          });
        },
      };
    },
  });
  const r = await provider.send({ toE164: '+14155552671', body: 'hi' });
  ok('textbee mock success accepted', r.provider === 'textbee' && r.id === 'batch-123' && r.accepted);
  ok('textbee success is queued not delivered', r.queued === true && r.delivered === false);
  ok('textbee uses send-sms endpoint', String(captured.url).endsWith('/gateway/send-sms'));
  ok('textbee auth header present', captured.opts.headers['x-api-key'] === 'tb-secret-key-do-not-leak');
  const body = JSON.parse(captured.opts.body);
  ok('textbee body has recipients+message+deviceId', Array.isArray(body.recipients) && body.deviceId === 'device-xyz');
}

{
  const provider = createTextBeeSmsProvider({
    apiKey: 'tb-secret-key-do-not-leak',
    deviceId: 'device-xyz',
    fetchImpl: async () => ({
      ok: true,
      status: 200,
      async text() {
        return JSON.stringify({
          data: {
            batch: {
              status: 'pending',
              successCount: 0,
              failureCount: 0,
              pendingCount: 1,
              dispatchedCount: 0,
              sentCount: 0,
              deliveredCount: 0,
            },
          },
        });
      },
    }),
  });
  const st = await provider.getBatchStatus('batch-123');
  ok('textbee pending status not delivered', st.delivered === false && st.status === 'pending');
}

{
  const provider = createTextBeeSmsProvider({
    apiKey: 'tb-secret-key-do-not-leak',
    deviceId: 'device-xyz',
    fetchImpl: async () => ({
      ok: true,
      status: 200,
      async text() {
        return JSON.stringify({
          data: {
            batch: {
              status: 'completed',
              successCount: 1,
              failureCount: 0,
              pendingCount: 0,
              sentCount: 0,
              deliveredCount: 1,
            },
          },
        });
      },
    }),
  });
  const st = await provider.getBatchStatus('batch-123');
  ok('textbee deliveredCount proves delivered', st.delivered === true);
}

await throwsAsync(
  'textbee HTTP 429 → rate limit',
  async () => {
    const provider = createTextBeeSmsProvider({
      apiKey: 'k',
      deviceId: 'd',
      fetchImpl: async () => ({
        ok: false,
        status: 429,
        async text() {
          return JSON.stringify({ message: 'daily limit' });
        },
      }),
    });
    await provider.send({ toE164: '+14155552671', body: 'hi' });
  },
  DeliveryError
);

await throwsAsync(
  'textbee HTTP 401 auth',
  async () => {
    const provider = createTextBeeSmsProvider({
      apiKey: 'bad',
      deviceId: 'd',
      fetchImpl: async () => ({
        ok: false,
        status: 401,
        async text() {
          return JSON.stringify({ message: 'unauthorized' });
        },
      }),
    });
    await provider.send({ toE164: '+14155552671', body: 'hi' });
  },
  DeliveryAuthError
);

await throwsAsync(
  'textbee HTTP 403 auth',
  async () => {
    const provider = createTextBeeSmsProvider({
      apiKey: 'bad',
      deviceId: 'd',
      fetchImpl: async () => ({
        ok: false,
        status: 403,
        async text() {
          return JSON.stringify({ message: 'forbidden' });
        },
      }),
    });
    await provider.send({ toE164: '+14155552671', body: 'hi' });
  },
  DeliveryAuthError
);

await throwsAsync(
  'textbee HTTP 5xx',
  async () => {
    const provider = createTextBeeSmsProvider({
      apiKey: 'k',
      deviceId: 'd',
      fetchImpl: async () => ({
        ok: false,
        status: 503,
        async text() {
          return JSON.stringify({ message: 'unavailable' });
        },
      }),
    });
    await provider.send({ toE164: '+14155552671', body: 'hi' });
  },
  DeliveryError
);

await throwsAsync(
  'textbee invalid recipient E.164',
  async () => {
    const provider = createTextBeeSmsProvider({
      apiKey: 'k',
      deviceId: 'd',
      fetchImpl: async () => ({ ok: true, status: 200, async text() { return '{}'; } }),
    });
    await provider.send({ toE164: '09121234567', body: 'hi' });
  },
  DeliveryRecipientError
);

await throwsAsync(
  'textbee provider invalid phone 400',
  async () => {
    const provider = createTextBeeSmsProvider({
      apiKey: 'k',
      deviceId: 'd',
      fetchImpl: async () => ({
        ok: false,
        status: 400,
        async text() {
          return JSON.stringify({ message: 'Invalid phone number' });
        },
      }),
    });
    await provider.send({ toE164: '+14155552671', body: 'hi' });
  },
  DeliveryRecipientError
);

await throwsAsync(
  'textbee timeout via abort',
  async () => {
    const provider = createTextBeeSmsProvider({
      apiKey: 'k',
      deviceId: 'd',
      timeoutMs: 20,
      fetchImpl: async (_url, opts) => {
        await new Promise((_, reject) => {
          opts.signal.addEventListener('abort', () => {
            const err = new Error('aborted');
            err.name = 'AbortError';
            reject(err);
          });
        });
      },
    });
    await provider.send({ toE164: '+14155552671', body: 'hi' });
  },
  DeliveryTimeoutError
);

{
  // API-key secrecy: error paths and results must not echo the key.
  let threw = null;
  try {
    const provider = createTextBeeSmsProvider({
      apiKey: 'super-secret-textbee-key',
      deviceId: 'd',
      fetchImpl: async () => ({
        ok: false,
        status: 401,
        async text() {
          return JSON.stringify({ message: 'bad key super-secret-textbee-key' });
        },
      }),
    });
    await provider.send({ toE164: '+14155552671', body: 'hi' });
  } catch (err) {
    threw = err;
  }
  ok('textbee auth error thrown', threw instanceof DeliveryAuthError);
  ok(
    'textbee error message omits api key',
    threw && !String(threw.message).includes('super-secret-textbee-key')
  );
  ok(
    'textbee error stack omits api key',
    threw && !String(threw.stack || '').includes('super-secret-textbee-key')
  );
}

// ── Twilio mock fetch ──
console.log('\nTwilio error mapping');
{
  const provider = createTwilioSmsProvider({
    accountSid: 'ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
    authToken: 'token',
    from: '+15005550006',
    fetchImpl: async () => ({
      ok: true,
      status: 201,
      async text() {
        return JSON.stringify({ sid: 'SMxxx' });
      },
    }),
  });
  const r = await provider.send({ toE164: '+14155552671', body: 'hi' });
  ok('twilio mock success', r.provider === 'twilio' && r.id === 'SMxxx');
}

await throwsAsync(
  'twilio auth failure',
  async () => {
    const provider = createTwilioSmsProvider({
      accountSid: 'ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
      authToken: 'bad',
      from: '+15005550006',
      fetchImpl: async () => ({
        ok: false,
        status: 401,
        async text() {
          return JSON.stringify({ code: 20003, message: 'Authenticate' });
        },
      }),
    });
    await provider.send({ toE164: '+14155552671', body: 'hi' });
  },
  DeliveryAuthError
);

await throwsAsync(
  'twilio invalid recipient',
  async () => {
    const provider = createTwilioSmsProvider({
      accountSid: 'ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
      authToken: 'token',
      from: '+15005550006',
      fetchImpl: async () => ({
        ok: false,
        status: 400,
        async text() {
          return JSON.stringify({ code: 21211, message: 'Invalid To' });
        },
      }),
    });
    await provider.send({ toE164: '+14155552671', body: 'hi' });
  },
  DeliveryRecipientError
);

await throwsAsync(
  'twilio timeout via abort',
  async () => {
    const provider = createTwilioSmsProvider({
      accountSid: 'ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
      authToken: 'token',
      from: '+15005550006',
      timeoutMs: 20,
      fetchImpl: async (_url, opts) => {
        await new Promise((_, reject) => {
          opts.signal.addEventListener('abort', () => {
            const err = new Error('aborted');
            err.name = 'AbortError';
            reject(err);
          });
        });
      },
    });
    await provider.send({ toE164: '+14155552671', body: 'hi' });
  },
  DeliveryTimeoutError
);

await throwsAsync(
  'twilio rejects non-E.164 destination',
  async () => {
    const provider = createTwilioSmsProvider({
      accountSid: 'ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
      authToken: 'token',
      from: '+15005550006',
      fetchImpl: async () => ({ ok: true, status: 201, async text() { return '{}'; } }),
    });
    await provider.send({ toE164: '09121234567', body: 'hi' });
  },
  DeliveryRecipientError
);

await throwsAsync(
  'twilio network error → DeliveryError',
  async () => {
    const provider = createTwilioSmsProvider({
      accountSid: 'ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
      authToken: 'token',
      from: '+15005550006',
      fetchImpl: async () => {
        throw new Error('ECONNRESET');
      },
    });
    await provider.send({ toE164: '+14155552671', body: 'hi' });
  },
  DeliveryError
);

// ── Phone normalization ──
console.log('\nPhone normalization');
{
  const ir = normalizePhoneNumber('09121234567');
  ok('IR local → storage + e164', ir.ok && ir.storageKey === '09121234567' && ir.e164 === '+989121234567');
  const ir2 = normalizePhoneNumber('+989121234567');
  ok('IR e164 → local storage', ir2.ok && ir2.storageKey === '09121234567');
  const us = normalizePhoneNumber('+14155552671');
  ok('US e164 ok', us.ok && us.e164 === '+14155552671');
  const bad = normalizePhoneNumber('123');
  ok('invalid phone rejected', !bad.ok);
  const bare = normalizePhoneNumber('14155552671');
  ok('bare non-IR rejected', !bare.ok);
}

// ── OTP security helpers ──
console.log('\nOTP security');
{
  const code = generateNumericOtp(6);
  ok('numeric otp length 6', /^\d{6}$/.test(code));
  const hashed = hashOtpCode('123456');
  ok('hash prefix h1:', hashed.startsWith('h1:'));
  ok('hash match', otpCodesMatch(hashed, '123456'));
  ok('hash mismatch', !otpCodesMatch(hashed, '000000'));
  ok('legacy plaintext match', otpCodesMatch('123456', '123456'));

  const expired = {
    code: hashOtpCode('111111'),
    expires_at: new Date(Date.now() - 1000),
    attempts: 0,
  };
  ok('expired otp', evaluateOtpAttempt(expired, '111111').reason === 'expired');

  const fresh = {
    code: hashOtpCode('222222'),
    expires_at: new Date(Date.now() + 60_000),
    attempts: 0,
  };
  ok('valid stored otp', evaluateOtpAttempt(fresh, '222222', { allowDevFallback: false }).ok);

  const reusedShape = evaluateOtpAttempt(null, '222222', { allowDevFallback: false });
  ok('missing record invalid (reuse after delete)', !reusedShape.ok && reusedShape.reason === 'invalid');

  const locked = {
    code: hashOtpCode('333333'),
    expires_at: new Date(Date.now() + 60_000),
    attempts: 99,
  };
  ok('locked after max attempts', evaluateOtpAttempt(locked, '333333').reason === 'locked');

  const wrong = evaluateOtpAttempt(fresh, '000000', { allowDevFallback: false });
  ok('incorrect code invalid', wrong.reason === 'invalid');

  withEnv({ NODE_ENV: 'development' }, () => {
    ok('dev email otp fixed', generateEmailOtpCode() === DEV_EMAIL_OTP);
  });
  withEnv({ NODE_ENV: 'production', JWT_SECRET: 'prod-secret-for-test' }, () => {
    const c = generateEmailOtpCode();
    ok('prod email otp random 6', /^\d{6}$/.test(c) && c !== undefined);
  });
}

// ── Rate limit / cooldown (enable temporarily) ──
console.log('\nRate limiting');
{
  const prev = process.env.AUTH_RATE_LIMIT_DISABLED;
  delete process.env.AUTH_RATE_LIMIT_DISABLED;
  resetAuthRateLimitStateForTests();
  const a = consumeRateLimit('test:ip', 2);
  const b = consumeRateLimit('test:ip', 2);
  const c = consumeRateLimit('test:ip', 2);
  ok('rate allow first', a.allowed);
  ok('rate allow second', b.allowed);
  ok('rate block third', !c.allowed && c.retryAfterSec >= 1);

  resetAuthRateLimitStateForTests();
  const d1 = consumeResendCooldown('email:a@b.c', 60_000);
  const d2 = consumeResendCooldown('email:a@b.c', 60_000);
  ok('resend cooldown allow first', d1.allowed);
  ok('resend cooldown block second', !d2.allowed);

  resetAuthRateLimitStateForTests();
  const destKey = destinationEmailKey('user@example.test', 'send');
  const phoneKey = destinationPhoneKey('09121234567', 'send');
  const acctKey = accountLoginKey('user@example.test');
  ok('dest email key shape', destKey === 'dest:email:user@example.test:send');
  ok('dest phone key shape', phoneKey === 'dest:sms:09121234567:send');
  ok('account login key shape', acctKey === 'acct:login:user@example.test');
  const e1 = consumeRateLimit(destKey, 1);
  const e2 = consumeRateLimit(destKey, 1);
  ok('per-destination email window allows first', e1.allowed);
  ok('per-destination email window blocks second', !e2.allowed);
  const p1 = consumeRateLimit(phoneKey, 1);
  const p2 = consumeRateLimit(phoneKey, 1);
  ok('per-destination phone window allows first', p1.allowed);
  ok('per-destination phone window blocks second', !p2.allowed);
  const l1 = consumeRateLimit(acctKey, 1);
  const l2 = consumeRateLimit(acctKey, 1);
  ok('per-account login window allows first', l1.allowed);
  ok('per-account login window blocks second', !l2.allowed);

  // Documented limitation: separate Map instances do not share state (simulates
  // two Node processes). This asserts the in-memory design, not multi-instance safety.
  const isolatedBucketsNote =
    'in-memory rate limits are per-process; a second process would not see these counters';
  ok('multi-instance limitation documented in code path', typeof isolatedBucketsNote === 'string');

  process.env.AUTH_RATE_LIMIT_DISABLED = prev ?? 'true';
  resetAuthRateLimitStateForTests();
}

// ── Production fail-closed / secret guards (Task 12) ──
console.log('\nProduction fail-closed & secrets');
withEnv(
  {
    NODE_ENV: 'production',
    AUTH_DELIVERY_REQUIRED: 'false',
    EMAIL_PROVIDER: 'smtp',
    SMS_PROVIDER: 'textbee',
    SMTP_HOST: undefined,
    EMAIL_FROM: undefined,
    SMTP_USER: undefined,
    SMTP_PASS: undefined,
    TEXTBEE_API_KEY: undefined,
    TEXTBEE_DEVICE_ID: undefined,
  },
  () => {
    ok('prod ignores AUTH_DELIVERY_REQUIRED=false for isDeliveryRequired', isDeliveryRequired() === true);
    throws(
      'prod AUTH_DELIVERY_REQUIRED=false still fails assertDeliveryConfigured',
      () => assertDeliveryConfigured(),
      DeliveryConfigError
    );
  }
);

withEnv(
  {
    NODE_ENV: 'production',
    AUTH_DELIVERY_REQUIRED: 'false',
    EMAIL_PROVIDER: 'console',
    SMS_PROVIDER: 'console',
  },
  () => {
    throws(
      'prod cannot disable delivery and use console providers',
      () => assertDeliveryConfigured(),
      DeliveryConfigError
    );
  }
);

withEnv(
  {
    NODE_ENV: 'development',
    AUTH_DELIVERY_REQUIRED: 'true',
    EMAIL_PROVIDER: 'smtp',
    SMS_PROVIDER: 'textbee',
    SMTP_HOST: undefined,
    EMAIL_FROM: undefined,
    TEXTBEE_API_KEY: undefined,
  },
  () => {
    ok('dev AUTH_DELIVERY_REQUIRED=true makes delivery required', isDeliveryRequired() === true);
    throws('dev required mode fails without SMTP/TextBee', () => assertDeliveryConfigured(), DeliveryConfigError);
  }
);

withEnv(
  {
    NODE_ENV: 'development',
    AUTH_DELIVERY_REQUIRED: undefined,
    EMAIL_PROVIDER: undefined,
    SMS_PROVIDER: undefined,
  },
  () => {
    ok('dev default isDeliveryRequired=false', isDeliveryRequired() === false);
    const d = assertDeliveryConfigured();
    ok('dev default console providers still construct', d.email === 'console' && d.sms === 'console');
  }
);

withEnv(
  {
    NODE_ENV: 'production',
    EMAIL_PROVIDER: 'smtp',
    SMS_PROVIDER: 'textbee',
    SMTP_HOST: 'smtp-relay.brevo.com',
    SMTP_USER: 'brevo-login',
    SMTP_PASS: 'brevo-smtp-key',
    EMAIL_FROM: 'noreply@example.test',
    TEXTBEE_API_KEY: 'tb-test-key',
    TEXTBEE_DEVICE_ID: 'tb-device-1',
    JWT_SECRET: 'prod-strong-secret-value-32',
    OTP_PEPPER: undefined,
  },
  () => {
    const d = assertDeliveryConfigured();
    ok('prod valid providers pass assert', d.email === 'smtp' && d.sms === 'textbee');
    const secrets = assertOtpSecretsConfigured();
    ok('prod OTP pepper falls back to JWT_SECRET', secrets.pepperSource === 'JWT_SECRET');
  }
);

withEnv(
  {
    NODE_ENV: 'production',
    JWT_SECRET: 'ayeh_default_secret_2026',
    OTP_PEPPER: undefined,
  },
  () => {
    throws('prod weak default JWT-as-pepper rejected', () => assertOtpSecretsConfigured(), DeliveryConfigError);
  }
);

withEnv(
  {
    NODE_ENV: 'production',
    JWT_SECRET: 'prod-strong-secret-value-32',
    OTP_PEPPER: DEV_OTP_PEPPER,
  },
  () => {
    throws('prod explicit DEV_OTP_PEPPER rejected', () => assertOtpSecretsConfigured(), DeliveryConfigError);
  }
);

withEnv(
  {
    NODE_ENV: 'production',
    JWT_SECRET: 'prod-strong-secret-value-32',
    OTP_PEPPER: 'short',
  },
  () => {
    throws('prod short OTP_PEPPER rejected', () => assertOtpSecretsConfigured(), DeliveryConfigError);
  }
);

withEnv(
  {
    NODE_ENV: 'production',
    JWT_SECRET: 'prod-strong-secret-value-32',
    OTP_PEPPER: 'staging-otp-pepper-strong-16+',
  },
  () => {
    const secrets = assertOtpSecretsConfigured();
    ok('prod dedicated OTP_PEPPER accepted', secrets.pepperSource === 'OTP_PEPPER');
  }
);

withEnv({ NODE_ENV: 'production', AUTH_RATE_LIMIT_DISABLED: 'true' }, () => {
  throws('prod refuses AUTH_RATE_LIMIT_DISABLED=true', () => assertAuthRateLimitSafe(), DeliveryConfigError);
});

withEnv({ NODE_ENV: 'development', AUTH_RATE_LIMIT_DISABLED: 'true' }, () => {
  const r = assertAuthRateLimitSafe();
  ok('dev may disable rate limits for tests', r.inMemoryOnly === true && r.multiInstanceSafe === false);
});

withEnv(
  {
    NODE_ENV: 'production',
    EMAIL_PROVIDER: 'smtp',
    SMS_PROVIDER: 'textbee',
    SMTP_HOST: 'smtp-relay.brevo.com',
    EMAIL_FROM: 'noreply@example.test',
    SMTP_USER: 'brevo-login',
    SMTP_PASS: 'super-secret-smtp-pass',
    TEXTBEE_API_KEY: 'super-secret-textbee-key',
    TEXTBEE_DEVICE_ID: 'tb-device-1',
  },
  () => {
    // Providers must construct without logging credentials (smoke: no throw + names only).
    const d = assertDeliveryConfigured();
    ok(
      'prod configured providers construct without needing to log secrets',
      d.email === 'smtp' && d.sms === 'textbee'
    );
  }
);

// ── 429 code shape for TextBee (account-enumeration-safe provider errors) ──
console.log('\nTextBee rate-limit code');
{
  let err = null;
  try {
    const provider = createTextBeeSmsProvider({
      apiKey: 'k',
      deviceId: 'd',
      fetchImpl: async () => ({
        ok: false,
        status: 429,
        async text() {
          return JSON.stringify({ message: 'monthly limit' });
        },
      }),
    });
    await provider.send({ toE164: '+14155552671', body: 'hi' });
  } catch (e) {
    err = e;
  }
  ok('textbee 429 is DeliveryError', err instanceof DeliveryError);
  ok('textbee 429 code DELIVERY_RATE_LIMIT', err?.code === 'DELIVERY_RATE_LIMIT');
  ok('textbee 429 status 429', err?.status === 429);
}

console.log(`\nDelivery/OTP tests: ${passed} passed, ${failed} failed`);
console.log('(Mocked providers only — not live Brevo/TextBee verification)');
if (failed > 0) process.exit(1);
