const STORAGE_KEY = "tadabbur-read-verses";
export const TOTAL_QURAN_VERSES = 6236;

export function getReadVerses() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
  } catch {
    return {};
  }
}

export function markVerseRead(verseKey, metadata = {}) {
  try {
    const data = getReadVerses();
    if (!data[verseKey]) {
      data[verseKey] = { ts: Date.now(), ...metadata };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
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

export function getUniqueSurahsRead() {
  const data = getReadVerses();
  const surahs = new Set();
  Object.keys(data).forEach((key) => {
    surahs.add(Number(key.split(":")[0]));
  });
  return surahs.size;
}

export function getJuzReadCount() {
  const data = getReadVerses();
  const juzSet = new Set();
  Object.values(data).forEach((info) => {
    if (info.juz) juzSet.add(info.juz);
  });
  return juzSet.size;
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
  try {
    return JSON.parse(localStorage.getItem("tadabbur-bookmarks") || "[]").length;
  } catch {
    return 0;
  }
}

export function getBookmarks() {
  try {
    return JSON.parse(localStorage.getItem("tadabbur-bookmarks") || "[]");
  } catch {
    return [];
  }
}

export function removeBookmark(verseKey) {
  try {
    const updated = getBookmarks().filter((b) => b !== verseKey);
    localStorage.setItem("tadabbur-bookmarks", JSON.stringify(updated));
    return updated;
  } catch {
    return getBookmarks();
  }
}

export function getNotesCount() {
  let count = 0;
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith("tadabbur-notes-")) {
      const val = localStorage.getItem(key);
      if (val && val.trim().length > 0) count++;
    }
  }
  return count;
}

const SAVED_POSTS_KEY = "tadabbur-saved-posts";

export function getSavedPosts() {
  try {
    return JSON.parse(localStorage.getItem(SAVED_POSTS_KEY) || "[]");
  } catch {
    return [];
  }
}

export function toggleSavedPost(postId) {
  const saved = getSavedPosts();
  const isSaved = saved.includes(postId);
  const updated = isSaved ? saved.filter((id) => id !== postId) : [...saved, postId];
  try {
    localStorage.setItem(SAVED_POSTS_KEY, JSON.stringify(updated));
  } catch {}
  return !isSaved;
}