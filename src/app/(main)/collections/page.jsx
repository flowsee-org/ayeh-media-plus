import { Suspense } from 'react';
import Collections from '@/views/Collections';

export const revalidate = 1800; // ISR: Revalidate every 30 minutes

export const metadata = {
  title: 'مجموعه‌های منتخب آیات — آیه مدیا پلاس',
  description: 'مجموعه‌های موضوعی و منتخب آیات برای مطالعه، تدبر و اشتراک‌گذاری',
};

export default function CollectionsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-accent/30 border-t-accent rounded-full animate-spin" />
        </div>
      }
    >
      <Collections />
    </Suspense>
  );
}
