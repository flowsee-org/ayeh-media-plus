import { useState } from "react";
import { Link } from "@/lib/router-compat";
import { BookOpen, Film, Lightbulb, Loader2, Plus, ArrowLeft, Copy, Check } from "lucide-react";
import { toast } from "react-hot-toast";
import api from "@/lib/api";
import CreatePost from "@/components/community/CreatePost";

export default function GuideVerseCard({ match, user, verse }) {
 const [composing, setComposing] = useState(false);
 const [posted, setPosted] = useState(false);
 const [copied, setCopied] = useState(false);

 const key = match.verse_key;
 const link = `/verse/${key.replace(":", "/")}`;
 const initialVerse = {
 verse_key: key,
 verse_arabic: verse?.arabic || "",
 verse_text: verse?.translation || "",
 };

 const copyVerse = async () => {
 const text = `${verse?.arabic || ""}\n«${verse?.translation || ""}»\n[آیه ${key}]`;
 try {
 if (navigator.clipboard?.writeText) {
 await navigator.clipboard.writeText(text);
 } else {
 const ta = document.createElement("textarea");
 ta.value = text;
 document.body.appendChild(ta);
 ta.select();
 document.execCommand("copy");
 document.body.removeChild(ta);
 }
 setCopied(true);
 toast.success("آیه و ترجمه در حافظه رونوشت شد");
 setTimeout(() => setCopied(false), 2000);
 } catch {
 toast.error("امکان کپی در این مرورگر فراهم نشد");
 }
 };

 return (
 <div className="relative overflow-hidden rounded border border-border bg-card shadow-soft hover:border-primary/40 transition-all duration-200">
 {/* Verse Header */}
 <div className="p-6 sm:p-8">
 <div className="mb-4 flex items-center justify-between border-b border-border/80 pb-3 font-ui">
 <div className="flex items-center gap-2">
 <span className="h-2 w-2 rounded bg-accent" />
 <span className="text-xs font-bold text-foreground">آیه شریفه {key}</span>
 </div>
 {verse?.surahName && (
 <span className="text-xs text-muted-foreground font-medium">سوره مبارکه {verse.surahName}</span>
 )}
 </div>

 {verse ? (
 <Link to={link} className="block group cursor-pointer my-4">
 <p
 className="mb-4 text-center text-2xl sm:text-3xl leading-[2.4] text-foreground font-semibold group-hover:text-primary transition-colors"
 dir="rtl"
 lang="ar"
 >
 {verse.arabic}
 </p>
 <p className="font-doran text-center text-sm sm:text-base leading-relaxed text-muted-foreground max-w-2xl mx-auto">
 «{verse.translation}»
 </p>
 </Link>
 ) : (
 <div className="flex items-center justify-center gap-2 py-8 text-xs font-ui text-muted-foreground">
 <Loader2 className="h-5 w-5 animate-spin text-primary" />
 <span>در حال بارگذاری متن کامل آیه از مصحف…</span>
 </div>
 )}
 </div>

 {/* Why & Steps */}
 <div className="space-y-4 border-t border-border/70 bg-secondary/30 p-6 sm:p-8">
 <div className="rounded border border-border bg-card p-4">
 <div className="mb-1.5 flex items-center gap-2 font-ui text-xs font-bold text-primary">
 <BookOpen className="h-4 w-4" />
 <span>چرا این آیه گره‌گشای این دغدغه است؟</span>
 </div>
 <p className="font-doran text-sm leading-relaxed text-foreground/85">{match.why}</p>
 </div>

 {match.action && (
 <div className="rounded border border-border bg-card p-4">
 <div className="mb-1.5 flex items-center gap-2 font-ui text-xs font-bold text-accent">
 <Lightbulb className="h-4 w-4" />
 <span>یک گام عملی برای امروز:</span>
 </div>
 <p className="font-doran text-sm leading-relaxed text-foreground/85">{match.action}</p>
 </div>
 )}

 {match.visual && (
 <div className="rounded border border-border bg-card p-4">
 <div className="mb-1.5 flex items-center gap-2 font-ui text-xs font-bold text-muted-foreground">
 <Film className="h-4 w-4" />
 <span>ایده تدبّر بصری و تصویرسازی:</span>
 </div>
 <p className="font-doran text-xs leading-relaxed text-muted-foreground">{match.visual}</p>
 </div>
 )}
 </div>

 {/* Actions */}
 <div className="flex flex-wrap items-center gap-2.5 border-t border-border/70 bg-card p-4 sm:px-8 font-ui">
 <button
 onClick={() => (user ? setComposing(true) : api.auth.redirectToLogin())}
 className="flex flex-1 min-w-[140px] items-center justify-center gap-2 rounded bg-primary px-4 py-2.5 text-xs font-bold text-primary-foreground shadow-sm hover:opacity-90 transition-opacity"
 >
 <Plus className="h-4 w-4" /> ساخت پست تدبّری
 </button>

 <Link
 to={link}
 className="flex items-center justify-center gap-1.5 rounded border border-border bg-secondary px-4 py-2.5 text-xs font-bold text-foreground hover:bg-secondary/70 transition-colors"
 >
 <span>تفسیر جامع</span>
 <ArrowLeft className="h-3.5 w-3.5" />
 </Link>

 <button
 onClick={copyVerse}
 className="flex items-center justify-center gap-1.5 rounded border border-border bg-card px-3.5 py-2.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
 title="رونوشت آیه و ترجمه"
 >
 {copied ? <Check className="h-3.5 w-3.5 text-primary" /> : <Copy className="h-3.5 w-3.5" />}
 <span>{copied ? "کپی شد" : "کپی"}</span>
 </button>
 </div>

 {posted && (
 <div className="border-t border-border bg-secondary p-3 text-center text-xs font-ui text-primary font-medium">
 پست تدبّری شما با موفقیت منتشر شد.{" "}
 <Link to="/community" className="font-bold underline hover:opacity-80">
 مشاهده در بخش جامعه
 </Link>
 </div>
 )}

 {composing && user && (
 <CreatePost
 user={user}
 initialVerse={initialVerse}
 onClose={() => setComposing(false)}
 onPosted={() => {
 setComposing(false);
 setPosted(true);
 }}
 />
 )}
 </div>
 );
}
