import { Suspense } from 'react';
import CardStudio from '@/views/CardStudio';

export const metadata = {
  title: 'استودیوی طراحی کارت و استوری آیه — آیه مدیا پلاس',
  description: 'طراحی، زیباسازی و استخراج کارت‌های گرافیکی و استوری از آیات قرآن کریم',
};

export default function StudioRoute() {
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
