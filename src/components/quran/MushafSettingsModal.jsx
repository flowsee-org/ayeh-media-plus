import { useState } from "react";
import {
  X,
  RotateCcw,
  Check,
  Eye,
  EyeOff,
  Type,
  Palette,
  Sliders,
} from "lucide-react";
import {
  QURAN_FONTS,
  DIACRITIC_THEMES,
  DEFAULT_PREFS,
  renderQuranWaqf,
} from "@/lib/readingPrefs";
import { IslamicStar } from "@/components/IslamicOrnaments";

const SAMPLE_ARABIC =
  "بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ ۝ ذَٰلِكَ ٱلْكِتَٰبُ لَا رَيْبَ ۛ فِيهِ ۛ هُدًۭى لِّلْمُتَّقِينَ ۙ";
const SAMPLE_TRANSLATION =
  "«این کتابی است که در آن هیچ شکی نیست؛ راهنمای اهل تقواست.»";

export default function MushafSettingsModal({ isOpen, onClose, prefs, onChange }) {
  const [activeTab, setActiveTab] = useState("font"); // font | colors | layout

  if (!isOpen) return null;

  const currentTheme =
    DIACRITIC_THEMES.find((t) => t.id === prefs.diacriticTheme) || DIACRITIC_THEMES[0];

  const handleReset = () => {
    onChange({ ...DEFAULT_PREFS });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md"
      dir="rtl"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-xl rounded border border-accent/40 bg-card/95 backdrop-blur-2xl shadow-2xl p-5 sm:p-7 overflow-hidden text-right max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="pattern-islamic absolute inset-0 opacity-10 pointer-events-none" />

        {/* Modal Header */}
        <div className="relative flex items-center justify-between pb-3.5 border-b border-border/60">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded bg-accent/15 border border-accent/30 text-accent flex items-center justify-center shadow-soft">
              <Type className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-display font-bold text-base sm:text-lg text-foreground">
                تنظیمات خطاطی و شخصی‌سازی مصحف
              </h3>
              <p className="text-xs text-muted-foreground">
                انتخاب قلم، رنگ اعراب و علائم وقف، و فاصله سطرها
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="h-8 w-8 rounded hover:bg-secondary flex items-center justify-center text-muted-foreground transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Live Preview Card */}
        <div className="relative my-3 rounded border border-accent/30 bg-gradient-to-b from-card to-secondary/60 p-4 shadow-soft overflow-hidden">
          <div className="flex items-center justify-between text-[11px] font-bold text-accent mb-2">
            <span className="flex items-center gap-1.5">
              <IslamicStar size={12} className="text-accent" />
              پیش‌نمایش زنده خط مصحف:
            </span>
            <span className="text-muted-foreground">
              {QURAN_FONTS.find((f) => f.family === prefs.arabicFont)?.label || "قلم پیش‌فرض"}
            </span>
          </div>

          <div className={currentTheme.className}>
            <div
              className="text-center transition-all select-none font-bold"
              style={{
                fontFamily: prefs.arabicFont,
                fontSize: `${Math.round(22 * (prefs.arabicScale || 1.15))}px`,
                lineHeight: prefs.lineHeight || 2.4,
              }}
              dir="rtl"
              lang="ar"
            >
              {renderQuranWaqf(SAMPLE_ARABIC, prefs.highlightWaqf !== false)}
            </div>

            {prefs.showTranslation && (
              <p
                className="font-doran text-center text-muted-foreground mt-2 transition-all leading-relaxed"
                style={{
                  fontSize: `${Math.round(13 * (prefs.translationScale || 1.0))}px`,
                }}
              >
                {SAMPLE_TRANSLATION}
              </p>
            )}
          </div>
        </div>

        {/* Setting Navigation Tabs */}
        <div className="relative flex border-b border-border/50 text-xs font-bold mb-3">
          <button
            onClick={() => setActiveTab("font")}
            className={`flex-1 py-2 text-center border-b-2 transition-all flex items-center justify-center gap-1.5 ${
              activeTab === "font"
                ? "border-accent text-accent font-bold"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <Type className="h-3.5 w-3.5" />
            قلم و رسم‌الخط
          </button>
          <button
            onClick={() => setActiveTab("colors")}
            className={`flex-1 py-2 text-center border-b-2 transition-all flex items-center justify-center gap-1.5 ${
              activeTab === "colors"
                ? "border-accent text-accent font-bold"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <Palette className="h-3.5 w-3.5" />
            رنگ اعراب و وقف
          </button>
          <button
            onClick={() => setActiveTab("layout")}
            className={`flex-1 py-2 text-center border-b-2 transition-all flex items-center justify-center gap-1.5 ${
              activeTab === "layout"
                ? "border-accent text-accent font-bold"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <Sliders className="h-3.5 w-3.5" />
            ابعاد و فواصل
          </button>
        </div>

        {/* Tab Content Body */}
        <div className="relative flex-1 overflow-y-auto pr-1 py-1 space-y-3">
          {/* ── TAB 1: FONTS ── */}
          {activeTab === "font" && (
            <div className="space-y-2 animate-fade-in">
              {QURAN_FONTS.map((font) => {
                const isSelected = prefs.arabicFont === font.family;
                return (
                  <button
                    key={font.id}
                    onClick={() =>
                      onChange({
                        ...prefs,
                        arabicFont: font.family,
                        fontId: font.id,
                      })
                    }
                    className={`w-full flex items-center justify-between p-3.5 rounded border transition-all text-right ${
                      isSelected
                        ? "bg-accent/15 border-accent text-accent shadow-soft ring-1 ring-accent/40"
                        : "border-border/60 hover:bg-secondary/70 text-foreground"
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-display font-bold text-sm text-foreground">
                          {font.label}
                        </span>
                        {isSelected && (
                          <span className="h-2 w-2 rounded bg-accent animate-pulse-soft" />
                        )}
                      </div>
                      <p className="text-[11px] text-muted-foreground mb-2">
                        {font.description}
                      </p>
                      <div
                        className="text-lg font-bold text-foreground"
                        style={{ fontFamily: font.family }}
                        dir="rtl"
                        lang="ar"
                      >
                        {font.sample}
                      </div>
                    </div>

                    <div
                      className={`h-7 w-7 rounded flex items-center justify-center shrink-0 mr-3 transition-colors ${
                        isSelected
                          ? "bg-accent text-stone-950 font-bold"
                          : "border border-border text-transparent"
                      }`}
                    >
                      <Check className="h-4 w-4 stroke-[3]" />
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* ── TAB 2: DIACRITIC & WAQF COLORS ── */}
          {activeTab === "colors" && (
            <div className="space-y-4 animate-fade-in">
              <div>
                <label className="block text-xs font-bold text-foreground mb-2">
                  پالت رنگی اعراب و علائم مصحف
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {DIACRITIC_THEMES.map((theme) => {
                    const isSelected = prefs.diacriticTheme === theme.id;
                    return (
                      <button
                        key={theme.id}
                        onClick={() =>
                          onChange({
                            ...prefs,
                            diacriticTheme: theme.id,
                          })
                        }
                        className={`p-3 rounded border transition-all text-right flex flex-col justify-between ${
                          isSelected
                            ? "bg-accent/15 border-accent shadow-soft ring-1 ring-accent"
                            : "border-border/60 hover:bg-secondary/70"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="font-display font-bold text-xs text-foreground">
                            {theme.label}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold border ${theme.badgeColor}`}
                          >
                            نمونه رنگ
                          </span>
                        </div>
                        <p className="text-[11px] text-muted-foreground leading-relaxed">
                          {theme.description}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Waqf Signs Highlight Toggle */}
              <div className="pt-3 border-t border-border/50">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-foreground">
                      برجسته‌سازی نشان‌های وقف و شماره آیه
                    </h4>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      تفکیک علائم وقف (صلی، قلی، ج، مـ، ۛ) با رنگ انتخابی تم مصحف
                    </p>
                  </div>
                  <button
                    onClick={() =>
                      onChange({
                        ...prefs,
                        highlightWaqf: !prefs.highlightWaqf,
                      })
                    }
                    className={`h-6 w-11 rounded transition-colors relative flex items-center px-0.5 ${
                      prefs.highlightWaqf !== false ? "bg-accent" : "bg-secondary"
                    }`}
                  >
                    <span
                      className={`h-5 w-5 rounded bg-white transition-transform ${
                        prefs.highlightWaqf !== false ? "-translate-x-5" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── TAB 3: LAYOUT & SIZING ── */}
          {activeTab === "layout" && (
            <div className="space-y-4 animate-fade-in">
              {/* Arabic Font Size Slider */}
              <div>
                <div className="flex items-center justify-between text-xs font-bold mb-1.5">
                  <span>اندازه خط عربی آیات</span>
                  <span className="font-mono text-accent">
                    {Math.round((prefs.arabicScale || 1.15) * 100).toLocaleString("fa-IR")}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0.85"
                  max="1.6"
                  step="0.05"
                  value={prefs.arabicScale || 1.15}
                  onChange={(e) =>
                    onChange({
                      ...prefs,
                      arabicScale: parseFloat(e.target.value),
                      textScale: parseFloat(e.target.value),
                    })
                  }
                  className="w-full h-2 rounded bg-secondary appearance-none cursor-pointer accent-accent"
                />
                <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
                  <span>کوچک</span>
                  <span>استاندارد</span>
                  <span>درشت</span>
                </div>
              </div>

              {/* Line Height Slider */}
              <div>
                <div className="flex items-center justify-between text-xs font-bold mb-1.5">
                  <span>فاصله بین سطرها (جهت عدم تداخل اعراب)</span>
                  <span className="font-mono text-accent">
                    {(prefs.lineHeight || 2.4).toLocaleString("fa-IR")}
                  </span>
                </div>
                <input
                  type="range"
                  min="2.0"
                  max="3.2"
                  step="0.1"
                  value={prefs.lineHeight || 2.4}
                  onChange={(e) =>
                    onChange({
                      ...prefs,
                      lineHeight: parseFloat(e.target.value),
                    })
                  }
                  className="w-full h-2 rounded bg-secondary appearance-none cursor-pointer accent-accent"
                />
              </div>

              {/* Translation Size & Visibility */}
              <div className="pt-3 border-t border-border/50 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {prefs.showTranslation ? (
                      <Eye className="h-4 w-4 text-accent" />
                    ) : (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    )}
                    <span className="text-xs font-bold text-foreground">
                      نمایش ترجمه فارسی زیر هر آیه
                    </span>
                  </div>
                  <button
                    onClick={() =>
                      onChange({
                        ...prefs,
                        showTranslation: !prefs.showTranslation,
                      })
                    }
                    className={`h-6 w-11 rounded transition-colors relative flex items-center px-0.5 ${
                      prefs.showTranslation ? "bg-accent" : "bg-secondary"
                    }`}
                  >
                    <span
                      className={`h-5 w-5 rounded bg-white transition-transform ${
                        prefs.showTranslation ? "-translate-x-5" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>

                {prefs.showTranslation && (
                  <div>
                    <div className="flex items-center justify-between text-xs font-bold mb-1.5">
                      <span>اندازه قلم ترجمه فارسی</span>
                      <span className="font-mono text-accent">
                        {Math.round((prefs.translationScale || 1.0) * 100).toLocaleString("fa-IR")}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0.85"
                      max="1.3"
                      step="0.05"
                      value={prefs.translationScale || 1.0}
                      onChange={(e) =>
                        onChange({
                          ...prefs,
                          translationScale: parseFloat(e.target.value),
                        })
                      }
                      className="w-full h-2 rounded bg-secondary appearance-none cursor-pointer accent-accent"
                    />
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Modal Actions Footer */}
        <div className="relative pt-3.5 border-t border-border/60 flex items-center justify-between">
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>بازنشانی پیش‌فرض</span>
          </button>

          <button
            onClick={onClose}
            className="px-5 py-2 rounded bg-primary text-primary-foreground text-xs font-bold shadow-soft hover:shadow-emerald-glow transition-all"
          >
            تأیید و بازگشت به مصحف
          </button>
        </div>
      </div>
    </div>
  );
}
