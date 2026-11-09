/**
 * Ayeh Media Plus — Aparat Content Import System
 *
 * Bulk imports Quranic video content from Aparat using administrator-provided metadata.
 * Supports CSV bulk import and single URL import with optional oEmbed metadata fetch.
 *
 * Usage:
 *   node scripts/import-aparat.js --file urls.csv [--publish]
 *   node scripts/import-aparat.js --url "https://www.aparat.com/v/xxxx" [--publish]
 *   node scripts/import-aparat.js --list
 *
 * CSV format (header row required):
 *   url,category,title,description,author_name,tags
 *   https://www.aparat.com/v/xxxx,recitation,تلاوت سوره بقره,تلاوت خاشعانه,قاری miss Ali,قرآن,تلاوت,بقره
 */

import { createReadStream } from 'fs';
import { createInterface } from 'readline';
import { writeFileSync, readFileSync, existsSync, mkdirSync } from 'fs';

const IMPORT_LOG = './imports/import-log.json';
const IMPORT_DIR = './imports';

if (!existsSync(IMPORT_DIR)) {
  mkdirSync(IMPORT_DIR, { recursive: true });
}

// ── Aparat oEmbed endpoint (optional metadata fetch) ──
const APARAT_OEMBED = 'https://www.aparat.com/oembed';

// ── Parse Aparat video ID from URL ──
export function parseAparatVideoId(url) {
  const patterns = [
    /aparat\.com\/v\/([a-zA-Z0-9]+)/,
    /aparat\.com\/video\/video\/videotitle\/([a-zA-Z0-9]+)/,
    /aparat\.com\/([a-zA-Z0-9]{11})/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

// ── Build Aparat embed URL ──
export function buildAparatEmbedUrl(videoId) {
  return `https://www.aparat.com/video/video/embed/videohash/${videoId}/vt/frame`;
}

// ── Try to fetch metadata from Aparat oEmbed (graceful degradation) ──
export async function fetchAparatMetadata(videoUrl) {
  const videoId = parseAparatVideoId(videoUrl);
  if (!videoId) {
    return null;
  }

  try {
    const oembedUrl = `${APARAT_OEMBED}?url=https://www.aparat.com/v/${videoId}&format=json`;
    const response = await fetch(oembedUrl, { signal: AbortSignal.timeout(5000) });
    if (!response.ok) return null;
    const data = await response.json();
    return {
      videoId,
      title: data.title || '',
      author_name: data.author_name || '',
      thumbnail_url: data.thumbnail_url || '',
      embed_url: buildAparatEmbedUrl(videoId),
    };
  } catch {
    return null;
  }
}

// ── Quranic content validation keywords ──
const QURANIC_KEYWORDS = [
  'قرآن', 'تلاوت', 'تفسیر', 'تجوید', 'حفظ', 'قرآنی', 'محفلی',
  'قراء', 'آیه', 'سوره', 'رحمن', 'رحیم', 'اللہ', 'الله',
  'islamic', 'quran', 'qari', 'recitation', 'tafsir', 'tajweed',
  'memorization', 'mahfel', 'gathering', 'religious',
];

// ── Validate imported video content ──
export function validateVideo(metadata) {
  const errors = [];

  if (!metadata.title || metadata.title.trim().length === 0) {
    errors.push('عنوان الزامی است');
  }

  if (!metadata.source_url) {
    errors.push('لینک ویدیو الزامی است');
  }

  // Check for Quranic/religious relevance
  const searchableText = `${metadata.title} ${metadata.author_name || ''} ${metadata.description || ''}`.toLowerCase();
  const hasQuranicContent = QURANIC_KEYWORDS.some((kw) =>
    searchableText.includes(kw.toLowerCase())
  );

  if (!hasQuranicContent) {
    errors.push('محتوای قرآنی/مذهبی تشخیص داده نشد');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

// ── Check if video already imported ──
export function isAlreadyImported(videoId) {
  const log = readImportLog();
  return log.some((entry) => entry.sourceId === videoId);
}

// ── Read import log ──
export function readImportLog() {
  if (!existsSync(IMPORT_LOG)) return [];
  try {
    return JSON.parse(readFileSync(IMPORT_LOG, 'utf-8'));
  } catch {
    return [];
  }
}

// ── Save import log ──
function saveImportLog(records) {
  writeFileSync(IMPORT_LOG, JSON.stringify(records, null, 2));
}

// ── Import a single video ──
export async function importVideo(videoUrl, options = {}) {
  const {
    autoPublish = false,
    category = 'recitation',
    title = '',
    description = '',
    author_name = '',
    tags = [],
    skipIfExists = true,
  } = options;

  const videoId = parseAparatVideoId(videoUrl);

  if (!videoId) {
    return { success: false, reason: 'لینک معتبر آپارات نیست', videoId: null };
  }

  // Check for duplicates
  if (skipIfExists && isAlreadyImported(videoId)) {
    return { success: false, reason: '在此之前 وارد شده است', videoId };
  }

  // Try to fetch metadata from oEmbed (optional)
  let oembedData = null;
  try {
    oembedData = await fetchAparatMetadata(videoUrl);
  } catch {
    // Graceful degradation - oEmbed not available
  }

  // Build import record
  const importRecord = {
    id: `aparat_${videoId}`,
    source: 'aparat',
    sourceId: videoId,
    title: title || oembedData?.title || 'ویدیو آپارات',
    description: description || oembedData?.thumbnail_url ? '' : '',
    category,
    media_url: buildAparatEmbedUrl(videoId),
    media_type: 'video',
    thumbnail_url: oembedData?.thumbnail_url || null,
    source_url: videoUrl,
    author_name: author_name || oembedData?.author_name || 'کانال آپارات',
    author_url: `https://www.aparat.com/${videoId}`,
    duration: null,
    verse_key: null,
    tags: JSON.stringify(tags.length > 0 ? tags : ['قرآن', 'تلاوت']),
    status: autoPublish ? 'published' : 'pending_review',
    is_live: false,
    is_competition: false,
    views_count: 0,
    likes_count: 0,
    comments_count: 0,
    imported_at: new Date().toISOString(),
  };

  // Validate
  const validation = validateVideo(importRecord);
  if (!validation.valid) {
    return { success: false, reason: validation.errors.join(', '), videoId };
  }

  // Save to import log
  const log = readImportLog();
  log.push(importRecord);
  saveImportLog(log);

  return {
    success: true,
    videoId,
    record: importRecord,
    oembedUsed: !!oembedData,
  };
}

// ── Bulk import from CSV file ──
export async function bulkImportFromCsv(csvPath, options = {}) {
  if (!existsSync(csvPath)) {
    throw new Error(`فایل یافت نشد: ${csvPath}`);
  }

  const results = [];
  const fileStream = createReadStream(csvPath);
  const rl = createInterface({
    input: fileStream,
    crlfDelay: Infinity,
  });

  let firstLine = true;
  for await (const line of rl) {
    if (firstLine) {
      firstLine = false;
      continue; // Skip header
    }

    const parts = line.split(',');
    const url = parts[0]?.trim();
    const category = parts[1]?.trim() || 'recitation';
    const title = parts[2]?.trim() || '';
    const description = parts[3]?.trim() || '';
    const author_name = parts[4]?.trim() || '';
    const tags = parts[5]?.trim() ? parts[5].trim().split('|') : ['قرآن', 'تلاوت'];

    if (!url) continue;

    try {
      const result = await importVideo(url, {
        ...options,
        category,
        title,
        description,
        author_name,
        tags,
      });
      results.push({ url, ...result });
    } catch (err) {
      results.push({ url, success: false, reason: err.message });
    }
  }

  fileStream.close();
  return results;
}

// ── CLI interface ──
async function main() {
  const args = process.argv.slice(2);
  let url = null;
  let csvFile = null;
  let autoPublish = false;
  let title = '';
  let description = '';
  let author_name = '';
  let tags = [];

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--url' && args[i + 1]) {
      url = args[i + 1];
      i++;
    } else if (args[i] === '--file' && args[i + 1]) {
      csvFile = args[i + 1];
      i++;
    } else if (args[i] === '--publish') {
      autoPublish = true;
    } else if (args[i] === '--title' && args[i + 1]) {
      title = args[i + 1];
      i++;
    } else if (args[i] === '--description' && args[i + 1]) {
      description = args[i + 1];
      i++;
    } else if (args[i] === '--author_name' && args[i + 1]) {
      author_name = args[i + 1];
      i++;
    } else if (args[i] === '--tags' && args[i + 1]) {
      tags = args[i + 1].split(',').map((t) => t.trim()).filter(Boolean);
      i++;
    } else if (args[i] === '--help' || args[i] === '-h') {
      console.log(`
Aparat Content Import System
Usage:
  node scripts/import-aparat.js --url "https://www.aparat.com/v/xxxx"
  node scripts/import-aparat.js --file urls.csv --publish
  node scripts/import-aparat.js --list
Options:
  --url       Import a single Aparat video URL
  --file      Bulk import from CSV file (url,category,title,description,author,tags per line)
  --publish   Auto-publish imported videos (default: pending_review)
  --list      Show import log
      `);
      process.exit(0);
    } else if (args[i] === '--list') {
      const log = readImportLog();
      console.log(`\nImport Log (${log.length} entries):`);
      log.forEach((entry, i) => {
        console.log(`  ${i + 1}. [${entry.status}] ${entry.title} (${entry.sourceId})`);
      });
      process.exit(0);
    }
  }

  if (csvFile) {
    const results = await bulkImportFromCsv(csvFile, { autoPublish });
    const success = results.filter((r) => r.success).length;
    const failed = results.filter((r) => !r.success).length;
    console.log(`\nBulk Import Complete: ${success} success, ${failed} failed`);
    results.forEach((r) => {
      if (r.success) {
        console.log(`  ✅ ${r.record.title} (${r.videoId})`);
      } else {
        console.log(`  ❌ ${r.url}: ${r.reason}`);
      }
    });
  } else if (url) {
    const result = await importVideo(url, {
      autoPublish,
      title,
      description,
      author_name,
      tags,
    });
    if (result.success) {
      console.log(`✅ Imported: ${result.record.title}`);
      console.log(`   ID: ${result.videoId}`);
      console.log(`   Author: ${result.record.author_name}`);
      console.log(`   Status: ${result.record.status}`);
      console.log(`   Embed: ${result.record.media_url}`);
      if (result.oembedUsed) {
        console.log(`   Metadata: Fetched from Aparat oEmbed`);
      } else {
        console.log(`   Metadata: Provided manually`);
      }
    } else {
      console.error(`❌ Failed: ${result.reason}`);
      process.exit(1);
    }
  } else {
    console.error('No URL or file specified. Use --help for usage.');
    process.exit(1);
  }
}

if (import.meta.main) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
