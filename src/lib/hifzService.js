import api from './api';

const STORAGE_KEY = 'ayeh_hifz_progress_v1';
const GOALS_KEY = 'ayeh_hifz_goals_v1';

export function calculateClientSM2(grade, repetitions = 0, easeFactor = 2.5, intervalDays = 1) {
  let nextRepetitions = repetitions;
  let nextEaseFactor = easeFactor;
  let nextIntervalDays = intervalDays;

  if (grade >= 3) {
    if (repetitions === 0) {
      nextIntervalDays = 1;
    } else if (repetitions === 1) {
      nextIntervalDays = 3;
    } else {
      nextIntervalDays = Math.round(intervalDays * easeFactor);
    }
    nextRepetitions = repetitions + 1;
  } else {
    nextRepetitions = 0;
    nextIntervalDays = 1;
  }

  nextEaseFactor = easeFactor + (0.1 - (5 - grade) * (0.08 + (5 - grade) * 0.02));
  if (nextEaseFactor < 1.3) nextEaseFactor = 1.3;

  const nextReviewAt = new Date();
  nextReviewAt.setDate(nextReviewAt.getDate() + nextIntervalDays);

  let status = 'LEARNING';
  if (nextRepetitions >= 5) {
    status = 'MASTERED';
  } else if (grade < 3) {
    status = 'NEEDS_REVIEW';
  }

  return {
    repetitions: nextRepetitions,
    ease_factor: Number(nextEaseFactor.toFixed(2)),
    interval_days: nextIntervalDays,
    next_review_at: nextReviewAt.toISOString(),
    status,
  };
}

export function getLocalHifzStore() {
  if (typeof window === 'undefined') return { items: {}, goals: [] };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const rawGoals = localStorage.getItem(GOALS_KEY);
    return {
      items: raw ? JSON.parse(raw) : {},
      goals: rawGoals ? JSON.parse(rawGoals) : [],
    };
  } catch (err) {
    console.error('Failed to parse local Hifz store:', err);
    return { items: {}, goals: [] };
  }
}

export function saveLocalHifzItem(item) {
  if (typeof window === 'undefined') return;
  const store = getLocalHifzStore();
  const key = `${item.surah_number}:${item.verse_number}`;
  store.items[key] = {
    ...store.items[key],
    ...item,
    updated_at: new Date().toISOString(),
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store.items));
}

export function saveLocalHifzGoal(goal) {
  if (typeof window === 'undefined') return;
  const store = getLocalHifzStore();
  const updatedGoals = [goal, ...store.goals];
  localStorage.setItem(GOALS_KEY, JSON.stringify(updatedGoals));
}

export async function fetchHifzProgress() {
  const localStore = getLocalHifzStore();
  const token = typeof window !== 'undefined' ? (localStorage.getItem('base44_access_token') || localStorage.getItem('token')) : null;

  if (!token) {
    const itemsList = Object.values(localStore.items);
    const now = new Date();
    const dueReviews = itemsList.filter((item) => new Date(item.next_review_at) <= now);
    const mastered = itemsList.filter((i) => i.status === 'MASTERED').length;
    const learning = itemsList.filter((i) => i.status === 'LEARNING').length;
    const needsReview = itemsList.filter((i) => i.status === 'NEEDS_REVIEW').length;

    return {
      items: itemsList,
      due_reviews: dueReviews,
      goals: localStore.goals,
      stats: {
        total_memorized: mastered + learning,
        mastered,
        learning,
        needs_review: needsReview,
        due_today: dueReviews.length,
      },
    };
  }

  try {
    // Sync any offline items to server first
    const offlineList = Object.values(localStore.items);
    if (offlineList.length > 0) {
      await api.hifz.syncProgress(offlineList).catch(() => {});
    }

    const [resProgress, resGoals] = await Promise.all([
      api.hifz.getProgress(),
      api.hifz.getGoals().catch(() => ({ items: [] })),
    ]);

    // Mirror to local storage for fast offline reading
    const newLocalItems = {};
    (resProgress.items || []).forEach((it) => {
      newLocalItems[`${it.surah_number}:${it.verse_number}`] = it;
    });
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newLocalItems));
      if (resGoals.items) {
        localStorage.setItem(GOALS_KEY, JSON.stringify(resGoals.items));
      }
    }

    return {
      items: resProgress.items || [],
      due_reviews: resProgress.due_reviews || [],
      goals: resGoals.items || [],
      stats: resProgress.stats || {
        total_memorized: 0,
        mastered: 0,
        learning: 0,
        needs_review: 0,
        due_today: 0,
      },
    };
  } catch (err) {
    console.error('Remote hifz progress error, falling back to local:', err);
    return fetchHifzProgress(); // Will use offline branch since err handled
  }
}

export async function recordVerseReview({ surah_number, verse_number, grade, loop_count = 0 }) {
  const localStore = getLocalHifzStore();
  const key = `${surah_number}:${verse_number}`;
  const existing = localStore.items[key] || {
    repetitions: 0,
    ease_factor: 2.5,
    interval_days: 1,
    total_loop_plays: 0,
  };

  const sm2 = calculateClientSM2(
    Number(grade),
    existing.repetitions || 0,
    existing.ease_factor || 2.5,
    existing.interval_days || 1
  );

  const updatedItem = {
    surah_number: Number(surah_number),
    verse_number: Number(verse_number),
    repetitions: sm2.repetitions,
    ease_factor: sm2.ease_factor,
    interval_days: sm2.interval_days,
    next_review_at: sm2.next_review_at,
    last_reviewed_at: new Date().toISOString(),
    status: sm2.status,
    total_loop_plays: (existing.total_loop_plays || 0) + Number(loop_count || 0),
  };

  saveLocalHifzItem(updatedItem);

  const token = typeof window !== 'undefined' ? (localStorage.getItem('base44_access_token') || localStorage.getItem('token')) : null;
  if (token) {
    try {
      await api.hifz.submitReview({
        surah_number,
        verse_number,
        grade,
        loop_count,
      });
      // Gamification activity
      api.gamification.trackActivity({
        type: 'reading',
        action_detail: `مرور آیه ${surah_number}:${verse_number} در حالت حفظ`,
        duration_seconds: 45,
      }).catch(() => {});
    } catch (err) {
      console.warn('Review recorded locally; server sync deferred:', err);
    }
  }

  return updatedItem;
}
