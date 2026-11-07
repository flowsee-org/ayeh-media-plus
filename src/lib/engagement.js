/* موتور درگیرسازی روزانه — استریک، امتیاز و مأموریت‌های روزانه (localStorage) */
import { scopedKey } from "@/lib/storageScope";

const KEY = "tadabbur-engagement-v1";
const storageKey = () => scopedKey(KEY);
const BONUS_XP = 50;
export const ENGAGEMENT_EVENT = "tadabbur-engagement";

export const QUEST_POOL = [
  { id: "read_verses", label: "مطالعه سه آیه", target: 3, xp: 30, event: "verse_read" },
  { id: "listen_audio", label: "گوش دادن به یک تلاوت", target: 1, xp: 20, event: "audio_play" },
  { id: "bookmark_verse", label: "ذخیره یک آیه", target: 1, xp: 15, event: "bookmark" },
  { id: "social", label: "لایک یا نظر در جامعه", target: 1, xp: 15, event: "social" },
  { id: "note", label: "نوشتن یادداشت تدبّر", target: 1, xp: 20, event: "note" },
];

const LEVELS = [
  { min: 0, name: "نوآموز" },
  { min: 100, name: "تدبّرگر" },
  { min: 300, name: "اندیشمند" },
  { min: 600, name: "حکیم" },
  { min: 1000, name: "عارف" },
  { min: 1500, name: "مصباح" },
];

const dayStr = (d = new Date()) => `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;

function load() {
  try { return JSON.parse(localStorage.getItem(storageKey())); } catch { return null; }
}

function save(state) {
  try { localStorage.setItem(storageKey(), JSON.stringify(state)); } catch {}
  window.dispatchEvent(new Event(ENGAGEMENT_EVENT));
}

/* سه مأموریتِ ثابت برای هر روز، بر اساس تاریخ (چرخشی و قابل پیش‌بینی) */
function todaysQuests(dateStr) {
  let h = 0;
  for (let i = 0; i < dateStr.length; i++) h = (h * 31 + dateStr.charCodeAt(i)) >>> 0;
  return QUEST_POOL.map((_, i) => QUEST_POOL[(i + h) % QUEST_POOL.length]).slice(0, 3);
}

function normalize(raw) {
  const t = dayStr();
  const state = raw || { xp: 0, streak: 0, bestStreak: 0, lastActiveDate: null, today: null };
  if (!state.today || state.today.date !== t) {
    state.today = { date: t, progress: {}, bonusClaimed: false };
  }
  // استریک با یک روز فاصله قطع می‌شود
  if (
    state.lastActiveDate &&
    state.lastActiveDate !== t &&
    state.lastActiveDate !== dayStr(new Date(Date.now() - 864e5))
  ) {
    state.streak = 0;
  }
  return state;
}

export function trackEngagement(event) {
  const state = normalize(load());
  const t = dayStr();
  if (state.lastActiveDate !== t) {
    state.streak =
      state.lastActiveDate === dayStr(new Date(Date.now() - 864e5)) ? (state.streak || 0) + 1 : 1;
    state.bestStreak = Math.max(state.bestStreak || 0, state.streak);
    state.lastActiveDate = t;
  }
  todaysQuests(t).forEach((q) => {
    if (q.event !== event) return;
    const cur = state.today.progress[q.id] || 0;
    if (cur < q.target) {
      state.today.progress[q.id] = cur + 1;
      if (cur + 1 >= q.target) state.xp = (state.xp || 0) + q.xp; // پاداخ یک‌باره
    }
  });
  save(state);
}

export function claimDailyBonus() {
  const state = normalize(load());
  const qs = todaysQuests(state.today.date);
  const allDone = qs.every((q) => (state.today.progress[q.id] || 0) >= q.target);
  if (allDone && !state.today.bonusClaimed) {
    state.xp = (state.xp || 0) + BONUS_XP;
    state.today.bonusClaimed = true;
    save(state);
  }
}

export function getEngagementSnapshot() {
  const state = normalize(load());
  const quests = todaysQuests(state.today.date).map((q) => {
    const progress = Math.min(state.today.progress[q.id] || 0, q.target);
    return { ...q, progress, done: progress >= q.target };
  });
  const allDone = quests.every((q) => q.done);
  let level = LEVELS[0];
  let next = null;
  for (const l of LEVELS) {
    if ((state.xp || 0) >= l.min) level = l;
    else { next = l; break; }
  }
  return {
    xp: state.xp || 0,
    streak: state.streak || 0,
    bestStreak: state.bestStreak || 0,
    quests,
    allDone,
    bonusClaimed: !!state.today.bonusClaimed,
    level,
    nextLevel: next,
  };
}