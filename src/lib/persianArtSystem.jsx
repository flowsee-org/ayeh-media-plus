/**
 * Persian-Islamic "Orsi & Haft-Rang" Art Design System
 * Inspired by the radiant light of Nasir al-Mulk (مسجد نصیرالملک) and Safavid vaulted ceilings (چهل‌ستون و شیخ‌لطف‌الله).
 */

export const PERSIAN_ART_IMAGES = {
  // 1. Panoramic Sanctuary with Sunbeams & Persian Carpets
  sanctuaryPanorama: "/images/art/nasir_panorama_sanctuary.webp",

  // 2. Vertical Twisted Columns & Stained Glass Refraction on Turquoise Tiles
  lightColumns: "/images/art/nasir_light_columns.jpg",

  // 3. Intricate Persian Carpet Flooded with Jeweled Sunlight
  carpetWindow: "/images/art/nasir_carpet_window.jpg",

  // 4. Intricate Muqarnas & Vaulted Brickwork Ceiling
  vaultCeiling: "/images/art/nasir_vault_ceiling.webp",

  // 5. Celestial Gilded Royal Vault with Miniature Frescoes
  goldVault: "/images/art/chehel_sotoun_gold_vault.webp",
};

/**
 * Orsi Light Beam SVG component for atmospheric colored sunbeam overlays
 */
export function OrsiLightBeams({ className = "opacity-35" }) {
  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 overflow-hidden mix-blend-screen transition-opacity ${className}`}
    >
      <div className="absolute -top-1/4 -right-1/4 w-[140%] h-[140%] bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-amber-400/20 via-emerald-500/15 to-transparent blur-3xl transform -rotate-12" />
      <div className="absolute -bottom-1/4 -left-1/4 w-[140%] h-[140%] bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-rose-500/15 via-blue-500/15 to-transparent blur-3xl transform rotate-12" />
    </div>
  );
}
