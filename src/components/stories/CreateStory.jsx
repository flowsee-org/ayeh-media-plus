import { useState, useRef } from "react";
import api from "@/lib/api";
import { X, Loader2, Camera } from "lucide-react";

export default function CreateStory({ user, onPosted, onClose }) {
  const [mediaUrl, setMediaUrl] = useState("");
  const [mediaType, setMediaType] = useState("image");
  const [caption, setCaption] = useState("");
  const [verseKey, setVerseKey] = useState("");
  const [verseText, setVerseText] = useState("");
  const [uploading, setUploading] = useState(false);
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef(null);

  const handleFile = async (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setUploading(true);
    setError("");
    try {
      const isVideo = f.type.startsWith("video/");
      setMediaType(isVideo ? "video" : "image");
      const res = await api.integrations.Core.UploadPublicFile({ file: f });
      setMediaUrl(res.file_url);
    } catch {
      setError("خطا در بارگذاری فایل");
    }
    setUploading(false);
  };

  const handlePost = async () => {
    if (!mediaUrl) return;
    setPosting(true);
    setError("");
    try {
      await api.entities.Story.create({
        author_id: user?.id || "guest",
        author_name: user?.full_name || user?.phone || user?.email || "کاربر تدبّر",
        author_avatar: user?.avatar_url || "",
        media_url: mediaUrl,
        media_type: mediaType,
        caption: caption.trim(),
        verse_key: verseKey.trim(),
        verse_text: verseText.trim(),
        viewed_by: [],
      });
      onPosted?.();
      onClose?.();
    } catch (e) {
      setError(e?.data?.message || e?.message || "خطا در انتشار استوری");
    }
    setPosting(false);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-md rounded bg-card border border-accent/20 shadow-premium overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-accent/10">
          <h3 className="font-display font-bold text-base">استوری جدید</h3>
          <button
            onClick={onClose}
            className="h-8 w-8 rounded hover:bg-muted flex items-center justify-center text-muted-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Media preview */}
          {mediaUrl ? (
            <div className="relative rounded overflow-hidden border border-accent/10">
              {mediaType === "video" ? (
                <video src={mediaUrl} className="w-full max-h-64 object-contain bg-black" controls />
              ) : (
                <img src={mediaUrl} alt="preview" className="w-full max-h-64 object-contain bg-black/5" />
              )}
              <button
                onClick={() => {
                  setMediaUrl("");
                }}
                className="absolute top-2 left-2 h-8 w-8 rounded bg-black/50 text-white flex items-center justify-center"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => fileRef.current?.click()}
              className="w-full rounded border-2 border-dashed border-accent/20 p-8 flex flex-col items-center gap-2 text-muted-foreground hover:border-accent/40 hover:text-accent transition-colors"
            >
              {uploading ? (
                <Loader2 className="h-8 w-8 animate-spin" />
              ) : (
                <Camera className="h-8 w-8" />
              )}
              <span className="text-sm">
                {uploading ? "در حال بارگذاری..." : "انتخاب عکس یا ویدیو"}
              </span>
            </button>
          )}
          <input
            ref={fileRef}
            type="file"
            accept="image/*,video/*"
            onChange={handleFile}
            className="hidden"
          />

          {/* Caption */}
          {mediaUrl && (
            <>
              <textarea
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="متن استوری..."
                rows={2}
                className="w-full rounded border border-border bg-background px-3 py-2 text-sm resize-none focus:border-accent/40 focus:outline-none"
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  value={verseKey}
                  onChange={(e) => setVerseKey(e.target.value)}
                  placeholder="کلید آیه (مثلاً ۲:٢٥٥)"
                  className="rounded border border-border bg-background px-3 py-2 text-sm focus:border-accent/40 focus:outline-none"
                />
                <input
                  value={verseText}
                  onChange={(e) => setVerseText(e.target.value)}
                  placeholder="متن آیه (اختیاری)"
                  className="rounded border border-border bg-background px-3 py-2 text-sm focus:border-accent/40 focus:outline-none"
                />
              </div>
            </>
          )}

          {error && <p className="text-sm text-destructive text-center">{error}</p>}

          <button
            onClick={handlePost}
            disabled={!mediaUrl || posting}
            className="w-full rounded bg-primary text-primary-foreground py-3 font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary/90 transition-colors"
          >
            {posting ? "در حال انتشار..." : "انتشار استوری"}
          </button>
          <p className="text-xs text-muted-foreground/60 text-center">
            استوری شما ۲۴ ساعت پس از انتشار حذف خواهد شد.
          </p>
        </div>
      </div>
    </div>
  );
}