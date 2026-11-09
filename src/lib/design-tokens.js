/**
 * Ayeh Media Plus — Design System Tokens
 *
 * Single source of truth for colors, typography, spacing, and motion.
 * All values align with the Quranic Aparat+TED hybrid design system.
 */

export const DESIGN_TOKENS = {
  // ── Colors (HSL values matching tailwind config) ──
  colors: {
    // Brand
    primary: '166 63% 25%',        // Deep Emerald #0D5C46
    primaryForeground: '0 0% 100%',
    primaryGlow: '166 63% 35%',
    primaryMuted: '166 40% 90%',

    // Accent
    accent: '174 72% 38%',         // Turquoise #008B74
    accentForeground: '0 0% 100%',
    accentGlow: '174 72% 48%',
    accentMuted: '174 50% 90%',

    // Secondary / Saffron
    secondary: '45 70% 50%',       // Warm Gold #D4AF37
    secondaryForeground: '25 25% 12%',
    secondaryMuted: '45 20% 92%',

    // Neutrals (light mode)
    background: '45 25% 97%',      // Off-white #FAFAFC
    foreground: '25 25% 12%',      // High contrast #0F172A
    card: '0 0% 100%',
    cardForeground: '25 25% 12%',
    border: '45 15% 82%',          // Slate #E2E8F0
    input: '45 15% 82%',
    muted: '45 15% 88%',
    mutedForeground: '25 15% 45%',

    // Dark mode
    darkBackground: '25 15% 6%',   // Obsidian #0B0F19
    darkForeground: '45 15% 96%',
    darkCard: '25 15% 9%',
    darkBorder: '25 15% 18%',
    darkMuted: '25 15% 12%',
    darkMutedForeground: '45 10% 65%',

    // Quranic semantic
    quranic: {
      emerald: '166 63% 25%',
      emeraldLight: '166 50% 40%',
      emeraldDark: '166 70% 18%',
      turquoise: '174 72% 38%',
      saffron: '45 70% 50%',
      saffronLight: '45 70% 62%',
      saffronDark: '45 75% 35%',
      parchment: '45 25% 97%',
      ink: '25 25% 12%',
      sand: '45 20% 92%',
      clay: '25 35% 55%',
      midnight: '25 15% 6%',
    },

    // Status
    success: '166 63% 25%',
    warning: '45 70% 50%',
    error: '0 75% 55%',
    info: '174 72% 38%',
    pending: '45 70% 50%',
    verified: '166 63% 25%',
    rejected: '0 75% 55%',
  },

  // ── Typography ──
  typography: {
    fontBody: "'Doran', system-ui, sans-serif",
    fontHeading: "'Rokh', 'Doran', sans-serif",
    fontArabic: "'Tajrid', 'Noto Naskh Arabic', serif",
    fontDisplay: "'Rokh', 'Doran', sans-serif",
    fontFalsafeh: "'Falsafeh', 'Doran', sans-serif",
    fontMono: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',

    // Scale
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

  // ── Spacing ──
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

  // ── Border Radius ──
  radius: {
    sm: '0.5rem',
    md: '0.75rem',
    lg: '1rem',
    xl: '1.5rem',
    '2xl': '2rem',
    full: '9999px',
  },

  // ── Shadows ──
  shadows: {
    soft: '0 1px 3px 0 rgb(0 0 0 / 0.04), 0 1px 2px -1px rgb(0 0 0 / 0.04)',
    premium: '0 4px 12px -2px rgb(0 0 0 / 0.06), 0 2px 6px -2px rgb(0 0 0 / 0.04)',
    cardHover: '0 12px 24px -6px rgb(0 0 0 / 0.08), 0 4px 8px -4px rgb(0 0 0 / 0.05)',
    goldGlow: '0 4px 20px -4px hsl(45 70% 50% / 0.35)',
    emeraldGlow: '0 4px 20px -4px hsl(166 63% 25% / 0.35)',
    liveGlow: '0 0 30px -4px hsl(45 70% 50% / 0.5)',
  },

  // ── Transitions ──
  transitions: {
    fast: '150ms ease-out',
    normal: '200ms ease-out',
    slow: '300ms ease-out',
    spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
    expo: 'cubic-bezier(0.19, 1, 0.22, 1)',
    bounce: 'cubic-bezier(0.68, -0.55, 0.27, 1.55)',
  },

  // ── Breakpoints ──
  breakpoints: {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px',
  },

  // ── Z-index ──
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

/**
 * Get CSS hsl() value for a color token
 */
export function hsl(color) {
  return `hsl(${color})`;
}

/**
 * Status color mapping for badges/labels
 */
export const STATUS_COLORS = {
  pending_review: { bg: 'bg-amber-500/10', text: 'text-amber-700', border: 'border-amber-500/20', label: 'در انتظار بررسی' },
  verified: { bg: 'bg-emerald-500/10', text: 'text-emerald-700', border: 'border-emerald-500/20', label: 'تایید شده' },
  published: { bg: 'bg-emerald-500/10', text: 'text-emerald-700', border: 'border-emerald-500/20', label: 'منتشر شده' },
  rejected: { bg: 'bg-red-500/10', text: 'text-red-700', border: 'border-red-500/20', label: 'رد شده' },
  archived: { bg: 'bg-slate-500/10', text: 'text-slate-700', border: 'border-slate-500/20', label: 'بایگانی شده' },
  live: { bg: 'bg-saffron-500 text-saffron-950', text: 'text-saffron-950', border: 'border-saffron-500/30', label: 'زنده' },
};

/**
 * Persian digit converter
 */
export const fa = (n) => String(n || 0).toLocaleString('fa-IR');
