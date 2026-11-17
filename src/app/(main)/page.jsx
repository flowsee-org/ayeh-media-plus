import { Suspense } from 'react';
import Home from '@/views/Home';

export const dynamic = 'force-dynamic'; // SSR: Dynamic Server Rendering per request

export const metadata = {
  title: 'آیه مدیا پلاس — تدبّر در قرآن کریم',
  description: 'مطالعه مصحف، ترجمه، تفسیر، تدبّر، تلاوت، هنر و جامعه قرآنی — همه در یک تجربه یکپارچه',
  openGraph: {
    title: 'آیه مدیا پلاس',
    description: 'مجتمع قرآنی: تلاوت، تفسیر، تدبّر، هنر و جامعه',
  },
};

export default function HomePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-accent/30 border-t-accent rounded animate-spin" />
        </div>
      }
    >
      <Home />
    </Suspense>
  );
}
