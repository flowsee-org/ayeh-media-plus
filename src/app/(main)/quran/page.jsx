import { Suspense } from 'react';
import Quran from '@/views/Quran';

export const metadata = {
  title: 'مصحف شریف — آیه مدیا پلاس',
  description: 'فهرست سوره‌ها، جزءها، تلاوت قاریان برجسته جهان اسلام و مطالعه آیات قرآن کریم',
  openGraph: {
    title: 'مصحف شریف — قرآن کریم',
    description: 'مطالعه و استماع تلاوت سوره‌ها و جزء‌های مصحف شریف',
  },
};

export default function QuranPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-accent/30 border-t-accent rounded-full animate-spin" />
        </div>
      }
    >
      <Quran />
    </Suspense>
  );
}
