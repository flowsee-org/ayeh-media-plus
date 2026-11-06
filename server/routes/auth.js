import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../db.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'ayeh_default_secret_2026';

// In-memory OTP store for email verification
const otpStore = new Map();

// In-memory Captcha & Phone OTP stores
const captchaStore = new Map();
const phoneOtpStore = new Map();

// Helper to convert Persian/Arabic digits to English digits
function toEnglishDigits(str) {
  if (!str) return '';
  return String(str)
    .replace(/[۰-۹]/g, (d) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)))
    .replace(/[٠-٩]/g, (d) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)))
    .trim();
}

function generateNumericSvgCaptcha() {
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
  captchaStore.set(captchaId, {
    answer: digits,
    expiresAt: Date.now() + 5 * 60 * 1000,
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
router.get('/captcha', (req, res) => {
  const { captchaId, svg } = generateNumericSvgCaptcha();
  res.json({ captchaId, svg });
});

// POST /api/auth/send-otp-phone
router.post('/send-otp-phone', async (req, res) => {
  try {
    const { phone, captchaId, captchaAnswer } = req.body;

    if (!phone || !captchaId || !captchaAnswer) {
      return res.status(400).json({ message: 'شماره همراه و کد امنیتی الزامی است' });
    }

    // Verify Captcha
    const cap = captchaStore.get(captchaId);
    if (!cap || cap.expiresAt < Date.now()) {
      return res.status(400).json({ message: 'کد امنیتی منقضی شده است. تصویر جدید دریافت کنید' });
    }

    const cleanAnswer = toEnglishDigits(captchaAnswer);
    if (cleanAnswer !== cap.answer) {
      return res.status(400).json({ message: 'کد امنیتی اشتباه است' });
    }
    captchaStore.delete(captchaId);

    // Validate and format Phone
    let cleanPhone = toEnglishDigits(phone).replace(/[\s-+]/g, '');
    if (cleanPhone.startsWith('98')) {
      cleanPhone = '0' + cleanPhone.slice(2);
    } else if (cleanPhone.length === 10 && cleanPhone.startsWith('9')) {
      cleanPhone = '0' + cleanPhone;
    }

    if (!/^09\d{9}$/.test(cleanPhone)) {
      return res.status(400).json({ message: 'شماره تلفن همراه معتبر نیست (مثال: ۰۹۱۲۳۴۵۶۷۸۹)' });
    }

    // Generate 5-digit OTP
    const otp = Math.floor(10000 + Math.random() * 90000).toString();
    phoneOtpStore.set(cleanPhone, {
      otp,
      expiresAt: Date.now() + 5 * 60 * 1000,
    });

    console.log(`[SMS/AUTH] Verification code for ${cleanPhone}: ${otp}`);

    res.json({
      success: true,
      message: 'کد تأیید پیامک شد',
      phone: cleanPhone,
      dev_otp: otp, // Available in dev for seamless testing
    });
  } catch (err) {
    console.error('Send OTP Phone error:', err);
    res.status(500).json({ message: 'خطا در ارسال کد تایید', error: err.message });
  }
});

// POST /api/auth/verify-otp-phone
router.post('/verify-otp-phone', async (req, res) => {
  try {
    const { phone, otp } = req.body;
    if (!phone || !otp) {
      return res.status(400).json({ message: 'شماره همراه و کد تایید الزامی است' });
    }

    let cleanPhone = toEnglishDigits(phone).replace(/[\s-+]/g, '');
    if (cleanPhone.startsWith('98')) {
      cleanPhone = '0' + cleanPhone.slice(2);
    } else if (cleanPhone.length === 10 && cleanPhone.startsWith('9')) {
      cleanPhone = '0' + cleanPhone;
    }

    const cleanOtp = toEnglishDigits(otp);
    const record = phoneOtpStore.get(cleanPhone);

    // Allow generated OTP or fallback dev code '12345'
    const isValid = (record && record.otp === cleanOtp) || cleanOtp === '12345';
    if (!isValid) {
      return res.status(400).json({ message: 'کد تایید اشتباه یا منقضی شده است' });
    }

    phoneOtpStore.delete(cleanPhone);

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
        },
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
    const { full_name } = req.body;
    if (!full_name || !full_name.trim()) {
      return res.status(400).json({ message: 'نام و نام خانوادگی الزامی است' });
    }

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
    const { email, password, full_name } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (existing) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        email: normalizedEmail,
        password: hashedPassword,
        full_name: full_name || normalizedEmail.split('@')[0],
      },
    });

    // Store OTP (default demo OTP is '123456', or random 6 digits)
    const otp = '123456';
    otpStore.set(normalizedEmail, { otp, expiresAt: Date.now() + 15 * 60 * 1000 });
    console.log(`[AUTH] Verification OTP for ${normalizedEmail}: ${otp}`);

    res.json({
      success: true,
      message: 'Verification code sent',
      email: normalizedEmail,
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ message: 'Failed to register', error: err.message });
  }
});

// POST /api/auth/verify-otp
router.post('/verify-otp', async (req, res) => {
  try {
    const { email, otpCode } = req.body;
    if (!email || !otpCode) {
      return res.status(400).json({ message: 'Email and verification code are required' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const record = otpStore.get(normalizedEmail);
    // In development or if code matches (accepts generated code or fallback '123456')
    const isValid = (record && record.otp === otpCode) || otpCode === '123456';
    if (!isValid) {
      return res.status(400).json({ message: 'Invalid or expired verification code' });
    }

    otpStore.delete(normalizedEmail);
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
    };

    res.json({
      access_token: token,
      token,
      user: safeUser,
    });
  } catch (err) {
    res.status(500).json({ message: 'Verification failed', error: err.message });
  }
});

// POST /api/auth/resend-otp
router.post('/resend-otp', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: 'Email required' });
  const normalizedEmail = email.trim().toLowerCase();
  const otp = '123456';
  otpStore.set(normalizedEmail, { otp, expiresAt: Date.now() + 15 * 60 * 1000 });
  console.log(`[AUTH] Resent OTP for ${normalizedEmail}: ${otp}`);
  res.json({ success: true, message: 'Code resent' });
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password required' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ message: 'Invalid email or password' });
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
    const { full_name, avatar_config, avatar_url, bio } = req.body;
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
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: 'Email required' });
  const normalizedEmail = email.trim().toLowerCase();
  const resetToken = jwt.sign({ email: normalizedEmail, type: 'reset' }, JWT_SECRET, { expiresIn: '1h' });
  console.log(`[AUTH] Password reset link for ${normalizedEmail}: /reset-password?token=${resetToken}`);
  res.json({ success: true, message: 'Password reset email sent (if account exists)', resetToken });
});

// POST /api/auth/reset-password
router.post('/reset-password', async (req, res) => {
  try {
    const { resetToken, newPassword } = req.body;
    if (!resetToken || !newPassword) {
      return res.status(400).json({ message: 'Reset token and new password are required' });
    }

    const decoded = jwt.verify(resetToken, JWT_SECRET);
    if (decoded.type !== 'reset' || !decoded.email) {
      return res.status(400).json({ message: 'Invalid reset token' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { email: decoded.email },
      data: { password: hashedPassword },
    });

    res.json({ success: true, message: 'Password updated successfully' });
  } catch (err) {
    res.status(400).json({ message: 'Invalid or expired reset token', error: err.message });
  }
});

export default router;
