import { z } from 'zod';

// Helper to validate request body against a zod schema.
// Returns { success: true, data } or sends a 400 error response and returns { success: false }.
export function validateBody(res, schema, body) {
  const result = schema.safeParse(body);
  if (!result.success) {
    const issues = result.error.issues.map((i) => ({
      field: i.path.join('.'),
      message: i.message,
    }));
    res.status(400).json({
      message: 'Validation failed',
      errors: issues,
    });
    return { success: false };
  }
  return { success: true, data: result.data };
}

// ── Auth validation schemas ──
export const sendOtpPhoneSchema = z.object({
  phone: z.string().min(1, 'شماره همراه الزامی است'),
  captchaId: z.string().min(1, 'شناسه کپچا الزامی است'),
  captchaAnswer: z.string().min(1, 'پاسخ کپچا الزامی است'),
});

export const verifyOtpPhoneSchema = z.object({
  phone: z.string().min(1, 'شماره همراه الزامی است'),
  otp: z.string().min(1, 'کد تایید الزامی است'),
});

export const registerSchema = z.object({
  email: z.string().email('ایمیل معتبر نیست').toLowerCase().trim(),
  password: z.string().min(6, 'رمز عبور باید حداقل ۶ کاراکتر باشد'),
  full_name: z.string().optional(),
});

export const verifyOtpSchema = z.object({
  email: z.string().email('ایمیل معتبر نیست').toLowerCase().trim(),
  otpCode: z.string().min(1, 'کد تایید الزامی است'),
});

export const resendOtpSchema = z.object({
  email: z.string().email('ایمیل معتبر نیست').toLowerCase().trim(),
});

export const loginSchema = z.object({
  email: z.string().email('ایمیل معتبر نیست').toLowerCase().trim(),
  password: z.string().min(1, 'رمز عبور الزامی است'),
});

export const resetPasswordRequestSchema = z.object({
  email: z.string().email('ایمیل معتبر نیست').toLowerCase().trim(),
});

export const resetPasswordSchema = z.object({
  resetToken: z.string().min(1, 'توکن بازنشانی الزامی است'),
  newPassword: z.string().min(6, 'رمز عبور جدید باید حداقل ۶ کاراکتر باشد'),
});

export const completeProfileSchema = z.object({
  full_name: z.string().min(1, 'نام و نام خانوادگی الزامی است'),
});

export const updateMeSchema = z.object({
  full_name: z.string().optional(),
  avatar_config: z.string().optional(),
  avatar_url: z.string().url('آواتار یک لینک معتبر نیست').optional(),
  bio: z.string().optional(),
});
