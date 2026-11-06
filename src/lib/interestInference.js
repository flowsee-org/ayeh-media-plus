/* ═══════════════════════════════════════════════════════════
   Interest Inference Engine
   ───────────────────────────────────────────────────────────
   Infers hidden interests from ALL in-app signals:
   1. Topic affinity (likes + dwell) — from personalization.js
   2. Reading history → infer topics from verse tags
   3. Bookmarks → strong topic signal
   4. Saved posts → strong topic signal
   5. Search history → explicit interest signal
   6. Session signals — real-time mood (last 2h)
   7. Collections saved — theme-based interest
   8. Surah frequency — familiarity signal
   ═══════════════════════════════════════════════════════════ */
import { getAffinities } from "@/lib/personalization";
import { getReadVerses, getBookmarks, getSavedPosts } from "@/lib/readingTracker";
import { getSession } from "@/lib/exploreEngine";

const DAY = 86400000;
const SEARCH_KEY = "tadabbur-search-history";
const MAX_SEARCH = 50;

/* ── Search tracking ── */

export function trackSearch(query) {
  const q = (query || "").trim();
  if (q.length < 2) return;
  try {
    const history = getSearchHistory();
    // Deduplicate + move to front
    const filtered = history.filter((h) => h.query !== q);
    filtered.unshift({ query: q, ts: Date.now() });
    localStorage.setItem(SEARCH_KEY, JSON.stringify(filtered.slice(0, MAX_SEARCH)));
  } catch {}
}

export function getSearchHistory() {
  try {
    return JSON.parse(localStorage.getItem(SEARCH_KEY) || "[]");
  } catch {
    return [];
  }
}

/* ═══════════════════════════════════════════════════════════
   COMPREHENSIVE PROFILE — all signals combined
   ═══════════════════════════════════════════════════════════ */

/**
 * Build a comprehensive interest profile from all signals.
 * @param {Object} verseTagMap — { verse_key: [tags] } for inferring topics from reading history
 * @returns {Object} profile with topicScores, surahFreq, searchTerms, sessionTags, etc.
 */
export function buildInferredProfile(verseTagMap = {}) {
  const topicAffinity = getAffinities(); // {tag: score} from likes/dwell
  const readData = getReadVerses();
  const bookmarks = getBookmarks();
  const savedPosts = getSavedPosts();
  const searchHistory = getSearchHistory();
  const session = getSession();

  // ── Topic scores: combine all signals into one weighted map ──
  const topicScores = {};

  // 1. Explicit topic affinity (likes +3, dwell +1/10s) — highest confidence
  Object.entries(topicAffinity).forEach(([tag, score]) => {
    topicScores[tag] = (topicScores[tag] || 0) + score * 1.5;
  });

  // 2. Reading history → infer topics from verse tags
  const readKeys = Object.keys(readData);
  readKeys.forEach((key) => {
    const age = (Date.now() - (readData[key]?.ts || 0)) / DAY;
    const recencyWeight = age <= 7 ? 2 : age <= 30 ? 1.5 : 1;
    const tags = verseTagMap[key] || [];
    tags.forEach((t) => {
      topicScores[t] = (topicScores[t] || 0) + 2 * recencyWeight;
    });
  });

  // 3. Bookmarks → very strong topic signal (user explicitly saved)
  bookmarks.forEach((key) => {
    const tags = verseTagMap[key] || [];
    tags.forEach((t) => {
      topicScores[t] = (topicScores[t] || 0) + 4;
    });
  });

  // 4. Search history → explicit interest signal
  searchHistory.forEach((s) => {
    const age = (Date.now() - (s.ts || 0)) / DAY;
    const recencyWeight = age <= 7 ? 3 : age <= 30 ? 2 : 1;
    // Search queries are themselves topic signals
    topicScores[s.query] = (topicScores[s.query] || 0) + 3 * recencyWeight;
  });

  // 5. Session signals (real-time mood, last 2h)
  const sessionTags = {};
  const sessionAuthors = {};
  const sessionTypes = {};
  session.forEach((e) => {
    (e.tags || []).forEach((t) => {
      sessionTags[t] = (sessionTags[t] || 0) + e.weight;
      topicScores[t] = (topicScores[t] || 0) + e.weight;
    });
    if (e.author) sessionAuthors[e.author] = (sessionAuthors[e.author] || 0) + e.weight;
    if (e.postType) sessionTypes[e.postType] = (sessionTypes[e.postType] || 0) + e.weight;
  });

  // 6. Surah frequency — familiarity signal
  const surahFreq = {};
  readKeys.forEach((k) => {
    const s = k.split(":")[0];
    surahFreq[s] = (surahFreq[s] || 0) + 1;
  });
  bookmarks.forEach((k) => {
    const s = String(k).split(":")[0];
    surahFreq[s] = (surahFreq[s] || 0) + 2;
  });

  return {
    topicScores,
    sessionTags,
    sessionAuthors,
    sessionTypes,
    surahFreq,
    searchTerms: searchHistory.map((s) => s.query),
    savedPosts: new Set(savedPosts),
    readKeys: new Set(readKeys),
    bookmarkSet: new Set(bookmarks),
    hasData: Object.keys(topicScores).length > 0 || session.length > 0,
  };
}

/* ═══════════════════════════════════════════════════════════
   TOP INTERESTS — sorted by confidence
   ═══════════════════════════════════════════════════════════ */

export function getTopInterests(profile, limit = 5) {
  if (!profile?.topicScores) return [];
  return Object.entries(profile.topicScores)
    .filter(([, score]) => score > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([topic, score]) => ({ topic, score }));
}

/* ═══════════════════════════════════════════════════════════
   INFERENCE SUMMARY — human-readable explanation
   ═══════════════════════════════════════════════════════════ */

export function getInferenceSummary(profile) {
  if (!profile?.hasData) {
    return "محتوای منتخب روز — با فعالیت بیشتر شخصی‌سازی می‌شود";
  }
  const top = getTopInterests(profile, 3);
  const parts = [];
  if (top.length) {
    parts.push(`علاقه‌مندی: ${top.map((t) => t.topic).join("، ")}`);
  }
  if (profile.searchTerms.length) {
    parts.push(`${profile.searchTerms.length.toLocaleString("fa-IR")} جستجوی اخیر`);
  }
  if (profile.readKeys.size) {
    parts.push(`${profile.readKeys.size.toLocaleString("fa-IR")} آیه مطالعه‌شده`);
  }
  if (profile.bookmarkSet.size) {
    parts.push(`${profile.bookmarkSet.size.toLocaleString("fa-IR")} نشان`);
  }
  return parts.length ? `بر اساس ${parts.join(" و ")}` : "محتوای منتخب روز";
}