import { Suspense } from 'react';
import VideoWatchPage from '@/views/VideoWatchPage';
import { notFound } from 'next/navigation';

export const revalidate = 0; // Dynamic - video watch pages are always fresh

export async function generateMetadata({ params }) {
  const resolved = await params;
  const videoId = resolved.id;

  return {
    title: `مشاهده ویدیو قرآنی — آیه مدیا پلاس`,
    description: 'تماشا و تدبر در ویدیوهای قرآنی، تلاوت، تفسیر و مسابقات',
    openGraph: {
      title: 'مشاهده ویدیو قرآنی — آیه مدیا پلاس',
      description: 'تماشا و تدبر در ویدیوهای قرآنی، تلاوت، تفسیر و مسابقات',
      type: 'video.other',
    },
  };
}

export default async function VideoWatchPageRoute({ params }) {
  const resolved = await params;
  const videoId = resolved.id;

  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-quranic-parchment flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-quranic-emerald/30 border-t-quranic-emerald rounded animate-spin" />
        </div>
      }
    >
      <VideoWatchPage videoId={videoId} />
    </Suspense>
  );
}