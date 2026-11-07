import { SURAH_DATA, getSurahByNumber } from "@/lib/surahData";
import { JUZ_SURAH_RANGES } from "@/lib/juzData";
import { scopedKey, belongsToCurrentScope } from "@/lib/storageScope";

const STORAGE_KEY = "tadabbur-read-verses";
const BOOKMARKS_KEY = "tadabbur-bookmarks";
const NOTES_PREFIX = "tadabbur-notes-";
const SAVED_POSTS_KEY = "tadabbur-saved-posts";

export const TOTAL_QURAN_VERSES = 6236;

export function getReadVerses() {
  try {
    return JSON.parse(localStorage.getItem(scopedKey(STORAGE_KEY)) || "{}");
  } catch {
    return {};
  }
}

export function markVerseRead(verseKey, metadata = {}) {
  try {
    const data = getReadVerses();
    if (!data[verseKey]) {
      data[verseKey] = { ts: Date.now(), ...metadata };
      localStorage.setItem(scopedKey(STORAGE_KEY), JSON.stringify(data));
    }
  } catch {}
}

export function getReadCount() {
  return Object.keys(getReadVerses()).length;
}

export function getProgressPercent() {
  return Math.min((getReadCount() / TOTAL_QURAN_VERSES) * 100, 100);
}

export function getRecentVerses(limit = 10) {
  const data = getReadVerses();
  return Object.entries(data)
    .sort(([, a], [, b]) => b.ts - a.ts)
    .slice(0, limit)
    .map(([key, info]) => ({ key, ...info }));
}

/** Number of distinct surahs the user has opened at least one verse from. */
export function getUniqueSurahsRead() {
  const data = getReadVerses();
  const surahs = new Set();
  Object.keys(data).forEach((key) => {
    surahs.add(Number(key.split(":")[0]));
  });
  return surahs.size;
}

/** Number of surahs where every single verse has been marked as read. */
export function getCompletedSurahs() {
  const data = getReadVerses();
  const counts = {};
  Object.keys(data).forEach((key) => {
    const surah = Number(key.split(":")[0]);
    if (surah) counts[surah] = (counts[surah] || 0) + 1;
  });
  return SURAH_DATA.filter((s) => (counts[s.number] || 0) >= s.numberOfAyahs).length;
}

function inJuzRange(surah, ayah, start, end) {
  const afterStart = surah > start.surah || (surah === start.surah && ayah >= start.ayah);
  const beforeEnd = surah < end.surah || (surah === end.surah && ayah <= end.ayah);
  return afterStart && beforeEnd;
}

/** Number of juz where every verse in the juz range has been read. */
export function getJuzReadCount() {
  const readSet = new Set(Object.keys(getReadVerses()));
  let completed = 0;

  for (const juz of Object.keys(JUZ_SURAH_RANGES)) {
    const { start, end } = JUZ_SURAH_RANGES[juz];
    let total = 0;
    let read = 0;

    for (let surah = start.surah; surah <= end.surah; surah++) {
      const meta = getSurahByNumber(surah);
      if (!meta) continue;
      for (let ayah = 1; ayah <= meta.numberOfAyahs; ayah++) {
        if (!inJuzRange(surah, ayah, start, end)) continue;
        total += 1;
        if (readSet.has(`${surah}:${ayah}`)) read += 1;
      }
    }

    if (total > 0 && read >= total) completed += 1;
  }

  return completed;
}

export function getJuzVerseCounts() {
  const data = getReadVerses();
  const counts = {};
  Object.values(data).forEach((info) => {
    if (info.juz) counts[info.juz] = (counts[info.juz] || 0) + 1;
  });
  return counts;
}

export function getBookmarksCount() {
  return getBookmarks().length;
}

export function getBookmarks() {
  try {
    return JSON.parse(localStorage.getItem(scopedKey(BOOKMARKS_KEY)) || "[]");
  } catch {
    return [];
  }
}

export function removeBookmark(verseKey) {
  try {
    const updated = getBookmarks().filter((b) => b !== verseKey);
    localStorage.setItem(scopedKey(BOOKMARKS_KEY), JSON.stringify(updated));
    return updated;
  } catch {
    return getBookmarks();
  }
}

export function getNotesCount() {
  let count = 0;
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith(NOTES_PREFIX) && belongsToCurrentScope(key)) {
      const val = localStorage.getItem(key);
      if (val && val.trim().length > 0) count++;
    }
  }
  return count;
}

export function getSavedPosts() {
  try {
    return JSON.parse(localStorage.getItem(scopedKey(SAVED_POSTS_KEY)) || "[]");
  } catch {
    return [];
  }
}

export function toggleSavedPost(postId) {
  const saved = getSavedPosts();
  const isSaved = saved.includes(postId);
  const updated = isSaved ? saved.filter((id) => id !== postId) : [...saved, postId];
  try {
    localStorage.setItem(scopedKey(SAVED_POSTS_KEY), JSON.stringify(updated));
  } catch {}
  return !isSaved;
}
