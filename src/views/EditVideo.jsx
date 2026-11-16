'use client';

import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "@/lib/router-compat";
import api from "@/lib/api";
import { useAuth } from "@/lib/AuthContext";
import { toast } from "react-hot-toast";
import { fa } from "@/lib/utils";
import { Loader2, Trash2, Save, ArrowLeft, Play, Video as VideoIcon, Mic, BookOpen } from "lucide-react";

/**
 * Ayeh Media Plus — Edit Video Page
 * Allows video owners to edit metadata and manage their published content.
 */
export default function EditVideoPage({ videoId }) {
 const navigate = useNavigate();
 const { user: authUser } = useAuth();

 const [video, setVideo] = useState(null);
 const [loading, setLoading] = useState(true);
 const [saving, setSaving] = useState(false);
 const [deleting, setDeleting] = useState(false);

 // Edit form state
 const [form, setForm] = useState({
 title: "",
 description: "",
 category: "recitation",
 tags: [],
 verse_key: "",
 verse_arabic: "",
 is_competition: false,
 });

 const CATEGORIES = [
 { value: "recitation", label: "تلاوت قرآن" },
 { value: "tafsir", label: "تفسیر و تدبّر" },
 { value: "competition", label: "مسابقه قرآنی" },
 { value: "gathering", label: "محفل قرآنی" },
 { value: "lecture", label: "سمینار و سخنرانی" },
 { value: "nasheed", label: "ناشید و مداحی" },
 ];

 const loadVideo = useCallback(async () => {
 try {
 setLoading(true);
 const vid = await api.videos.get(videoId);
 if (!vid) {
 toast.error("ویدیو یافت نشد.");
 navigate("/creator");
 return;
 }

 // Check ownership
 if (vid.reciter_id !== authUser?.id && authUser?.role !== 'admin' && authUser?.role !== 'moderator') {
 toast.error("شما مجاز به ویرایش این محتوا نیستید.");
 navigate("/creator");
 return;
 }

 const qualities = vid.qualities ? (typeof vid.qualities === 'string' ? JSON.parse(vid.qualities) : vid.qualities) : [];

 setForm({
 title: vid.title || "",
 description: vid.description || "",
 category: vid.category || "recitation",
 tags: Array.isArray(vid.tags) ? vid.tags : (vid.tags ? JSON.parse(vid.tags) : []),
 verse_key: vid.verse_key || "",
 verse_arabic: vid.verse_arabic || "",
 is_competition: vid.is_competition || false,
 });

 setVideo({
 ...vid,
 qualities,
 hls_url: vid.hls_url,
 thumbnail_url: vid.thumbnail_url,
 media_url: vid.media_url,
 status: vid.status,
 views_count: vid.views_count,
 likes_count: vid.likes_count,
 });
 } catch (err) {
 toast.error("خطا در بارگذاری ویدیو: " + (err.message || "خطای نامشخص"));
 } finally {
 setLoading(false);
 }
 }, [videoId, authUser?.id, authUser?.role, navigate]);

 useEffect(() => {
 loadVideo();
 }, [loadVideo]);

 const handleInputChange = (key, value) => {
 setForm(prev => ({ ...prev, [key]: value }));
 };

 const toggleTag = (tag) => {
 setForm(prev => {
 const tags = [...prev.tags];
 const idx = tags.indexOf(tag);
 if (idx >= 0) tags.splice(idx, 1);
 else tags.push(tag);
 return { ...prev, tags };
 });
 };

 const addTag = (e) => {
 if (e.key === "Enter") {
 e.preventDefault();
 const v = e.target.value.trim();
 if (v && !form.tags.includes(v)) {
 setForm(prev => ({ ...prev, tags: [...prev.tags, v] }));
 }
 e.target.value = "";
 }
 };

 const handleSave = async (e) => {
 e.preventDefault();
 if (!form.title.trim()) {
 toast.error("عنوان الزامی است");
 return;
 }

 setSaving(true);
 try {
 const updated = await api.videos.update(videoId, {
 title: form.title.trim(),
 description: form.description.trim(),
 category: form.category,
 tags: form.tags,
 verse_key: form.verse_key.trim() || undefined,
 verse_arabic: form.verse_arabic.trim() || undefined,
 });

 if (updated?.status === "pending_review") {
 toast.success("ذخیره شد و برای بررسی مجدد ارسال گردید.");
 } else {
 toast.success("محتوا با موفقیت به‌روزرسانی شد.");
 }
 setVideo(prev => ({ ...prev, ...updated }));
 navigate(updated?.status === "pending_review" ? "/creator" : `/watch/${videoId}`);
 } catch (err) {
 toast.error("خطا در به‌روزرسانی محتوا: " + (err.message || "خطای نامشخص"));
 } finally {
 setSaving(false);
 }
 };

 const handleDelete = async () => {
 if (!confirm("آیا از حذف این محتوا اطمینان دارید؟ این操作 ن قابل بازگشت نیست.")) return;
 setDeleting(true);
 try {
 await api.videos.delete(videoId);
 toast.success("محتوا حذف شد.");
 navigate("/creator");
 } catch (err) {
 toast.error("خطا در حذف محتوا.");
 } finally {
 setDeleting(false);
 }
 };

 if (loading) {
 return (
 <div className="flex flex-col items-center justify-center min-h-[60vh]">
 <Loader2 className="h-10 w-10 animate-spin text-accent mb-4" />
 <p className="text-muted-foreground font-doran">در حال بارگذاری...</p>
 </div>
 );
 }

 if (!video) return null;

 const isOwnerOrStaff = authUser &&
 (video.reciter_id === authUser.id || authUser.role === 'admin' || authUser.role === 'moderator');

 if (!isOwnerOrStaff) {
 return (
 <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-6">
 <AlertCircle className="h-12 w-12 text-muted-foreground/30 mb-4" />
 <h2 className="font-rokh-bold font-bold text-xl text-foreground mb-2">دسترسی مجاز نیست</h2>
 <p className="text-muted-foreground mb-6">شما مجاز به ویرایش این محتوا نیستید.</p>
 <button onClick={() => navigate("/creator")} className="px-6 py-3 rounded bg-quranic-emerald text-white text-sm font-medium hover:bg-quranic-emerald/90 transition-colors">
 بازگشت به داشبورد
 </button>
 </div>
 );
 }

 return (
 <div className="page-shell-narrow animate-fade-in font-doran">
 <div className="mb-8 flex items-center justify-between">
 <LinkBack onClick={() => navigate(`/watch/${videoId}`)} label="بازگشت به ویدیو" />
 <h1 className="font-rokh-bold font-bold text-2xl sm:text-3xl text-foreground">ویرایش محتوای ویدیویی</h1>
 </div>

 {/* Video info card */}
 <div className="rounded border border-border bg-card p-6 mb-8 shadow-soft">
 <div className="flex items-center gap-4 mb-4">
 <div className="h-12 w-12 rounded bg-muted flex items-center justify-center">
 {video.media_type === 'audio' ? <Mic className="h-6 w-6 text-muted-foreground/60" /> : <VideoIcon className="h-6 w-6 text-muted-foreground/60" />}
 </div>
 <div className="flex-1 min-w-0">
 <div className="font-medium text-foreground truncate">{video.title}</div>
 <div className="text-xs text-muted-foreground mt-0.5">
 {video.status} · {formattedDuration(video)} · {fa(video.views_count || 0)} بازدید
 </div>
 </div>
 <span className={`px-2 py-1 rounded text-xs font-bold border ${
 video.status === 'published' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
 video.status === 'pending_review' ? 'bg-amber-50 text-amber-700 border-amber-100' :
 'bg-muted/50 text-muted-foreground border-border'
 }`}>
 {video.status === 'published' ? 'منتشر شده' : video.status === 'pending_review' ? 'در انتظار بررسی' : video.status}
 </span>
 </div>

 {video.hls_url && video.qualities && video.qualities.length > 0 && (
 <div className="mt-4 pt-4 border-t border-border/50">
 <div className="text-xs font-medium text-muted-foreground mb-2">کیفیت‌های transcoding شده</div>
 <div className="flex flex-wrap gap-2">
 {video.qualities.map((q) => (
 <span key={q.name} className="px-3 py-1 rounded bg-quranic-emerald/10 text-quranic-emerald text-xs font-bold border border-quranic-emerald/20">
 {q.name} ({q.bitrate}kbps)
 </span>
 ))}
 </div>
 </div>
 )}
 </div>

 <form onSubmit={handleSave} className="space-y-6">
 <div>
 <label className="block text-xs font-bold text-foreground font-ui mb-1.5">
 عنوان محتوای <span className="text-red-500">*</span>
 </label>
 <input
 type="text"
 value={form.title}
 onChange={(e) => handleInputChange('title', e.target.value)}
 placeholder="عنوان ویدیو را وارد کنید..."
 className="w-full px-4 py-3 rounded bg-background border border-input text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
 />
 </div>

 <div>
 <label className="block text-xs font-bold text-foreground font-ui mb-1.5">دسته‌بندی</label>
 <select
 value={form.category}
 onChange={(e) => handleInputChange('category', e.target.value)}
 className="w-full px-4 py-3 rounded bg-background border border-input text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
 >
 {CATEGORIES.map((cat) => (
 <option key={cat.value} value={cat.value}>{cat.label}</option>
 ))}
 </select>
 </div>

 <div>
 <label className="block text-xs font-bold text-foreground font-ui mb-1.5">توضیحات</label>
 <textarea
 value={form.description}
 onChange={(e) => handleInputChange('description', e.target.value)}
 rows={4}
 placeholder="توضیح کوتاه درباره محتوای..."
 className="w-full px-4 py-3 rounded bg-background border border-input text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 resize-none"
 />
 </div>

 <div>
 <label className="block text-xs font-bold text-foreground font-ui mb-1.5">مرجع آیه (اختیاری)</label>
 <div className="flex gap-2">
 <input
 type="text"
 value={form.verse_key}
 onChange={(e) => handleInputChange('verse_key', e.target.value)}
 placeholder="مثلاً 2:255"
 className="flex-1 px-4 py-3 rounded bg-background border border-input text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
 />
 <input
 type="text"
 value={form.verse_arabic}
 onChange={(e) => handleInputChange('verse_arabic', e.target.value)}
 placeholder="متن آیه..."
 className="flex-1 px-4 py-3 rounded bg-background border border-input text-sm dir-rtl focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
 />
 </div>
 </div>

 <div>
 <label className="block text-xs font-bold text-foreground font-ui mb-1.5">تگ‌ها</label>
 <div className="flex flex-wrap gap-2">
 {form.tags.map((tag, i) => (
 <div key={i} className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-emerald-50 text-emerald-700 text-xs font-medium border border-emerald-100">
 <span>{tag}</span>
 <button
 onClick={() => toggleTag(tag)}
 className="text-emerald-500 hover:text-emerald-700"
 >
 ×
 </button>
 </div>
 ))}
 <input
 type="text"
 onKeyDown={addTag}
 placeholder="افزودن تگ و Enter..."
 className="flex-1 px-4 py-3 rounded bg-background border border-input text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 placeholder:text-muted-foreground/50"
 />
 </div>
 </div>

 <div className="flex items-center gap-3 mt-4">
 <input
 type="checkbox"
 checked={form.is_competition}
 onChange={(e) => handleInputChange('is_competition', e.target.checked)}
 className="rounded bg-background border-input text-emerald-600 focus:ring-emerald-500"
 />
 <label className="text-sm text-muted-foreground font-ui cursor-pointer">
 محتوای مسابقه‌ای
 </label>
 </div>

 <div className="flex items-center justify-between pt-6 border-t border-border/50">
 <button
 type="button"
 onClick={handleDelete}
 disabled={deleting}
 className="px-6 py-3 rounded bg-transparent text-destructive border border-destructive/50 hover:bg-destructive/50 font-medium transition-all disabled:opacity-50"
 >
 {deleting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Trash2 className="h-4 w-4 mr-2" />} حذف محتوا
 </button>
 <button
 type="submit"
 disabled={saving}
 className="px-8 py-3 rounded bg-quranic-emerald text-white font-bold hover:bg-quranic-emerald/90 shadow-saffron-glow transition-all disabled:opacity-50 flex items-center gap-2"
 >
 {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} ذخیره تغییرات
 </button>
 </div>
 </form>
 </div>
 );
}

function LinkBack({ onClick, label }) {
 return (
 <button
 onClick={onClick}
 className="inline-flex items-center gap-2 px-4 py-2.5 rounded bg-muted text-muted-foreground font-medium hover:bg-muted/80 transition-colors"
 >
 <ArrowLeft className="h-4 w-4" />
 <span>{label}</span>
 </button>
 );
}

function formattedDuration(video) {
 if (!video) return "";
 const dur = video.source_duration || video.duration;
 if (!dur) return "";
 const m = Math.floor(dur / 60);
 const s = dur % 60;
 return `${m}:${s.toString().padStart(2, "0")}`;
}
