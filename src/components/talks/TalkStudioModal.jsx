import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { toast } from "react-hot-toast";
import {
  X,
  Upload,
  Plus,
  Trash2,
  Mic,
  Sparkles,
  Loader2,
} from "lucide-react";
import { IslamicStar } from "@/components/IslamicOrnaments";

function parseTimestampToSeconds(ts) {
  if (!ts) return 0;
  const parts = ts.trim().split(":").map(Number);
  if (parts.length === 2) {
    return (parts[0] || 0) * 60 + (parts[1] || 0);
  }
  if (parts.length === 3) {
    return (parts[0] || 0) * 3600 + (parts[1] || 0) * 60 + (parts[2] || 0);
  }
  return 0;
}

export default function TalkStudioModal({ isOpen, onClose, onCreated, user }) {
  const [step, setStep] = useState(1); // 1: details | 2: chapters | 3: verses & submit
  const [loading, setLoading] = useState(false);
  const [uploadingAudio, setUploadingAudio] = useState(false);

  // Form states
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [audioUrl, setAudioUrl] = useState("");
  const [coverUrl, setCoverUrl] = useState("");
  const [duration, setDuration] = useState("");
  const [verseKeyInput, setVerseKeyInput] = useState("");
  const [chapters, setChapters] = useState([
    { title: "مقدمه و ورود به بحث", timestamp: "00:00" },
  ]);

  if (!isOpen) return null;

  const handleAudioUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingAudio(true);
    try {
      const res = await base44.integrations.Core.UploadPublicFile({ file });
      if (res.file_url) {
        setAudioUrl(res.file_url);
        toast.success("فایل صوتی با موفقیت بارگذاری شد");
      }
    } catch {
      toast.error("خطا در بارگذاری فایل صوتی");
    } finally {
      setUploadingAudio(false);
    }
  };

  const handleAddChapter = () => {
    setChapters([...chapters, { title: "", timestamp: "00:00" }]);
  };

  const handleUpdateChapter = (index, field, value) => {
    const updated = [...chapters];
    updated[index] = { ...updated[index], [field]: value };
    setChapters(updated);
  };

  const handleRemoveChapter = (index) => {
    if (chapters.length <= 1) return;
    setChapters(chapters.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!title.trim() || !audioUrl.trim()) {
      toast.error("لطفاً عنوان و فایل صوتی گفتار را تکمیل فرمایید");
      setStep(1);
      return;
    }

    setLoading(true);
    try {
      const parsedChapters = chapters
        .filter((c) => c.title.trim())
        .map((c) => ({
          title: c.title.trim(),
          timestamp: c.timestamp.trim() || "00:00",
          seconds: parseTimestampToSeconds(c.timestamp),
        }));

      const verseKeys = verseKeyInput
        .split(/[,،\s]+/)
        .map((k) => k.trim())
        .filter(Boolean);

      const created = await base44.entities.Podcast.create({
        title: title.trim(),
        scholar_id: user?.id || null,
        scholar_name: user?.full_name || user?.email || "استاد محترم",
        scholar_avatar: user?.avatar_url || user?.avatar_config || "",
        audio_url: audioUrl.trim(),
        cover_image: coverUrl.trim() || "/images/fd38dd0b5_generated_image.png",
        duration: duration.trim() || "۱۵:۰۰",
        description: description.trim(),
        chapters: parsedChapters,
        verse_keys: verseKeys,
        views_count: 0,
        likes_count: 0,
      });

      toast.success("درس‌گفتار صوتی با موفقیت در سامانه منتشر شد");
      onCreated?.(created);
      onClose();
    } catch (err) {
      toast.error(err.message || "خطا در انتشار گفتار");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      dir="rtl"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-xl rounded-3xl border border-accent/40 bg-card/95 backdrop-blur-xl shadow-premium p-6 sm:p-8 overflow-hidden text-right max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="pattern-islamic absolute inset-0 opacity-10 pointer-events-none" />

        {/* Modal Header */}
        <div className="relative flex items-center justify-between pb-4 border-b border-border/60">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-accent/15 border border-accent/30 text-accent flex items-center justify-center">
              <Mic className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-display font-bold text-base sm:text-lg text-foreground">
                استودیوی انتشار گفتار تفسیری و پادکست
              </h3>
              <p className="text-xs text-muted-foreground">
                استاد: {user?.full_name || "کاربر پژوهشگر"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="h-8 w-8 rounded-lg hover:bg-secondary flex items-center justify-center text-muted-foreground transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Steps Indicator */}
        <div className="relative flex items-center justify-between px-4 py-3 my-2 bg-secondary/50 rounded-2xl border border-border/40 text-xs font-bold">
          <button
            onClick={() => setStep(1)}
            className={`flex items-center gap-1.5 transition-colors ${
              step === 1 ? "text-accent" : "text-muted-foreground"
            }`}
          >
            <span className="h-5 w-5 rounded-full bg-accent/20 flex items-center justify-center text-[11px]">
              ۱
            </span>
            <span>مشخصات گفتار</span>
          </button>
          <span className="text-border">←</span>
          <button
            onClick={() => setStep(2)}
            className={`flex items-center gap-1.5 transition-colors ${
              step === 2 ? "text-accent" : "text-muted-foreground"
            }`}
          >
            <span className="h-5 w-5 rounded-full bg-accent/20 flex items-center justify-center text-[11px]">
              ۲
            </span>
            <span>فصل‌بندی زمانی</span>
          </button>
          <span className="text-border">←</span>
          <button
            onClick={() => setStep(3)}
            className={`flex items-center gap-1.5 transition-colors ${
              step === 3 ? "text-accent" : "text-muted-foreground"
            }`}
          >
            <span className="h-5 w-5 rounded-full bg-accent/20 flex items-center justify-center text-[11px]">
              ۳
            </span>
            <span>آیات و انتشار</span>
          </button>
        </div>

        {/* Form Body */}
        <div className="relative flex-1 overflow-y-auto py-3 space-y-4 pr-1">
          {step === 1 && (
            <div className="space-y-4 animate-fade-in">
              <div>
                <label className="block text-xs font-bold text-foreground mb-1.5">
                  عنوان درس‌گفتار <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="مثال: شرح و تدبر در آیه الکرسی — توحید و ولایت الهی"
                  className="w-full px-4 py-2.5 rounded-xl border border-border bg-secondary/50 text-foreground text-sm focus:outline-none focus:border-accent"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-foreground mb-1.5">
                  توضیحات و محورهای اصلی بحث
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="خلاصه‌ای از مباحث ارائه شده در این درس تفسیری..."
                  className="w-full px-4 py-2.5 rounded-xl border border-border bg-secondary/50 text-foreground text-sm focus:outline-none focus:border-accent"
                />
              </div>

              {/* Audio Upload or URL */}
              <div>
                <label className="block text-xs font-bold text-foreground mb-1.5">
                  فایل صوتی پادکست (MP3 یا M4A) <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={audioUrl}
                    onChange={(e) => setAudioUrl(e.target.value)}
                    placeholder="https://... یا بارگذاری مستقیم فایل"
                    className="flex-1 px-4 py-2.5 rounded-xl border border-border bg-secondary/50 text-foreground text-xs focus:outline-none focus:border-accent font-mono"
                    dir="ltr"
                  />
                  <label className="cursor-pointer px-4 py-2.5 rounded-xl bg-accent text-stone-950 text-xs font-bold flex items-center gap-1.5 hover:bg-accent/90 transition-all shrink-0">
                    {uploadingAudio ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Upload className="h-4 w-4" />
                    )}
                    <span>آپلود فایل</span>
                    <input
                      type="file"
                      accept="audio/*"
                      onChange={handleAudioUpload}
                      className="hidden"
                      disabled={uploadingAudio}
                    />
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-foreground mb-1.5">
                    مدت زمان تقریبی
                  </label>
                  <input
                    type="text"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    placeholder="مثال: ۱۸:۴۰"
                    className="w-full px-4 py-2 rounded-xl border border-border bg-secondary/50 text-foreground text-sm focus:outline-none focus:border-accent"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-foreground mb-1.5">
                    آدرس تصویر کاور
                  </label>
                  <input
                    type="url"
                    value={coverUrl}
                    onChange={(e) => setCoverUrl(e.target.value)}
                    placeholder="/images/... یا لینک مستقیم"
                    className="w-full px-4 py-2 rounded-xl border border-border bg-secondary/50 text-foreground text-xs focus:outline-none focus:border-accent"
                    dir="ltr"
                  />
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-3 animate-fade-in">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-foreground">
                    فصل‌های درس‌گفتار (Chapters)
                  </h4>
                  <p className="text-[11px] text-muted-foreground">
                    کاربر با کلیک روی هر فصل مستقیماً به زمان تعیین‌شده هدایت می‌شود.
                  </p>
                </div>
                <button
                  onClick={handleAddChapter}
                  className="px-3 py-1.5 rounded-xl bg-secondary hover:bg-secondary/80 text-accent text-xs font-bold flex items-center gap-1 transition-colors"
                >
                  <Plus className="h-3.5 w-3.5" />
                  افزودن فصل
                </button>
              </div>

              <div className="space-y-2 mt-2">
                {chapters.map((ch, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2 p-2.5 rounded-2xl border border-border/70 bg-secondary/30"
                  >
                    <span className="h-6 w-6 rounded-lg bg-secondary text-muted-foreground flex items-center justify-center text-xs font-bold shrink-0">
                      {(idx + 1).toLocaleString("fa-IR")}
                    </span>
                    <input
                      type="text"
                      value={ch.title}
                      onChange={(e) => handleUpdateChapter(idx, "title", e.target.value)}
                      placeholder="عنوان این سرفصل..."
                      className="flex-1 px-3 py-1.5 rounded-xl border border-border bg-card text-foreground text-xs focus:outline-none focus:border-accent"
                    />
                    <input
                      type="text"
                      value={ch.timestamp}
                      onChange={(e) => handleUpdateChapter(idx, "timestamp", e.target.value)}
                      placeholder="00:00"
                      className="w-20 px-2.5 py-1.5 rounded-xl border border-border bg-card text-foreground text-xs font-mono text-center focus:outline-none focus:border-accent"
                      dir="ltr"
                    />
                    {chapters.length > 1 && (
                      <button
                        onClick={() => handleRemoveChapter(idx)}
                        className="h-8 w-8 rounded-lg hover:bg-destructive/15 text-muted-foreground hover:text-destructive flex items-center justify-center transition-colors shrink-0"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4 animate-fade-in">
              <div>
                <label className="block text-xs font-bold text-foreground mb-1.5">
                  آیات مرتبط در مصحف شریف (Verse Keys)
                </label>
                <input
                  type="text"
                  value={verseKeyInput}
                  onChange={(e) => setVerseKeyInput(e.target.value)}
                  placeholder="مثال: 2:255, 1:1, 1:6"
                  className="w-full px-4 py-2.5 rounded-xl border border-border bg-secondary/50 text-foreground text-sm focus:outline-none focus:border-accent font-mono"
                  dir="ltr"
                />
                <p className="text-[11px] text-muted-foreground mt-1">
                  آیات را با ویرگول جدا فرمایید. در پلیر صوتی دکمه دسترسی مستقیم به متن این آیات نمایش داده خواهد شد.
                </p>
              </div>

              {/* Review card summary */}
              <div className="p-4 rounded-2xl border border-accent/30 bg-accent/5 space-y-2">
                <div className="flex items-center gap-2">
                  <IslamicStar size={14} className="text-accent" />
                  <span className="font-display font-bold text-xs text-foreground">
                    پیش‌نمایش کارت گفتار:
                  </span>
                </div>
                <div className="font-bold text-sm text-foreground">{title || "بدون عنوان"}</div>
                <div className="text-xs text-muted-foreground">
                  استاد: {user?.full_name || "نامشخص"} • مدت: {duration || "۱۵:۰۰"} • سرفصل‌ها:{" "}
                  {chapters.length.toLocaleString("fa-IR")} بخش
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Actions Footer */}
        <div className="relative pt-4 border-t border-border/60 flex items-center justify-between">
          {step > 1 ? (
            <button
              onClick={() => setStep(step - 1)}
              className="px-4 py-2 rounded-xl bg-secondary hover:bg-secondary/80 text-foreground text-xs font-bold transition-colors"
            >
              مرحله قبل
            </button>
          ) : (
            <div />
          )}

          {step < 3 ? (
            <button
              onClick={() => setStep(step + 1)}
              className="px-5 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold transition-all hover:shadow-emerald-glow"
            >
              گام بعدی ←
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-accent to-yellow-500 hover:from-accent/90 text-stone-950 text-xs font-bold shadow-gold-glow flex items-center gap-1.5 transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4" />
              )}
              <span>انتشار درس‌گفتار</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
