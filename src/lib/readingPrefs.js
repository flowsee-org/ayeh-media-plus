import React, { useState, useEffect, useCallback } from "react";

const STORAGE_KEY = "tadabbur-reading-prefs";
const PREFS_CHANGE_EVENT = "ayeh-reading-prefs-changed";

export const QURAN_FONTS = [
  {
    id: "amiri-quran",
    label: "امیری قرآنی (مصحف مدینه)",
    family: "'Amiri Quran', 'Amiri', serif",
    sample: "بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ",
    description: "رسم‌الخط رسمی مصحف شریف با علائم کامل وقف و تجوید",
  },
  {
    id: "scheherazade",
    label: "شهرزاد (نسخ اصیل ایرانی)",
    family: "'Scheherazade New', 'Amiri', serif",
    sample: "بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ",
    description: "قلم چشم‌نواز با کرسی منظم، اعراب متمایز و خوانایی بالا",
  },
  {
    id: "noto-naskh",
    label: "نسخ معاصر (عثمان طه دیجیتال)",
    family: "'Noto Naskh Arabic', 'Amiri', serif",
    sample: "بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ",
    description: "خط متوازن و دقیق برای تلاوت طولانی در نمایشگر",
  },
  {
    id: "amiri",
    label: "امیری کلاسیک",
    family: "'Amiri', serif",
    sample: "بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ",
    description: "قلم احیا شده مکتب حروف‌نگاری سنتی",
  },
  {
    id: "doran",
    label: "دوران قرآنی",
    family: "'Doran', sans-serif",
    sample: "بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ",
    description: "قلم مدرن دیجیتال برای خوانش ساده و یکدست",
  },
];

export const DIACRITIC_THEMES = [
  {
    id: "classic",
    label: "کلاسیک مصحفی",
    badgeColor: "bg-secondary text-foreground border-border",
    className: "quran-theme-classic",
    description: "اعراب و علائم هم‌رنگ متن اصلی مصحف",
  },
  {
    id: "ruby",
    label: "یاقوتی درباری",
    badgeColor: "bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30",
    className: "quran-theme-ruby",
    description: "علائم و اعراب با جوهر سرخ یاقوتی بر روی متن",
  },
  {
    id: "gold",
    label: "زرین کهربایی",
    badgeColor: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30",
    className: "quran-theme-gold",
    description: "نشان‌های وقف و علائم با جلوه طلاکاری کهن",
  },
  {
    id: "turquoise",
    label: "فیروزه‌ای نیشابور",
    badgeColor: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
    className: "quran-theme-turquoise",
    description: "علائم وقف و اعراب با فیروزه‌ای آرامش‌بخش",
  },
];

export const DEFAULT_PREFS = {
  textScale: 1, // compatibility with older components
  arabicScale: 1.15, // 0.85 to 1.7
  lineHeight: 2.5, // 2.0 to 3.4
  translationScale: 1.0, // 0.85 to 1.35
  showTranslation: true,
  arabicFont: "'Amiri Quran', 'Amiri', serif",
  fontId: "amiri-quran",
  diacriticTheme: "classic", // classic | ruby | gold | turquoise
  highlightWaqf: true,
};

export function getReadingPrefs() {
  if (typeof window === "undefined") return { ...DEFAULT_PREFS };
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    return { ...DEFAULT_PREFS, ...stored };
  } catch {
    return { ...DEFAULT_PREFS };
  }
}

export function saveReadingPrefs(prefs) {
  if (typeof window === "undefined") return;
  try {
    const merged = { ...DEFAULT_PREFS, ...prefs };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
    window.dispatchEvent(new CustomEvent(PREFS_CHANGE_EVENT, { detail: merged }));
  } catch {}
}

/** Hook for synchronized reading preferences across all Mushaf components */
export function useReadingPrefs() {
  const [prefs, setPrefsState] = useState(getReadingPrefs);

  useEffect(() => {
    const handleStorage = () => {
      setPrefsState(getReadingPrefs());
    };

    window.addEventListener("storage", handleStorage);
    window.addEventListener(PREFS_CHANGE_EVENT, handleStorage);

    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener(PREFS_CHANGE_EVENT, handleStorage);
    };
  }, []);

  const updatePrefs = useCallback((newPrefs) => {
    saveReadingPrefs(newPrefs);
    setPrefsState((prev) => ({ ...prev, ...newPrefs }));
  }, []);

  return [prefs, updatePrefs];
}

/** Helper to render Waqf signs with distinct decorative classes */
export function renderQuranWaqf(arabicText, highlightWaqf = true) {
  if (!arabicText || !highlightWaqf) return arabicText;
  const waqfRegex = /([\u06D6-\u06DC\u06E2\u06DF\u06E0\u06ED\u06D9])/g;
  const parts = arabicText.split(waqfRegex);
  if (parts.length <= 1) return arabicText;

  return parts.map((part, index) => {
    if (waqfRegex.test(part)) {
      return React.createElement(
        "span",
        {
          key: index,
          className: "quran-waqf-mark inline-block mx-0.5 px-0.5 transition-colors font-sans",
        },
        part
      );
    }
    return part;
  });
}
