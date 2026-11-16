import { Suspense } from 'react';
import Assistant from '@/views/Assistant';

export const metadata = {
  title: 'دستیار هوش مصنوعی تدبر — آیه مدیا پلاس',
  description: 'راهنمای هوشمند تدبر در قرآن کریم و پاسخ به پرسش‌های دینی و معرفتی',
};

export default function AssistantRoute() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-accent/30 border-t-accent rounded animate-spin" />
        </div>
      }
    >
      <Assistant />
    </Suspense>
  );
}
