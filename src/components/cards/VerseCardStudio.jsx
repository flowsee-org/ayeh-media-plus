import { useMemo, useState } from "react";
import { base44 } from "@/api/base44Client";
import CharacterAvatar from "@/components/CharacterAvatar";
import { PRESETS, serializeAvatar } from "@/lib/avatars";
import { CARD_THEMES, CARD_FORMATS, buildVerseCardSvg, svgToDataUrl, svgToPngBlob } from "@/lib/verseCard";
import { X, Loader2, Download, Send, Sparkles, Smartphone, Square } from "lucide-react";
import { toast } from "react-hot-toast";

/** Studio for creating Royal Persian Islamic verse cards with multiple aspect ratios. */
export default function VerseCardStudio({ user, onClose, onPosted }) {
  const [arabic, setArabic] = useState("");
  const [translation, setTranslation] = useState("");
  const [verseKey, setVerseKey] = useState("");
  const [characterId, setCharacterId] = useState(PRESETS[0].id);
  const [themeId, setThemeId] = useState(CARD_THEMES[0].id);
  const [formatId, setFormatId] = useState("square");
  const [busy, setBusy] = useState(null);
  const [err, setErr] = useState(null);

  const preset = PRESETS.find((p) => p.id === characterId) || PRESETS[0];
  const format = CARD_FORMATS.find((f) => f.id === formatId) || CARD_FORMATS[0];
  const avatarValue = serializeAvatar(preset.id, preset.cfg);

  const svg = useMemo(
    () =>
      buildVerseCardSvg({
        arabic,
        translation,
        verseKey,
        author: user?.full_name || user?.email,
        character: avatarValue,
        themeId,
        formatId,
      }),
    [arabic, translation, verseKey, user, avatarValue, themeId, formatId]
  );

  const ready = arabic.trim().length > 0 || translation.trim().length > 0;

  const download = async () => {
    setBusy("download");
    try {
      const blob = await svgToPngBlob(svg, format.width, format.height);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `ayeh-card-${formatId}-${Date.now()}.png`;
      link.click();
      URL.revokeObjectURL(url);
      toast.success("تصویر با وضوح بالا ذخیره شد");
    } catch {
      setErr("ساخت تصویر ناموفق بود.");
      toast.error("خطا در ایجاد خروجی تصویر");
    }
    setBusy(null);
  };

  const publish = async () => {
    if (!ready || !user) return;
    setBusy("publish");
    setErr(null);
    try {
      const blob = await svgToPngBlob(svg, format.width, format.height);
      const file = new File([blob], `ayeh-card-${formatId}-${Date.now()}.png`, { type: "image/png" });
      const { file_url } = await base44.integrations.Core.UploadPublicFile({ file });
      const created = await base44.entities.Post.create({
        author_id: user.id,
        author_name: user.full_name || user.email,
        author_avatar: avatarValue,
        content: translation.trim() || "کارت آیه",
        type: "image",
        image_url: file_url,
        verse_key: verseKey.trim() || undefined,
        verse_text: translation.trim() || undefined,
        verse_arabic: arabic.trim() || undefined,
        tags: ["کارت آیه", preset.name, formatId === "story" ? "استوری" : "پست"],
        likes_count: 0,
        comments_count: 0,
        liked_by: [],
      });
      toast.success("کارت آیه با موفقیت در فید جامعه قرآنی منتشر شد");
      onPosted(created);
    } catch (e) {
      setErr(e.message || "انتشار کارت ناموفق بود.");
      toast.error("خطا در انتشار کارت");
    }
    setBusy(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 backdrop-blur-sm animate-fade-in font-ui" onClick={onClose}>
      <div
        className="max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-3xl border border-border bg-card p-5 sm:p-7 shadow-soft animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-5 flex items-center justify-between border-b border-border pb-3">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-accent/15 text-accent flex items-center justify-center">
              <Sparkles className="h-4.5 w-4.5" />
            </div>
            <div>
              <h3 className="font-kalameh text-lg font-bold text-foreground">کارگاه هنری کارت آیه</h3>
              <p className="font-yekan text-xs text-muted-foreground mt-0.5">طراحی کارت‌های قرآنی با تذهیب سنتی و ابعاد استاندارد شبکه‌های اجتماعی</p>
            </div>
          </div>
          <button onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-xl hover:bg-secondary transition-colors text-muted-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="grid gap-6 md:grid-cols-[minmax(0,280px)_1fr] items-start">
          {/* Card Preview */}
          <div className="flex flex-col items-center">
            <div className={`overflow-hidden rounded-2xl border border-border shadow-soft bg-black/50 p-2 flex items-center justify-center ${formatId === "story" ? "h-[380px] w-[214px]" : "h-[280px] w-[280px]"}`}>
              <img
                src={svgToDataUrl(svg)}
                alt="پیش‌نمایش کارت آیه"
                className="max-h-full max-w-full rounded-xl object-contain"
              />
            </div>
            <span className="font-yekan text-[11px] text-muted-foreground mt-2">
              خروجی باکیفیت {format.width}×{format.height} پیکسل
            </span>
          </div>

          {/* Controls & Inputs */}
          <div className="space-y-4">
            {/* Format Selector Pills */}
            <div>
              <p className="mb-2 text-xs font-bold text-foreground">قالب ابعادی</p>
              <div className="grid grid-cols-2 gap-2">
                {CARD_FORMATS.map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setFormatId(f.id)}
                    className={`flex items-center justify-center gap-2 p-2.5 rounded-xl border text-xs font-bold transition-all ${
                      formatId === f.id
                        ? "bg-primary text-primary-foreground border-primary shadow-soft"
                        : "bg-secondary/60 border-border text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {f.id === "story" ? <Smartphone className="h-4 w-4" /> : <Square className="h-4 w-4" />}
                    <span>{f.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Inputs */}
            <div className="space-y-2.5">
              <input
                value={verseKey}
                onChange={(e) => setVerseKey(e.target.value)}
                placeholder="کلید آیه (مثلاً 2:255 یا 94:5)"
                className="w-full rounded-xl border border-border bg-secondary/40 px-3.5 py-2.5 text-xs focus:border-primary focus:outline-none"
              />
              <textarea
                value={arabic}
                onChange={(e) => setArabic(e.target.value)}
                rows={2}
                dir="rtl"
                placeholder="متن عربی آیه با خط عثمان طه…"
                className="font-arabic w-full resize-none rounded-xl border border-border bg-secondary/40 px-3.5 py-2.5 text-sm leading-loose focus:border-primary focus:outline-none"
              />
              <textarea
                value={translation}
                onChange={(e) => setTranslation(e.target.value)}
                rows={2}
                dir="rtl"
                placeholder="ترجمه پیام یا برداشت تدبّری کوتاه…"
                className="font-yekan w-full resize-none rounded-xl border border-border bg-secondary/40 px-3.5 py-2.5 text-xs focus:border-primary focus:outline-none"
              />
            </div>

            {/* Character Selection */}
            <div>
              <p className="mb-2 text-xs font-bold text-foreground">شخصیت و شمسه قرآنی</p>
              <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                {PRESETS.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setCharacterId(p.id)}
                    title={`${p.name} — ${p.epithet}`}
                    className={`shrink-0 rounded-full p-1 transition-all ${
                      characterId === p.id ? "ring-2 ring-primary shadow-soft" : "opacity-65 hover:opacity-100"
                    }`}
                  >
                    <CharacterAvatar config={p.cfg} size={36} />
                  </button>
                ))}
              </div>
            </div>

            {/* Royal Theme Palettes */}
            <div>
              <p className="mb-2 text-xs font-bold text-foreground">پالت رنگی اصیل ایرانی-اسلامی</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {CARD_THEMES.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setThemeId(t.id)}
                    className={`flex items-center gap-2 p-2 rounded-xl border text-xs font-medium transition-all ${
                      themeId === t.id
                        ? "border-primary bg-primary/10 ring-1 ring-primary font-bold text-foreground"
                        : "border-border/70 bg-card hover:bg-secondary text-muted-foreground"
                    }`}
                  >
                    <span
                      className="h-4 w-4 rounded-full border border-white/20 shrink-0"
                      style={{ background: `linear-gradient(135deg, ${t.from}, ${t.accent})` }}
                    />
                    <span className="truncate">{t.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {err && <p className="mt-3 text-xs text-destructive text-center">{err}</p>}

        {/* Action Buttons */}
        <div className="mt-6 flex flex-wrap items-center justify-end gap-2.5 border-t border-border pt-4">
          <button
            onClick={download}
            disabled={!ready || !!busy}
            className="inline-flex items-center gap-2 rounded-xl border border-border bg-secondary px-5 py-2.5 text-xs font-bold text-foreground hover:bg-secondary/70 disabled:opacity-40 transition-colors"
          >
            {busy === "download" ? <Loader2 className="h-4 w-4 animate-spin text-primary" /> : <Download className="h-4 w-4" />}
            دانلود تصویر {formatId === "story" ? "استوری" : "پست"}
          </button>
          <button
            onClick={publish}
            disabled={!ready || !!busy}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-xs font-bold text-primary-foreground shadow-soft hover:opacity-90 disabled:opacity-50 transition-all"
          >
            {busy === "publish" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            انتشار در جامعه قرآنی
          </button>
        </div>
      </div>
    </div>
  );
}
