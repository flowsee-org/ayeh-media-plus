/* Simple topic-affinity personalization for the Explore feed.
   Signals: likes (+3) and dwell time on a post detail page (+1 per 10s, max +5).
   Affinity scores are stored locally per topic tag. */

const KEY = "tadabbur-topic-affinity";
const CAP = 100;

export function getAffinities() {
  try {
    return JSON.parse(localStorage.getItem(KEY)) || {};
  } catch {
    return {};
  }
}

export function recordEngagement(tags, weight = 1) {
  const list = (tags || []).filter(Boolean);
  if (!list.length) return;
  const aff = getAffinities();
  list.forEach((t) => {
    aff[t] = Math.min(CAP, (aff[t] || 0) + weight);
  });
  localStorage.setItem(KEY, JSON.stringify(aff));
}

export function scoreTags(tags) {
  const aff = getAffinities();
  return (tags || []).reduce((sum, t) => sum + (aff[t] || 0), 0);
}

export function hasAffinityData() {
  return Object.keys(getAffinities()).length > 0;
}