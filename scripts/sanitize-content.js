#!/usr/bin/env node
/**
 * Sanitize live content for launch integrity:
 * - Deduplicate identical media_url rows (preserve engagement on survivor)
 * - Align titles/creators with actual verified media sources
 * - Zero fabricated views/likes; sync counters from real rows
 * - Generate local SVG thumbnails for rows missing artwork
 * - Never invent lectures/tafsir that we do not host
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
// Express serves static files from server/uploads (see server/index.js)
const THUMB_DIR = path.join(__dirname, '..', 'uploads', 'thumbs');

/** Honest metadata overrides keyed by id (seed rows). */
const HONEST_BY_ID = {
  'video-1': {
    title: 'تلاوت ترتیل سوره یاسین — مشاری راشد عفاسی',
    description: 'تلاوت کامل سوره یاسین از منبع QuranicAudio (مشاری راشد عفاسی).',
    category: 'recitation',
    media_url: 'https://download.quranicaudio.com/quran/mishaari_raashid_al_3afaasee/036.mp3',
    media_type: 'audio',
    duration: '۱:۱۸:۰۰',
    verse_key: '36:1',
    reciter_name: 'مشاری راشد عفاسی',
    scholar_name: null,
    scholar_id: null,
    is_live: false,
    is_competition: false,
    tags: JSON.stringify(['ترتیل', 'سوره یاسین', 'عفاسی', 'صوتی']),
  },
  'video-2': {
    title: 'تلاوت آیه الکرسی — محمود خلیل الحصری',
    description: 'تلاوت آیه الکرسی با صدای شیخ محمود خلیل الحصری (منبع EveryAyah).',
    category: 'recitation',
    media_url: 'https://everyayah.com/data/Husary_128kbps/002255.mp3',
    media_type: 'audio',
    duration: '۰:۰۱:۱۵',
    verse_key: '2:255',
    reciter_name: 'محمود خلیل الحصری',
    scholar_name: null,
    scholar_id: null,
    is_live: false,
    is_competition: false,
    tags: JSON.stringify(['آیت الکرسی', 'حصری', 'کوتاه', 'شورت', 'صوتی']),
  },
  'video-3': {
    title: 'تلاوت سوره بقره — آپارات',
    description: 'ویدیوی مجاز آپارات (embed) — تلاوت سوره بقره.',
    category: 'recitation',
    media_url: 'https://www.aparat.com/video/video/embed/videohash/6Zv4j/vt/frame',
    media_type: 'video',
    duration: '۱۴:۲۰',
    verse_key: '2:1',
    reciter_name: 'کانال آپارات',
    is_live: false,
    is_competition: false,
    competition_year: null,
    competition_category: null,
    venue: null,
    prize: null,
    competition_details: null,
    tags: JSON.stringify(['آپارات', 'سوره بقره', 'ویدیو']),
  },
  'video-4': {
    title: 'تلاوت سوره الرحمن — سعد الغامدی',
    description: 'تلاوت کامل سوره الرحمن از QuranicAudio (سعد الغامدی).',
    category: 'recitation',
    media_url: 'https://download.quranicaudio.com/quran/sa3d_al-ghaamidi/complete/055.mp3',
    media_type: 'audio',
    duration: '۰:۱۱:۳۰',
    verse_key: '55:1',
    reciter_name: 'سعد الغامدی',
    scholar_name: null,
    scholar_id: null,
    is_live: false,
    is_competition: false,
    tags: JSON.stringify(['ترتیل', 'سوره الرحمن', 'الغامدی', 'صوتی']),
  },
  'video-5': {
    title: 'تلاوت سوره ملک — عبدالباسط عبدالصمد',
    description: 'تلاوت سوره ملک با صدای عبدالباسط عبدالصمد (منبع mp3quran).',
    category: 'recitation',
    media_url: 'https://server8.mp3quran.net/basit/067.mp3',
    media_type: 'audio',
    duration: '۰:۰۶:۴۰',
    verse_key: '67:1',
    reciter_name: 'عبدالباسط عبدالصمد',
    is_live: false,
    is_competition: false,
    tags: JSON.stringify(['ترتیل', 'سوره ملک', 'عبدالباسط', 'صوتی']),
  },
  'video-6': {
    title: 'تلاوت سوره فاتحه — مشاری عفاسی',
    description: 'تلاوت سوره حمد با صدای مشاری راشد عفاسی (QuranicAudio).',
    category: 'recitation',
    media_url: 'https://download.quranicaudio.com/quran/mishaari_raashid_al_3afaasee/001.mp3',
    media_type: 'audio',
    duration: '۰:۰۱:۰۵',
    verse_key: '1:1',
    reciter_name: 'مشاری راشد عفاسی',
    is_live: false,
    tags: JSON.stringify(['ترتیل', 'سوره فاتحه', 'عفاسی', 'کوتاه', 'شورت', 'صوتی']),
  },
  'video-7': {
    title: 'تلاوت آیه استعينوا بالصبر — مشاری عفاسی',
    description: 'تلاوت آیه ۱۵۳ سوره بقره با صدای مشاری عفاسی (EveryAyah).',
    category: 'recitation',
    media_url: 'https://everyayah.com/data/Alafasy_128kbps/002153.mp3',
    media_type: 'audio',
    duration: '۰:۰۰:۳۵',
    verse_key: '2:153',
    reciter_name: 'مشاری راشد عفاسی',
    scholar_name: null,
    scholar_id: null,
    is_live: false,
    tags: JSON.stringify(['بقره', 'عفاسی', 'کوتاه', 'شورت', 'صوتی']),
  },
  'video-8': {
    title: 'تلاوت سوره الرحمن — سعد الغامدی (mp3quran)',
    description: 'تلاوت سوره الرحمن با صدای سعد الغامدی (منبع mp3quran).',
    category: 'recitation',
    media_url: 'https://server8.mp3quran.net/s_gmd/055.mp3',
    media_type: 'audio',
    duration: '۰:۱۱:۲۰',
    verse_key: '55:1',
    reciter_name: 'سعد الغامدی',
    is_live: false,
    tags: JSON.stringify(['ترتیل', 'سوره الرحمن', 'الغامدی', 'صوتی']),
  },
  'video-9': {
    title: 'تلاوت ترتیل سوره یاسین — سعد الغامدی',
    description: 'تلاوت سوره یاسین با صدای سعد الغامدی (منبع mp3quran).',
    category: 'recitation',
    media_url: 'https://server7.mp3quran.net/s_gmd/036.mp3',
    media_type: 'audio',
    duration: '۱:۱۰:۰۰',
    verse_key: '36:1',
    reciter_name: 'سعد الغامدی',
    is_live: false,
    tags: JSON.stringify(['ترتیل', 'سوره یاسین', 'الغامدی', 'صوتی']),
  },
  'video-10': {
    title: 'تلاوت آیه الکرسی — مشاری عفاسی',
    description: 'تلاوت کوتاه آیه الکرسی با صدای مشاری عفاسی (EveryAyah).',
    category: 'recitation',
    media_url: 'https://everyayah.com/data/Alafasy_128kbps/002255.mp3',
    media_type: 'audio',
    duration: '۰:۰۰:۴۵',
    verse_key: '2:255',
    reciter_name: 'مشاری راشد عفاسی',
    is_live: false,
    tags: JSON.stringify(['آیت الکرسی', 'عفاسی', 'کوتاه', 'شورت', 'صوتی']),
  },
};

const APARAT_META = {
  A6Q2M: { title: 'تلاوت سوره الرحمن — آپارات', verse_key: '55:1' },
  vz6Gg: { title: 'تلاوت سوره ملک — آپارات', verse_key: '67:1' },
  Jk2gq: { title: 'تلاوت سوره یاسین — آپارات', verse_key: '36:1' },
  '6Zv4j': { title: 'تلاوت سوره بقره — آپارات', verse_key: '2:1' },
};

function makeThumbSvg({ kind }) {
  const bg = kind === 'video' ? '#0D5C46' : '#1a3a4a';
  const accent = '#D4AF37';
  // Visual-only thumb: no baked-in labels (UI owns title/duration).
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="720" viewBox="0 0 1280 720">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${bg}"/>
      <stop offset="100%" stop-color="#0b0f19"/>
    </linearGradient>
  </defs>
  <rect width="1280" height="720" fill="url(#g)"/>
  <circle cx="1100" cy="120" r="180" fill="${accent}" fill-opacity="0.12"/>
  <circle cx="160" cy="600" r="220" fill="${accent}" fill-opacity="0.08"/>
</svg>`;
}

function aparatHash(url) {
  const m = String(url || '').match(/videohash\/([A-Za-z0-9]+)/);
  return m ? m[1] : null;
}

async function reassignEngagement(fromId, toId) {
  // Move likes/bookmarks/comments that would not collide; drop pure duplicates.
  const likes = await prisma.like.findMany({ where: { video_id: fromId } });
  for (const row of likes) {
    const clash = await prisma.like.findFirst({
      where: { user_id: row.user_id, video_id: toId },
    });
    if (clash) {
      await prisma.like.delete({ where: { id: row.id } });
    } else {
      await prisma.like.update({ where: { id: row.id }, data: { video_id: toId } });
    }
  }

  const bookmarks = await prisma.bookmark.findMany({ where: { video_id: fromId } });
  for (const row of bookmarks) {
    const clash = await prisma.bookmark.findFirst({
      where: { user_id: row.user_id, video_id: toId },
    });
    if (clash) {
      await prisma.bookmark.delete({ where: { id: row.id } });
    } else {
      await prisma.bookmark.update({ where: { id: row.id }, data: { video_id: toId } });
    }
  }

  await prisma.comment.updateMany({
    where: { video_id: fromId },
    data: { video_id: toId },
  });
}

async function dedupeByMediaUrl() {
  const videos = await prisma.video.findMany({ orderBy: { created_date: 'asc' } });
  const groups = new Map();
  for (const v of videos) {
    const key = (v.media_url || '').trim();
    if (!key) continue;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(v);
  }

  let removed = 0;
  for (const [, rows] of groups) {
    if (rows.length < 2) continue;
    // Prefer stable seed id (video-*) as survivor, else oldest.
    const survivor =
      rows.find((r) => String(r.id).startsWith('video-')) || rows[0];
    for (const dup of rows) {
      if (dup.id === survivor.id) continue;
      await reassignEngagement(dup.id, survivor.id);
      await prisma.video.delete({ where: { id: dup.id } });
      removed += 1;
      console.log(`deduped ${dup.id} -> ${survivor.id}`);
    }
  }
  return removed;
}

async function ensureThumb(video) {
  fs.mkdirSync(THUMB_DIR, { recursive: true });
  const file = path.join(THUMB_DIR, `${video.id}.svg`);
  const svg = makeThumbSvg({
    title: video.title,
    subtitle: video.reciter_name || video.scholar_name || '',
    kind: video.media_type === 'video' ? 'video' : 'audio',
  });
  fs.writeFileSync(file, svg, 'utf8');
  return `/uploads/thumbs/${video.id}.svg`;
}

async function syncCounters(videoId) {
  const [likes, comments, bookmarks] = await Promise.all([
    prisma.like.count({ where: { video_id: videoId } }),
    prisma.comment.count({ where: { video_id: videoId } }),
    prisma.bookmark.count({ where: { video_id: videoId } }),
  ]);
  // views_count: keep only non-fabricated scale — use real interactions as floor, else 0
  // If previous views were clearly fabricated (>1000 with almost no engagement), reset.
  const current = await prisma.video.findUnique({ where: { id: videoId } });
  const fabricated = (current?.views_count || 0) > 1000 && likes + comments + bookmarks <= 2;
  const views = fabricated ? likes + comments + bookmarks : Math.max(current?.views_count || 0, likes);
  await prisma.video.update({
    where: { id: videoId },
    data: {
      likes_count: likes,
      comments_count: comments,
      views_count: views,
    },
  });
}

async function main() {
  console.log('sanitize: start');

  // 1) Honest metadata for known seed rows
  for (const [id, data] of Object.entries(HONEST_BY_ID)) {
    const existing = await prisma.video.findUnique({ where: { id } });
    if (!existing) {
      console.log(`skip missing ${id}`);
      continue;
    }
    await prisma.video.update({ where: { id }, data });
    console.log(`honested ${id}`);
  }

  // 2) Normalize remaining Aparat rows
  const aparatRows = await prisma.video.findMany({
    where: { media_url: { contains: 'aparat.com' } },
  });
  for (const v of aparatRows) {
    const hash = aparatHash(v.media_url);
    const meta = hash ? APARAT_META[hash] : null;
    await prisma.video.update({
      where: { id: v.id },
      data: {
        media_type: 'video',
        is_live: false,
        title: meta?.title || v.title?.replace(/به‌\s*verkla/gi, '').trim() || v.title,
        verse_key: meta?.verse_key || v.verse_key,
        description: v.description || (meta ? `ویدیوی مجاز آپارات (embed ${hash}).` : v.description),
      },
    });
  }

  // 3) Drop broken / nonexistent aparat hashes
  const broken = await prisma.video.findMany({
    where: {
      OR: [
        { media_url: { contains: 'videohash/nonexistent' } },
        { media_url: { contains: 'cdn.example.com' } },
        { title: { contains: 'verkla' } },
      ],
    },
  });
  for (const v of broken) {
    await prisma.comment.deleteMany({ where: { video_id: v.id } });
    await prisma.like.deleteMany({ where: { video_id: v.id } });
    await prisma.bookmark.deleteMany({ where: { video_id: v.id } });
    await prisma.video.delete({ where: { id: v.id } });
    console.log(`deleted broken ${v.id}`);
  }

  // 4) Deduplicate identical media
  const removed = await dedupeByMediaUrl();

  // 5) Thumbnails + counters for all remaining
  const all = await prisma.video.findMany();
  for (const v of all) {
    const thumb = await ensureThumb(v);
    await prisma.video.update({
      where: { id: v.id },
      data: { thumbnail_url: thumb, is_live: false },
    });
    await syncCounters(v.id);
  }

  const summary = {
    videos: await prisma.video.count(),
    audio: await prisma.video.count({ where: { media_type: 'audio' } }),
    video: await prisma.video.count({ where: { media_type: 'video' } }),
    live: await prisma.video.count({ where: { is_live: true } }),
    missingThumb: await prisma.video.count({
      where: { OR: [{ thumbnail_url: null }, { thumbnail_url: '' }] },
    }),
    removedDupes: removed,
  };
  console.log('sanitize: done', summary);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
