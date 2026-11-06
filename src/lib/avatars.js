/**
 * Avatar system: users pick a preset QURANIC CHARACTER — never a personal photo.
 * Config is stored as a compact JSON string on the user (avatar_config)
 * and copied onto posts (author_avatar) when publishing.
 */

export const SKINS = ["#F3C99F", "#E0A87E", "#B77B4F", "#8A5433"];
export const SKIN_LABELS = ["روشن", "گرم", "گندمی", "سبزه"];
export const OUTFITS = ["#0f766e", "#1e3a8a", "#166534", "#9d174d", "#7c2d12", "#4c1d95"];
export const OUTFIT_LABELS = ["فیروزه‌ای", "نیلی", "سبز", "زرشکی", "عنابی", "بنفش"];
export const BGS = ["#F5EDDA", "#E4EFE4", "#EAE4F3", "#F7E7E0"];
export const BG_LABELS = ["کاهی", "سبز روشن", "بنفش روشن", "گلبهی"];
export const HEADWEAR = [
  { id: "hijab", label: "حجاب" },
  { id: "turban", label: "عمامه" },
  { id: "cap", label: "کلاه" },
  { id: "hair", label: "مو" },
  { id: "none", label: "ساده" },
];

const CHARACTERS = [
  { id: "maryam", name: "مریم", epithet: "پاک‌دامنی", cfg: { skin: 1, outfit: 0, head: "hijab", bg: 1, beard: false } },
  { id: "asiyeh", name: "آسیه", epithet: "ایمان استوار", cfg: { skin: 2, outfit: 3, head: "hijab", bg: 3, beard: false } },
  { id: "hajar", name: "هاجر", epithet: "توکل و تلاش", cfg: { skin: 3, outfit: 4, head: "hijab", bg: 0, beard: false } },
  { id: "bilqis", name: "بلقیس", epithet: "حکمت فرمانروا", cfg: { skin: 0, outfit: 5, head: "hijab", bg: 2, beard: false } },
  { id: "yusuf", name: "یوسف", epithet: "زیبایی و صبر", cfg: { skin: 1, outfit: 1, head: "hair", bg: 2, beard: false } },
  { id: "musa", name: "موسی", epithet: "رهایی‌بخش", cfg: { skin: 3, outfit: 0, head: "hair", bg: 1, beard: true } },
  { id: "ibrahim", name: "ابراهیم", epithet: "بت‌شکن", cfg: { skin: 2, outfit: 4, head: "cap", bg: 0, beard: true } },
  { id: "nuh", name: "نوح", epithet: "کشتی نجات", cfg: { skin: 3, outfit: 2, head: "cap", bg: 1, beard: true } },
  { id: "isa", name: "عیسی", epithet: "مهر و شفا", cfg: { skin: 0, outfit: 0, head: "hair", bg: 3, beard: true } },
  { id: "davud", name: "داوود", epithet: "عدل و نغمه", cfg: { skin: 1, outfit: 3, head: "cap", bg: 2, beard: true } },
  { id: "soleyman", name: "سلیمان", epithet: "حکمت و مُلک", cfg: { skin: 2, outfit: 5, head: "turban", bg: 0, beard: true } },
  { id: "luqman", name: "لقمان", epithet: "حکمت", cfg: { skin: 3, outfit: 1, head: "turban", bg: 1, beard: true } },
  { id: "khidr", name: "خضر", epithet: "دانش پنهان", cfg: { skin: 1, outfit: 2, head: "turban", bg: 3, beard: true } },
  { id: "dhulqarnayn", name: "ذوالقرنین", epithet: "عدالت‌گستر", cfg: { skin: 2, outfit: 4, head: "cap", bg: 2, beard: true } },
  { id: "yunus", name: "یونس", epithet: "توبه", cfg: { skin: 0, outfit: 0, head: "hair", bg: 1, beard: false } },
  { id: "ayyub", name: "ایوب", epithet: "صبر", cfg: { skin: 3, outfit: 3, head: "cap", bg: 0, beard: true } },
  { id: "zakariya", name: "زکریا", epithet: "دعا", cfg: { skin: 1, outfit: 5, head: "turban", bg: 2, beard: true } },
  { id: "talut", name: "طالوت", epithet: "شجاعت", cfg: { skin: 2, outfit: 2, head: "hair", bg: 3, beard: true } },
];

export const PRESETS = CHARACTERS;

/** Parse a stored avatar value (JSON string or object) into a config, or null. */
export function parseAvatar(value) {
  if (!value) return null;
  let obj = value;
  if (typeof value === "string") {
    try {
      obj = JSON.parse(value);
    } catch {
      return null;
    }
  }
  if (!obj || typeof obj !== "object") return null;
  const cfg = obj.cfg || obj;
  if (
    Number.isInteger(cfg.skin) && cfg.skin >= 0 && cfg.skin < SKINS.length &&
    Number.isInteger(cfg.outfit) && cfg.outfit >= 0 && cfg.outfit < OUTFITS.length &&
    Number.isInteger(cfg.bg) && cfg.bg >= 0 && cfg.bg < BGS.length &&
    HEADWEAR.some((h) => h.id === cfg.head)
  ) {
    return cfg;
  }
  return null;
}

export function serializeAvatar(presetId, cfg) {
  return JSON.stringify(presetId ? { preset: presetId, cfg } : { cfg });
}

/** Build the config for a preset id. */
export function presetConfig(presetId) {
  const p = PRESETS.find((x) => x.id === presetId);
  return p ? p.cfg : null;
}

/** Character metadata (name/epithet) for a stored avatar value. */
export function characterInfo(value) {
  if (!value) return null;
  let parsed = value;
  if (typeof value === "string") {
    try {
      parsed = JSON.parse(value);
    } catch {
      return null;
    }
  }
  if (!parsed?.preset) return null;
  return PRESETS.find((p) => p.id === parsed.preset) || null;
}

/** Random character config for the "ساخت تصادفی" button. */
export function randomConfig() {
  const pick = (arr) => Math.floor(Math.random() * arr.length);
  return {
    skin: pick(SKINS),
    outfit: pick(OUTFITS),
    head: HEADWEAR[pick(HEADWEAR)].id,
    bg: pick(BGS),
    beard: Math.random() > 0.6,
  };
}