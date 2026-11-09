import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

/* ── Persian/Arabic Numerals ── */
export const fa = (n) => (n || 0).toLocaleString("fa-IR");

/* ── Time Ago Helper ── */
export function timeAgo(dateStr) {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = Math.floor((now - date) / 1000);
  if (diff < 60) return "چند لحظه پیش";
  if (diff < 3600) return `${Math.floor(diff / 60)} دقیقه پیش`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} ساعت پیش`;
  if (diff < 604800) return `${Math.floor(diff / 86400)} روز پیش`;
  return date.toLocaleDateString("fa-IR");
}

export const isIframe = typeof window !== "undefined" ? window.self !== window.top : false;
