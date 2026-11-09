import { Suspense } from 'react';
import CollectionDetail from '@/views/CollectionDetail';

export const revalidate = 1800; // ISR: 30 minutes

export async function generateMetadata({ params }) {
  const { id } = await params;
  return {
    title: `مجموعه مطالعاتی آیات — آیه مدیا پلاس`,
    description: `مطالعه و تدبر در آیات این مجموعه به همراه ترجمه و تفاسیر`,
  };
}

export default function CollectionDetailPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-accent/30 border-t-accent rounded-full animate-spin" />
        </div>
      }
    >
      <CollectionDetail />
    </Suspense>
  );
}
