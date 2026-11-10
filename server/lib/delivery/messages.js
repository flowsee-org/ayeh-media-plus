import { appPublicUrl } from './config.js';

export function emailVerificationMessage(otp) {
  const subject = 'کد تایید آیه پلاس / Ayeh verification code';
  const text = [
    'کد تایید حساب آیه پلاس:',
    otp,
    '',
    'این کد تا ۱۵ دقیقه معتبر است. اگر شما این درخواست را نداده‌اید، این پیام را نادیده بگیرید.',
    '',
    `Your Ayeh Media Plus verification code is ${otp}. It expires in 15 minutes.`,
  ].join('\n');
  const html = `
    <div dir="rtl" style="font-family:Tahoma,Arial,sans-serif;line-height:1.7">
      <p>کد تایید حساب آیه پلاس:</p>
      <p style="font-size:28px;letter-spacing:4px;font-weight:bold">${otp}</p>
      <p>این کد تا ۱۵ دقیقه معتبر است.</p>
      <hr/>
      <p dir="ltr">Your verification code is <strong>${otp}</strong> (expires in 15 minutes).</p>
    </div>
  `;
  return { subject, text, html };
}

export function passwordResetMessage(resetToken) {
  const link = `${appPublicUrl()}/reset-password?token=${encodeURIComponent(resetToken)}`;
  const subject = 'بازنشانی رمز عبور آیه پلاس / Password reset';
  const text = [
    'برای بازنشانی رمز عبور روی لینک زیر کلیک کنید (اعتبار ۱ ساعت):',
    link,
    '',
    'اگر این درخواست از سمت شما نبوده، این ایمیل را نادیده بگیرید.',
  ].join('\n');
  const html = `
    <div dir="rtl" style="font-family:Tahoma,Arial,sans-serif;line-height:1.7">
      <p>برای بازنشانی رمز عبور روی لینک زیر کلیک کنید (اعتبار ۱ ساعت):</p>
      <p><a href="${link}">بازنشانی رمز عبور</a></p>
      <p style="word-break:break-all;font-size:12px;color:#64748b">${link}</p>
    </div>
  `;
  return { subject, text, html };
}

export function smsOtpMessage(otp) {
  return `کد تایید آیه پلاس: ${otp}\nAyeh code: ${otp}`;
}
