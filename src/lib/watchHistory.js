/**
 * Ayeh Media Plus — Watch History
 *
 * Authenticated users persist to /api/watch-history (cross-device).
 * localStorage remains a per-browser cache and the only store when logged out.
 */

import { scopedKey } from "@/lib/storageScope";
import { auth } from "@/lib/api";

const BASE_KEY = "ayeh-watch-history";
const MAX_ENTRIES = 100;
const API_BASE = "/api/watch-history";

function storageKey() {
  return scopedKey(BASE_KEY);
}

function getToken() {
  return typeof auth?.getToken === "function" ? auth.getToken() : null;
}

function load() {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(storageKey())) || {};
  } catch {
    return {};
  }
}

function save(data) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(storageKey(), JSON.stringify(data));
  } catch {
    // Storage quota exceeded or private mode — silently ignore
  }
}

function cacheLocalEntry(entry) {
  if (!entry?.video_id) return;
  const data = load();
  data[entry.video_id] = {
    video_id: entry.video_id,
    title: entry.title || "",
    thumbnail_url: entry.thumbnail_url || null,
    watched_at: entry.watched_at || Date.now(),
    watch_seconds: entry.watch_seconds || 0,
    completion_percentage: entry.completion_percentage || 0,
    watch_count: entry.watch_count || 1,
    video_available: entry.video_available !== false,
  };
  const keys = Object.keys(data);
  if (keys.length > MAX_ENTRIES) {
    keys.sort((a, b) => data[a].watched_at - data[b].watched_at);
    keys.slice(0, keys.length - MAX_ENTRIES).forEach((k) => delete data[k]);
  }
  save(data);
  return data[entry.video_id];
}

async function apiRequest(path, options = {}) {
  const token = getToken();
  if (!token) {
    const err = new Error("Authentication required");
    err.status = 401;
    throw err;
  }
  const headers = {
    Authorization: `Bearer ${token}`,
    ...(options.headers || {}),
  };
  if (options.body && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }
  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  const text = await res.text();
  let data = {};
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { _raw: text };
  }
  if (!res.ok) {
    const err = new Error(data.message || `Watch history failed (${res.status})`);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

/**
 * Record (or update) a video watch entry.
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

  const keys = Object.keys(data);
  if (keys.length > MAX_ENTRIES) {
    keys.sort((a, b) => data[a].watched_at - data[b].watched_at);
    const toRemove = keys.slice(0, keys.length - MAX_ENTRIES);
    toRemove.forEach((k) => delete data[k]);
  }

  save(data);

  if (getToken()) {
    apiRequest("", {
      method: "POST",
      body: JSON.stringify({
        video_id,
        title,
        thumbnail_url,
        watch_seconds,
        completion_percentage,
      }),
    }).catch(() => {
      // Offline / transient — local cache already updated
    });
  }

  return entry;
}

export function getWatchHistory() {
  if (typeof window === "undefined") return [];
  const data = load();
  return Object.values(data).sort((a, b) => b.watched_at - a.watched_at);
}

/** Prefer server history when authenticated; falls back to local cache. */
export async function fetchWatchHistory() {
  if (!getToken()) {
    return getWatchHistory();
  }
  try {
    const res = await apiRequest("");
    const items = Array.isArray(res.items) ? res.items : [];
    const mapped = items.map((e) => ({
      video_id: e.video_id,
      title: e.title || "",
      thumbnail_url: e.thumbnail_url || null,
      watched_at: e.watched_at || (e.last_watched_at ? new Date(e.last_watched_at).getTime() : 0),
      watch_seconds: e.watch_seconds || 0,
      completion_percentage: e.completion_percentage || 0,
      watch_count: e.watch_count || 1,
      video_available: e.video_available !== false,
    }));
    // Refresh local cache from server truth
    const next = {};
    mapped.forEach((e) => {
      next[e.video_id] = e;
    });
    save(next);
    return mapped;
  } catch {
    return getWatchHistory();
  }
}

export function getWatchEntry(video_id) {
  if (!video_id) return null;
  const data = load();
  return data[video_id] || null;
}

export function removeWatchEntry(video_id) {
  if (typeof window === "undefined") return;
  const data = load();
  delete data[video_id];
  save(data);
  if (getToken()) {
    apiRequest(`/${encodeURIComponent(video_id)}`, { method: "DELETE" }).catch(() => {});
  }
}

export function clearWatchHistory() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(storageKey());
  if (getToken()) {
    apiRequest("", { method: "DELETE" }).catch(() => {});
  }
}

export function getWatchCount() {
  return Object.keys(load()).length;
}

export function getTotalWatchTime() {
  const data = load();
  return Object.values(data).reduce((sum, e) => sum + (e.watch_seconds || 0), 0);
}

export { cacheLocalEntry };
