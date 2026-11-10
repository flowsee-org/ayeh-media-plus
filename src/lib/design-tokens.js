/**
 * Ayeh Media Plus — Design System Tokens
 *
 * Aparat-style video platform with Quranic branding.
 * Light mode is primary; cool neutrals + emerald/turquoise brand.
 */

export const DESIGN_TOKENS = {
  colors: {
    primary: '166 63% 25%',
    primaryForeground: '0 0% 100%',
    primaryGlow: '166 63% 35%',
    primaryMuted: '166 40% 92%',

    accent: '174 72% 38%',
    accentForeground: '0 0% 100%',
    accentGlow: '174 72% 48%',
    accentMuted: '174 50% 92%',

    secondary: '233 22% 94%',
    secondaryForeground: '234 11% 18%',
    secondaryMuted: '233 22% 94%',

    // Aparat-like cool neutrals (light)
    background: '240 25% 97%',
    foreground: '234 11% 18%',
    card: '0 0% 100%',
    cardForeground: '234 11% 18%',
    border: '233 22% 92%',
    input: '233 22% 92%',
    muted: '233 22% 94%',
    mutedForeground: '232 9% 48%',

    darkBackground: '25 15% 6%',
    darkForeground: '240 20% 96%',
    darkCard: '25 15% 9%',
    darkBorder: '25 15% 18%',
    darkMuted: '25 15% 12%',
    darkMutedForeground: '232 10% 65%',

    quranic: {
      emerald: '166 63% 25%',
      emeraldLight: '166 50% 40%',
      emeraldDark: '166 70% 18%',
      turquoise: '174 72% 38%',
      saffron: '45 70% 50%',
      saffronLight: '45 70% 62%',
      saffronDark: '45 75% 35%',
      parchment: '240 25% 97%',
      ink: '234 11% 18%',
      sand: '233 22% 94%',
      clay: '232 9% 48%',
      midnight: '25 15% 6%',
    },

    success: '166 63% 25%',
    warning: '45 70% 50%',
    error: '0 75% 55%',
    info: '174 72% 38%',
    pending: '45 70% 50%',
    verified: '166 63% 25%',
    rejected: '0 75% 55%',
  },

  typography: {
    // Doran — primary UI, navigation, forms, buttons, body
    fontBody: "'Doran', system-ui, sans-serif",
    fontUi: "'Doran', system-ui, sans-serif",
    // Rokh — display headings and page titles
    fontHeading: "'Rokh', 'Doran', sans-serif",
    fontDisplay: "'Rokh', 'Doran', sans-serif",
    // Tajrid — Quranic Arabic / verse typography
    fontArabic: "'Tajrid', 'Noto Naskh Arabic', serif",
    // Falsafeh — editorial intros, reflections, explanatory copy
    fontFalsafeh: "'Falsafeh', 'Doran', sans-serif",
    fontEditorial: "'Falsafeh', 'Doran', sans-serif",
    fontMono: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',

    scale: {
      'display-xl': 'clamp(3.5rem, 8vw, 6rem)',
      'display-lg': 'clamp(2.5rem, 6vw, 4rem)',
      'display-md': 'clamp(2rem, 5vw, 3rem)',
      'display-sm': 'clamp(1.5rem, 4vw, 2.25rem)',
      'heading-xl': 'clamp(1.75rem, 4vw, 2.5rem)',
      'heading-lg': 'clamp(1.5rem, 3vw, 2rem)',
      'heading-md': 'clamp(1.25rem, 2.5vw, 1.5rem)',
      'heading-sm': 'clamp(1.125rem, 2vw, 1.25rem)',
      'body-lg': '1.125rem',
      'body': '1rem',
      'body-sm': '0.875rem',
      'caption': '0.75rem',
      'overline': '0.625rem',
    },

    lineHeight: {
      tight: '1.1',
      snug: '1.25',
      normal: '1.6',
      relaxed: '2.0',
      arabic: '2.6',
    },

    letterSpacing: {
      tight: '-0.03em',
      normal: '0.005em',
      wide: '0.08em',
    },
  },

  spacing: {
    xs: '0.25rem',
    sm: '0.5rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem',
    '2xl': '3rem',
    '3xl': '4rem',
    section: '4.5rem',
    sectionLg: '5.5rem',
    sectionXl: '6.5rem',
  },

  radius: {
    sm: '0.5rem',
    md: '0.75rem',
    lg: '1rem',
    xl: '1.5rem',
    '2xl': '2rem',
    full: '9999px',
  },

  shadows: {
    soft: '0 1px 3px 0 rgb(0 0 0 / 0.04), 0 1px 2px -1px rgb(0 0 0 / 0.04)',
    premium: '0 4px 12px -2px rgb(0 0 0 / 0.06), 0 2px 6px -2px rgb(0 0 0 / 0.04)',
    cardHover: '0 12px 24px -6px rgb(0 0 0 / 0.08), 0 4px 8px -4px rgb(0 0 0 / 0.05)',
    goldGlow: '0 4px 20px -4px hsl(45 70% 50% / 0.35)',
    emeraldGlow: '0 4px 20px -4px hsl(166 63% 25% / 0.35)',
    liveGlow: '0 0 30px -4px hsl(45 70% 50% / 0.5)',
  },

  transitions: {
    fast: '150ms ease-out',
    normal: '200ms ease-out',
    slow: '300ms ease-out',
    spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
    expo: 'cubic-bezier(0.19, 1, 0.22, 1)',
    bounce: 'cubic-bezier(0.68, -0.55, 0.27, 1.55)',
  },

  breakpoints: {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px',
  },

  zIndex: {
    hide: -1,
    auto: 'auto',
    base: 0,
    docked: 10,
    dropdown: 100,
    sticky: 200,
    modal: 300,
    popover: 400,
    tooltip: 500,
  },
};

export function hsl(color) {
  return `hsl(${color})`;
}

export const STATUS_COLORS = {
  pending_review: { bg: 'bg-amber-500/10', text: 'text-amber-700', border: 'border-amber-500/20', label: 'در انتظار بررسی' },
  verified: { bg: 'bg-emerald-500/10', text: 'text-emerald-700', border: 'border-emerald-500/20', label: 'تایید شده' },
  published: { bg: 'bg-emerald-500/10', text: 'text-emerald-700', border: 'border-emerald-500/20', label: 'منتشر شده' },
  rejected: { bg: 'bg-red-500/10', text: 'text-red-700', border: 'border-red-500/20', label: 'رد شده' },
  archived: { bg: 'bg-slate-500/10', text: 'text-slate-700', border: 'border-slate-500/20', label: 'بایگانی شده' },
  live: { bg: 'bg-saffron-500 text-saffron-950', text: 'text-saffron-950', border: 'border-saffron-500/30', label: 'زنده' },
};

export const fa = (n) => String(n || 0).toLocaleString('fa-IR');
