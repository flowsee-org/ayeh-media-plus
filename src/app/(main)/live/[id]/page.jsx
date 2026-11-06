import { Suspense } from 'react';
import LiveView from '@/views/LiveView';

export async function generateMetadata({ params }) {
  const { id } = await params;
  return {
    title: `اتاق پخش زنده — آیه مدیا پلاس`,
    description: `تماشا و گفتگوی زنده در جلسه قرآنی آیه مدیا پلاس`,
  };
}

export default function LiveRoomRoute() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-accent/30 border-t-accent rounded-full animate-spin" />
        </div>
      }
    >
      <LiveView />
    </Suspense>
  );
}
