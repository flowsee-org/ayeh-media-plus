import { Suspense } from 'react';
import WatchHistoryPage from '@/views/WatchHistory';

export const revalidate = 0;

export default function WatchHistoryRoute() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="w-8 h-8 border-4 border-accent/30 border-t-accent rounded-full animate-spin" />
      </div>
    }>
      <WatchHistoryPage />
    </Suspense>
  );
}
