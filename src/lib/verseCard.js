import { SKINS, OUTFITS, BGS, PRESETS, parseAvatar } from "@/lib/avatars";

/**
 * Royal Islamic Verse Card generator:
 * Supports Instagram Story (9:16 - 1080×1920), Square Post (1:1 - 1080×1080),
 * and Wide Landscape Banner (16:9 - 1920×1080).
 */

export const CARD_FORMATS = [
  { id: "story", label: "استوری (۹:۱۶)", width: 1080, height: 1920, icon: "Smartphone", ratio: "9/16" },
  { id: "square", label: "پست مربعی (۱:۱)", width: 1080, height: 1080, icon: "Square", ratio: "1/1" },
  { id: "landscape", label: "کاور افقی (۱۶:۹)", width: 1920, height: 1080, icon: "Monitor", ratio: "16/9" },
];

export const CARD_THEMES = [
  {
    id: "royal_green",
    label: "سبز درباری و زرین",
    from: "#063326",
    to: "#02130e",
    text: "#f0fdf4",
    accent: "#f59e0b",
    border: "#10b981",
    badgeBg: "rgba(245, 158, 11, 0.18)",
    glowColor: "rgba(16, 185, 129, 0.35)",
  },
  {
    id: "lajavard",
    label: "لاجورد شاهی و طلا",
    from: "#08102b",
    to: "#030614",
    text: "#ffffff",
    accent: "#fbbf24",
    border: "#d97706",
    badgeBg: "rgba(251, 191, 36, 0.18)",
    glowColor: "rgba(59, 130, 246, 0.3)",
  },
  {
    id: "turquoise",
    label: "فیروزه نیشابور",
    from: "#062b3b",
    to: "#02121c",
    text: "#f0fdfa",
    accent: "#38bdf8",
    border: "#0284c7",
    badgeBg: "rgba(56, 189, 248, 0.18)",
    glowColor: "rgba(56, 189, 248, 0.3)",
  },
  {
    id: "agate",
    label: "عقیق یمنی و زرین",
    from: "#3d1308",
    to: "#1a0602",
    text: "#fff7ed",
    accent: "#fb923c",
    border: "#ea580c",
    badgeBg: "rgba(251, 146, 60, 0.18)",
    glowColor: "rgba(234, 88, 12, 0.3)",
  },
  {
    id: "minimal_dark",
    label: "مینیمال مشکی آبنوس",
    from: "#09090b",
    to: "#18181b",
    text: "#fafafa",
    accent: "#e4e4e7",
    border: "#3f3f46",
    badgeBg: "rgba(255, 255, 255, 0.1)",
    glowColor: "rgba(255, 255, 255, 0.15)",
  },
  {
    id: "minimal_light",
    label: "مینیمال عاج و زمرد",
    from: "#fafaf9",
    to: "#f5f5f4",
    text: "#1c1917",
    accent: "#047857",
    border: "#a7f3d0",
    badgeBg: "rgba(4, 120, 87, 0.12)",
    glowColor: "rgba(4, 120, 87, 0.15)",
  },
];

export const MOSQUE_BACKGROUNDS = [
  {
    id: "none",
    label: "الگوی سنتی اسلیمی (بدون عکس)",
    url: null,
  },
  {
    id: "nasir_panorama",
    label: "تالار نور و ارسی‌های نصیرالملک (پانوراما)",
    url: "/images/art/nasir_panorama_sanctuary.webp",
  },
  {
    id: "nasir_columns",
    label: "ستون‌های مارپیچ و کاشی فیروزه‌ای",
    url: "/images/art/nasir_light_columns.jpg",
  },
  {
    id: "nasir_carpet",
    label: "فرش ایرانی در پرتو شیشه‌های هفت‌رنگ",
    url: "/images/art/nasir_carpet_window.jpg",
  },
  {
    id: "nasir_vault",
    label: "مقرنس و طاق آجری گل و بوته",
    url: "/images/art/nasir_vault_ceiling.webp",
  },
  {
    id: "chehel_sotoun",
    label: "سقف زرین و مینیاتورهای چهل‌ستون",
    url: "/images/art/chehel_sotoun_gold_vault.webp",
  },
];

export const ARABIC_FONTS = [
  { id: "amiri", label: "خط عثمان طه / امیری", family: "'Amiri Quran', 'Traditional Arabic', serif" },
  { id: "scheherazade", label: "خط نسخ قرآنی", family: "'Scheherazade New', 'Amiri', serif" },
  { id: "standard", label: "خط نسخ استاندارد", family: "system-ui, sans-serif" },
];

export const PERSIAN_FONTS = [
  { id: "doran", label: "قلم دوران", family: "'Doran', sans-serif" },
  { id: "doran-bold", label: "قلم دوران Bold", family: "'Doran', sans-serif; font-weight: 700" },
  { id: "doran-extrabold", label: "قلم دوران ExtraBold", family: "'Doran', sans-serif; font-weight: 800" },
  { id: "rokh", label: "قلم رخ", family: "'Rokh', sans-serif" },
  { id: "rokh-bold", label: "قلم رخ Bold", family: "'Rokh', sans-serif; font-weight: 700" },
  { id: "rokh-extrabold", label: "قلم رخ ExtraBold", family: "'Rokh', sans-serif; font-weight: 800" },
  { id: "tajrid", label: "قلم تجريد (عربی)", family: "'Tajrid', serif" },
  { id: "tajrid-bold", label: "قلم تجريد Bold (عربی)", family: "'Tajrid', serif; font-weight: 700" },
  { id: "falsafeh", label: "قلم Delfi", family: "'Falsafeh', sans-serif" },
  { id: "falsafeh-bold", label: "قلم Delfi Bold", family: "'Falsafeh', sans-serif; font-weight: 700" },
];

const esc = (value) =>
  String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

function wrap(text, maxChars, maxLines) {
  const words = String(text || "").trim().split(/\s+/).filter(Boolean);
  const lines = [];
  let current = "";
  words.forEach((w) => {
    if (!current) current = w;
    else if ((current + " " + w).length <= maxChars) current += " " + w;
    else {
      lines.push(current);
      current = w;
    }
  });
  if (current) lines.push(current);
  if (lines.length > maxLines) {
    const kept = lines.slice(0, maxLines);
    kept[maxLines - 1] = kept[maxLines - 1] + " …";
    return kept;
  }
  return lines;
}

/** Character artwork (100×100 viewBox) as SVG markup */
function characterMarkup(cfg) {
  const skin = SKINS[cfg?.skin] || SKINS.medium;
  const outfit = OUTFITS[cfg?.outfit] || OUTFITS.teal;
  const bg = BGS[cfg?.bg] || BGS.sand;
  const dark = "#2d1f14";

  const headwear =
    {
      hijab: `<g><circle cx="50" cy="41" r="20" fill="${outfit}"/><path d="M30 48 C30 64 38 72 50 72 C62 72 70 64 70 48 L70 82 L30 82 Z" fill="${outfit}"/><circle cx="50" cy="43" r="13.5" fill="${skin}"/><path d="M37 40 C37 30 43 27 50 27 C57 27 63 30 63 40 L63 38 C63 31 57 29 50 29 C43 29 37 31 37 38 Z" fill="${outfit}"/></g>`,
      turban: `<g><path d="M33 35 C33 24 41 19 50 19 C59 19 67 24 67 35 L67 38 L33 38 Z" fill="#F5F0E6" stroke="#D8CDB8" stroke-width="1"/><path d="M36 30 C42 27 58 27 64 30" stroke="#D8CDB8" stroke-width="1.2" fill="none"/><path d="M64 36 L70 52 L64 50 Z" fill="#F5F0E6" stroke="#D8CDB8" stroke-width="1"/></g>`,
      cap: `<path d="M35 32 C35 24 42 21 50 21 C58 21 65 24 65 32 L65 33 L35 33 Z" fill="${outfit}"/>`,
      hair: `<path d="M35 38 C34 27 41 23 50 23 C59 23 66 27 65 38 C65 32 60 30 50 30 C40 30 35 32 35 38 Z" fill="${dark}"/>`,
      none: "",
    }[cfg?.head] || "";

  const beard = cfg?.beard
    ? `<path d="M35.5 42 C35.5 54 41 58.5 50 58.5 C59 58.5 64.5 54 64.5 42 C64.5 46 62 44.5 60 46 C56 49 44 49 40 46 C38 44.5 35.5 46 35.5 42 Z" fill="${dark}" opacity="0.9"/>`
    : "";

  return `<rect width="100" height="100" fill="${bg}"/>
  <path d="M18 100 C18 76 36 67 50 67 C64 67 82 76 82 100 Z" fill="${outfit}"/>
  <path d="M44 70 L50 78 L56 70" fill="none" stroke="#ffffff" stroke-opacity="0.25" stroke-width="2"/>
  <rect x="44" y="55" width="12" height="14" rx="5" fill="${skin}"/>
  <circle cx="50" cy="42" r="16" fill="${skin}"/>
  ${beard}
  <circle cx="44" cy="42" r="1.8" fill="${dark}"/>
  <circle cx="56" cy="42" r="1.8" fill="${dark}"/>
  <path d="M45.5 49 Q50 52 54.5 49" stroke="${dark}" stroke-width="1.6" fill="none" stroke-linecap="round"/>
  ${headwear}`;
}

/** Corner Tazhib Islimi motif markup */
function cornerMotif(x, y, rotate, color) {
  return `<g transform="translate(${x}, ${y}) rotate(${rotate}) scale(1.4)" stroke="${color}" stroke-opacity="0.65" fill="none" stroke-width="1.8">
    <path d="M0,0 L45,0 C45,25 25,45 0,45 L0,0 Z" stroke-opacity="0.25" />
    <path d="M6,6 Q26,6 36,16 Q42,26 42,42" />
    <path d="M14,14 Q28,14 34,22 Q38,30 38,38" stroke-dasharray="2 3" />
    <circle cx="16" cy="16" r="4" fill="${color}" fill-opacity="0.4" />
    <polygon points="28,28 32,24 36,28 32,32" fill="${color}" fill-opacity="0.6" />
  </g>`;
}

export function buildVerseCardSvg({
  arabic,
  translation,
  verseKey,
  surahName,
  translatorName,
  author,
  character,
  themeId = "royal_green",
  formatId = "story",
  backgroundUrl = null,
  backgroundDim = 0.5,
  showAvatar = true,
  showBismillah = true,
  arabicFontId = "amiri",
  persianFontId = "doran",
  fontSizeMultiplier = 1,
}) {
  const theme = CARD_THEMES.find((t) => t.id === themeId) || CARD_THEMES[0];
  const format = CARD_FORMATS.find((f) => f.id === formatId) || CARD_FORMATS[0];
  const arabicFont = ARABIC_FONTS.find((f) => f.id === arabicFontId) || ARABIC_FONTS[0];
  const persianFont = PERSIAN_FONTS.find((f) => f.id === persianFontId) || PERSIAN_FONTS[0];
  const cfg = parseAvatar(character) || PRESETS[0].cfg;

  const w = format.width;
  const h = format.height;
  const isStory = formatId === "story";
  const isLandscape = formatId === "landscape";

  // Calculate Text Layout depending on aspect ratio
  let arabicMaxChars = isStory ? 24 : isLandscape ? 40 : 28;
  let arabicMaxLines = isStory ? 7 : isLandscape ? 3 : 5;
  let transMaxChars = isStory ? 44 : isLandscape ? 65 : 50;
  let transMaxLines = isStory ? 6 : isLandscape ? 3 : 4;

  const arabicLines = wrap(arabic, arabicMaxChars, arabicMaxLines);
  const transLines = wrap(translation, transMaxChars, transMaxLines);

  const baseArabicSize = (isStory ? 52 : isLandscape ? 56 : 46) * fontSizeMultiplier;
  const arabicLh = baseArabicSize * 1.6;

  const baseTransSize = (isStory ? 30 : isLandscape ? 32 : 26) * fontSizeMultiplier;
  const transLh = baseTransSize * 1.6;

  // Vertical placement logic
  const topKatibehY = isStory ? 150 : isLandscape ? 110 : 120;
  const characterR = showAvatar ? (isStory ? 160 : isLandscape ? 120 : 125) : 0;
  const characterY = showAvatar ? (isStory ? 420 : isLandscape ? 280 : 280) : 0;

  let arabicStart;
  if (isLandscape) {
    arabicStart = showAvatar ? 450 : 360;
  } else if (isStory) {
    arabicStart = showAvatar ? 680 : 540;
  } else {
    arabicStart = showAvatar ? 470 : 360;
  }

  const transStart = arabicStart + Math.max(arabicLines.length, 1) * arabicLh + 36;

  const arabicMarkup = arabicLines
    .map(
      (line, i) =>
        `<text x="${w / 2}" y="${arabicStart + i * arabicLh}" text-anchor="middle" direction="rtl" font-family="${arabicFont.family}" font-size="${baseArabicSize.toFixed(1)}" font-weight="bold" fill="${theme.text}" filter="drop-shadow(0 2px 4px rgba(0,0,0,0.5))">${esc(line)}</text>`
    )
    .join("");

  const translationMarkup = transLines
    .map(
      (line, i) =>
        `<text x="${w / 2}" y="${transStart + i * transLh}" text-anchor="middle" direction="rtl" font-family="${persianFont.family}" font-size="${baseTransSize.toFixed(1)}" fill="${theme.text}" opacity="0.92" filter="drop-shadow(0 1px 3px rgba(0,0,0,0.4))">«${esc(line)}»</text>`
    )
    .join("");

  // Avatar / Shamseh Markup
  const avatarSection = showAvatar
    ? `<!-- Central Shamseh & Character Portrait -->
  <g>
    <circle cx="${w / 2}" cy="${characterY}" r="${characterR + 14}" fill="none" stroke="${theme.accent}" stroke-opacity="0.5" stroke-width="3"/>
    <circle cx="${w / 2}" cy="${characterY}" r="${characterR + 6}" fill="none" stroke="${theme.accent}" stroke-opacity="0.25" stroke-width="1.5" stroke-dasharray="4 4"/>
    <g clip-path="url(#vcclip_${formatId})">
      <g transform="translate(${w / 2 - characterR},${characterY - characterR}) scale(${((characterR * 2) / 100).toFixed(3)})">${characterMarkup(cfg)}</g>
    </g>
  </g>`
    : "";

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <defs>
    <linearGradient id="vcbg_${theme.id}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${theme.from}"/>
      <stop offset="1" stop-color="${theme.to}"/>
    </linearGradient>
    <radialGradient id="vcglow_${theme.id}" cx="0.5" cy="${isStory ? 0.25 : 0.3}" r="0.6">
      <stop offset="0" stop-color="${theme.accent}" stop-opacity="0.32"/>
      <stop offset="1" stop-color="${theme.accent}" stop-opacity="0"/>
    </radialGradient>
    <clipPath id="vcclip_${formatId}"><circle cx="${w / 2}" cy="${characterY}" r="${characterR}"/></clipPath>
    <pattern id="vcp_${theme.id}" width="90" height="90" patternUnits="userSpaceOnUse">
      <g fill="none" stroke="${theme.accent}" stroke-opacity="0.08" stroke-width="1.2">
        <rect x="18" y="18" width="54" height="54"/>
        <rect x="18" y="18" width="54" height="54" transform="rotate(45 45 45)"/>
        <circle cx="45" cy="45" r="7"/>
      </g>
    </pattern>
  </defs>

  <!-- Background Base & Optional Photography -->
  <rect width="${w}" height="${h}" fill="url(#vcbg_${theme.id})"/>
  ${
    backgroundUrl
      ? `<image href="${esc(backgroundUrl)}" width="${w}" height="${h}" preserveAspectRatio="xMidYMid slice" opacity="${(1 - backgroundDim).toFixed(2)}" />
         <rect width="${w}" height="${h}" fill="url(#vcbg_${theme.id})" opacity="${backgroundDim.toFixed(2)}" />`
      : `<rect width="${w}" height="${h}" fill="url(#vcp_${theme.id})"/>`
  }
  <rect width="${w}" height="${h}" fill="url(#vcglow_${theme.id})"/>

  <!-- Ornamental Double Border -->
  <rect x="36" y="36" width="${w - 72}" height="${h - 72}" rx="32" fill="none" stroke="${theme.accent}" stroke-opacity="0.4" stroke-width="2.5"/>
  <rect x="48" y="48" width="${w - 96}" height="${h - 96}" rx="24" fill="none" stroke="${theme.accent}" stroke-opacity="0.22" stroke-width="1.2" stroke-dasharray="6 4"/>

  <!-- 4 Corner Tazhib Motifs -->
  ${cornerMotif(48, 48, 0, theme.accent)}
  ${cornerMotif(w - 48, 48, 90, theme.accent)}
  ${cornerMotif(w - 48, h - 48, 180, theme.accent)}
  ${cornerMotif(48, h - 48, 270, theme.accent)}

  <!-- Top Katibeh: Bismillah & Verse Key -->
  <g transform="translate(${w / 2}, ${topKatibehY})">
    ${
      showBismillah
        ? `<rect x="-190" y="-36" width="380" height="56" rx="28" fill="${theme.badgeBg}" stroke="${theme.accent}" stroke-opacity="0.4" stroke-width="1.4"/>
           <text x="0" y="2" text-anchor="middle" direction="rtl" font-family="'Amiri Quran','Traditional Arabic',serif" font-size="25" font-weight="bold" fill="${theme.accent}">بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ</text>`
        : ""
    }
    ${
      verseKey || surahName
        ? `<text x="0" y="${showBismillah ? 50 : 10}" text-anchor="middle" font-family="${persianFont.family}" font-size="22" font-weight="bold" fill="${theme.accent}" opacity="0.95">${esc(surahName ? `${surahName} | ` : "")}آیه مبارکه ${esc(verseKey || "")}</text>`
        : ""
    }
  </g>

  ${avatarSection}

  <!-- Sacred Quranic Text & Translation -->
  ${arabicMarkup}
  ${translationMarkup}

  ${
    translatorName
      ? `<text x="${w / 2}" y="${transStart + Math.max(transLines.length, 1) * transLh + 10}" text-anchor="middle" font-family="${persianFont.family}" font-size="18" fill="${theme.accent}" opacity="0.8">(${esc(translatorName)})</text>`
      : ""
  }

  <!-- Footer Ornament & Author Brand -->
  <g transform="translate(0, ${h - (isStory ? 170 : isLandscape ? 100 : 120)})">
    <line x1="${w / 2 - 180}" y1="0" x2="${w / 2 + 180}" y2="0" stroke="${theme.accent}" stroke-opacity="0.45" stroke-width="1.5"/>
    <polygon points="${w / 2}, -7 ${w / 2 + 7},0 ${w / 2}, 7 ${w / 2 - 7},0" fill="${theme.accent}" fill-opacity="0.8"/>
    <text x="${w / 2}" y="36" text-anchor="middle" direction="rtl" font-family="${persianFont.family}" font-size="22" font-weight="bold" fill="${theme.text}" opacity="0.9">${esc(author || "آیه مدیا پلاس")}</text>
    <text x="${w / 2}" y="60" text-anchor="middle" font-family="${persianFont.family}" font-size="15" fill="${theme.accent}" opacity="0.7">سامانه رسانه و جامعه قرآنی آیه</text>
  </g>
</svg>`;
}

export function svgToDataUrl(svg) {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

export async function svgToPngBlob(svg, width = 1080, height = 1080) {
  const img = new Image();
  img.decoding = "async";
  await new Promise((resolve, reject) => {
    img.onload = resolve;
    img.onerror = reject;
    img.src = svgToDataUrl(svg);
  });
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(img, 0, 0, width, height);
  }
  return new Promise((resolve) => canvas.toBlob(resolve, "image/png", 0.95));
}

/** Copy image blob to system clipboard */
export async function copyImageToClipboard(blob) {
  if (!navigator.clipboard || !window.ClipboardItem) {
    throw new Error("مرورگر شما از کپی مستقیم تصویر در کلیپ‌بورد پشتیبانی نمی‌کند.");
  }
  const item = new ClipboardItem({ "image/png": blob });
  await navigator.clipboard.write([item]);
}

/** Native Share Sheet (Instagram, Bale, Eitaa, WhatsApp) */
export async function shareVerseCardNative({ blob, title = "کارت آیه قرآن کریم", text = "آیه مبارکه از سامانه آیه پلاس" }) {
  if (!navigator.share) {
    throw new Error("اشتراک‌گذاری بومی در این مرورگر در دسترس نیست.");
  }
  const file = new File([blob], `ayeh-card-${Date.now()}.png`, { type: "image/png" });
  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    await navigator.share({
      files: [file],
      title,
      text,
    });
  } else {
    await navigator.share({
      title,
      text,
      url: window.location.href,
    });
  }
}
