import { useState } from "react";
import { Link } from "@/lib/router-compat";
import { BookOpen, ChevronDown, ChevronUp, ExternalLink, Sparkles } from "lucide-react";

const fa = (n) => (n || 0).toLocaleString("fa-IR");

/**
 * Floating Glassmorphic Pinned Quran Verse Banner for Live Streams
 */
export default function LivePinnedVerseOverlay({ pinnedVerse }) {
 const [minimized, setMinimized] = useState(false);

 if (!pinnedVerse) return null;

 const { verseKey, surahNum, ayahNum, surahName, arabic, translation } = pinnedVerse;

 return (
 <div className="absolute inset-x-2 sm:inset-x-4 bottom-14 z-20 pointer-events-none select-none">
 <div className="max-w-xl mx-auto pointer-events-auto">
 {!minimized ? (
 <div className="relative rounded border border-amber-500/40 bg-black/80 backdrop-blur-md p-3.5 sm:p-4 text-white shadow-2xl animate-fade-in-up">
 {/* Header: Surah Name Badge + Minimize + External Link */}
 <div className="flex items-center justify-between gap-2 border-b border-white/15 pb-2">
 <div className="inline-flex items-center gap-1.5 rounded bg-amber-500/20 px-3 py-0.5 text-xs font-bold text-amber-400 font-rokh-bold border border-amber-500/30">
 <Sparkles className="h-3 w-3" />
 <span>
 محور تدبّر: {surahName ? `سوره ${surahName} • آیه ${fa(ayahNum || "")}` : `آیه ${verseKey}`}
 </span>
 </div>

 <div className="flex items-center gap-1">
 {surahNum && ayahNum && (
 <Link
 to={`/verse/${surahNum}/${ayahNum}`}
 target="_blank"
 rel="noopener noreferrer"
 className="flex h-7 w-7 items-center justify-center rounded bg-white/10 hover:bg-white/20 text-stone-200 transition-colors"
 title="مطالعه تفسیر کامل در تب جدید"
 >
 <ExternalLink className="h-3.5 w-3.5" />
 </Link>
 )}
 <button
 type="button"
 onClick={() => setMinimized(true)}
 className="flex h-7 items-center gap-1 px-2 rounded bg-white/10 hover:bg-white/20 text-xs text-stone-200 transition-colors font-ui"
 title="جمع‌کردن بنر برای دید بهتر ویدیو"
 >
 <ChevronDown className="h-3.5 w-3.5" />
 <span className="text-[10px]">کوچک‌کردن</span>
 </button>
 </div>
 </div>

 {/* Arabic Calligraphy */}
 {arabic && (
 <div
 className="my-2.5 text-amber-100 text-sm sm:text-base leading-[2.2] text-center font-bold tracking-wide"
 dir="rtl"
 lang="ar"
 >
 {arabic}
 </div>
 )}

 {/* Translation */}
 {translation && (
 <p className="font-doran text-stone-200 text-xs sm:text-sm text-center leading-relaxed font-medium line-clamp-2 sm:line-clamp-3">
 «{translation}»
 </p>
 )}
 </div>
 ) : (
 /* Minimized Pill on Video */
 <div className="flex justify-center animate-scale-in">
 <button
 type="button"
 onClick={() => setMinimized(false)}
 className="inline-flex items-center gap-2 rounded border border-amber-500/40 bg-black/85 backdrop-blur-md px-4 py-1.5 text-xs font-bold text-amber-400 shadow-2xl hover:bg-black transition-all hover:scale-105 active:scale-95 font-rokh-bold"
 title="نمایش متن آیه تدبّر"
 >
 <BookOpen className="h-3.5 w-3.5 text-amber-400" />
 <span>
 آیه تدبّر: {surahName ? `سوره ${surahName} (${verseKey})` : verseKey}
 </span>
 <ChevronUp className="h-3.5 w-3.5 ml-0.5 text-stone-300" />
 </button>
 </div>
 )}
 </div>
 </div>
 );
}
