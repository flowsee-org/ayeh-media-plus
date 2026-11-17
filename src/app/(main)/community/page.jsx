import { Suspense } from 'react';
import Community from '@/views/Community';

export const dynamic = 'force-dynamic'; // SSR: Live social feed

export const metadata = {
  title: 'جامعه و گفت‌وگوی قرآنی — آیه مدیا پلاس',
  description: 'یادداشت‌های تدبری، بازتاب‌ها، تجربیات انس با قرآن و تبادل نظر پیرامون آیات',
};

export default function CommunityPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-accent/30 border-t-accent rounded animate-spin" />
        </div>
      }
    >
      <Community />
    </Suspense>
  );
}
