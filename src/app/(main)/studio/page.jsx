import { Suspense } from 'react';
import CardStudio from '@/views/CardStudio';

export const metadata = {
  title: 'استودیوی آیه — آیه مدیا پلاس',
  description: 'آیات را به شاهکارهای بصری و استوری تبدیل کنید — با هنر معماری ایران',
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
