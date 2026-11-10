#!/usr/bin/env node
/**
 * Build platform-owned Quranic videos from verified audio + local artwork.
 * Removes dead Aparat embeds (API 404/410) and replaces them with local MP4s.
 */
import { execFileSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const UPLOAD = path.join(ROOT, 'uploads');
const VIDEO_DIR = path.join(UPLOAD, 'videos');
const THUMB_DIR = path.join(UPLOAD, 'thumbs');
const POSTER = path.join(ROOT, 'public', 'images', 'art', 'nasir_light_columns.jpg');

const BUILDS = [
  {
    id: 'video-3',
    title: 'تلاوت آیه الکرسی — مشاری عفاسی (ویدیو)',
    description: 'ویدیوی پلتفرمی ساخته‌شده از تلاوت معتبر EveryAyah (مشاری عفاسی).',
    category: 'recitation',
    audioUrl: 'https://everyayah.com/data/Alafasy_128kbps/002255.mp3',
    duration: '۰:۰۰:۴۵',
    verse_key: '2:255',
    reciter_name: 'مشاری راشد عفاسی',
    tags: ['آیت الکرسی', 'عفاسی', 'کوتاه', 'شورت', 'ویدیو'],
    status: 'published',
  },
  {
    id: 'plat-video-fatiha',
    title: 'تلاوت سوره فاتحه — مشاری عفاسی (ویدیو)',
    description: 'ویدیوی پلتفرمی از تلاوت سوره حمد (QuranicAudio / مشاری عفاسی).',
    category: 'recitation',
    audioUrl: 'https://download.quranicaudio.com/quran/mishaari_raashid_al_3afaasee/001.mp3',
    duration: '۰:۰۱:۰۵',
    verse_key: '1:1',
    reciter_name: 'مشاری راشد عفاسی',
    tags: ['فاتحه', 'عفاسی', 'کوتاه', 'شورت', 'ویدیو'],
    status: 'published',
  },
  {
    id: 'plat-video-sabr',
    title: 'تلاوت آیه استعينوا بالصبر — مشاری عفاسی (ویدیو)',
    description: 'ویدیوی پلتفرمی کوتاه از آیه ۱۵۳ بقره (EveryAyah).',
    category: 'recitation',
    audioUrl: 'https://everyayah.com/data/Alafasy_128kbps/002153.mp3',
    duration: '۰:۰۰:۳۵',
    verse_key: '2:153',
    reciter_name: 'مشاری راشد عفاسی',
    tags: ['بقره', 'عفاسی', 'کوتاه', 'شورت', 'ویدیو'],
    status: 'published',
  },
  {
    id: 'plat-video-husary-kursi',
    title: 'تلاوت آیه الکرسی — الحصری (ویدیو)',
    description: 'ویدیوی پلتفرمی از تلاوت شیخ الحصری (EveryAyah).',
    category: 'recitation',
    audioUrl: 'https://everyayah.com/data/Husary_128kbps/002255.mp3',
    duration: '۰:۰۱:۱۵',
    verse_key: '2:255',
    reciter_name: 'محمود خلیل الحصری',
    tags: ['آیت الکرسی', 'حصری', 'کوتاه', 'شورت', 'ویدیو'],
    status: 'verified',
  },
];

function sh(cmd, args) {
  execFileSync(cmd, args, { stdio: 'inherit' });
}

function makeThumbSvg(id, _title, _subtitle) {
  fs.mkdirSync(THUMB_DIR, { recursive: true });
  const file = path.join(THUMB_DIR, `${id}.svg`);
  // Visual-only thumb: no baked-in labels (UI owns title/duration).
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="720" viewBox="0 0 1280 720">
  <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0%" stop-color="#0D5C46"/><stop offset="100%" stop-color="#0b0f19"/>
  </linearGradient></defs>
  <rect width="1280" height="720" fill="url(#g)"/>
  <circle cx="1100" cy="120" r="180" fill="#D4AF37" fill-opacity="0.12"/>
  <circle cx="160" cy="600" r="220" fill="#D4AF37" fill-opacity="0.08"/>
</svg>`;
  fs.writeFileSync(file, svg);
  return `/uploads/thumbs/${id}.svg`;
}

async function removeDeadAparat() {
  const rows = await prisma.video.findMany({
    where: { media_url: { contains: 'aparat.com' } },
  });
  for (const v of rows) {
    await prisma.comment.deleteMany({ where: { video_id: v.id } });
    await prisma.like.deleteMany({ where: { video_id: v.id } });
    await prisma.bookmark.deleteMany({ where: { video_id: v.id } });
    await prisma.video.delete({ where: { id: v.id } });
    console.log('removed dead aparat', v.id, v.title);
  }
}

async function buildOne(spec) {
  fs.mkdirSync(VIDEO_DIR, { recursive: true });
  const audioPath = path.join(VIDEO_DIR, `${spec.id}.src.mp3`);
  const mp4Path = path.join(VIDEO_DIR, `${spec.id}.mp4`);
  const posterJpg = path.join(VIDEO_DIR, `${spec.id}.poster.jpg`);

  if (!fs.existsSync(audioPath)) {
    console.log('download', spec.audioUrl);
    sh('curl', ['-fsSL', '-o', audioPath, spec.audioUrl]);
  }

  // Normalize poster to jpg for ffmpeg
  if (!fs.existsSync(posterJpg)) {
    sh('ffmpeg', [
      '-y',
      '-i',
      POSTER,
      '-vf',
      'scale=1280:720:force_original_aspect_ratio=increase,crop=1280:720',
      posterJpg,
    ]);
  }

  console.log('encode', spec.id);
  sh('ffmpeg', [
    '-y',
    '-loop',
    '1',
    '-i',
    posterJpg,
    '-i',
    audioPath,
    '-c:v',
    'libx264',
    '-tune',
    'stillimage',
    '-c:a',
    'aac',
    '-b:a',
    '128k',
    '-pix_fmt',
    'yuv420p',
    '-shortest',
    '-movflags',
    '+faststart',
    mp4Path,
  ]);

  const thumb = makeThumbSvg(spec.id, spec.title, spec.reciter_name);
  const mediaUrl = `/uploads/videos/${spec.id}.mp4`;
  const data = {
    title: spec.title,
    description: spec.description,
    category: spec.category,
    media_url: mediaUrl,
    media_type: 'video',
    thumbnail_url: thumb,
    duration: spec.duration,
    verse_key: spec.verse_key,
    reciter_name: spec.reciter_name,
    is_live: false,
    is_competition: false,
    tags: JSON.stringify(spec.tags),
    status: spec.status,
    views_count: 0,
    likes_count: 0,
    comments_count: 0,
  };

  const existing = await prisma.video.findUnique({ where: { id: spec.id } });
  if (existing) {
    await prisma.video.update({ where: { id: spec.id }, data });
  } else {
    await prisma.video.create({ data: { id: spec.id, ...data } });
  }
  console.log('upserted', spec.id, mediaUrl);
}

async function main() {
  if (!fs.existsSync(POSTER)) {
    throw new Error(`Missing poster artwork: ${POSTER}`);
  }
  await removeDeadAparat();
  for (const spec of BUILDS) {
    await buildOne(spec);
  }
  const summary = {
    videos: await prisma.video.count(),
    videoType: await prisma.video.count({ where: { media_type: 'video' } }),
    audioType: await prisma.video.count({ where: { media_type: 'audio' } }),
    aparatLeft: await prisma.video.count({ where: { media_url: { contains: 'aparat.com' } } }),
  };
  console.log('done', summary);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
