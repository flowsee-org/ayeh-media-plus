import { Suspense } from 'react';
import SearchPage from '@/views/SearchPage';

export const metadata = {
  title: 'جست‌وجو در آیات و مفاهیم — آیه مدیا پلاس',
  description: 'جست‌وجوی پیشرفته در متن، ترجمه، موضوعات و تفاسیر قرآن کریم',
};

export default function SearchRoute() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-accent/30 border-t-accent rounded animate-spin" />
        </div>
      }
    >
      <SearchPage />
    </Suspense>
  );
}
