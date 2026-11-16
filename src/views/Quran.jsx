'use client';
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useSearchParams, useNavigate } from "@/lib/router-compat";
import { getSurahList, getSurah, getJuz, RECITERS, getAudioUrl } from "@/lib/quranApi";
import OrnamentalDivider from "@/components/OrnamentalDivider";
import { VerseMarker } from "@/components/IslamicDecorations";
import { JUZ_DATA } from "@/lib/juzData";
import PullToRefresh from "@/components/PullToRefresh";
import BackButton from "@/components/BackButton";
import { useAudioPlayer } from "@/context/AudioPlayerContext";
import { useReadingPrefs, renderQuranWaqf, DIACRITIC_THEMES } from "@/lib/readingPrefs";
import MushafSettingsModal from "@/components/quran/MushafSettingsModal";
import api from "@/lib/api";
import { toast } from "react-hot-toast";
import confetti from "canvas-confetti";

import {
 Search, ChevronRight, BookOpen, Layers, Loader2, RotateCw,
 Play, Pause, Type, SkipBack, SkipForward, Volume2, Check,
 Compass, ChevronDown, Sparkles, Palette,
} from "lucide-react";

const fa = (n) => (n || 0).toLocaleString("fa-IR");

export default function Quran() {
 const [params, setParams] = useSearchParams();
 const view = params.get("juz") ? "juz" : params.get("surah") ? "surah" : "list";
 const khatmPartId = params.get("khatm_part_id");
 const [completingKhatm, setCompletingKhatm] = useState(false);
 const [khatmDone, setKhatmDone] = useState(false);

 useEffect(() => {
 if (view === "surah" || view === "juz") {
 const timer = setTimeout(() => {
 api.gamification.trackActivity({ type: "reading", duration_seconds: 60 }).catch(() => {});
 }, 5000);
 return () => clearTimeout(timer);
 }
 }, [view]);

 const handleConfirmKhatmPart = async () => {
 if (!khatmPartId) return;
 try {
 setCompletingKhatm(true);
 await api.khatm.completePart(khatmPartId);
 api.gamification.trackActivity({ type: "social", action_detail: "تکمیل سهم ختم قرآن" }).catch(() => {});
 confetti({
 particleCount: 100,
 spread: 70,
 origin: { y: 0.6 },
 colors: ["#10b981", "#f59e0b", "#3b82f6"],
 });
 toast.success("سهم شما در ختم قرآن با موفقیت به عنوان قرائت شده ثبت شد ✨");
 setKhatmDone(true);
 } catch (err) {
 console.error("Error completing khatm part:", err);
 toast.error(err?.message || "خطا در ثبت اتمام قرائت");
 } finally {
 setCompletingKhatm(false);
 }
 };

 return (
 <div className="page-shell">
 {/* Pinned Khatm Recitation Floating Action Bar */}
 {khatmPartId && (
 <div className="sticky top-20 z-40 mb-6 p-4 rounded-2xl bg-card/95 backdrop-blur-md border border-accent/40 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-3 animate-in fade-in slide-in-from-top-4">
 <div className="flex items-center gap-3">
 <div className="w-10 h-10 rounded-xl bg-accent/15 text-accent flex items-center justify-center font-bold shrink-0">
 <Sparkles className="w-5 h-5" />
 </div>
 <div>
 <div className="text-sm font-bold text-foreground">
 در حال قرائت سهم ختم قرآن (جزء {fa(params.get("juz"))})
 </div>
 <div className="text-xs text-muted-foreground">
 {khatmDone
 ? "سهم شما ثبت شد. تقبل‌الله اعمالکم!"
 : "پس از پایان تلاوت، دکمه تایید زیر را فشار دهید تا در دوره ثبت گردد."}
 </div>
 </div>
 </div>

 <div className="flex items-center gap-2 w-full sm:w-auto">
 {!khatmDone ? (
 <button
 onClick={handleConfirmKhatmPart}
 disabled={completingKhatm}
 className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-semibold text-xs shadow-md active:scale-95 transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
 >
 <Check className="w-4 h-4" />
 <span>{completingKhatm ? "در حال ثبت..." : "ثبت اتمام قرائت این جزء"}</span>
 </button>
 ) : (
 <Link
 to="/khatm"
 className="w-full sm:w-auto px-4 py-2 rounded-xl bg-accent text-accent-foreground font-semibold text-xs text-center shadow-sm"
 >
 بازگشت به دوره‌های ختم
 </Link>
 )}
 </div>
 </div>
 )}

 {view === "list" && (
 <SurahList
 onPick={(n) => setParams({ surah: n })}
 onPickJuz={(n) => setParams({ juz: n })}
 />
 )}
 {view === "surah" && (
 <SurahView n={Number(params.get("surah"))} onBack={() => setParams({})} />
 )}
 {view === "juz" && (
 <JuzView n={Number(params.get("juz"))} onBack={() => setParams({})} />
 )}
 </div>
 );
}

function SurahList({ onPick, onPickJuz }) {
 const [surahs, setSurahs] = useState([]);
 const [query, setQuery] = useState("");
 const [loading, setLoading] = useState(true);
 const [mode, setMode] = useState("surah");

 const loadSurahs = useCallback(() => {
 setLoading(true);
 getSurahList()
 .then(setSurahs)
 .catch(() => {})
 .finally(() => setLoading(false));
 }, []);

 useEffect(() => {
 loadSurahs();
 }, [loadSurahs]);

 const filtered = useMemo(() => {
 if (!query) return surahs;
 const q = query.trim().toLowerCase();
 return surahs.filter(
 (s) =>
 s.persianName?.includes(query) ||
 s.name?.includes(query) ||
 s.englishName?.toLowerCase().includes(q) ||
 String(s.number).includes(q)
 );
 }, [surahs, query]);

 return (
 <PullToRefresh onRefresh={loadSurahs}>
 {/* suppressHydrationWarning: password-manager extensions (e.g. Proton Pass)
 may inject data-* attrs onto ancestors of text inputs before hydrate. */}
 <div className="animate-fade-in font-doran" suppressHydrationWarning>
 {/* Header section */}
 <div className="rounded-3xl border border-border bg-card p-6 sm:p-10 mb-8 text-center shadow-soft">
 <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary border border-border text-foreground font-ui text-xs font-semibold mb-3">
 <BookOpen className="h-3.5 w-3.5 text-primary" /> ۱۱۴ سوره مبارکه · ۳۰ جزء مصحف شریف
 </div>
 <h1 className="font-rokh-bold font-black text-3xl sm:text-4xl text-foreground tracking-tight mb-2">
 مصحف شریف قرآن کریم
 </h1>
 <p className="font-doran text-sm text-muted-foreground max-w-xl mx-auto mb-6">
 مطالعه متن، ترجمه روان، تلاوت ترتیل با صدای برترین قاریان جهان اسلام و ورود به تدبّر تخصصی آیات
 </p>

 {/* Search bar */}
 <div className="relative max-w-md mx-auto">
 <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
 <input
 type="search"
 name="surah-search"
 autoComplete="off"
 autoCorrect="off"
 spellCheck={false}
 data-1p-ignore="true"
 data-lpignore="true"
 data-form-type="other"
 data-protonpass-ignore="true"
 value={query}
 onChange={(e) => setQuery(e.target.value)}
 placeholder="جستجوی نام سوره یا شماره جزء..."
 className="w-full pl-4 pr-10 py-3 rounded-2xl bg-secondary/60 border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 font-ui text-sm shadow-xs transition-all"
 />
 </div>
 </div>

 {/* Mode Switcher */}
 <div className="flex justify-center mb-8">
 <div className="inline-flex p-1 rounded-2xl bg-secondary border border-border">
 <button
 onClick={() => setMode("surah")}
 className={`px-6 py-2 rounded-xl text-xs font-bold font-ui transition-all ${
 mode === "surah"
 ? "bg-card text-foreground shadow-xs scale-100"
 : "text-muted-foreground hover:text-foreground"
 }`}
 >
 فهرست سوره‌ها ({surahs.length})
 </button>
 <button
 onClick={() => setMode("juz")}
 className={`px-6 py-2 rounded-xl text-xs font-bold font-ui transition-all ${
 mode === "juz"
 ? "bg-card text-foreground shadow-xs scale-100"
 : "text-muted-foreground hover:text-foreground"
 }`}
 >
 اجزاء سی‌گانه (۳۰)
 </button>
 </div>
 </div>

 {loading ? (
 <div className="flex justify-center py-20">
 <Loader2 className="h-8 w-8 animate-spin text-accent" />
 </div>
 ) : mode === "surah" ? (
 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
 {filtered.map((s) => (
 <button
 key={s.number}
 onClick={() => onPick(s.number)}
 className="group relative flex items-center justify-between p-4 sm:p-5 rounded-2xl border border-border/80 bg-card hover:border-primary/50 hover:shadow-card-hover transition-all text-right"
 >
 <div className="flex items-center gap-3.5 min-w-0">
 <div className="h-10 w-10 shrink-0 rounded-xl bg-secondary/80 border border-border flex items-center justify-center font-ui text-xs font-bold text-foreground group-hover:border-primary/40 transition-colors">
 {s.number}
 </div>
 <div className="min-w-0">
 <div className="font-rokh-bold font-bold text-base text-foreground truncate">
 سوره {s.persianName}
 </div>
 <div className="text-xs text-muted-foreground mt-0.5 font-ui">
 {s.revelationType === "Meccan" ? "مکی" : "مدنی"} · {fa(s.numberOfAyahs)} آیه
 </div>
 </div>
 </div>
 <div
 className=" text-xl font-bold text-foreground/85 group-hover:text-primary transition-colors"
 dir="rtl"
 >
 {s.name}
 </div>
 </button>
 ))}
 </div>
 ) : (
 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
 {JUZ_DATA.map((juz) => (
 <button
 key={juz.number}
 onClick={() => onPickJuz(juz.number)}
 className="group p-5 rounded-2xl border border-border/80 bg-card hover:border-primary/50 hover:shadow-card-hover transition-all text-right"
 >
 <div className="flex items-center justify-between mb-3">
 <div className="h-9 w-9 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center font-ui text-xs font-bold text-accent">
 {juz.number}
 </div>
 <div className="text-2xl text-primary/70 group-hover:text-primary transition-colors" dir="rtl">
 {juz.arabicName}
 </div>
 </div>
 <div className="font-rokh-bold font-bold text-base mb-1 text-foreground">
 جزء {juz.number} — {juz.persianName}
 </div>
 <p className="font-doran text-xs text-muted-foreground leading-relaxed line-clamp-2 mb-2">
 {juz.description}
 </p>
 <div className="font-ui text-xs font-medium text-primary" dir="rtl">
 {juz.verseRange}
 </div>
 </button>
 ))}
 </div>
 )}
 </div>
 </PullToRefresh>
 );
}

function SurahView({ n, onBack }) {
 const [data, setData] = useState(null);
 const [loading, setLoading] = useState(true);
 const [error, setError] = useState(null);
 const [retryKey, setRetryKey] = useState(0);
 const [settingsOpen, setSettingsOpen] = useState(false);

 // Reciter & Continuous Playback state
 const [selectedReciter, setSelectedReciter] = useState(() => {
   if (typeof window === "undefined") return "ar.alafasy";
   return localStorage.getItem("ayeh-preferred-reciter") || "ar.alafasy";
 });
 const [autoScroll, setAutoScroll] = useState(true);
 const [reciterDropdownOpen, setReciterDropdownOpen] = useState(false);

 const [prefs, updatePrefs] = useReadingPrefs();
 const navigate = useNavigate();
 const { playTrack, track: currentTrack, isPlaying, togglePlay } = useAudioPlayer();

 const currentTheme =
 DIACRITIC_THEMES.find((t) => t.id === prefs.diacriticTheme) || DIACRITIC_THEMES[0];

 const currentReciterObj = useMemo(() => {
 return RECITERS.find((r) => r.id === selectedReciter) || RECITERS[0];
 }, [selectedReciter]);

 useEffect(() => {
 setLoading(true);
 setError(null);
 getSurah(n)
 .then(setData)
 .catch((e) => setError(e.message))
 .finally(() => setLoading(false));
 }, [n, retryKey]);

 // Current playing ayah tracking
 const isPlayingThisSurah =
 isPlaying && currentTrack?.type === "quran" && currentTrack?.verseKey?.startsWith(`${n}:`);

 const currentPlayingAyah = isPlayingThisSurah
 ? Number(currentTrack.verseKey.split(":")[1])
 : null;

 // Continuous playback engine: plays ayah and auto-chains to next ayah
 const playAyah = useCallback(
 (ayahNumber, reciterId = selectedReciter) => {
 if (!data?.ayahs) return;
 const ayahItem = data.ayahs.find((a) => a.numberInSurah === ayahNumber);
 if (!ayahItem) return;

 const reciter = RECITERS.find((r) => r.id === reciterId) || RECITERS[0];
 const audioUrl = getAudioUrl(n, ayahNumber, reciterId);
 const trackId = `quran-${n}-${ayahNumber}`;
 const nextAyahItem = data.ayahs.find((a) => a.numberInSurah === ayahNumber + 1);

 playTrack({
 id: trackId,
 title: `سوره ${data?.name || n} — آیه ${fa(ayahNumber)}`,
 subtitle: `تلاوت ترتیل • ${reciter.name}`,
 audioUrl,
 type: "quran",
 verseKey: `${n}:${ayahNumber}`,
 reciter: reciter.name,
 onEnded: () => {
 if (nextAyahItem) {
 playAyah(nextAyahItem.numberInSurah, reciterId);
 }
 },
 });
 },
 [data, n, playTrack, selectedReciter]
 );

 const handleSelectReciter = (reciterId) => {
 setSelectedReciter(reciterId);
 localStorage.setItem("ayeh-preferred-reciter", reciterId);
 setReciterDropdownOpen(false);

 // If currently playing, restart current ayah with new reciter
 if (currentPlayingAyah) {
 playAyah(currentPlayingAyah, reciterId);
 }
 };

 const togglePlayAyah = (e, ayahItem) => {
 e.preventDefault();
 e.stopPropagation();
 const isThisAyahActive =
 isPlaying && currentTrack?.verseKey === `${n}:${ayahItem.numberInSurah}`;

 if (isThisAyahActive) {
 togglePlay();
 } else {
 playAyah(ayahItem.numberInSurah);
 }
 };

 const handlePlayNext = () => {
 if (!data?.ayahs) return;
 const target = (currentPlayingAyah || 0) + 1;
 if (target <= data.numberOfAyahs) {
 playAyah(target);
 }
 };

 const handlePlayPrev = () => {
 if (!data?.ayahs) return;
 const target = (currentPlayingAyah || 2) - 1;
 if (target >= 1) {
 playAyah(target);
 }
 };

 // Smooth Synchronized Auto-scroll
 useEffect(() => {
 if (!autoScroll || !isPlayingThisSurah || !currentPlayingAyah) return;
 const el = document.getElementById(`ayah-${n}-${currentPlayingAyah}`);
 if (el) {
 el.scrollIntoView({ behavior: "smooth", block: "center" });
 }
 }, [currentPlayingAyah, autoScroll, isPlayingThisSurah, n]);

 if (loading)
 return (
 <div className="flex justify-center py-24">
 <Loader2 className="h-10 w-10 animate-spin text-accent" />
 </div>
 );

 if (error)
 return (
 <div className="rounded-xl border border-dashed border-accent/15 p-12 text-center max-w-md mx-auto">
 <BookOpen className="h-8 w-8 text-muted-foreground/30 mx-auto mb-3" />
 <p className="text-sm text-muted-foreground mb-4">{error}</p>
 <button
 onClick={() => setRetryKey((k) => k + 1)}
 className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-accent text-accent-foreground text-sm font-medium hover:shadow-glow transition-all"
 >
 <RotateCw className="h-4 w-4" /> تلاش مجدد
 </button>
 </div>
 );

 if (!data) return null;

 return (
 <div className="max-w-5xl mx-auto animate-fade-in font-doran pb-28">
 {/* Top Navigation */}
 <div className="flex items-center justify-between mb-6 sm:mb-8">
 <BackButton onClick={onBack} label="همه سوره‌ها" className="mb-0" />
 <button
 onClick={() => setSettingsOpen(true)}
 className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl border border-accent/30 bg-card/85 hover:bg-secondary text-xs font-bold text-foreground shadow-soft transition-all hover:scale-105 active:scale-95 font-ui"
 >
 <Type className="h-4 w-4 text-accent" />
 <span>تنظیمات خط و مصحف</span>
 </button>
 </div>

 {/* Surah Banner Card with Authentic Persian Muqarnas Ceiling */}
 <div className="relative overflow-hidden rounded-3xl border border-amber-400/30 bg-card p-6 sm:p-12 mb-8 text-center shadow-xl">
 <div className="absolute inset-0 z-0 pointer-events-none">
 <img
 src="/images/art/nasir_vault_ceiling.webp"
 alt=""
 className="w-full h-full object-cover filter brightness-[0.25] dark:brightness-[0.16] contrast-[1.1] scale-105"
 />
 <div className="absolute inset-0 bg-gradient-to-b from-card/90 via-card/80 to-card/95 backdrop-blur-[1px]" />
 </div>
 <div className="relative z-10">
 <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-secondary/80 backdrop-blur-md border border-amber-400/30 text-foreground font-ui text-xs font-bold mb-3">
 <span>سوره مبارکه شماره {data.number}</span>
 </div>
 <div
 className="text-5xl sm:text-7xl text-foreground mb-4 font-bold tracking-wide"
 dir="rtl"
 >
 {data.name}
 </div>
 <OrnamentalDivider className="my-6" />
 <div className="flex items-center justify-center gap-3 flex-wrap font-ui">
 <InfoBadge label={data.revelationType === "Meccan" ? "مکی" : "مدنی"} />
 <InfoBadge label={`${fa(data.numberOfAyahs)} آیه`} />
 {data.ayahs[0]?.juz ? <InfoBadge label={`جزء ${fa(data.ayahs[0].juz)}`} /> : null}
 </div>

 {/* Surah Recitation Audio Trigger Button */}
 <div className="mt-6 flex justify-center items-center gap-3 flex-wrap">
 <button
 onClick={() => {
 if (isPlayingThisSurah) {
 togglePlay();
 } else {
 playAyah(currentPlayingAyah || 1);
 }
 }}
 className={`inline-flex items-center gap-2.5 px-6 py-3 rounded-full font-ui text-sm font-bold shadow-soft transition-all hover:scale-105 active:scale-95 ${
 isPlayingThisSurah
 ? "bg-amber-500 text-amber-950 ring-4 ring-amber-500/20"
 : "bg-primary text-primary-foreground hover:opacity-90"
 }`}
 >
 {isPlayingThisSurah ? (
 <>
 <Pause className="h-4 w-4 fill-current" />
 <span>توقف تلاوت سوره</span>
 </>
 ) : (
 <>
 <Play className="h-4 w-4 fill-current ml-0.5" />
 <span>شروع تلاوت پیوسته با صدای {currentReciterObj.name}</span>
 </>
 )}
 </button>
 </div>
 </div>
 </div>

 {/* Bismillah */}
 {data.number !== 9 && (
 <div className="text-center mb-8">
 <p
 className="text-2xl sm:text-3xl text-foreground/80 font-bold"
 style={{ fontFamily: prefs.arabicFont }}
 dir="rtl"
 lang="ar"
 >
 بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
 </p>
 </div>
 )}

 {/* Ayahs List with Synchronized Highlighting */}
 <div className={`space-y-4 ${currentTheme.className}`}>
 {data.ayahs.map((a) => {
 const isAyahActive =
 isPlaying && currentTrack?.verseKey === `${n}:${a.numberInSurah}`;

 return (
 <Link
 key={a.number}
 id={`ayah-${n}-${a.numberInSurah}`}
 to={`/verse/${data.number}/${a.numberInSurah}`}
 className={`group relative block rounded-2xl border p-5 sm:p-7 transition-all duration-300 ${
 isAyahActive
 ? "border-amber-500/80 bg-gradient-to-r from-amber-500/15 via-amber-500/5 to-transparent shadow-[0_0_25px_rgba(245,158,11,0.22)] ring-2 ring-amber-500/40 scale-[1.01]"
 : "border-border bg-card hover:border-primary/40 hover:shadow-card-hover"
 }`}
 >
 <div className="flex items-start gap-4 sm:gap-6">
 <div className="flex flex-col items-center gap-2 shrink-0">
 <div
 className={`h-10 w-10 rounded-xl flex items-center justify-center font-ui text-xs font-bold transition-colors ${
 isAyahActive
 ? "bg-amber-500 text-amber-950 shadow-xs"
 : "bg-secondary border border-border text-foreground"
 }`}
 >
 {a.numberInSurah}
 </div>

 {/* Audio Play Trigger for Individual Ayah */}
 <button
 type="button"
 onClick={(e) => togglePlayAyah(e, a)}
 className={`h-9 w-9 rounded-xl flex items-center justify-center transition-all ${
 isAyahActive
 ? "bg-amber-500 text-amber-950 shadow-sm ring-2 ring-amber-500/50"
 : "bg-secondary/70 border border-border text-muted-foreground hover:text-primary hover:bg-secondary"
 }`}
 title={isAyahActive ? "توقف تلاوت آیه" : "پخش تلاوت ترتیل این آیه"}
 >
 {isAyahActive ? (
 <Pause className="h-3.5 w-3.5 fill-current" />
 ) : (
 <Play className="h-3.5 w-3.5 fill-current ml-0.5" />
 )}
 </button>

 {/* Equalizer animation indicator */}
 {isAyahActive && (
 <div className="flex items-center gap-0.5 mt-1 text-amber-500">
 <span className="w-1 h-3 bg-amber-500 rounded-full animate-bounce" />
 <span className="w-1 h-4 bg-amber-500 rounded-full animate-bounce [animation-delay:150ms]" />
 <span className="w-1 h-2 bg-amber-500 rounded-full animate-bounce [animation-delay:300ms]" />
 </div>
 )}
 </div>

 <div className="flex-1 min-w-0">
 <div
 className="font-bold text-foreground transition-all select-text"
 style={{
 fontFamily: prefs.arabicFont,
 fontSize: `${Math.round(23 * (prefs.arabicScale || 1.15))}px`,
 lineHeight: prefs.lineHeight || 2.4,
 }}
 dir="rtl"
 lang="ar"
 >
 {renderQuranWaqf(a.arabic, prefs.highlightWaqf !== false)}
 </div>

 {prefs.showTranslation && (
 <p
 className="font-doran text-muted-foreground mt-4 leading-[2.2] transition-all"
 style={{
 fontSize: `${Math.round(14 * (prefs.translationScale || 1.0))}px`,
 }}
 >
 «{a.translation}»
 </p>
 )}

 <div className="mt-4 pt-3 border-t border-border/60 flex items-center justify-between text-xs font-ui text-muted-foreground">
 <div className="flex items-center gap-3">
 {a.juz ? <span>جزء {fa(a.juz)}</span> : null}
 {a.juz ? <span className="text-border">·</span> : null}
 {a.page ? <span>صفحه {fa(a.page)}</span> : null}
 </div>
 <div className="flex items-center gap-3">
 <button
 type="button"
 onClick={(e) => {
 e.preventDefault();
 e.stopPropagation();
 navigate(`/assistants?q=تدبّر در آیه ${data.number}:${a.numberInSurah}`);
 }}
 className="text-xs text-muted-foreground hover:text-primary transition-colors flex items-center gap-1 font-rokh-bold"
 title="طراحی کارت و استوری این آیه"
 >
 <Palette className="h-3.5 w-3.5" />
 <span className="hidden sm:inline">کارت آیه</span>
 </button>
 <span className="text-primary font-bold group-hover:underline flex items-center gap-1">
 مشاهده تفسیر و تدبّر{" "}
 <ChevronRight className="h-3.5 w-3.5 group-hover:-translate-x-1 transition-transform" />
 </span>
 </div>
 </div>
 </div>
 </div>
 </Link>
 );
 })}
 </div>

 {/* Floating Recitation Dock */}
 <div className="fixed bottom-20 md:bottom-5 left-1/2 -translate-x-1/2 z-40 w-[95%] max-w-xl">
 <div className="relative rounded-2xl border border-border/80 bg-card/95 backdrop-blur-xl shadow-2xl p-3 sm:px-5 sm:py-3.5 transition-all">
 <div className="flex items-center justify-between gap-2">
 {/* Reciter Selector Trigger */}
 <div className="relative">
 <button
 onClick={() => setReciterDropdownOpen(!reciterDropdownOpen)}
 className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-secondary/80 hover:bg-secondary text-foreground text-xs font-bold border border-border/60 transition-colors font-ui"
 title="انتخاب قاری"
 >
 <Volume2 className="h-3.5 w-3.5 text-accent" />
 <span className="max-w-[100px] truncate">{currentReciterObj.name}</span>
 <ChevronDown className="h-3 w-3 text-muted-foreground" />
 </button>

 {/* Reciter Dropdown Menu */}
 {reciterDropdownOpen && (
 <>
 <div
 className="fixed inset-0 z-30"
 onClick={() => setReciterDropdownOpen(false)}
 />
 <div className="absolute bottom-11 right-0 z-40 w-56 rounded-2xl border border-border bg-popover/95 p-1.5 shadow-2xl backdrop-blur-md animate-scale-in font-ui text-xs">
 <div className="px-3 py-2 text-[11px] font-bold text-muted-foreground border-b border-border/50">
 انتخاب قاری ترتیل:
 </div>
 {RECITERS.map((r) => {
 const isChosen = r.id === selectedReciter;
 return (
 <button
 key={r.id}
 onClick={() => handleSelectReciter(r.id)}
 className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-right transition-colors ${
 isChosen
 ? "bg-accent/15 text-accent font-bold"
 : "text-foreground hover:bg-secondary"
 }`}
 >
 <div>
 <div>{r.name}</div>
 <span className="text-[10px] text-muted-foreground">{r.style}</span>
 </div>
 {isChosen && <Check className="h-3.5 w-3.5 text-accent" />}
 </button>
 );
 })}
 </div>
 </>
 )}
 </div>

 {/* Playback Controls (Previous / Play-Pause / Next) */}
 <div className="flex items-center gap-2">
 {/* Prev Ayah (RTL: right arrow goes to prev) */}
 <button
 onClick={handlePlayPrev}
 disabled={!currentPlayingAyah || currentPlayingAyah <= 1}
 className="flex h-9 w-9 items-center justify-center rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary disabled:opacity-40 transition-colors"
 title="آیه قبلی"
 >
 <SkipForward className="h-4 w-4" />
 </button>

 {/* Main Play / Pause Button */}
 <button
 onClick={() => {
 if (isPlayingThisSurah) {
 togglePlay();
 } else {
 playAyah(currentPlayingAyah || 1);
 }
 }}
 className={`flex h-11 w-11 items-center justify-center rounded-2xl shadow-soft transition-all transform active:scale-90 ${
 isPlayingThisSurah
 ? "bg-amber-500 text-amber-950 ring-4 ring-amber-500/25"
 : "bg-primary text-primary-foreground hover:opacity-90"
 }`}
 title={isPlayingThisSurah ? "مکث تلاوت" : "ادامه تلاوت"}
 >
 {isPlayingThisSurah ? (
 <Pause className="h-5 w-5 fill-current" />
 ) : (
 <Play className="h-5 w-5 fill-current ml-0.5" />
 )}
 </button>

 {/* Next Ayah (RTL: left arrow goes to next) */}
 <button
 onClick={handlePlayNext}
 disabled={
 !currentPlayingAyah || currentPlayingAyah >= data.numberOfAyahs
 }
 className="flex h-9 w-9 items-center justify-center rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary disabled:opacity-40 transition-colors"
 title="آیه بعدی"
 >
 <SkipBack className="h-4 w-4" />
 </button>
 </div>

 {/* Current Ayah Tracking & AutoScroll Toggle */}
 <div className="flex items-center gap-1.5">
 <span className="hidden sm:inline text-xs font-bold font-ui text-muted-foreground">
 آیه {fa(currentPlayingAyah || 1)} از {fa(data.numberOfAyahs)}
 </span>

 {/* Auto Scroll Toggle */}
 <button
 onClick={() => setAutoScroll(!autoScroll)}
 className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl border text-xs font-semibold font-ui transition-all ${
 autoScroll
 ? "bg-accent/15 border-accent/40 text-accent"
 : "bg-secondary/60 border-border text-muted-foreground"
 }`}
 title={autoScroll ? "اسکرول خودکار فعال است" : "اسکرول خودکار غیرفعال است"}
 >
 <Compass className="h-3.5 w-3.5" />
 <span className="hidden sm:inline">
 {autoScroll ? "پیمایش خودکار" : "پیمایش دستی"}
 </span>
 </button>
 </div>
 </div>
 </div>
 </div>

 {/* Mushaf Typography & Diacritics Modal */}
 <MushafSettingsModal
 isOpen={settingsOpen}
 onClose={() => setSettingsOpen(false)}
 prefs={prefs}
 onChange={updatePrefs}
 />
 </div>
 );
}

function JuzView({ n, onBack }) {
 const [groups, setGroups] = useState([]);
 const [surahs, setSurahs] = useState({});
 const [loading, setLoading] = useState(true);
 const [error, setError] = useState(null);
 const [retryKey, setRetryKey] = useState(0);

 useEffect(() => {
 setLoading(true);
 setError(null);
 Promise.all([getJuz(n), getSurahList()])
 .then(([g, list]) => {
 setGroups(g);
 const m = {};
 list.forEach((s) => (m[s.number] = s));
 setSurahs(m);
 })
 .catch((e) => setError(e.message))
 .finally(() => setLoading(false));
 }, [n, retryKey]);

 if (loading)
 return (
 <div className="flex justify-center py-24">
 <Loader2 className="h-10 w-10 animate-spin text-accent" />
 </div>
 );

 if (error)
 return (
 <div className="rounded-xl border border-dashed border-accent/15 p-12 text-center max-w-md mx-auto">
 <Layers className="h-8 w-8 text-muted-foreground/30 mx-auto mb-3" />
 <p className="text-sm text-muted-foreground mb-4">{error}</p>
 <button
 onClick={() => setRetryKey((k) => k + 1)}
 className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-accent text-accent-foreground text-sm font-medium hover:shadow-glow transition-all"
 >
 <RotateCw className="h-4 w-4" /> تلاش مجدد
 </button>
 </div>
 );

 return (
 <div className="max-w-5xl mx-auto animate-fade-in font-doran">
 <BackButton onClick={onBack} label="همه اجزاء" className="mb-6 sm:mb-8" />

 <div className="text-center mb-10">
 <div className="text-xs tracking-[0.25em] text-muted-foreground mb-2">جزء</div>
 <h1 className="font-rokh-bold font-extrabold text-4xl sm:text-5xl tracking-tight">
 جزء {fa(n)}
 </h1>
 <OrnamentalDivider className="mt-6" />
 </div>

 <div className="space-y-10">
 {groups.map((g) => {
 const s = surahs[g.surah];
 return (
 <div key={g.surah}>
 <Link
 to={`/quran?surah=${g.surah}`}
 className="inline-flex items-center gap-2 mb-4 group"
 >
 <span className="h-8 w-8 rounded-lg bg-accent/10 text-accent flex items-center justify-center text-xs font-bold ring-1 ring-accent/10">
 {g.surah}
 </span>
 <span
 className=" text-lg font-semibold group-hover:text-accent transition-colors"
 dir="rtl"
 >
 {s?.name || `سوره ${g.surah}`}
 </span>
 </Link>
 <div className="space-y-3">
 {g.ayahs.map((a) => (
 <Link
 key={a.number}
 to={`/verse/${g.surah}/${a.numberInSurah}`}
 className="group flex items-start gap-4 rounded-xl border border-accent/10 bg-card/40 p-4 hover:border-accent/30 hover:shadow-soft transition-all duration-300"
 >
 <VerseMarker number={a.numberInSurah} size={36} />
 <div className="flex-1 min-w-0">
 <div
 className="text-xl sm:text-2xl leading-[2.2] text-right text-foreground/90"
 dir="rtl"
 >
 {a.arabic}
 </div>
 <p className="text-sm text-foreground/65 mt-1.5 line-clamp-1">
 {a.translation}
 </p>
 </div>
 </Link>
 ))}
 </div>
 </div>
 );
 })}
 </div>
 </div>
 );
}

function InfoBadge({ label }) {
 return (
 <span className="inline-flex items-center px-3 py-1 rounded-full bg-muted/50 text-xs text-muted-foreground font-medium ring-1 ring-border/30">
 {label}
 </span>
 );
}
