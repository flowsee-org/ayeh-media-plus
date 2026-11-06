/* ═══════════════════════════════════════════════════════════
   Curated Content System
   ───────────────────────────────────────────────────────────
   Pre-generates "explore cards" from all content sources
   (Verses, Collections, Posts) and matches them to the
   user's inferred interest profile — like Instagram Explore.

   Content sources → unified explore cards → profile-matched feed
   ═══════════════════════════════════════════════════════════ */
import { buildInferredProfile, getTopInterests } from "@/lib/interestInference";
import { detectMood } from "@/lib/exploreEngine";

const DAY = 86400000;

const hashCode = (str) => {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) | 0;
  return Math.abs(h);
};

/* ═══════════════════════════════════════════════════════════
   CARD BUILDERS — convert each content type to unified explore cards
   ═══════════════════════════════════════════════════════════ */

function verseToCard(v) {
  const tags = v.tags || [];
  return {
    id: `verse:${v.id}`,
    type: "verse",
    source: "verse",
    title: v.surah_name_english || `سوره ${v.surah_number}`,
    subtitle: v.verse_key,
    content: v.translation || "",
    arabic: v.arabic || "",
    verse_key: v.verse_key,
    image_url: v.images?.[0] || null,
    tags,
    topics: tags,
    author_name: "آیات قرآن",
    author_avatar: null,
    likes_count: 0,
    comments_count: 0,
    quality: [v.classical_tafsir, v.tadabbur, v.modern_tafsir].filter(Boolean).length,
    created_date: v.created_date,
    route: `/verse/${v.surah_number}/${v.verse_number}`,
    _isCurated: true,
  };
}

function collectionToCard(c) {
  const tags = c.related_topics || [];
  return {
    id: `collection:${c.id}`,
    type: "collection",
    source: "collection",
    title: c.name,
    subtitle: `${c.verse_count || 0} آیه`,
    content: c.description || "",
    arabic: "",
    image_url: null,
    tags,
    topics: tags,
    author_name: "مجموعه‌ها",
    author_avatar: null,
    likes_count: 0,
    comments_count: 0,
    quality: c.is_featured ? 5 : 2,
    created_date: c.created_date,
    route: `/collections/${c.id}`,
    _isCurated: true,
  };
}

function postToCard(p) {
  const tags = p.tags || (p.type ? [p.type] : []);
  return {
    id: `post:${p.id}`,
    type: "post",
    source: "post",
    title: p.video_title || "",
    subtitle: "",
    content: p.content || "",
    arabic: p.verse_arabic || "",
    verse_key: p.verse_key,
    image_url: p.image_url || p.video_url,
    tags,
    topics: tags,
    author_name: p.author_name,
    author_avatar: p.author_avatar,
    likes_count: p.likes_count || 0,
    comments_count: p.comments_count || 0,
    quality: 0,
    created_date: p.created_date,
    route: `/community/${p.id}`,
    _isCurated: false,
  };
}

/* ═══════════════════════════════════════════════════════════
   BUILD CARDS — convert all content sources to explore cards
   ═══════════════════════════════════════════════════════════ */

export function buildCuratedCards(verses = [], collections = [], posts = []) {
  const verseCards = verses
    .filter((v) => v.arabic || v.translation)
    .map(verseToCard);

  const collectionCards = collections
    .filter((c) => c.name)
    .map(collectionToCard);

  const postCards = posts
    .filter((p) => p.content || p.image_url)
    .map(postToCard);

  return [...verseCards, ...collectionCards, ...postCards];
}

/* ═══════════════════════════════════════════════════════════
   SCORE CARD — match a card against the user profile
   ═══════════════════════════════════════════════════════════ */

function scoreCard(card, profile, mood) {
  let score = 0;
  const reasons = [];

  // 1. Topic match — highest weight (inferred interests)
  const topicMatch = (card.topics || []).filter((t) => (profile.topicScores[t] || 0) > 0);
  if (topicMatch.length) {
    const topicScore = topicMatch.reduce((s, t) => s + profile.topicScores[t], 0) * 2 + 5;
    score += topicScore;
    const best = topicMatch.sort((a, b) => profile.topicScores[b] - profile.topicScores[a])[0];
    reasons.push(`علاقه به «${best}»`);
  }

  // 2. Session-based match (current mood — real-time)
  const sessionMatch = (card.topics || []).filter((t) => (profile.sessionTags[t] || 0) > 0);
  if (sessionMatch.length) {
    score += sessionMatch.reduce((s, t) => s + profile.sessionTags[t], 0) * 4 + 8;
    reasons.push("مطابق حال امروز شما");
  }

  // 3. Author affinity
  if (card.author_name && profile.sessionAuthors[card.author_name]) {
    score += profile.sessionAuthors[card.author_name] * 3 + 4;
    reasons.push(`از ${card.author_name}`);
  }

  // 4. Mood-based topic matching
  if (mood) {
    const moodMatch = (card.topics || []).filter((t) => mood.topics.includes(t));
    if (moodMatch.length) {
      score += 6;
      if (!reasons.length) reasons.push(`برای حالِ «${mood.label}»`);
    }
  }

  // 5. Content quality — curated verses with tafsir/tadabbur are higher value
  if (card.quality) {
    score += Math.min(card.quality * 2, 10);
  }

  // 6. Post engagement (quality proxy for user posts)
  if (card.likes_count || card.comments_count) {
    score += Math.min((card.likes_count || 0) * 0.3 + (card.comments_count || 0) * 0.5, 10);
  }

  // 7. Recency boost
  const ageDays = (Date.now() - new Date(card.created_date || Date.now()).getTime()) / DAY;
  if (ageDays < 1) score += 5;
  else if (ageDays < 3) score += 3;
  else if (ageDays < 7) score += 1;

  // 8. Curated content (verses/collections) gets a baseline boost
  if (card._isCurated) score += 3;

  // 9. Verse reference bonus
  if (card.verse_key) score += 2;

  // 10. Already saved → rank down (don't repeat)
  if (card.source === "verse" && profile.bookmarkSet.has(card.verse_key)) score -= 30;
  if (card.source === "post" && profile.savedPosts.has(card.id.replace("post:", ""))) score -= 30;
  if (card.source === "verse" && profile.readKeys.has(card.verse_key)) score -= 10;

  // 11. Daily rotation — deterministic per-day shuffling
  const day = Math.floor(Date.now() / DAY);
  score += (hashCode((card.id || "") + ":" + day) % 30) / 10;

  return { score, reasons: reasons.slice(0, 2) };
}

/* ═══════════════════════════════════════════════════════════
   RANK — sort cards with diversity constraints
   ═══════════════════════════════════════════════════════════ */

export function rankCuratedFeed(cards, profile, mood, count = 60) {
  if (!cards.length) return { ranked: [], profile, mood, topInterests: [] };

  // Score all cards
  const scored = cards.map((card) => {
    const { score, reasons } = scoreCard(card, profile, mood);
    return { post: card, score, reasons, _tags: card.topics || [], _author: card.author_name };
  });

  scored.sort((a, b) => b.score - a.score);

  // Diversity: no more than 2 consecutive same author or same primary topic
  const result = [];
  let lastAuthor = null;
  let authorStreak = 0;
  let lastTopic = null;
  let topicStreak = 0;
  const used = new Set();

  for (const item of scored) {
    if (used.has(item.post.id)) continue;
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

  // Fill remaining slots
  if (result.length < count) {
    for (const item of scored) {
      if (used.has(item.post.id)) continue;
      result.push(item);
      used.add(item.post.id);
      if (result.length >= count) break;
    }
  }

  // Exploration: 10% random discovery
  const exploreCount = Math.floor(result.length * 0.1);
  if (exploreCount > 0) {
    const unranked = cards
      .filter((c) => !used.has(c.id))
      .sort(() => Math.random() - 0.5)
      .slice(0, exploreCount);
    unranked.forEach((card) => {
      result.splice(
        Math.floor(Math.random() * result.length),
        0,
        { post: card, score: 0, reasons: ["کاوش جدید"], _tags: card.topics || [], _author: card.author_name }
      );
    });
  }

  const topInterests = getTopInterests(profile, 5);
  return { ranked: result, profile, mood, topInterests };
}

/* ═══════════════════════════════════════════════════════════
   MAIN ENTRY — get curated feed for the user
   ═══════════════════════════════════════════════════════════ */

export function getCuratedFeed(verses = [], collections = [], posts = [], count = 60) {
  // Build verse tag map for inference (verse_key → tags)
  const verseTagMap = {};
  verses.forEach((v) => {
    if (v.verse_key && v.tags) verseTagMap[v.verse_key] = v.tags;
  });

  const profile = buildInferredProfile(verseTagMap);
  const mood = detectMood();
  const cards = buildCuratedCards(verses, collections, posts);

  return rankCuratedFeed(cards, profile, mood, count);
}