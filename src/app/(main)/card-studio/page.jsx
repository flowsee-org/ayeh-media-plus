import { Suspense } from 'react';
import CardStudio from '@/views/CardStudio';

export const metadata = {
  title: 'استودیو طراحی کارت آیه — آیه پلاس',
  description: 'طراحی و اشتراک‌گذاری کارت‌های تدبر در قرآن کریم',
};

export default function CardStudioRoute() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-accent/30 border-t-accent rounded-full animate-spin" />
        </div>
      }
    >
      <CardStudio />
    </Suspense>
  );
}
