import { useEffect, useState } from "react";
import { Link } from "@/lib/router-compat";
import api from "@/lib/api";
import { getRecommendations, getProfileSummary } from "@/lib/recommendationEngine";
import { Loader2, Sparkles, ArrowLeft, BookOpen, Compass } from "lucide-react";

const verseKeyToPath = (vk) => {
 const [s, a] = String(vk).split(":");
 return `/verse/${s}/${a}`;
};

export default function DailyRecommendation() {
 const [picks, setPicks] = useState([]);
 const [summary, setSummary] = useState(null);
 const [loading, setLoading] = useState(true);

 useEffect(() => {
 (async () => {
 try {
 const page = await api.entities.Verse.list({
 limit: 100,
 fields: ["verse_key", "arabic", "translation", "tags", "surah_number", "classical_tafsir", "modern_tafsir", "tadabbur", "reflections"],
 });
 const pool = (page.items || []).filter((v) => v.verse_key && v.arabic);
 const { picks: result, profile } = getRecommendations(pool, 3);
 setPicks(result);
 setSummary(getProfileSummary(profile));
 } catch {}
 setLoading(false);
 })();
 }, []);

 if (loading) {
 return (
 <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 flex justify-center">
 <Loader2 className="h-6 w-6 animate-spin text-primary" />
 </div>
 );
 }
 if (!picks.length) return null;

 return (
 <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
 <div className="flex items-center justify-between mb-6 pb-3 border-b border-border/80">
 <div className="flex items-center gap-3">
 <div className="h-9 w-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
 <Compass className="h-5 w-5" />
 </div>
 <div>
 <h2 className="font-rokh-bold font-bold text-xl sm:text-2xl text-foreground">
 پیشنهاد تدبّر اختصاصی برای شما
 </h2>
 <p className="font-doran text-xs sm:text-sm text-muted-foreground mt-0.5">{summary}</p>
 </div>
 </div>
 </div>

 <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
 {picks.map((p, i) => (
 <Link
 key={p.verse.id || i}
 to={verseKeyToPath(p.verse.verse_key)}
 className="group relative flex flex-col justify-between rounded-2xl border border-border bg-card p-5 sm:p-6 hover:border-primary/40 hover:shadow-card-hover transition-all duration-200"
 >
 <div>
 <div className="flex items-center justify-between gap-2 mb-3.5">
 <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-secondary border border-border text-foreground font-ui text-xs font-semibold">
 <Sparkles className="h-3 w-3 text-accent" /> {p.reason}
 </span>
 <span className="font-ui text-xs font-semibold text-muted-foreground px-2 py-0.5 rounded bg-secondary">
 آیه {p.verse.verse_key}
 </span>
 </div>

 <div className="text-lg sm:text-xl leading-[2.2] text-foreground text-right line-clamp-3 mb-3 font-semibold" dir="rtl" lang="ar">
 {p.verse.arabic}
 </div>

 <p className="font-doran text-xs sm:text-sm text-muted-foreground leading-relaxed line-clamp-2 mb-4">
 «{p.verse.translation}»
 </p>

 {p.reflection && (
 <div className="rounded-xl bg-secondary/60 border border-border/80 p-3 mb-3">
 <div className="flex items-center gap-1.5 text-[11px] font-ui text-primary font-bold mb-1">
 <BookOpen className="h-3 w-3" /> پیام تدبّری
 </div>
 <p className="font-doran text-xs text-muted-foreground leading-relaxed line-clamp-2">{p.reflection}</p>
 </div>
 )}
 </div>

 <div className="pt-3 border-t border-border/60 flex items-center justify-between">
 <span className="font-ui text-xs font-bold text-primary group-hover:underline">
 مطالعه آیه و تفسیر کامل
 </span>
 <ArrowLeft className="h-3.5 w-3.5 text-primary group-hover:-translate-x-1 transition-transform" />
 </div>
 </Link>
 ))}
 </div>
 </section>
 );
}
