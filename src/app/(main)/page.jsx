import { Suspense } from 'react';
import Home from '@/views/Home';

export const dynamic = 'force-dynamic'; // SSR: Dynamic Server Rendering per request

export const metadata = {
  title: 'آیه مدیا پلاس — سامانه چندرسانه‌ای تدبر در قرآن کریم',
  description: 'مطالعه مصحف شریف، ترجمه و تفسیر، درس‌گفتارهای اساتید، شبکه اجتماعی تدبر و پخش زنده قرآنی',
  openGraph: {
    title: 'آیه مدیا پلاس',
    description: 'جامعه و رسانه قرآنی — تلاوت، تفسیر و تدبر در آیات وحی',
  },
};

export default function HomePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-accent/30 border-t-accent rounded-full animate-spin" />
        </div>
      }
    >
      <Home />
    </Suspense>
  );
}
