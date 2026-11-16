import { Suspense } from 'react';
import Topics from '@/views/Topics';

export const metadata = {
  title: 'موضوعات و مفاهیم کلیدی قرآن کریم — آیه مدیا پلاس',
  description: 'دسته‌بندی موضوعی آیات قرآن کریم: توحید، اخلاق، معاد، امید، صبر، جامعه و آرامش در آیه مدیا پلاس',
  openGraph: {
    title: 'موضوعات و مفاهیم قرآن کریم',
    description: 'کاوش و تدبر در آیات بر اساس دسته‌بندی‌های موضوعی',
  },
};

export default function TopicsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-accent/30 border-t-accent rounded animate-spin" />
        </div>
      }
    >
      <Topics />
    </Suspense>
  );
}
