import { Suspense } from 'react';
import Scholars from '@/views/Scholars';

export const revalidate = 3600; // ISR: Revalidate every hour

export const metadata = {
  title: 'اساتید و مفسران قرآنی — آیه مدیا پلاس',
  description: 'آشنایی با اساتید برجسته، مفسران معاصر قرآن، درس‌گفتارها و جلسات تخصصی تدبر',
};

export default function ScholarsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-accent/30 border-t-accent rounded-full animate-spin" />
        </div>
      }
    >
      <Scholars />
    </Suspense>
  );
}
