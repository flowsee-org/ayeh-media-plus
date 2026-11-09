/**
 * Ayeh Media Plus — Video Transcoding Service
 *
 * Uses ffmpeg to generate multiple resolutions and HLS adaptive streaming
 * playlists from uploaded video files.
 *
 * Output structure (per source file):
 *   /uploads/hls/<video_id>/index.m3u8          — master HLS playlist
 *   /uploads/hls/<video_id>/360p/index.m3u8     — 360p variant playlist
 *   /uploads/hls/<video_id>/360p/segment_%03d.ts — 360p segments
 *   /uploads/hls/<video_id>/720p/index.m3u8     — 720p variant playlist
 *   /uploads/hls/<video_id>/720p/segment_%03d.ts — 720p segments
 *   /uploads/hls/<video_id>/1080p/index.m3u8    — 1080p variant playlist (if source is 1080p+)
 *   /uploads/thumbs/<video_id>.jpg               — poster thumbnail
 */

import { execFileSync } from 'child_process';
import { existsSync, mkdirSync, writeFileSync, rmSync, unlinkSync } from 'fs';
import { join } from 'path';

const UPLOAD_DIR = join(process.cwd(), 'uploads');
const HLS_DIR = join(UPLOAD_DIR, 'hls');
const THUMB_DIR = join(UPLOAD_DIR, 'thumbs');

for (const dir of [UPLOAD_DIR, HLS_DIR, THUMB_DIR]) {
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
}

/**
 * Target renditions for adaptive streaming.
 * Each rendition: { name, width, height, videoBitrate, audioBitrate }
 */
const RENDITIONS = [
  { name: '360p',  width: 640,  height: 360,  videoBitrate: 800,  audioBitrate: 96 },
  { name: '720p',  width: 1280, height: 720,  videoBitrate: 2500, audioBitrate: 128 },
  { name: '1080p', width: 1920, height: 1080, videoBitrate: 5000, audioBitrate: 160 },
];

/**
 * Probe a media file for stream info using ffprobe.
 * Returns { width, height, duration, hasVideo, hasAudio }.
 */
export function probeMedia(filePath) {
  const output = execFileSync(
    'ffprobe',
    [
      '-v', 'error',
      '-select_streams', 'v:0',
      '-show_entries', 'stream=width,height',
      '-show_entries', 'format=duration',
      '-of', 'csv=p=0',
      filePath,
    ],
    { encoding: 'utf-8', maxBuffer: 10 * 1024 * 1024 }
  ).trim();

  let width = 0, height = 0, duration = 0;
  const lines = output.split('\n').filter(Boolean);

  for (const line of lines) {
    const parts = line.split(',');
    if (parts.length >= 3) {
      width = parseInt(parts[0], 10) || 0;
      height = parseInt(parts[1], 10) || 0;
      duration = parseFloat(parts[2]) || 0;
    } else if (parts.length === 1 && parts[0]) {
      duration = parseFloat(parts[0]) || 0;
    }
  }

  const streamsOutput = execFileSync(
    'ffprobe',
    [
      '-v', 'error',
      '-select_streams', 'v',
      '-show_entries', 'stream=codec_type',
      '-of', 'csv=p=0',
      filePath,
    ],
    { encoding: 'utf-8', maxBuffer: 10 * 1024 * 1024 }
  ).trim();
  const hasVideo = streamsOutput.includes('video');

  const audioOutput = execFileSync(
    'ffprobe',
    [
      '-v', 'error',
      '-select_streams', 'a',
      '-show_entries', 'stream=codec_type',
      '-of', 'csv=p=0',
      filePath,
    ],
    { encoding: 'utf-8', maxBuffer: 10 * 1024 * 1024 }
  ).trim();
  const hasAudio = audioOutput.includes('audio');

  return { width, height, duration, hasVideo, hasAudio };
}

/**
 * Generate a poster thumbnail from the video at the 5-second mark.
 */
export function generateThumbnail(filePath, videoId) {
  const thumbPath = join(THUMB_DIR, `${videoId}.jpg`);

  try {
    execFileSync(
      'ffmpeg',
      [
        '-y', '-i', filePath,
        '-ss', '00:00:05',
        '-frames:v', '1',
        '-q:v', '2',
        '-vf', 'scale=480:-1',
        thumbPath,
      ],
      { encoding: 'utf-8', maxBuffer: 10 * 1024 * 1024 }
    );
  } catch (_err) {
    // Fallback: try first frame
    try {
      execFileSync(
        'ffmpeg',
        [
          '-y', '-i', filePath,
          '-ss', '00:00:01',
          '-frames:v', '1',
          '-q:v', '2',
          '-vf', 'scale=480:-1',
          thumbPath,
        ],
        { encoding: 'utf-8', maxBuffer: 10 * 1024 * 1024 }
      );
    } catch (_err2) {
      // Thumbnail generation failed
    }
  }

  return existsSync(thumbPath) ? `/thumbs/${videoId}.jpg` : null;
}

/**
 * Transcode a video file into multiple HLS renditions.
 *
 * Returns:
 *   {
 *     hlsUrl: '/hls/<video_id>/index.m3u8',
 *     qualities: [...],
 *     thumbnailUrl: '/thumbs/<video_id>.jpg' | null,
 *     duration: number,
 *     width: number,
 *     height: number,
 *     hasVideo: boolean,
 *     hasAudio: boolean,
 *   }
 */
export function transcodeVideo(filePath, videoId) {
  const { width, height, duration, hasVideo, hasAudio } = probeMedia(filePath);

  // Determine which renditions to generate (don't upscale beyond source)
  const sourceHeight = height || 720;
  const applicableRenditions = RENDITIONS.filter(r => r.height <= sourceHeight);
  if (applicableRenditions.length === 0) {
    applicableRenditions.push(RENDITIONS[0]); // Always include at least 360p
  }

  const outputDir = join(HLS_DIR, videoId);
  mkdirSync(outputDir, { recursive: true });

  const variantLines = ['#EXTM3U'];
  const qualities = [];

  for (const rendition of applicableRenditions) {
    const renditionDir = join(outputDir, rendition.name);
    mkdirSync(renditionDir, { recursive: true });

    const playlistPath = join(renditionDir, 'index.m3u8');
    const segmentPattern = join(renditionDir, 'segment_%03d.ts');

    const ffmpegArgs = [
      '-y',
      '-i', filePath,
      '-map', '0:v:0',
      ...(hasAudio ? ['-map', '0:a:0'] : []),
      '-c:v', 'libx264',
      '-profile:v', 'main',
      '-level', '3.1',
      '-preset', 'fast',
      '-crf', '23',
      '-vf', `scale=w=${rendition.width}:h=${rendition.height}:force_original_aspect_ratio=decrease,pad=${rendition.width}:${rendition.height}:(ow-iw)/2:(oh-ih)/2`,
      '-b:v', `${rendition.videoBitrate}k`,
      '-maxrate', `${rendition.videoBitrate}k`,
      '-bufsize', `${rendition.videoBitrate * 2}k`,
      '-c:a', 'aac',
      '-b:a', `${rendition.audioBitrate}k`,
      '-ac', '2',
      '-ar', '48000',
      '-f', 'hls',
      '-hls_time', '6',
      '-hls_playlist_type', 'vod',
      '-hls_segment_filename', join(renditionDir, 'segment_%03d.ts'),
      playlistPath,
    ];

    execFileSync('ffmpeg', ffmpegArgs, { encoding: 'utf-8', maxBuffer: 100 * 1024 * 1024 });

    // Build variant playlist line
    const resolution = `${rendition.width}x${rendition.height}`;
    const bandwidth = (rendition.videoBitrate + rendition.audioBitrate) * 1000;
    variantLines.push(
      `#EXT-X-STREAM-INF:BANDWIDTH=${bandwidth},RESOLUTION=${resolution},CODECS="avc1.42001e,mp4a.40.2"` +
      (hasAudio ? '' : ',VIDEO-ONLY')
    );
    variantLines.push(`${rendition.name}/index.m3u8`);

    qualities.push({
      name: rendition.name,
      url: `/hls/${videoId}/${rendition.name}/index.m3u8`,
      height: rendition.height,
      width: rendition.width,
      bitrate: rendition.videoBitrate,
    });
  }

  // Write master playlist
  const masterPlaylistPath = join(outputDir, 'index.m3u8');
  const masterPlaylist = variantLines.join('\n') + '\n';
  writeFileSync(masterPlaylistPath, masterPlaylist, 'utf-8');

  // Generate thumbnail
  const thumbnailUrl = generateThumbnail(filePath, videoId);

  return {
    hlsUrl: `/hls/${videoId}/index.m3u8`,
    qualities,
    thumbnailUrl,
    duration: Math.round(duration || 0),
    width,
    height,
    hasVideo,
    hasAudio,
  };
}

/**
 * Clean up all transcoded files for a video (HLS + thumbnail).
 */
export function cleanupVideo(videoId) {
  const outputDir = join(HLS_DIR, videoId);
  if (existsSync(outputDir)) {
    rmSync(outputDir, { recursive: true, force: true });
  }
  const thumbPath = join(THUMB_DIR, `${videoId}.jpg`);
  if (existsSync(thumbPath)) {
    unlinkSync(thumbPath);
  }
}

export { HLS_DIR, THUMB_DIR, UPLOAD_DIR };
