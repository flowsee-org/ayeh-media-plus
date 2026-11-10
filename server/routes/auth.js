import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../db.js';
import { authenticate } from '../middleware/auth.js';
import { JWT_SECRET, IS_PRODUCTION } from '../lib/jwt.js';
import {
  validateBody,
  sendOtpPhoneSchema,
  verifyOtpPhoneSchema,
  registerSchema,
  verifyOtpSchema,
  resendOtpSchema,
  loginSchema,
  resetPasswordRequestSchema,
  resetPasswordSchema,
  completeProfileSchema,
  updateMeSchema,
} from '../lib/validation.js';
import { getEmailProvider } from '../lib/delivery/email/index.js';
import { getSmsProvider } from '../lib/delivery/sms/index.js';
import {
  DEV_EMAIL_OTP,
  DEV_PHONE_OTP,
  evaluateOtpAttempt,
  generateEmailOtpCode,
  generatePhoneOtpCode,
  emailOtpExpiresAt,
  phoneOtpExpiresAt,
  getMaxOtpVerifyAttempts,
  hashOtpCode,
} from '../lib/delivery/otp.js';
import { normalizePhoneNumber, toEnglishDigits } from '../lib/delivery/phone.js';
import {
  getAuthRateLimits,
  clientKey,
  consumeRateLimit,
  consumeResendCooldown,
  rejectRateLimited,
  destinationEmailKey,
  destinationPhoneKey,
  accountLoginKey,
} from '../lib/delivery/rateLimit.js';
import {
  emailVerificationMessage,
  passwordResetMessage,
  smsOtpMessage,
} from '../lib/delivery/messages.js';
import { shouldExposeDevDeliveryHints } from '../lib/delivery/config.js';
import { DeliveryError } from '../lib/delivery/errors.js';

const router = Router();

// Database-backed OTP / captcha store (replaces in-memory Maps so data
// survives server restarts and works across multiple instances).

function deliveryFailure(res, err, fallbackMessage) {
  if (err instanceof DeliveryError) {
    // Never echo provider internals or OTP material to clients.
    return res.status(err.status || 502).json({
      message: fallbackMessage,
      code: err.code,
    });
  }
  console.error('[auth/delivery]', err?.name || 'Error', err?.code || '');
  return res.status(500).json({ message: fallbackMessage });
}

async function storeEmailOtp(email, code) {
  const now = new Date();
  const stored = hashOtpCode(code);
  return prisma.authOtp.upsert({
    where: { email },
    update: {
      code: stored,
      expires_at: emailOtpExpiresAt(),
      attempts: 0,
      last_sent_at: now,
    },
    create: {
      email,
      code: stored,
      expires_at: emailOtpExpiresAt(),
      attempts: 0,
      last_sent_at: now,
    },
  });
}

async function storePhoneOtp(phone, code) {
  const now = new Date();
  const stored = hashOtpCode(code);
  return prisma.authOtp.upsert({
    where: { phone },
    update: {
      code: stored,
      expires_at: phoneOtpExpiresAt(),
      attempts: 0,
      last_sent_at: now,
    },
    create: {
      phone,
      code: stored,
      expires_at: phoneOtpExpiresAt(),
      attempts: 0,
      last_sent_at: now,
    },
  });
}

async function sendEmailOtp(email, code) {
  const msg = emailVerificationMessage(code);
  await getEmailProvider().send({ to: email, ...msg });
}

async function sendSmsOtp(e164, code) {
  await getSmsProvider().send({ toE164: e164, body: smsOtpMessage(code) });
}

async function generateNumericSvgCaptcha() {
  // 4 random digits
  const digits = Math.floor(1000 + Math.random() * 9000).toString();
  const width = 140;
  const height = 46;

  const colors = ['#0f766e', '#b45309', '#4338ca', '#be123c', '#15803d', '#7c3aed'];

  let digitElements = '';
  for (let i = 0; i < digits.length; i++) {
    const d = digits[i];
    const x = 18 + i * 28 + (Math.random() * 6 - 3);
    const y = 32 + (Math.random() * 6 - 3);
    const angle = (Math.random() * 24 - 12).toFixed(1);
    const color = colors[Math.floor(Math.random() * colors.length)];
    const fontSize = Math.floor(24 + Math.random() * 5);
    digitElements += `<text x="${x}" y="${y}" font-family="monospace, sans-serif" font-weight="bold" font-size="${fontSize}" fill="${color}" transform="rotate(${angle} ${x} ${y})">${d}</text>`;
  }

  let noiseLines = '';
  for (let i = 0; i < 3; i++) {
    const x1 = Math.floor(Math.random() * 30);
    const y1 = Math.floor(Math.random() * height);
    const qx = Math.floor(width / 2 + (Math.random() * 40 - 20));
    const qy = Math.floor(Math.random() * height);
    const x2 = Math.floor(width - Math.random() * 30);
    const y2 = Math.floor(Math.random() * height);
    const color = colors[Math.floor(Math.random() * colors.length)];
    noiseLines += `<path d="M${x1},${y1} Q${qx},${qy} ${x2},${y2}" stroke="${color}" stroke-width="1.5" fill="none" opacity="0.4" />`;
  }

  let noiseDots = '';
  for (let i = 0; i < 20; i++) {
    const cx = Math.floor(Math.random() * width);
    const cy = Math.floor(Math.random() * height);
    const r = (Math.random() * 1.5 + 0.5).toFixed(1);
    noiseDots += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="#94a3b8" opacity="0.5" />`;
  }

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" style="background: rgba(241, 245, 249, 0.7); border-radius: 8px;">
    ${noiseDots}
    ${noiseLines}
    ${digitElements}
  </svg>`;

  const captchaId = Math.random().toString(36).substring(2, 10);
  await prisma.authCaptcha.create({
    data: {
      captcha_id: captchaId,
      answer: digits,
      expires_at: new Date(Date.now() + 5 * 60 * 1000),
    },
  });

  return { captchaId, svg };
}

function generateToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email || user.phone, phone: user.phone, role: user.role },
    JWT_SECRET,
    { expiresIn: '30d' }
  );
}

// GET /api/auth/captcha
router.get('/captcha', async (req, res) => {
  try {
    const { captchaId, svg } = await generateNumericSvgCaptcha();
    res.json({ captchaId, svg });
  } catch (err) {
    res.status(500).json({ message: 'Failed to generate captcha', error: err.message });
  }
});

// POST /api/auth/send-otp-phone
router.post('/send-otp-phone', async (req, res) => {
  try {
    const validation = validateBody(res, sendOtpPhoneSchema, req.body);
    if (!validation.success) return;
    const { phone, captchaId, captchaAnswer } = validation.data;

    if (!phone || !captchaId || !captchaAnswer) {
      return res.status(400).json({ message: 'شماره همراه و کد امنیتی الزامی است' });
    }

    const sendLimit = consumeRateLimit(clientKey(req, 'sms-send'), getAuthRateLimits().otpSendMax);
    if (!sendLimit.allowed) return rejectRateLimited(res, sendLimit);

    // Verify Captcha (database-backed)
    const cap = await prisma.authCaptcha.findUnique({ where: { captcha_id: captchaId } });
    if (!cap || cap.expires_at < new Date()) {
      return res.status(400).json({ message: 'کد امنیتی منقضی شده است. تصویر جدید دریافت کنید' });
    }

    const cleanAnswer = toEnglishDigits(captchaAnswer);
    if (cleanAnswer !== cap.answer) {
      return res.status(400).json({ message: 'کد امنیتی اشتباه است' });
    }
    await prisma.authCaptcha.delete({ where: { captcha_id: captchaId } });

    const normalized = normalizePhoneNumber(phone);
    if (!normalized.ok) {
      return res.status(400).json({ message: normalized.message });
    }

    const destSendLimit = consumeRateLimit(
      destinationPhoneKey(normalized.storageKey, 'send'),
      getAuthRateLimits().otpSendMax
    );
    if (!destSendLimit.allowed) return rejectRateLimited(res, destSendLimit);

    const cooldown = consumeResendCooldown(`sms:${normalized.storageKey}`);
    if (!cooldown.allowed) return rejectRateLimited(res, cooldown);

    const otp = generatePhoneOtpCode();
    await storePhoneOtp(normalized.storageKey, otp);

    try {
      await sendSmsOtp(normalized.e164, otp);
    } catch (err) {
      // Do not leave a code that was never delivered (user would burn attempts).
      await prisma.authOtp.delete({ where: { phone: normalized.storageKey } }).catch(() => {});
      return deliveryFailure(res, err, 'خطا در ارسال کد تایید');
    }

    res.json({
      success: true,
      message: 'کد تأیید پیامک شد',
      phone: normalized.storageKey,
      // Never leak the code in production; it is a dev convenience only.
      ...(shouldExposeDevDeliveryHints() ? { dev_otp: otp } : {}),
    });
  } catch (err) {
    console.error('Send OTP Phone error:', err?.name || err);
    res.status(500).json({ message: 'خطا در ارسال کد تایید' });
  }
});

// POST /api/auth/verify-otp-phone
router.post('/verify-otp-phone', async (req, res) => {
  try {
    const validation = validateBody(res, verifyOtpPhoneSchema, req.body);
    if (!validation.success) return;
    const { phone, otp } = validation.data;
    if (!phone || !otp) {
      return res.status(400).json({ message: 'شماره همراه و کد تایید الزامی است' });
    }

    const verifyLimit = consumeRateLimit(clientKey(req, 'sms-verify'), getAuthRateLimits().otpVerifyMax * 4);
    if (!verifyLimit.allowed) return rejectRateLimited(res, verifyLimit);

    const normalized = normalizePhoneNumber(phone);
    if (!normalized.ok) {
      return res.status(400).json({ message: normalized.message });
    }
    const cleanPhone = normalized.storageKey;

    const destVerifyLimit = consumeRateLimit(
      destinationPhoneKey(cleanPhone, 'verify'),
      getAuthRateLimits().otpVerifyMax * 4
    );
    if (!destVerifyLimit.allowed) return rejectRateLimited(res, destVerifyLimit);

    const cleanOtp = toEnglishDigits(otp);
    const record = await prisma.authOtp.findUnique({ where: { phone: cleanPhone } });
    const verdict = evaluateOtpAttempt(record, cleanOtp, {
      allowDevFallback: !IS_PRODUCTION,
      devCode: DEV_PHONE_OTP,
    });

    if (!verdict.ok) {
      if (record && verdict.reason !== 'locked') {
        await prisma.authOtp.update({
          where: { phone: cleanPhone },
          data: { attempts: { increment: 1 } },
        });
      }
      const message =
        verdict.reason === 'locked'
          ? 'تعداد تلاش برای این کد بیش از حد مجاز است. کد جدید درخواست کنید'
          : 'کد تایید اشتباه یا منقضی شده است';
      return res.status(400).json({ message });
    }

    // The dev fallback code is accepted without a stored record, so only
    // consume the OTP row when one actually exists.
    if (record) {
      await prisma.authOtp.delete({ where: { phone: cleanPhone } });
    }

    // Find or create user
    let user = await prisma.user.findUnique({ where: { phone: cleanPhone } });
    let isNewUser = false;

    if (!user) {
      isNewUser = true;
      user = await prisma.user.create({
        data: {
          phone: cleanPhone,
          full_name: 'کاربر آیه ' + cleanPhone.slice(-4),
          role: 'user',
          phone_verified: true,
        },
      });
    } else if (!user.phone_verified) {
      user = await prisma.user.update({
        where: { id: user.id },
        data: { phone_verified: true },
      });
    }

    const token = generateToken(user);

    const safeUser = {
      id: user.id,
      phone: user.phone,
      email: user.email,
      full_name: user.full_name,
      role: user.role,
      is_scholar: user.is_scholar,
      avatar_config: user.avatar_config,
      avatar_url: user.avatar_url,
      bio: user.bio,
      streak_days: user.streak_days || 0,
      max_streak: user.max_streak || 0,
      total_xp: user.total_xp || 0,
      spiritual_level: user.spiritual_level || 'مستمع',
    };

    res.json({
      success: true,
      access_token: token,
      token,
      user: safeUser,
      isNewUser,
    });
  } catch (err) {
    console.error('Verify OTP Phone error:', err);
    res.status(500).json({ message: 'خطا در اعتبارسنجی کد', error: err.message });
  }
});

// POST /api/auth/complete-profile
router.post('/complete-profile', authenticate({ required: true }), async (req, res) => {
  try {
    const validation = validateBody(res, completeProfileSchema, req.body);
    if (!validation.success) return;
    const { full_name } = validation.data;

    const updated = await prisma.user.update({
      where: { id: req.user.id },
      data: { full_name: full_name.trim() },
      select: {
        id: true,
        phone: true,
        email: true,
        full_name: true,
        role: true,
        avatar_url: true,
      },
    });

    res.json({ success: true, user: updated });
  } catch (err) {
    console.error('Complete profile error:', err);
    res.status(500).json({ message: 'خطا در ویرایش نام', error: err.message });
  }
});

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const validation = validateBody(res, registerSchema, req.body);
    if (!validation.success) return;
    const { email, password, full_name } = validation.data;

    const registerLimit = consumeRateLimit(clientKey(req, 'register'), getAuthRateLimits().otpSendMax);
    if (!registerLimit.allowed) return rejectRateLimited(res, registerLimit);

    const normalizedEmail = email.trim().toLowerCase();
    const destRegisterLimit = consumeRateLimit(
      destinationEmailKey(normalizedEmail, 'send'),
      getAuthRateLimits().otpSendMax
    );
    if (!destRegisterLimit.allowed) return rejectRateLimited(res, destRegisterLimit);

    const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (existing) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    const registerCooldown = consumeResendCooldown(`email:${normalizedEmail}`);
    if (!registerCooldown.allowed) return rejectRateLimited(res, registerCooldown);

    const hashedPassword = await bcrypt.hash(password, 10);
    await prisma.user.create({
      data: {
        email: normalizedEmail,
        password: hashedPassword,
        full_name: full_name || normalizedEmail.split('@')[0],
      },
    });

    const otp = generateEmailOtpCode();
    await storeEmailOtp(normalizedEmail, otp);

    try {
      await sendEmailOtp(normalizedEmail, otp);
    } catch (err) {
      // Account exists unverified — recoverable via /resend-otp once delivery works.
      return deliveryFailure(
        res,
        err,
        'Failed to send verification code. Account created — request a new code via resend-otp.'
      );
    }

    res.json({
      success: true,
      message: 'Verification code sent',
      email: normalizedEmail,
      ...(shouldExposeDevDeliveryHints() ? { dev_otp: otp } : {}),
    });
  } catch (err) {
    console.error('Register error:', err?.name || err);
    res.status(500).json({ message: 'Failed to register' });
  }
});

// POST /api/auth/verify-otp
router.post('/verify-otp', async (req, res) => {
  try {
    const validation = validateBody(res, verifyOtpSchema, req.body);
    if (!validation.success) return;
    const { email, otpCode } = validation.data;

    const verifyLimit = consumeRateLimit(clientKey(req, 'email-verify'), getAuthRateLimits().otpVerifyMax * 4);
    if (!verifyLimit.allowed) return rejectRateLimited(res, verifyLimit);

    const normalizedEmail = email.trim().toLowerCase();
    const destVerifyLimit = consumeRateLimit(
      destinationEmailKey(normalizedEmail, 'verify'),
      getAuthRateLimits().otpVerifyMax * 4
    );
    if (!destVerifyLimit.allowed) return rejectRateLimited(res, destVerifyLimit);

    const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (!user) {
      // Avoid account enumeration via verify endpoint differences where possible.
      return res.status(400).json({ message: 'Invalid or expired verification code' });
    }

    const record = await prisma.authOtp.findUnique({ where: { email: normalizedEmail } });
    const verdict = evaluateOtpAttempt(record, otpCode, {
      allowDevFallback: !IS_PRODUCTION,
      devCode: DEV_EMAIL_OTP,
    });
    if (!verdict.ok) {
      if (record && verdict.reason !== 'locked') {
        await prisma.authOtp.update({
          where: { email: normalizedEmail },
          data: { attempts: { increment: 1 } },
        });
      }
      const message =
        verdict.reason === 'locked'
          ? `Too many verification attempts. Request a new code (max ${getMaxOtpVerifyAttempts()}).`
          : 'Invalid or expired verification code';
      return res.status(400).json({ message });
    }

    if (record) {
      await prisma.authOtp.delete({ where: { email: normalizedEmail } });
    }

    // Mark inbox as verified — login requires this flag for email/password.
    const verifiedUser = user.email_verified
      ? user
      : await prisma.user.update({
          where: { id: user.id },
          data: { email_verified: true },
        });

    const token = generateToken(verifiedUser);

    const safeUser = {
      id: verifiedUser.id,
      email: verifiedUser.email,
      full_name: verifiedUser.full_name,
      role: verifiedUser.role,
      is_scholar: verifiedUser.is_scholar,
      avatar_config: verifiedUser.avatar_config,
      avatar_url: verifiedUser.avatar_url,
      bio: verifiedUser.bio,
      streak_days: verifiedUser.streak_days || 0,
      max_streak: verifiedUser.max_streak || 0,
      total_xp: verifiedUser.total_xp || 0,
      spiritual_level: verifiedUser.spiritual_level || 'مستمع',
      email_verified: true,
    };

    res.json({
      access_token: token,
      token,
      user: safeUser,
    });
  } catch (err) {
    console.error('Verify OTP error:', err?.name || err);
    res.status(500).json({ message: 'Verification failed' });
  }
});

// POST /api/auth/resend-otp
router.post('/resend-otp', async (req, res) => {
  try {
    const validation = validateBody(res, resendOtpSchema, req.body);
    if (!validation.success) return;
    const { email } = validation.data;
    const normalizedEmail = email.trim().toLowerCase();

    const sendLimit = consumeRateLimit(clientKey(req, 'email-resend'), getAuthRateLimits().otpSendMax);
    if (!sendLimit.allowed) return rejectRateLimited(res, sendLimit);

    const destSendLimit = consumeRateLimit(
      destinationEmailKey(normalizedEmail, 'send'),
      getAuthRateLimits().otpSendMax
    );
    if (!destSendLimit.allowed) return rejectRateLimited(res, destSendLimit);

    const cooldown = consumeResendCooldown(`email:${normalizedEmail}`);
    if (!cooldown.allowed) return rejectRateLimited(res, cooldown);

    // Always return a generic success when the account is missing to avoid enumeration.
    const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (!user) {
      return res.json({ success: true, message: 'Code resent' });
    }

    const otp = generateEmailOtpCode();
    await storeEmailOtp(normalizedEmail, otp);

    try {
      await sendEmailOtp(normalizedEmail, otp);
    } catch (err) {
      return deliveryFailure(res, err, 'Failed to resend code');
    }

    res.json({
      success: true,
      message: 'Code resent',
      ...(shouldExposeDevDeliveryHints() ? { dev_otp: otp } : {}),
    });
  } catch (err) {
    console.error('Resend OTP error:', err?.name || err);
    res.status(500).json({ message: 'Failed to resend code' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const validation = validateBody(res, loginSchema, req.body);
    if (!validation.success) return;
    const { email, password } = validation.data;

    const normalizedEmail = email.trim().toLowerCase();
    // Per-IP and per-account login caps (in-memory; not multi-instance safe).
    const loginIpLimit = consumeRateLimit(clientKey(req, 'login'), getAuthRateLimits().loginMax);
    if (!loginIpLimit.allowed) return rejectRateLimited(res, loginIpLimit);
    const loginAcctLimit = consumeRateLimit(accountLoginKey(normalizedEmail), getAuthRateLimits().loginMax);
    if (!loginAcctLimit.allowed) return rejectRateLimited(res, loginAcctLimit);

    const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (!user || !user.password) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    if (!user.email_verified) {
      return res.status(403).json({
        message: 'ایمیل شما هنوز تایید نشده است. کد ارسال‌شده را وارد کنید',
        code: 'EMAIL_NOT_VERIFIED',
        email: user.email,
      });
    }

    const token = generateToken(user);
    const safeUser = {
      id: user.id,
      email: user.email,
      full_name: user.full_name,
      role: user.role,
      is_scholar: user.is_scholar,
      avatar_config: user.avatar_config,
      avatar_url: user.avatar_url,
      bio: user.bio,
      streak_days: user.streak_days || 0,
      max_streak: user.max_streak || 0,
      total_xp: user.total_xp || 0,
      spiritual_level: user.spiritual_level || 'مستمع',
      email_verified: user.email_verified,
    };

    res.json({
      access_token: token,
      token,
      user: safeUser,
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Login failed', error: err.message });
  }
});

// GET /api/auth/me
router.get('/me', authenticate({ required: true }), (req, res) => {
  res.json(req.user);
});

// PATCH & PUT /api/auth/me
const updateMeHandler = async (req, res) => {
  try {
    const validation = validateBody(res, updateMeSchema, req.body);
    if (!validation.success) return;
    const { full_name, avatar_config, avatar_url, bio } = validation.data;
    const updated = await prisma.user.update({
      where: { id: req.user.id },
      data: {
        ...(full_name !== undefined && { full_name }),
        ...(avatar_config !== undefined && { avatar_config }),
        ...(avatar_url !== undefined && { avatar_url }),
        ...(bio !== undefined && { bio }),
      },
      select: {
        id: true,
        email: true,
        full_name: true,
        role: true,
        is_scholar: true,
        avatar_config: true,
        avatar_url: true,
        bio: true,
        streak_days: true,
        max_streak: true,
        total_xp: true,
        spiritual_level: true,
        created_date: true,
      },
    });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: 'Failed to update profile', error: err.message });
  }
};
router.patch('/me', authenticate({ required: true }), updateMeHandler);
router.put('/me', authenticate({ required: true }), updateMeHandler);

// POST /api/auth/reset-password-request
router.post('/reset-password-request', async (req, res) => {
  try {
    const validation = validateBody(res, resetPasswordRequestSchema, req.body);
    if (!validation.success) return;
    const { email } = validation.data;
    const normalizedEmail = email.trim().toLowerCase();

    const resetLimit = consumeRateLimit(clientKey(req, 'reset'), getAuthRateLimits().otpSendMax);
    if (!resetLimit.allowed) return rejectRateLimited(res, resetLimit);

    const destResetLimit = consumeRateLimit(
      destinationEmailKey(normalizedEmail, 'reset'),
      getAuthRateLimits().otpSendMax
    );
    if (!destResetLimit.allowed) return rejectRateLimited(res, destResetLimit);

    // Only mint a token for an existing account, but always answer with the
    // same generic message so the endpoint cannot be used to enumerate users.
    const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    let devToken;
    if (user) {
      const resetToken = jwt.sign(
        { email: normalizedEmail, type: 'reset' },
        JWT_SECRET,
        { expiresIn: '1h' }
      );
      const msg = passwordResetMessage(resetToken);
      try {
        await getEmailProvider().send({ to: normalizedEmail, ...msg });
        // In production the token is only delivered out-of-band (email).
        // Returning it from the API would let any caller reset any account.
        if (shouldExposeDevDeliveryHints()) devToken = resetToken;
      } catch (err) {
        // Do not change the HTTP shape based on account existence or delivery
        // outcome — enumeration risk. Ops must monitor delivery error logs.
        console.error('Reset password email delivery failed:', err?.code || err?.name || 'error');
      }
    }

    res.json({
      success: true,
      message: 'Password reset email sent (if account exists)',
      ...(devToken ? { resetToken: devToken } : {}),
    });
  } catch (err) {
    console.error('Reset password request error:', err?.name || err);
    res.status(500).json({ message: 'Failed to request password reset' });
  }
});

// POST /api/auth/reset-password
router.post('/reset-password', async (req, res) => {
  try {
    const validation = validateBody(res, resetPasswordSchema, req.body);
    if (!validation.success) return;
    const { resetToken, newPassword } = validation.data;

    const decoded = jwt.verify(resetToken, JWT_SECRET);
    if (decoded.type !== 'reset' || !decoded.email) {
      return res.status(400).json({ message: 'Invalid reset token' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    // Proving inbox control via reset link also verifies the email.
    await prisma.user.update({
      where: { email: decoded.email },
      data: { password: hashedPassword, email_verified: true },
    });

    res.json({ success: true, message: 'Password updated successfully' });
  } catch (err) {
    res.status(400).json({ message: 'Invalid or expired reset token', error: err.message });
  }
});

// DELETE /api/auth/me — permanently delete the signed-in account and all of
// its dependent data. The generic entities API intentionally cannot do this
// because deleting a User row alone would orphan posts, comments, badges, etc.
router.delete('/me', authenticate({ required: true }), async (req, res) => {
  const userId = req.user.id;
  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Sessions created by this user own their parts and duas; delete those
    // explicitly because the schema has no cascade relations.
    const ownedSessions = await prisma.khatmSession.findMany({
      where: { creator_id: userId },
      select: { id: true },
    });
    const ownedSessionIds = ownedSessions.map((s) => s.id);

    const ops = [
      prisma.post.deleteMany({ where: { author_id: userId } }),
      prisma.comment.deleteMany({ where: { author_id: userId } }),
      prisma.story.deleteMany({ where: { author_id: userId } }),
      prisma.competitionEntry.deleteMany({ where: { author_id: userId } }),
      prisma.vote.deleteMany({ where: { user_id: userId } }),
      prisma.like.deleteMany({ where: { user_id: userId } }),
      prisma.bookmark.deleteMany({ where: { user_id: userId } }),
      prisma.report.deleteMany({ where: { reporter_id: userId } }),
      prisma.moderationAction.deleteMany({ where: { actor_id: userId } }),
      // Null out reviewer attribution rather than blocking deletion.
      prisma.report.updateMany({
        where: { reviewed_by: userId },
        data: { reviewed_by: null },
      }),
      prisma.notification.deleteMany({
        where: { OR: [{ recipient_id: userId }, { actor_id: userId }] },
      }),
      prisma.follow.deleteMany({
        where: { OR: [{ follower_id: userId }, { followed_id: userId }] },
      }),
      prisma.khatmDua.deleteMany({ where: { user_id: userId } }),
      ...(ownedSessionIds.length
        ? [
            prisma.khatmPart.deleteMany({ where: { session_id: { in: ownedSessionIds } } }),
            prisma.khatmDua.deleteMany({ where: { session_id: { in: ownedSessionIds } } }),
            prisma.khatmSession.deleteMany({ where: { id: { in: ownedSessionIds } } }),
          ]
        : []),
      // Reserved parts are structural: release them instead of deleting.
      prisma.khatmPart.updateMany({
        where: { user_id: userId },
        data: {
          user_id: null,
          user_name: null,
          user_avatar: null,
          status: 'available',
          reserved_at: null,
        },
      }),
      prisma.watchHistory.deleteMany({ where: { user_id: userId } }),
      prisma.userBadge.deleteMany({ where: { user_id: userId } }),
      prisma.dailyQuestProgress.deleteMany({ where: { user_id: userId } }),
      prisma.podcast.deleteMany({ where: { scholar_id: userId } }),
      prisma.liveSession.deleteMany({ where: { scholar_id: userId } }),
      // Keep uploaded media/content attribution soft when the account leaves.
      prisma.video.updateMany({ where: { reciter_id: userId }, data: { reciter_id: null } }),
      prisma.competition.updateMany({
        where: { organizer_id: userId },
        data: { organizer_id: null },
      }),
      // Curated collections are platform content; keep them, drop the owner.
      prisma.collection.updateMany({ where: { user_id: userId }, data: { user_id: null } }),
      ...(user.email ? [prisma.authOtp.deleteMany({ where: { email: user.email } })] : []),
      ...(user.phone ? [prisma.authOtp.deleteMany({ where: { phone: user.phone } })] : []),
      prisma.user.delete({ where: { id: userId } }),
    ];

    await prisma.$transaction(ops);
    res.json({ success: true });
  } catch (err) {
    console.error('Delete account error:', err);
    res.status(500).json({ message: 'Failed to delete account' });
  }
});

export default router;
