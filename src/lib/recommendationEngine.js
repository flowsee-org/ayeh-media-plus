/* ═══════════════════════════════════════════════════════════
   Intelligent recommendation engine
   Signals: reading history (recency-weighted), bookmarks,
   topic affinities (likes/dwell), in-surah continuation and
   bookmark similarity — with a deterministic daily rotation.
   ═══════════════════════════════════════════════════════════ */
import { getReadVerses, getBookmarks } from "@/lib/readingTracker";
import { getAffinities } from "@/lib/personalization";

const DAY = 86400000;

const hashCode = (str) => {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) | 0;
  return Math.abs(h);
};

const nextVerseKey = (vk) => {
  const [s, a] = String(vk).split(":").map(Number);
  if (!Number.isFinite(s) || !Number.isFinite(a)) return null;
  return `${s}:${a + 1}`;
};

const clampText = (t, max = 200) => {
  const s = (t || "").replace(/\s+/g, " ").trim();
  return s.length > max ? s.slice(0, max).trimEnd() + "…" : s;
};

/** Aggregated user profile from all local signals. */
export function buildProfile() {
  const readData = getReadVerses();
  const bookmarks = getBookmarks();

  const readKeys = Object.keys(readData);
  // Recency weight: verses read in the last 7 days count 2x, last 30 days 1.5x
  const readWeighted = {};
  readKeys.forEach((k) => {
    const age = (Date.now() - (readData[k]?.ts || 0)) / DAY;
    readWeighted[k] = age <= 7 ? 2 : age <= 30 ? 1.5 : 1;
  });

  // Surah frequency across read + bookmarked verses
  const surahFreq = {};
  readKeys.forEach((k) => {
    const s = k.split(":")[0];
    surahFreq[s] = (surahFreq[s] || 0) + 1;
  });
  bookmarks.forEach((k) => {
    const s = String(k).split(":")[0];
    surahFreq[s] = (surahFreq[s] || 0) + 2; // bookmarks weigh double
  });

  // Most recent read verse — drives "continue reading" suggestions
  const mostRecentKey =
    [...readKeys].sort((a, b) => (readData[b]?.ts || 0) - (readData[a]?.ts || 0))[0] || null;

  return {
    readData,
    readKeys: new Set(readKeys),
    bookmarkSet: new Set(bookmarks),
    bookmarks,
    affinities: getAffinities(),
    surahFreq,
    mostRecentKey,
    stats: {
      read: readKeys.length,
      bookmarks: bookmarks.length,
      topics: Object.keys(getAffinities()).length,
    },
  };
}

/** Scores the verse pool and returns the top picks with reasons. */
export function getRecommendations(pool, count = 3) {
  const profile = buildProfile();
  if (!pool.length) return { picks: [], profile };

  const byKey = new Map(pool.filter((v) => v.verse_key).map((v) => [v.verse_key, v]));
  const day = Math.floor(Date.now() / DAY);

  // Tags of bookmarked verses — similarity targets
  const bookmarkTags = {};
  profile.bookmarks.forEach((k) => {
    (byKey.get(k)?.tags || []).forEach((t) => {
      bookmarkTags[t] = (bookmarkTags[t] || 0) + 1;
    });
  });

  const nextAfterRecent = profile.mostRecentKey ? nextVerseKey(profile.mostRecentKey) : null;

  const scored = pool
    .filter((v) => v.verse_key && v.arabic)
    .map((v) => {
      const tags = v.tags || [];
      const surah = String(v.surah_number ?? String(v.verse_key).split(":")[0]);
      let score = 0;
      let reason = null;

      // 1. Continue right where the user left off
      if (nextAfterRecent && v.verse_key === nextAfterRecent && !profile.readKeys.has(v.verse_key)) {
        score += 18;
        reason = "ادامهٔ مسیر مطالعهٔ شما";
      }

      // 2. Topic affinity (likes/dwell signals)
      const matched = tags.filter((t) => profile.affinities[t] > 0);
      if (matched.length) {
        score += matched.reduce((s, t) => s + profile.affinities[t], 0) * 2 + 8;
        const best = matched.sort((a, b) => profile.affinities[b] - profile.affinities[a])[0];
        if (!reason) reason = `بر اساس علاقهٔ شما به «${best}»`;
      }

      // 3. Similarity to bookmarked verses (shared tags)
      const sharedWithBookmarks = tags.filter((t) => bookmarkTags[t]);
      if (sharedWithBookmarks.length) {
        score += sharedWithBookmarks.reduce((s, t) => s + bookmarkTags[t], 0) * 2;
        if (sharedWithBookmarks.length >= 2 && !reason) reason = "مشابه آیات نشان‌شدهٔ شما";
      }

      // 4. Surah familiarity (read/bookmarked surahs, capped)
      if (profile.surahFreq[surah] && !profile.readKeys.has(v.verse_key)) {
        score += Math.min(profile.surahFreq[surah] * 2, 10);
        if (!reason) reason = "در مسیر مطالعهٔ شما";
      }

      // 5. Content richness (verse with tafsir/reflections is a better pick)
      const hasTafsir = [v.classical_tafsir, v.modern_tafsir, v.tadabbur].some(Boolean);
      score += hasTafsir ? 4 : -6;
      if (v.reflections?.length) score += 2;

      // 6. Novelty: already studied/bookmarked verses rank down
      if (profile.bookmarkSet.has(v.verse_key)) score -= 60;
      if (profile.readKeys.has(v.verse_key)) score -= 20;

      // 7. Deterministic daily rotation — picks change day to day
      score += (hashCode(v.verse_key + ":" + day) % 40) / 10;

      return { verse: v, score, reason: reason || "انتخاب ویژه برای امروز" };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, count);

  const picks = scored.map(({ verse, reason }) => ({
    verse,
    reason,
    reflection: clampText(verse.tadabbur || verse.reflections?.[0]?.content),
  }));

  return { picks, profile };
}

/** Human-readable summary of what the recommendations are based on. */
export function getProfileSummary(profile) {
  const { read, bookmarks, topics } = profile.stats;
  if (!read && !bookmarks && !topics) return "بر اساس آیات منتخب امروز — با مطالعه بیشتر شخصی‌سازی می‌شود";
  const parts = [];
  if (read) parts.push(`${read.toLocaleString("fa-IR")} آیه مطالعه‌شده`);
  if (bookmarks) parts.push(`${bookmarks.toLocaleString("fa-IR")} نشان`);
  if (topics) parts.push("علایق شما");
  return `بر اساس ${parts.join(" و ")}`;
}

export { clampText };