/**
 * Ayeh Media Plus — Watch History
 *
 * LocalStorage-based watch history for videos. Tracks when a user watches
 * a video, how long they watched, and completion percentage.
 *
 * Structure:
 *   {
 *     "<video_id>": {
 *       video_id: string,
 *       title: string,
 *       thumbnail_url: string?,
 *       watched_at: number (timestamp),
 *       watch_seconds: number,
 *       completion_percentage: number,
 *       watch_count: number,
 *     }
 *   }
 */

const KEY = "ayeh-watch-history";
const MAX_ENTRIES = 100;

function load() {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(KEY)) || {};
  } catch {
    return {};
  }
}

function save(data) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(KEY, JSON.stringify(data));
  } catch {
    // Storage quota exceeded or private mode — silently ignore
  }
}

/**
 * Record (or update) a video watch entry.
 * Call this whenever the user starts watching a video, and periodically
 * as they progress (e.g. on timeupdate throttled to every 30s).
 */
export function recordWatch({
  video_id,
  title,
  thumbnail_url,
  watch_seconds = 0,
  completion_percentage = 0,
}) {
  if (!video_id) return;
  const data = load();
  const now = Date.now();
  const existing = data[video_id];

  const entry = {
    video_id,
    title: title || "",
    thumbnail_url: thumbnail_url || null,
    watched_at: now,
    watch_seconds: existing ? existing.watch_seconds + watch_seconds : watch_seconds,
    completion_percentage: Math.max(
      existing ? existing.completion_percentage : 0,
      completion_percentage
    ),
    watch_count: existing ? existing.watch_count + 1 : 1,
  };

  data[video_id] = entry;

  // Cap total entries — remove oldest
  const keys = Object.keys(data);
  if (keys.length > MAX_ENTRIES) {
    keys.sort((a, b) => data[a].watched_at - data[b].watched_at);
    const toRemove = keys.slice(0, keys.length - MAX_ENTRIES);
    toRemove.forEach((k) => delete data[k]);
  }

  save(data);
  return entry;
}

/**
 * Get all watch history entries, sorted by most recently watched first.
 */
export function getWatchHistory() {
  if (typeof window === "undefined") return [];
  const data = load();
  return Object.values(data).sort((a, b) => b.watched_at - a.watched_at);
}

/**
 * Get a single watch history entry by video ID.
 */
export function getWatchEntry(video_id) {
  if (!video_id) return null;
  const data = load();
  return data[video_id] || null;
}

/**
 * Remove a video from watch history.
 */
export function removeWatchEntry(video_id) {
  if (typeof window === "undefined") return;
  const data = load();
  delete data[video_id];
  save(data);
}

/**
 * Clear all watch history.
 */
export function clearWatchHistory() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(KEY);
}

/**
 * Get count of unique videos watched.
 */
export function getWatchCount() {
  return Object.keys(load()).length;
}

/**
 * Get total watch time in seconds.
 */
export function getTotalWatchTime() {
  const data = load();
  return Object.values(data).reduce((sum, e) => sum + (e.watch_seconds || 0), 0);
}
