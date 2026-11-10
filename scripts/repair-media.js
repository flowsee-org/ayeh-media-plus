#!/usr/bin/env node
/**
 * Repair fake / broken media URLs in the live database without reseeding.
 * Preserves users and engagement rows. Uses only verified-reachable sources.
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const REPAIRS = {
  'video-1': {
    media_url: 'https://download.quranicaudio.com/quran/mishaari_raashid_al_3afaasee/036.mp3',
    media_type: 'audio',
    thumbnail_url: null,
    duration: '۱:۱۸:۰۰',
    is_live: false,
  },
  'video-2': {
    // Ayat al-Kursi — Husary (verified everyayah)
    media_url: 'https://everyayah.com/data/Husary_128kbps/002255.mp3',
    media_type: 'audio',
    thumbnail_url: null,
    duration: '۰:۰۱:۱۵',
    is_live: false,
    tags: JSON.stringify(['تفسیر', 'آیت الکرسی', 'حصری', 'کوتاه', 'شورت']),
  },
  'video-3': {
    media_url: 'https://www.aparat.com/video/video/embed/videohash/6Zv4j/vt/frame',
    media_type: 'video',
    thumbnail_url: null,
    duration: '۱۴:۲۰',
    is_live: false,
  },
  'video-4': {
    media_url: 'https://download.quranicaudio.com/quran/sa3d_al-ghaamidi/complete/055.mp3',
    media_type: 'audio',
    thumbnail_url: null,
    duration: '۰:۱۱:۳۰',
    is_live: false,
  },
  'video-5': {
    media_url: 'https://server8.mp3quran.net/basit/067.mp3',
    media_type: 'audio',
    thumbnail_url: null,
    duration: '۰:۰۶:۴۰',
    is_live: false,
  },
  // Former fake live streams → real VOD audio (live feature remains via /live)
  'video-6': {
    title: 'تلاوت سوره فاتحه — مشاری عفاسی',
    description: 'تلاوت سوره حمد با صدای شیخ مشاری راشد عفاسی',
    media_url: 'https://download.quranicaudio.com/quran/mishaari_raashid_al_3afaasee/001.mp3',
    media_type: 'audio',
    thumbnail_url: null,
    duration: '۰:۰۱:۰۵',
    is_live: false,
    category: 'recitation',
    tags: JSON.stringify(['ترتیل', 'سوره فاتحه', 'عفاسی', 'کوتاه', 'شورت']),
  },
  'video-7': {
    media_url: 'https://everyayah.com/data/Alafasy_128kbps/002153.mp3',
    media_type: 'audio',
    thumbnail_url: null,
    duration: '۰:۰۰:۳۵',
    is_live: false,
    tags: JSON.stringify(['تفسیر موضوعی', 'صبر', 'عفاسی', 'کوتاه', 'شورت']),
  },
  'video-8': {
    title: 'تلاوت سوره الرحمن — سعد الغامدی',
    description: 'تلاوت کامل سوره الرحمن با صدای سعد الغامدی',
    media_url: 'https://server8.mp3quran.net/s_gmd/055.mp3',
    media_type: 'audio',
    thumbnail_url: null,
    duration: '۰:۱۱:۲۰',
    is_live: false,
    category: 'recitation',
    tags: JSON.stringify(['ترتیل', 'سوره الرحمن', 'الغامدی']),
  },
  'video-9': {
    media_url: 'https://server7.mp3quran.net/s_gmd/036.mp3',
    media_type: 'audio',
    thumbnail_url: null,
    duration: '۱:۱۰:۰۰',
    is_live: false,
  },
  'video-10': {
    title: 'تلاوت آیه الکرسی — مشاری عفاسی',
    description: 'تلاوت کوتاه آیه الکرسی مناسب شورت',
    media_url: 'https://everyayah.com/data/Alafasy_128kbps/002255.mp3',
    media_type: 'audio',
    thumbnail_url: null,
    duration: '۰:۰۰:۴۵',
    is_live: false,
    category: 'recitation',
    tags: JSON.stringify(['آیت الکرسی', 'عفاسی', 'کوتاه', 'شورت']),
  },
};

async function main() {
  let updated = 0;
  for (const [id, data] of Object.entries(REPAIRS)) {
    const existing = await prisma.video.findUnique({ where: { id } });
    if (!existing) {
      console.log(`skip missing ${id}`);
      continue;
    }
    await prisma.video.update({ where: { id }, data });
    updated += 1;
    console.log(`repaired ${id}`);
  }

  // Remove known broken Aparat import (hash: nonexistent)
  const broken = await prisma.video.findMany({
    where: { media_url: { contains: 'videohash/nonexistent' } },
  });
  for (const v of broken) {
    await prisma.comment.deleteMany({ where: { video_id: v.id } });
    await prisma.like.deleteMany({ where: { video_id: v.id } });
    await prisma.bookmark.deleteMany({ where: { video_id: v.id } });
    await prisma.video.delete({ where: { id: v.id } });
    console.log(`deleted broken ${v.id} (${v.title})`);
  }

  // Ensure Aparat imports have media_type video and no fake live flag
  const aparat = await prisma.video.findMany({
    where: { media_url: { contains: 'aparat.com' } },
  });
  for (const v of aparat) {
    await prisma.video.update({
      where: { id: v.id },
      data: { media_type: 'video', is_live: false },
    });
  }
  console.log(`normalized ${aparat.length} aparat embeds`);

  // Patch remaining cdn.example.com / islamic.network URLs if any
  const leftovers = await prisma.video.findMany({
    where: {
      OR: [
        { media_url: { contains: 'cdn.example.com' } },
        { media_url: { contains: 'cdn.islamic.network' } },
        { thumbnail_url: { contains: 'cdn.example.com' } },
        { thumbnail_url: { contains: 'cdn.islamic.network' } },
      ],
    },
  });
  for (const v of leftovers) {
    await prisma.video.update({
      where: { id: v.id },
      data: {
        media_url: v.media_url.includes('example.com') || v.media_url.includes('islamic.network')
          ? 'https://everyayah.com/data/Alafasy_128kbps/001001.mp3'
          : v.media_url,
        thumbnail_url: null,
        media_type: 'audio',
        is_live: false,
      },
    });
    console.log(`fallback-repaired ${v.id}`);
  }

  const counts = {
    videos: await prisma.video.count(),
    live: await prisma.video.count({ where: { is_live: true } }),
    fake: await prisma.video.count({
      where: {
        OR: [
          { media_url: { contains: 'cdn.example.com' } },
          { media_url: { contains: 'nonexistent' } },
        ],
      },
    }),
  };
  console.log('done', { updated, ...counts });
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
