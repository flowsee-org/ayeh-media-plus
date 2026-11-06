import { Suspense } from 'react';
import ResetPassword from '@/views/ResetPassword';

export const metadata = {
  title: 'بازیابی رمز عبور — آیه مدیا پلاس',
  description: 'تنظیم رمز عبور جدید برای حساب کاربری در سامانه آیه مدیا پلاس',
};

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-accent/30 border-t-accent rounded-full animate-spin" />
        </div>
      }
    >
      <ResetPassword />
    </Suspense>
  );
}
