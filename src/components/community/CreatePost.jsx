import { useState } from "react";
import api from "@/lib/api";
import { X, Loader2, BookOpen, Sparkles, Image as ImageIcon, HelpCircle, Send, Video } from "lucide-react";
import { Avatar } from "./shared";
import { useScholar } from "@/lib/scholarAccess";

const TYPES = [
  { id: "reflection", label: "تدبّر", icon: Sparkles },
  { id: "verse_share", label: "آیه", icon: BookOpen },
  { id: "image", label: "تصویر", icon: ImageIcon },
  { id: "video", label: "کلیپ", icon: Video },
  { id: "question", label: "پرسش", icon: HelpCircle },
];

export default function CreatePost({ user, onClose, onPosted, initialVerse = null }) {
  const { isScholar } = useScholar();
  const [type, setType] = useState("verse_share");
  const [content, setContent] = useState("");
  const [verseKey, setVerseKey] = useState(initialVerse?.verse_key || "");
  const [verseText, setVerseText] = useState(initialVerse?.verse_text || "");
  const [verseArabic, setVerseArabic] = useState(initialVerse?.verse_arabic || "");
  const [imageUrl, setImageUrl] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [tags, setTags] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [err, setErr] = useState(null);

  const handleFile = async (file) => {
    if (!file) return;
    setUploading(true);
    try {
      const { file_url } = await api.integrations.Core.UploadFile({ file });
      setImageUrl(file_url);
    } catch {}
    setUploading(false);
  };

  const handleVideo = async (file) => {
    if (!file) return;
    setUploading(true);
    try {
      const { file_url } = await api.integrations.Core.UploadFile({ file });
      setVideoUrl(file_url);
    } catch {}
    setUploading(false);
  };

  const submit = async () => {
    if (!content.trim() && !imageUrl && !videoUrl && !verseKey.trim()) return;
    setSaving(true);
    setErr(null);
    try {
      const created = await api.entities.Post.create({
        author_id: user?.id || "guest",
        author_name: user?.full_name || user?.phone || user?.email || "کاربر تدبّر",
        author_avatar: user?.avatar_config || user?.avatar_url || "",
        content: content.trim(),
        type,
        verse_key: verseKey.trim() || undefined,
        verse_text: verseText.trim() || undefined,
        verse_arabic: verseArabic.trim() || undefined,
        media_url: type === "video" ? videoUrl : (imageUrl || undefined),
        media_type: type === "video" ? "video" : (imageUrl ? "image" : undefined),
        image_url: type === "image" ? imageUrl || undefined : undefined,
        video_url: type === "video" ? videoUrl || undefined : undefined,
        video_title: type === "video" ? content.trim() || "کلیپ" : undefined,
        tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
        likes_count: 0,
        comments_count: 0,
        liked_by: [],
      });
      onPosted(created);
    } catch (e) {
      setErr(e?.data?.message || e?.message || "خطا در انتشار پست");
    }
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
      <div className="bg-card rounded-3xl border border-border/40 w-full max-w-xl max-h-[85vh] overflow-y-auto p-6 shadow-premium animate-scale-in" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-display font-bold text-xl">پست جدید</h3>
          <button onClick={onClose} className="h-9 w-9 rounded-xl hover:bg-muted/50 flex items-center justify-center transition-colors"><X className="h-4 w-4" /></button>
        </div>

        <div className="flex items-center gap-3 mb-4">
          <Avatar name={user?.full_name || "؟"} size={40} avatar={user?.avatar_config} />
          <span className="text-sm font-medium">{user?.full_name || user?.email}</span>
        </div>

        <div className="flex gap-2 mb-4 flex-wrap">
          {TYPES.filter((t) => isScholar || t.id !== "reflection").map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setType(id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${type === id ? "bg-accent text-accent-foreground" : "bg-muted/50 text-muted-foreground hover:text-foreground"}`}
            >
              <Icon className="h-3.5 w-3.5" /> {label}
            </button>
          ))}
        </div>

        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={
            type === "question"
              ? "پرسش خود را بنویسید…"
              : type === "reflection"
              ? "تدبّر خود را بنویسید…"
              : "متن پست را بنویسید…"
          }
          rows={4}
          className="w-full bg-muted/30 rounded-xl border border-border/40 p-3 text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-accent/20 resize-none"
          dir="rtl"
        />

        {initialVerse && type === "verse_share" && (
          <p className="mb-3 mt-3 rounded-xl bg-accent/10 px-3 py-2 text-xs text-accent">
            آیه {initialVerse.verse_key} انتخاب شده است.
          </p>
        )}

        {type === "verse_share" && (
          <div className="space-y-2 mb-3 mt-3">
            <input value={verseKey} onChange={(e) => setVerseKey(e.target.value)} placeholder="کلید آیه (مثلاً 2:255)" className="w-full bg-muted/30 rounded-xl border border-border/40 p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent/20" />
            <input value={verseArabic} onChange={(e) => setVerseArabic(e.target.value)} placeholder="متن عربی آیه" className="w-full bg-muted/30 rounded-xl border border-border/40 p-2.5 text-sm font-arabic focus:outline-none focus:ring-2 focus:ring-accent/20" dir="rtl" />
            <input value={verseText} onChange={(e) => setVerseText(e.target.value)} placeholder="ترجمه آیه" className="w-full bg-muted/30 rounded-xl border border-border/40 p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent/20" dir="rtl" />
          </div>
        )}

        {type === "image" && (
          <div className="mb-3 mt-3">
            {imageUrl ? (
              <div className="relative">
                <img src={imageUrl} className="w-full rounded-xl max-h-60 object-cover" alt="preview" />
                <button onClick={() => setImageUrl("")} className="absolute top-2 left-2 h-11 w-11 rounded-full bg-black/50 text-white flex items-center justify-center"><X className="h-4 w-4" /></button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-border/50 rounded-xl p-8 cursor-pointer hover:border-accent/30 transition-colors">
                <ImageIcon className="h-8 w-8 text-muted-foreground/40" />
                <span className="text-sm text-muted-foreground">{uploading ? "در حال آپلود…" : "تصویر را آپلود کنید"}</span>
                <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFile(e.target.files[0])} />
              </label>
            )}
          </div>
        )}

        {type === "video" && (
          <div className="mb-3 mt-3">
            {videoUrl ? (
              <div className="relative">
                <video src={videoUrl} controls playsInline className="w-full rounded-xl max-h-60 bg-black" />
                <button onClick={() => setVideoUrl("")} className="absolute top-2 left-2 h-9 w-9 rounded-full bg-black/60 text-white flex items-center justify-center"><X className="h-4 w-4" /></button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-border/50 rounded-xl p-8 cursor-pointer hover:border-accent/30 transition-colors">
                <Video className="h-8 w-8 text-muted-foreground/40" />
                <span className="text-sm text-muted-foreground">{uploading ? "در حال آپلود…" : "کلیپ را آپلود کنید"}</span>
                <input type="file" accept="video/*" className="hidden" onChange={(e) => handleVideo(e.target.files[0])} />
              </label>
            )}
          </div>
        )}

        <input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="برچسب‌ها (با کاما جدا کنید)" className="w-full bg-muted/30 rounded-xl border border-border/40 p-2.5 text-sm mt-3 mb-3 focus:outline-none focus:ring-2 focus:ring-accent/20" />

        {err && <p className="text-sm text-destructive mb-3">{err}</p>}

        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 rounded-full text-sm border border-border/50 text-muted-foreground hover:text-foreground transition-colors">انصراف</button>
          <button onClick={submit} disabled={saving || uploading || (!content.trim() && !imageUrl && !videoUrl && !verseKey.trim())} className="inline-flex items-center gap-2 px-5 py-2 rounded-full text-sm bg-accent text-accent-foreground font-medium hover:shadow-glow transition-all disabled:opacity-50">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            انتشار
          </button>
        </div>
      </div>
    </div>
  );
}