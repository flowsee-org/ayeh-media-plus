/* ═══════════════════════════════════════════════════════════
   Instagram-style Explore Engine
   ───────────────────────────────────────────────────────────
   Signals tracked:
   1. Topic affinity — likes (+3), dwell time (+1/10s, max 5)
   2. Author affinity — likes (+2), views (+1)
   3. Content-type affinity — from engagement per type
   4. Session signals — real-time mood from last 2h activity
   5. Saved posts — strong interest signal (+5)
   6. Time-of-day mood — morning/evening content preferences
   7. Post quality — overall likes/comments as quality proxy
   8. Recency — newer posts get slight boost
   9. Diversity — penalty for same author/topic clustering
   10. Daily rotation — deterministic per-day shuffling
   ═══════════════════════════════════════════════════════════ */
import { getAffinities, recordEngagement } from "@/lib/personalization";
import { getSavedPosts } from "@/lib/readingTracker";

const DAY = 86400000;
const HOUR = 3600000;
const SESSION_WINDOW = 2 * HOUR; // last 2h = "current mood"

const SESSION_KEY = "tadabbur-explore-session";
const DWELL_KEY = "tadabbur-dwell-log";

/* ── Tags of a post (fallback to type if no tags) ── */
const tagsOf = (p) => {
  const t = p?.tags || [];
  return t.length ? t : [p?.type].filter(Boolean);
};

/* ── Deterministic hash for daily rotation ── */
const hashCode = (str) => {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) | 0;
  return Math.abs(h);
};

/* ═══════════════════════════════════════════════════════════
   SESSION TRACKING — real-time "mood" detection
   ═══════════════════════════════════════════════════════════ */

/** Record a session engagement signal (like, view, save, dwell) */
export function trackSessionSignal(signal) {
  const { type, tags = [], author = null, postType = null, weight = 1 } = signal;
  try {
    const session = getSession();
    const entry = { type, tags, author, postType, weight, ts: Date.now() };
    session.push(entry);
    // Keep only signals within the session window
    const cutoff = Date.now() - SESSION_WINDOW;
    const filtered = session.filter((e) => e.ts > cutoff);
    localStorage.setItem(SESSION_KEY, JSON.stringify(filtered));
  } catch {}
}

/** Get all session signals (last 2h) */
export function getSession() {
  try {
    const raw = JSON.parse(localStorage.getItem(SESSION_KEY) || "[]");
    const cutoff = Date.now() - SESSION_WINDOW;
    return raw.filter((e) => e.ts > cutoff);
  } catch {
    return [];
  }
}

/** Clear session (on explicit refresh / new day) */
export function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}

/* ═══════════════════════════════════════════════════════════
   DWELL TIME TRACKING — how long the user looks at each post
   ═══════════════════════════════════════════════════════════ */

/** Record dwell time on a post (called periodically while viewing) */
export function recordDwell(postId, tags, author, ms) {
  if (!postId || ms < 1000) return;
  const weight = Math.min(Math.floor(ms / 10000), 5); // +1 per 10s, max 5
  if (weight > 0) {
    trackSessionSignal({ type: "dwell", tags, author, postType: null, weight });
    recordEngagement(tags, weight); // also feed topic affinity
  }
}

/* ═══════════════════════════════════════════════════════════
   MOOD DETECTION — infer user's current state
   ═══════════════════════════════════════════════════════════ */

const MOODS = {
  spiritual: { label: "آرامش روحی", icon: "Sparkles", topics: ["تلاوت", "ذکر", "دعا"], postTypes: ["verse_share", "reflection"] },
  learning: { label: "یادگیری", icon: "BookOpen", topics: ["تفسیر", "علوم قرآنی", "مفاهیم"], postTypes: ["verse_share", "reflection"] },
  reflective: { label: "تدبّر", icon: "Compass", topics: ["تدبّر", "تفکر", "اندیشه"], postTypes: ["reflection", "question"] },
  curious: { label: "پرسشگر", icon: "HelpCircle", topics: ["سوال", "پرسش"], postTypes: ["question"] },
  visual: { label: "هنری", icon: "Image", topics: ["خوشنویسی", "هنر", "تصویر"], postTypes: ["image", "video"] },
  social: { label: "اجتماعی", icon: "Users", topics: ["جامعه", "اخلاق", "روابط"], postTypes: ["reflection", "verse_share"] },
};

/** Detect the user's current mood from session signals + time of day */
export function detectMood() {
  const session = getSession();
  const hour = new Date().getHours();

  // Build tag frequency from session signals
  const tagFreq = {};
  const typeFreq = {};
  session.forEach((e) => {
    (e.tags || []).forEach((t) => { tagFreq[t] = (tagFreq[t] || 0) + e.weight; });
    if (e.postType) typeFreq[e.postType] = (typeFreq[e.postType] || 0) + e.weight;
  });

  // Score each mood
  const moodScores = {};
  Object.entries(MOODS).forEach(([id, mood]) => {
    let score = 0;
    mood.topics.forEach((t) => { score += (tagFreq[t] || 0) * 3; });
    mood.postTypes.forEach((t) => { score += (typeFreq[t] || 0) * 2; });

    // Time-of-day preferences
    if (id === "reflective" && (hour >= 20 || hour < 5)) score += 3; // evening/night → reflection
    if (id === "spiritual" && (hour >= 4 && hour < 8)) score += 3; // dawn → spiritual
    if (id === "learning" && (hour >= 8 && hour < 12)) score += 2; // morning → learning
    if (id === "curious" && (hour >= 14 && hour < 17)) score += 2; // afternoon → curious

    moodScores[id] = score;
  });

  // Find top mood
  const sorted = Object.entries(moodScores).sort((a, b) => b[1] - a[1]);
  const topId = sorted[0][0];
  const topScore = sorted[0][1];

  // If no session data, pick a mood based on time of day
  if (topScore === 0) {
    if (hour >= 4 && hour < 8) return { id: "spiritual", ...MOODS.spiritual, reason: "سحرگاهان — زمان آرامش روح" };
    if (hour >= 8 && hour < 12) return { id: "learning", ...MOODS.learning, reason: "صبح — زمان یادگیری" };
    if (hour >= 12 && hour < 17) return { id: "curious", ...MOODS.curious, reason: "بعدازظهر — زمان پرسش" };
    if (hour >= 17 && hour < 20) return { id: "social", ...MOODS.social, reason: "غروب — زمان اجتماع" };
    return { id: "reflective", ...MOODS.reflective, reason: "شب — زمان تدبّر" };
  }

  return { id: topId, ...MOODS[topId], reason: "بر اساس فعالیت اخیر شما" };
}

/* ═══════════════════════════════════════════════════════════
   USER PROFILE — multi-dimensional interest profile
   ═══════════════════════════════════════════════════════════ */

/** Build a comprehensive user profile from all signals */
export function buildExploreProfile() {
  const topicAffinity = getAffinities(); // {tag: score}
  const session = getSession();
  const savedPosts = getSavedPosts();

  // Session-based tag frequency (real-time mood)
  const sessionTags = {};
  const sessionAuthors = {};
  const sessionTypes = {};
  session.forEach((e) => {
    (e.tags || []).forEach((t) => { sessionTags[t] = (sessionTags[t] || 0) + e.weight; });
    if (e.author) sessionAuthors[e.author] = (sessionAuthors[e.author] || 0) + e.weight;
    if (e.postType) sessionTypes[e.postType] = (sessionTypes[e.postType] || 0) + e.weight;
  });

  return {
    topicAffinity,
    sessionTags,
    sessionAuthors,
    sessionTypes,
    savedPosts: new Set(savedPosts),
    hasData: Object.keys(topicAffinity).length > 0 || session.length > 0,
  };
}

/* ═══════════════════════════════════════════════════════════
   POST SCORING — Instagram-style relevance score
   ═══════════════════════════════════════════════════════════ */

/**
 * Score a single post against the user profile.
 * Returns { score, reasons: string[] }
 */
export function scorePost(post, profile, mood) {
  const tags = tagsOf(post);
  let score = 0;
  const reasons = [];

  // 1. Topic affinity (long-term interest)
  const topicMatch = tags.filter((t) => (profile.topicAffinity[t] || 0) > 0);
  if (topicMatch.length) {
    const topicScore = topicMatch.reduce((s, t) => s + profile.topicAffinity[t], 0) * 2 + 5;
    score += topicScore;
    const best = topicMatch.sort((a, b) => profile.topicAffinity[b] - profile.topicAffinity[a])[0];
    reasons.push(`علاقه به «${best}»`);
  }

  // 2. Session-based match (current mood — highest weight)
  const sessionMatch = tags.filter((t) => (profile.sessionTags[t] || 0) > 0);
  if (sessionMatch.length) {
    const sessionScore = sessionMatch.reduce((s, t) => s + profile.sessionTags[t], 0) * 4 + 8;
    score += sessionScore;
    reasons.push("مطابق حال امروز شما");
  }

  // 3. Author affinity (from session)
  if (post.author_name && profile.sessionAuthors[post.author_name]) {
    score += profile.sessionAuthors[post.author_name] * 3 + 4;
    reasons.push(`از ${post.author_name}`);
  }

  // 4. Content-type affinity (from session)
  if (post.type && profile.sessionTypes[post.type]) {
    score += profile.sessionTypes[post.type] * 2;
  }

  // 5. Mood-based topic matching
  if (mood) {
    const moodMatch = tags.filter((t) => mood.topics.includes(t));
    if (moodMatch.length) {
      score += 6;
      if (!reasons.length) reasons.push(`برای حالِ «${mood.label}»`);
    }
    const moodTypeMatch = mood.postTypes.includes(post.type);
    if (moodTypeMatch) score += 3;
  }

  // 6. Saved post → very strong signal, but don't re-show
  if (profile.savedPosts.has(post.id)) {
    score -= 30; // already saved, show less
  }

  // 7. Post quality (overall engagement as quality proxy)
  const quality = (post.likes_count || 0) * 0.3 + (post.comments_count || 0) * 0.5;
  score += Math.min(quality, 10);

  // 8. Recency boost
  const ageDays = (Date.now() - new Date(post.created_date || Date.now()).getTime()) / DAY;
  if (ageDays < 1) score += 5;
  else if (ageDays < 3) score += 3;
  else if (ageDays < 7) score += 1;
  else if (ageDays > 30) score -= 3;

  // 9. Content richness — posts with verse references are higher value
  if (post.verse_key) score += 2;
  if (post.tags?.length >= 2) score += 1;

  // 10. Deterministic daily rotation
  const day = Math.floor(Date.now() / DAY);
  score += (hashCode((post.id || "") + ":" + day) % 30) / 10;

  return { score, reasons: reasons.slice(0, 2) };
}

/* ═══════════════════════════════════════════════════════════
   RANK — sort posts with diversity constraints
   ═══════════════════════════════════════════════════════════ */

/**
 * Rank posts for Explore feed.
 * - Scores each post
 * - Applies diversity penalties (max 2 consecutive same author/topic)
 * - Mixes exploration (10% random new topics)
 * Returns sorted array of { post, score, reasons }
 */
export function rankExplore(posts, count = 60) {
  const profile = buildExploreProfile();
  const mood = detectMood();

  if (!posts.length) return { ranked: [], profile, mood };

  // Score all posts
  const scored = posts.map((post) => {
    const { score, reasons } = scorePost(post, profile, mood);
    return { post, score, reasons, _tags: tagsOf(post), _author: post.author_name };
  });

  // Sort by score descending
  scored.sort((a, b) => b.score - a.score);

  // Apply diversity: no more than 2 consecutive posts from same author or same primary topic
  const result = [];
  let lastAuthor = null;
  let authorStreak = 0;
  let lastTopic = null;
  let topicStreak = 0;
  const used = new Set();

  // First pass: pick top-scored with diversity constraints
  for (const item of scored) {
    if (used.has(item.post.id)) continue;

    // Diversity check
    if (item._author === lastAuthor && authorStreak >= 2) continue;
    const primaryTopic = item._tags[0];
    if (primaryTopic === lastTopic && topicStreak >= 3) continue;

    result.push(item);
    used.add(item.post.id);

    if (item._author === lastAuthor) authorStreak++;
    else { lastAuthor = item._author; authorStreak = 1; }

    if (primaryTopic === lastTopic) topicStreak++;
    else { lastTopic = primaryTopic; topicStreak = 1; }

    if (result.length >= count) break;
  }

  // Second pass: fill remaining slots (if we ran out due to diversity constraints)
  if (result.length < count) {
    for (const item of scored) {
      if (used.has(item.post.id)) continue;
      result.push(item);
      used.add(item.post.id);
      if (result.length >= count) break;
    }
  }

  // Exploration: replace last 10% with random unscored posts (discovery)
  const exploreCount = Math.floor(result.length * 0.1);
  if (exploreCount > 0) {
    const unranked = posts
      .filter((p) => !used.has(p.id))
      .sort(() => Math.random() - 0.5)
      .slice(0, exploreCount);
    unranked.forEach((post) => {
      result.splice(
        Math.floor(Math.random() * result.length),
        0,
        { post, score: 0, reasons: ["کاوش جدید"], _tags: tagsOf(post), _author: post.author_name }
      );
    });
  }

  return { ranked: result, profile, mood };
}

/* ═══════════════════════════════════════════════════════════
   PROFILE SUMMARY — human-readable explanation
   ═══════════════════════════════════════════════════════════ */

export function getExploreSummary(profile, mood) {
  if (!profile.hasData) {
    return mood?.reason
      ? `${mood.reason} — با فعالیت بیشتر شخصی‌سازی می‌شود`
      : "کاوش عمومی — با فعالیت بیشتر شخصی‌سازی می‌شود";
  }
  const parts = [];
  const topicCount = Object.keys(profile.topicAffinity).length;
  if (topicCount) parts.push(`${topicCount.toLocaleString("fa-IR")} موضوع مورد علاقه`);
  if (Object.keys(profile.sessionTags).length) parts.push("حال امروز شما");
  if (profile.savedPosts.size) parts.push(`${profile.savedPosts.size.toLocaleString("fa-IR")} پست ذخیره‌شده`);
  return `بر اساس ${parts.join(" و ")}`;
}