import { SKINS, OUTFITS, BGS, parseAvatar } from "@/lib/avatars";

/**
 * Illustrated SVG character avatar (no photo uploads).
 * `config` = { skin, outfit, head, bg, beard } indexes; falls back to null
 * render is handled by the caller (Avatar shows initials instead).
 */
export default function CharacterAvatar({ config, size = 40, className = "" }) {
  const cfg = parseAvatar(config);
  if (!cfg) return null;
  const skin = SKINS[cfg.skin];
  const outfit = OUTFITS[cfg.outfit];
  const bg = BGS[cfg.bg];
  const dark = "#3b2a1e";

  const headwear = {
    // Hijab: outer drape circle + forehead band, face drawn on top
    hijab: (
      <g>
        <circle cx="50" cy="41" r="20" fill={outfit} />
        <path d="M30 48 C30 64 38 72 50 72 C62 72 70 64 70 48 L70 82 L30 82 Z" fill={outfit} />
        <circle cx="50" cy="43" r="13.5" fill={skin} />
        <path d="M37 40 C37 30 43 27 50 27 C57 27 63 30 63 40 L63 38 C63 31 57 29 50 29 C43 29 37 31 37 38 Z" fill={outfit} />
      </g>
    ),
    // Turban (عمامه): white wrap with fold lines + tail
    turban: (
      <g>
        <path d="M33 35 C33 24 41 19 50 19 C59 19 67 24 67 35 L67 38 L33 38 Z" fill="#F5F0E6" stroke="#D8CDB8" strokeWidth="1" />
        <path d="M36 30 C42 27 58 27 64 30" stroke="#D8CDB8" strokeWidth="1.2" fill="none" />
        <path d="M64 36 L70 52 L64 50 Z" fill="#F5F0E6" stroke="#D8CDB8" strokeWidth="1" />
      </g>
    ),
    // Cap (کلاه): rounded cap on top of head
    cap: (
      <path d="M35 32 C35 24 42 21 50 21 C58 21 65 24 65 32 L65 33 L35 33 Z" fill={outfit} />
    ),
    // Short dark hair
    hair: (
      <path d="M35 38 C34 27 41 23 50 23 C59 23 66 27 65 38 C65 32 60 30 50 30 C40 30 35 32 35 38 Z" fill={dark} />
    ),
    none: null,
  }[cfg.head];

  return (
    <div
      className={`rounded-full overflow-hidden bg-muted/30 shrink-0 ${className}`}
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      <svg viewBox="0 0 100 100" width={size} height={size} className="block">
        <rect width="100" height="100" fill={bg} />
        {/* Shoulders / garment */}
        <path d="M18 100 C18 76 36 67 50 67 C64 67 82 76 82 100 Z" fill={outfit} />
        <path d="M44 70 L50 78 L56 70" fill="none" stroke="#ffffff" strokeOpacity="0.25" strokeWidth="2" />
        {/* Neck */}
        <rect x="44" y="55" width="12" height="14" rx="5" fill={skin} />
        {/* Head */}
        <circle cx="50" cy="42" r="16" fill={skin} />
        {/* Beard */}
        {cfg.beard && (
          <path d="M35.5 42 C35.5 54 41 58.5 50 58.5 C59 58.5 64.5 54 64.5 42 C64.5 46 62 44.5 60 46 C56 49 44 49 40 46 C38 44.5 35.5 46 35.5 42 Z" fill={dark} opacity="0.9" />
        )}
        {/* Face */}
        <circle cx="44" cy="42" r="1.8" fill={dark} />
        <circle cx="56" cy="42" r="1.8" fill={dark} />
        <path d="M45.5 49 Q50 52 54.5 49" stroke={dark} strokeWidth="1.6" fill="none" strokeLinecap="round" />
        {headwear}
      </svg>
    </div>
  );
}