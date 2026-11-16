import { Suspense } from 'react';
import Quran from '@/views/Quran';

export const metadata = {
  title: 'مصحف شریف — آیه مدیا پلاس',
  description: '۱۱۴ سوره، ۳۰ جزء، تلاوت قاریان جهان، ترجمه و تدبّر آیات قرآن کریم',
  openGraph: {
    title: 'مصحف شریف — آیه مدیا پلاس',
    description: 'مطالعه و استماع تلاوت، ترجمه و تدبّر قرآن کریم',
  },
};

export default function QuranPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-accent/30 border-t-accent rounded animate-spin" />
        </div>
      }
    >
      <Quran />
    </Suspense>
  );
}
