// Per-user localStorage scoping.
//
// Reading progress, bookmarks, notes and gamification used to live under
// shared, global keys — so every account on the same browser saw the same
// stats. Keys are now suffixed with the signed-in user id. Guests keep the
// legacy (un-suffixed) keys so anonymous usage still works.

let scope = "guest";

export function setStorageScope(userId) {
  scope = userId ? String(userId) : "guest";
}

export function getStorageScope() {
  return scope;
}

// Guests keep the legacy keys; signed-in users get an isolated namespace.
export function scopedKey(base) {
  return scope === "guest" ? base : `${base}::${scope}`;
}

// True when a raw localStorage key belongs to the current scope.
export function belongsToCurrentScope(key) {
  if (!key) return false;
  if (scope === "guest") return !key.includes("::");
  return key.endsWith(`::${scope}`);
}

// Remove every scoped key belonging to a user (used on account deletion).
export function clearScopedUserData(userId) {
  if (typeof window === "undefined" || !userId) return;
  const suffix = `::${userId}`;
  const keys = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.endsWith(suffix)) keys.push(key);
  }
  keys.forEach((k) => localStorage.removeItem(k));
}
