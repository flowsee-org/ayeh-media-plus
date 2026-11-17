'use client';

import { useState, useCallback, useRef, useMemo } from "react";
import { useNavigate } from "@/lib/router-compat";
import api from "@/lib/api";
import { useAuth } from "@/lib/AuthContext";
import { toast } from "react-hot-toast";
import {
 Upload, Mic, FileAudio, BookOpen, Check, X,
 ChevronRight, ChevronLeft, Video, Loader2,
 AlertCircle, Play,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

const STEPS = [
 { id: "media", label: "انتخاب محتوا", icon: Upload },
 { id: "metadata", label: "متادیتا و مشخصات", icon: BookOpen },
 { id: "preview", label: "پیش‌نمایش و تایید", icon: Check },
 { id: "submit", label: "ارسال برای بررسی", icon: Play },
];

export default function SubmissionWizard({ competitionId, onComplete }) {
 const navigate = useNavigate();
 const { user: authUser, openAuthModal } = useAuth();
 const [stepIndex, setStepIndex] = useState(0);
 const [form, setForm] = useState({
 media_url: null,
 media_type: "video",
 file: null,
 title: "",
 description: "",
 category: "recitation",
 verse_key: "",
 verse_arabic: "",
 competition_id: competitionId || null,
 is_competition: !!competitionId,
 tags: [],
 });
 const [errors, setErrors] = useState({});
 const [submitting, setSubmitting] = useState(false);

 const step = STEPS[stepIndex];
 const isLastStep = stepIndex === STEPS.length - 1;
 const isFirstStep = stepIndex === 0;

 const nextStep = () => {
 if (stepIndex < STEPS.length - 1) setStepIndex((i) => i + 1);
 };

 const prevStep = () => {
 if (stepIndex > 0) setStepIndex((i) => i - 1);
 };

 const isFormValid = useMemo(() => {
 const newErrors = {};
 switch (step.id) {
 case "media":
 if (!form.media_url && !form.file) newErrors.media = "فایل صوتی/ویدیویی را انتخاب کنید";
 break;
 case "metadata":
 if (!form.title.trim()) newErrors.title = "عنوان الزامی است";
 if (!form.category) newErrors.category = "دسته‌بندی الزامی است";
 break;
 }
 return Object.keys(newErrors).length === 0;
 }, [step.id, form]);

 const validateStep = useCallback(() => {
 const newErrors = {};
 switch (step.id) {
 case "media":
 if (!form.media_url && !form.file) newErrors.media = "فایل صوتی/ویدیویی را انتخاب کنید";
 break;
 case "metadata":
 if (!form.title.trim()) newErrors.title = "عنوان الزامی است";
 if (!form.category) newErrors.category = "دسته‌بندی الزامی است";
 break;
 }
 setErrors(newErrors);
 return Object.keys(newErrors).length === 0;
 }, [step.id, form]);

 const handleFileChange = (e) => {
 const file = e.target.files?.[0];
 if (file) {
 setForm((prev) => ({
 ...prev,
 file,
 media_type: file.type.startsWith("video") ? "video" : "audio",
 }));
 }
 };

 const handleSubmit = async (e) => {
 e.preventDefault();
 if (!authUser) { openAuthModal(); return; }
 if (!validateStep()) return;

 setSubmitting(true);
 try {
 let mediaUrl = form.media_url;
 let hlsUrl = null;
 let qualities = null;
 let thumbnailUrl = null;
 let duration = null;
 let sourceWidth = null;
 let sourceHeight = null;

 if (form.file) {
 const uploadRes = await api.integrations.Core.UploadFile({ file: form.file });
 mediaUrl = uploadRes.file_url;

 // Apply transcoding data if returned by the server
 if (uploadRes.transcoding) {
 hlsUrl = uploadRes.transcoding.hls_url;
 qualities = uploadRes.transcoding.qualities;
 thumbnailUrl = uploadRes.transcoding.thumbnail_url;
 duration = uploadRes.transcoding.duration;
 sourceWidth = uploadRes.transcoding.width;
 sourceHeight = uploadRes.transcoding.height;
 }
 }

 const isStaff = authUser.role === "admin" || authUser.role === "moderator";

 // Canonical create path — ownership/status assigned server-side from session.
 await api.videos.create({
 title: form.title,
 description: form.description,
 category: form.category,
 media_url: mediaUrl,
 media_type: form.media_type,
 verse_key: form.verse_key || undefined,
 verse_arabic: form.verse_arabic || undefined,
 competition_id: form.competition_id || undefined,
 is_competition: form.is_competition,
 tags: form.tags,
 reciter_name: authUser.full_name || "کاربر آیه",
 thumbnail_url: thumbnailUrl || undefined,
 duration: duration || undefined,
 hls_url: hlsUrl || undefined,
 qualities: qualities || undefined,
 source_width: sourceWidth || undefined,
 source_height: sourceHeight || undefined,
 source_duration: duration || undefined,
 });

 toast.success(isStaff ? "محتوای شما منتشر شد!" : "محتوای شما برای بررسی ارسال شد.");
 if (onComplete) onComplete();
 navigate("/creator");
 } catch (err) {
 toast.error(err.message || "خطا در ارسال محتوا");
 } finally { setSubmitting(false); }
 };

 const progress = ((stepIndex + 1) / STEPS.length) * 100;
 const isStaff = authUser && (authUser.role === "admin" || authUser.role === "moderator");

 return (
 <div className="page-shell-narrow py-6 sm:py-8 font-doran">
 <div className="rounded border border-border bg-card p-8 mb-8 shadow-soft">
 <div className="flex items-center gap-3 mb-6">
 <div className="flex-1 h-1 bg-border rounded">
 <div className="h-full bg-gradient-to-r from-primary to-primary/70 rounded transition-all" style={{ width: `${progress}%` }} />
 </div>
 <span className="text-xs font-bold font-ui text-muted-foreground uppercase tracking-wider">
 {stepIndex + 1} از {STEPS.length}
 </span>
 </div>
 <div className="flex gap-2">
 {STEPS.map((s, i) => (
 <div key={s.id} className={`flex items-center gap-2 px-3 py-1.5 rounded text-xs font-medium transition-all ${
 i === stepIndex ? "bg-primary text-primary-foreground shadow-sm" :
 i < stepIndex ? "bg-primary/10 text-primary border border-primary/20" :
 "bg-transparent text-muted-foreground border border-border/50"
 }`}>
 <s.icon className="h-3 w-3" />
 <span>{s.label}</span>
 </div>
 ))}
 </div>
 </div>

 <AnimatePresence mode="wait">
 <motion.div key={step.id} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }} className="space-y-6">
 {step.id === "media" && <MediaStep form={form} setForm={setForm} handleFileChange={handleFileChange} errors={errors} />}
 {step.id === "metadata" && <MetadataStep form={form} setForm={setForm} errors={errors} />}
 {step.id === "preview" && <PreviewStep form={form} errors={errors} />}
 {step.id === "submit" && <SubmitStep form={form} submitting={submitting} onSubmit={handleSubmit} />}
 </motion.div>
 </AnimatePresence>

 <div className="flex items-center justify-between pt-6 border-t border-border/50">
 <div className="text-xs text-muted-foreground font-ui">
 {isStaff ? "بصورت مدیر، محتوای شما بلافاصله منتشر می‌شود" : "محتوا پس از بررسی ناظرین منتشر می‌شود"}
 </div>
 <div className="flex gap-3">
 {!isFirstStep && (
 <button onClick={prevStep} className="px-6 py-3 rounded bg-transparent text-muted-foreground font-medium hover:bg-muted transition-colors border border-border/50">
 <ChevronLeft className="h-4 w-4 mr-2" /> بازگشت
 </button>
 )}
 {!isLastStep ? (
 <button disabled={!isFormValid} onClick={nextStep} className="px-8 py-3 rounded bg-primary text-primary-foreground font-medium hover:bg-primary/90 shadow-sm disabled:opacity-50">
 بعدی <ChevronRight className="h-4 w-4 ml-2" />
 </button>
 ) : (
 <button onClick={handleSubmit} disabled={submitting} className="px-8 py-3 rounded bg-primary text-primary-foreground font-bold hover:bg-primary/90 shadow-sm flex items-center gap-2 disabled:opacity-50">
 {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "ارسال نهایی"}
 {!submitting && <ChevronRight className="h-4 w-4 ml-2" />}
 </button>
 )}
 </div>
 </div>
 </div>
 );
}

function MediaStep({ form, setForm, handleFileChange, errors }) {
 const [tab, setTab] = useState("upload");
 const [isRecording, setIsRecording] = useState(false);
 const [recordedUrl, setRecordedUrl] = useState(null);
 const [recordingTime, setRecordingTime] = useState(0);
 const [cameraError, setCameraError] = useState(null);
 const mediaRecorderRef = useRef(null);
 const chunksRef = useRef([]);
 const timerRef = useRef(null);

 const startRecording = async () => {
 try {
 const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
 mediaRecorderRef.current = new MediaRecorder(stream, { mimeType: "video/webm" });
 chunksRef.current = [];
 mediaRecorderRef.current.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
 mediaRecorderRef.current.onstop = () => {
 const blob = new Blob(chunksRef.current, { type: "video/webm" });
 const url = URL.createObjectURL(blob);
 setRecordedUrl(url);
 setForm((prev) => ({ ...prev, file: new File([blob], `rec-${Date.now()}.webm`, { type: "video/webm" }), media_type: "video" }));
 stream.getTracks().forEach((t) => t.stop());
 };
 mediaRecorderRef.current.start();
 setIsRecording(true);
 timerRef.current = setInterval(() => setRecordingTime((t) => t + 1), 1000);
 } catch { setCameraError("دسترسی به دوربین/میکروفون امکان‌پذیر نیست."); }
 };

 const stopRecording = () => { if (mediaRecorderRef.current) mediaRecorderRef.current.stop(); setIsRecording(false); if (timerRef.current) clearInterval(timerRef.current); };
 const formatTime = (s) => { const m = Math.floor(s/60); const sec = s%60; return `${m}:${sec.toString().padStart(2,"0")}`; };

 return (
 <div className="space-y-6">
 <div className="flex gap-3">
 <button onClick={() => setTab("upload")} className={`flex-1 py-3 rounded font-medium transition-all ${tab==="upload"?"bg-primary/10 text-primary border border-primary/20":"bg-transparent text-muted-foreground hover:bg-muted/50"}`}>
 <Upload className="h-4 w-4 mr-2" /> بارگذاری فایل
 </button>
 <button onClick={() => setTab("record")} className={`flex-1 py-3 rounded font-medium transition-all ${tab==="record"?"bg-primary/10 text-primary border border-primary/20":"bg-transparent text-muted-foreground hover:bg-muted/50"}`}>
 <Mic className="h-4 w-4 mr-2" /> ضبط از دوربین
 </button>
 </div>
 {tab === "upload" ? (
 <div className="rounded border-2 border-dashed border-border/50 bg-background/50 p-12 text-center hover:border-primary/40 transition-all">
 <label htmlFor="media-upload" className="cursor-pointer flex flex-col items-center gap-4">
 <div className="h-16 w-16 rounded bg-primary/10 flex items-center justify-center text-primary"><Upload className="h-8 w-8" /></div>
 <div className="font-rokh-bold font-bold text-lg text-foreground">انتخاب فایل ویدیویی یا صوتی</div>
 <p className="text-sm text-muted-foreground max-w-sm mx-auto">MP4، WebM، MP3، WAV (حداکثر ۱۰۰ مگابایت)</p>
 <input id="media-upload" type="file" accept="video/*,audio/*" onChange={handleFileChange} className="hidden" />
 {form.file && <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded bg-primary/10 text-primary text-xs font-bold border border-primary/20"><Check className="h-3 w-3" /><span>{form.file.name}</span></div>}
 </label>
 {errors.media && <p className="mt-4 text-sm text-red-600">{errors.media}</p>}
 </div>
 ) : (
 <div className="rounded border border-border bg-card p-8 text-center shadow-sm">
 {cameraError && <div className="mb-6 p-4 rounded bg-red-50 border border-red-100 text-red-700 text-sm"><AlertCircle className="h-4 w-4 mr-2" />{cameraError}</div>}
 {!recordedUrl ? (
 <div className="space-y-6">
 <div className="relative">
 <div className="h-48 w-48 rounded bg-gradient-to-br from-primary/15 to-primary/35 flex items-center justify-center border-2 border-primary/30">
 <button onClick={isRecording ? stopRecording : startRecording} className={`absolute h-20 w-20 rounded flex items-center justify-center transition-all active:scale-95 ${isRecording?"bg-red-500 text-white ring-8 ring-red-500/30 animate-pulse":"bg-primary text-primary-foreground shadow-sm hover:bg-primary/90"}`}>
 {isRecording ? <X className="h-8 w-8" /> : <div className="flex items-center gap-2"><Video className="h-6 w-6"/><span className="ml-1">ضبط</span></div>}
 </button>
 </div>
 </div>
 {isRecording && <div className="space-y-2"><div className="font-rokh-bold font-bold text-lg text-foreground">در حال ضبط...</div><div className="text-3xl font-mono font-bold text-primary">{formatTime(recordingTime)}</div><p className="text-sm text-muted-foreground">برای پایان ضبط، روی دکمه توقف کلیک کنید.</p></div>}
 {!isRecording && <p className="text-sm text-muted-foreground">برای ثبت تلاوت، روی دکمه ضبط کلیک کنید.</p>}
 </div>
 ) : (
 <div className="space-y-4">
 <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-primary/10 text-primary text-xs font-bold border border-primary/20"><Check className="h-3 w-3" /><span>ضبط با موفقیت انجام شد ({formatTime(recordingTime)})</span></div>
 <video src={recordedUrl} controls className="w-full max-w-xs rounded border border-border" />
 <div className="flex gap-3">
 <button onClick={() => { URL.revokeObjectURL(recordedUrl); setForm((p) => ({ ...p, file: null, media_url: null })); }} className="flex-1 py-2.5 rounded border border-border text-muted-foreground hover:bg-muted/50 transition-colors text-sm font-medium">ضبط مجدد</button>
 <button className="flex-1 py-2.5 rounded bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors">استفاده از این ضبط</button>
 </div>
 </div>
 )}
 </div>
 )}
 </div>
 );
}

function MetadataStep({ form, setForm, errors }) {
 return (
 <div className="space-y-6">
 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
 <div className="space-y-2">
 <label className="block text-xs font-bold text-foreground font-ui mb-1">عنوان محتوای <span className="text-red-500">*</span></label>
 <input type="text" value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} placeholder="مثلاً: تلاوت مجلسی سوره رحمن" className="w-full px-4 py-3 rounded bg-background border border-input text-sm focus:outline-none focus:ring-2 focus:ring-primary/25" />
 {errors.title && <p className="text-xs text-red-600">{errors.title}</p>}
 </div>
 <div className="space-y-2">
 <label className="block text-xs font-bold text-foreground font-ui mb-1">دسته‌بندی <span className="text-red-500">*</span></label>
 <select value={form.category} onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))} className="w-full px-4 py-3 rounded bg-background border border-input text-sm focus:outline-none focus:ring-2 focus:ring-primary/25">
 <option value="recitation">تلاوت قرآن</option>
 <option value="tafsir">تفسیر و تدبّر</option>
 <option value="competition">مسابقه قرآنی</option>
 <option value="gathering">محفل قرآن</option>
 <option value="lecture">سمینار و سخنرانی</option>
 </select>
 {errors.category && <p className="text-xs text-red-600">{errors.category}</p>}
 </div>
 </div>
 <div className="space-y-2">
 <label className="block text-xs font-bold text-foreground font-ui mb-1">توضیحات</label>
 <textarea value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} rows={4} placeholder="توضیح کوتاه درباره محتوای..." className="w-full px-4 py-3 rounded bg-background border border-input text-sm focus:outline-none focus:ring-2 focus:ring-primary/25 resize-none" />
 </div>
 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
 <div className="space-y-2">
 <label className="block text-xs font-bold text-foreground font-ui mb-1">مرجع آیه (مثلاً 2:255)</label>
 <input type="text" value={form.verse_key} onChange={(e) => setForm((p) => ({ ...p, verse_key: e.target.value }))} placeholder="۲:۲۵۵" className="w-full px-4 py-3 rounded bg-background border border-input text-sm focus:outline-none focus:ring-2 focus:ring-primary/25" />
 </div>
 <div className="space-y-2">
 <label className="block text-xs font-bold text-foreground font-ui mb-1">متن آیه (اختیاری)</label>
 <input type="text" value={form.verse_arabic} onChange={(e) => setForm((p) => ({ ...p, verse_arabic: e.target.value }))} placeholder="الم تر que..." className="w-full px-4 py-3 rounded bg-background border border-input text-sm focus:outline-none focus:ring-2 focus:ring-primary/25 dir-rtl" />
 </div>
 </div>
 <div className="space-y-2">
 <label className="block text-xs font-bold text-foreground font-ui mb-1">تگ‌ها</label>
 <div className="flex flex-wrap gap-2">
 {form.tags.map((tag, i) => (
 <div key={i} className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-primary/10 text-primary text-xs font-medium border border-primary/20"><span>{tag}</span><button onClick={() => setForm((p) => ({ ...p, tags: p.tags.filter((_, idx) => idx !== i) }))} className="text-primary/70 hover:text-primary"><X className="h-3 w-3" /></button></div>
 ))}
 <input type="text" onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); const v = e.target.value.trim(); if (v && !form.tags.includes(v)) setForm((p) => ({ ...p, tags: [...p.tags, v] })); e.target.value = ""; } }} className="flex-1 px-4 py-3 rounded bg-background border border-input text-sm focus:outline-none focus:ring-2 focus:ring-primary/25 placeholder:text-muted-foreground/50" placeholder="افزودن تگ..." />
 </div>
 </div>
 </div>
 );
}

function PreviewStep({ form, errors }) {
 const mediaPreview = form.media_url || (form.file ? URL.createObjectURL(form.file) : null);
 return (
 <div className="space-y-6">
 <div className="rounded border border-border bg-card p-6 shadow-sm">
 <div className="flex items-center gap-3 mb-4">
 <div className="h-8 w-8 rounded bg-primary/10 flex items-center justify-center text-primary"><BookOpen className="h-4 w-4" /></div>
 <h3 className="font-rokh-bold font-bold text-base text-foreground">پیش‌نمایش محتوا</h3>
 </div>
 <div className="aspect-video bg-black rounded overflow-hidden mb-4 flex items-center justify-center">
 {mediaPreview ? (form.media_type === "video" ? <video src={mediaPreview} controls className="w-full h-full object-cover" /> : <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground"><FileAudio className="h-16 w-16 text-primary/70 mb-3"/><p>فایل صوتی</p></div>) : <div className="w-full h-full flex items-center justify-center text-muted-foreground"><Upload className="h-8 w-8 opacity-50"/></div>}
 </div>
 <div className="space-y-3">
 <div className="flex justify-between border-b border-border/50 pb-2"><span className="text-sm text-muted-foreground font-ui">عنوان</span><span className="font-rokh-bold font-semibold text-sm text-foreground">{form.title}</span></div>
 <div className="flex justify-between border-b border-border/50 pb-2"><span className="text-sm text-muted-foreground font-ui">دسته‌بندی</span><span className="text-sm text-foreground">{form.category}</span></div>
 {form.verse_key && <div className="flex justify-between border-b border-border/50 pb-2"><span className="text-sm text-muted-foreground font-ui">مرجع آیه</span><span className="text-sm text-foreground dir-rtl">{form.verse_key}</span></div>}
 <div className="flex justify-between border-b border-border/50 pb-2"><span className="text-sm text-muted-foreground font-ui">نوع فایل</span><span className="text-sm text-foreground">{form.media_type === "video" ? "ویدیو" : "صوت"}</span></div>
 </div>
 </div>
 <div className="rounded border border-primary/20 bg-primary/5 p-6">
 <div className="flex items-start gap-3">
 <div className="shrink-0 h-8 w-8 rounded bg-primary/10 flex items-center justify-center text-primary"><AlertCircle className="h-4 w-4" /></div>
 <div>
 <div className="font-rokh-bold font-bold text-sm text-foreground mb-1">وضعیت انتشار</div>
 <p className="text-sm text-muted-foreground leading-relaxed">محتوا پس از بررسی توسط ناظرین و تایید، منتشر می‌شود.</p>
 </div>
 </div>
 </div>
 </div>
 );
}

function SubmitStep({ form, submitting, onSubmit }) {
 return (
 <div className="space-y-6 text-center">
 <div className="h-20 w-20 rounded bg-primary/10 flex items-center justify-center mx-auto mb-6 text-primary"><Check className="h-10 w-10" /></div>
 <h2 className="font-rokh-bold font-bold text-2xl text-foreground mb-2">تایید نهایی و ارسال</h2>
 <p className="text-muted-foreground max-w-md mx-auto mb-8">محتوا برای بررسی نهایی ارسال می‌شود.</p>
 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
 <div className="flex justify-between px-4 py-2 rounded bg-background/50 border border-border/50"><span className="text-sm text-muted-foreground font-ui">عنوان</span><span className="text-sm font-medium text-foreground">{form.title}</span></div>
 <div className="flex justify-between px-4 py-2 rounded bg-background/50 border border-border/50"><span className="text-sm text-muted-foreground font-ui">وضعیت</span><span className="text-sm font-medium text-foreground">در انتظار بررسی</span></div>
 </div>
 <button onClick={onSubmit} disabled={submitting} className="w-full py-4 rounded bg-primary text-primary-foreground font-rokh-bold font-bold text-lg hover:bg-primary/90 shadow-sm flex items-center justify-center gap-2 disabled:opacity-50">
 {submitting ? <Loader2 className="h-5 w-5 animate-spin" /> : "ارسال نهایی برای بررسی"}
 </button>
 </div>
 );
}

