import { Suspense } from 'react';
import VerseDetail from '@/views/VerseDetail';
import { getSurahByNumber } from '@/lib/surahData';

export const revalidate = 86400; // ISR: Cache for 24 hours

export async function generateStaticParams() {
  // Pre-render core popular verses at build time (SSG)
  return [
    { surah: '1', ayah: '1' },
    { surah: '1', ayah: '2' },
    { surah: '1', ayah: '3' },
    { surah: '1', ayah: '4' },
    { surah: '1', ayah: '5' },
    { surah: '1', ayah: '6' },
    { surah: '1', ayah: '7' },
    { surah: '2', ayah: '255' },
    { surah: '36', ayah: '1' },
    { surah: '55', ayah: '1' },
    { surah: '112', ayah: '1' },
    { surah: '112', ayah: '2' },
    { surah: '112', ayah: '3' },
    { surah: '112', ayah: '4' },
  ];
}

export async function generateMetadata({ params }) {
  const resolved = await params;
  const surahNum = parseInt(resolved.surah, 10);
  const ayahNum = parseInt(resolved.ayah, 10);
  const surahInfo = getSurahByNumber(surahNum);
  const surahName = surahInfo ? surahInfo.name : `سوره ${resolved.surah}`;
  const persianName = surahInfo ? surahInfo.persianName : '';

  return {
    title: `سوره ${surahName} (${persianName}) آیه ${ayahNum} — آیه پلاس`,
    description: `متن، ترجمه، تفسیر المیزان و نمونه، صوت قاریان و تدبر پیرامون سوره ${surahName} آیه ${ayahNum}`,
    openGraph: {
      title: `سوره ${surahName} آیه ${ayahNum}`,
      description: `مطالعه و تدبر در سوره ${surahName} (${persianName}) آیه ${ayahNum} در سامانه آیه مدیا پلاس`,
    },
  };
}

export default async function VerseDetailPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-accent/30 border-t-accent rounded animate-spin" />
        </div>
      }
    >
      <VerseDetail />
    </Suspense>
  );
}
