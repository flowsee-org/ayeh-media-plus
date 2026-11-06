import { Suspense } from 'react';
import ScholarProfile from '@/views/ScholarProfile';

export const revalidate = 3600; // ISR: Revalidate every 1 hour

export async function generateMetadata({ params }) {
  const { id } = await params;
  return {
    title: `پروفایل و درس‌گفتارهای استاد — آیه پلاس`,
    description: `مشاهده جلسات، درس‌گفتارهای تفسیری و ارتباط با استاد در سامانه آیه مدیا پلاس`,
    openGraph: {
      title: `درس‌گفتارها و آثار استاد`,
      description: `مطالعه و شنیدن بیانات قرآنی و تفسیری در سامانه آیه مدیا پلاس`,
    },
  };
}

export default function ScholarDetailPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-accent/30 border-t-accent rounded-full animate-spin" />
        </div>
      }
    >
      <ScholarProfile />
    </Suspense>
  );
}
