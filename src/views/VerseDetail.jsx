'use client';
import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import { toast } from "react-hot-toast";
import api from "@/lib/api";
import { useRouter } from 'next/navigation';
import { getAyah, RECITERS, getAudioUrl } from "@/lib/quranApi";
import { SURAH_DATA } from "@/lib/surahData";
import { markVerseRead } from "@/lib/readingTracker";
import { scopedKey } from "@/lib/storageScope";
import IslamicPattern from "@/components/IslamicPattern";
import OrnamentalDivider from "@/components/OrnamentalDivider";
import { Image } from "@/components/ui/image";
import {
 Clock, Play, Pause, BookOpen, Sparkles, History,
 Languages, HelpCircle, Lightbulb, Compass, Link2, Video, Mic,
 Bookmark, Share2, FileText, MessageSquare, Loader2, Quote, BookMarked, RotateCw,
 ChevronRight, ChevronLeft, ChevronDown, Bot, Palette,
 Volume2, Download, Heart, Flag, Check, Layers,
} from "lucide-react";
import TextSettings from "@/components/verse/TextSettings";
import BackButton from "@/components/BackButton";
import { useReadingPrefs, renderQuranWaqf, DIACRITIC_THEMES } from "@/lib/readingPrefs";
import { trackEngagement } from "@/lib/engagement";
import { useAudioPlayer } from "@/context/AudioPlayerContext";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import ScholarCard from "@/components/ui/scholar-card";

const fa = (n) => (n || 0).toLocaleString("fa-IR");
const MIHRAB_IMG = "/images/art/nasir_light_columns.jpg";

const TABS = [
 { id: "overview", label: "آیه و ترجمه", icon: BookOpen },
 { id: "tafsir", label: "تفسیر", icon: Compass },
 { id: "linguistic", label: "واژه‌شناسی", icon: Languages },
 { id: "context", label: "زمینه و اسباب نزول", icon: History },
 { id: "reflections", label: "تدبّرها", icon: Sparkles },
 { id: "lessons", label: "درس‌ها و کاربرد", icon: Lightbulb },
 { id: "media", label: "صوت و تصویر", icon: Video },
 { id: "related", label: "مربوط", icon: Link2 },
 { id: "notes", label: "یادداشت‌ها", icon: FileText },
];

export default function VerseDetail() {
 const { surah, ayah } = useParams();
 const [ayahData, setAyahData] = useState(null);
 const [reflection, setReflection] = useState(null);
 const [scholars, setScholars] = useState({});
 const [loading, setLoading] = useState(true);
 const [tab, setTab] = useState("overview");
 const [bookmarked, setBookmarked] = useState(false);
 const [selectedReciter, setSelectedReciter] = useState("ar.alafasy");
 const [prefs, handlePrefsChange] = useReadingPrefs();
 const [showReciterMenu, setShowReciterMenu] = useState(false);
 const [chapters, setChapters] = useState([]);

 const router = useRouter();
 const navigate = (path) => router.push(path);
 const { playTrack, track: currentTrack, isPlaying, togglePlay, seek } = useAudioPlayer();

 const surahNum = Number(surah);
 const ayahNum = Number(ayah);
 const totalAyahs = SURAH_DATA[surahNum - 1]?.numberOfAyahs || ayahData?.totalVerses || 286;

 const currentTheme =
 DIACRITIC_THEMES.find((t) => t.id === prefs.diacriticTheme) || DIACRITIC_THEMES[0];

 const arabic = reflection?.arabic || ayahData?.arabic || "";
 const translation = reflection?.translation || ayahData?.translation || "";
 const transliteration = reflection?.transliteration || ayahData?.transliteration || "";
 const surahName = ayahData?.surahName || reflection?.surah_name_arabic || `سوره ${surah}`;
 const activeReciter = RECITERS.find((r) => r.id === selectedReciter) || RECITERS[0];
 const computedAudio = getAudioUrl(surahNum, ayahNum, selectedReciter) || ayahData?.audio || reflection?.audio_url || "";
 const difficultyLabel = reflection?.difficulty_level
 ? { beginner: "مقدماتی", intermediate: "متوسط", advanced: "پیشرفته" }[reflection.difficulty_level] || reflection.difficulty_level
 : null;

 const isThisVersePlaying = isPlaying && currentTrack?.id === `verse-${surah}-${ayah}`;

 // Build chapters from reflection data
 useEffect(() => {
 if (reflection?.chapters?.length) {
 setChapters(reflection.chapters);
 } else if (reflection?.tafsir_sections?.length) {
 setChapters(reflection.tafsir_sections.map((s, i) => ({ title: s.title, timestamp: i * 60 })));
 }
 }, [reflection]);

 const toggleAudio = (reciterId = selectedReciter) => {
 trackEngagement("audio_play");
 const targetRec = RECITERS.find((r) => r.id === reciterId) || activeReciter;
 const trackAudioUrl = getAudioUrl(surahNum, ayahNum, reciterId);
 if (currentTrack?.id === `verse-${surah}-${ayah}` && currentTrack?.reciterId === reciterId) {
 togglePlay();
 } else {
 playTrack({
 id: `verse-${surah}-${ayah}`,
 title: `سوره ${surahName} — آیه ${fa(ayahNum)}`,
 subtitle: `${targetRec.style} • ${targetRec.name}`,
 audioUrl: trackAudioUrl,
 type: "quran",
 verseKey: `${surah}:${ayah}`,
 reciter: targetRec.name,
 reciterId: targetRec.id,
 chapters: chapters.map(c => ({ title: c.title, time: c.timestamp })),
 });
 }
 };

 const handleReciterChange = (newReciterId) => {
 setSelectedReciter(newReciterId);
 setShowReciterMenu(false);
 if (isThisVersePlaying) {
 toggleAudio(newReciterId);
 }
 };

 const hasPrev = ayahNum > 1;
 const hasNext = ayahNum < totalAyahs;

 const goToPrev = () => {
 if (hasPrev) {
 navigate(`/verse/${surahNum}/${ayahNum - 1}`);
 }
 };
 const goToNext = () => {
 if (hasNext) {
 navigate(`/verse/${surahNum}/${ayahNum + 1}`);
 }
 };

 const handleShare = async () => {
 const url = window.location.href;
 const text = `${arabic || ""}\n«${translation || ""}»\n${url}`;
 if (navigator.share) {
 try {
 await navigator.share({ title: `آیه ${ayah} ${surahName}`, text, url });
 return;
 } catch {}
 }
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
 toast.success("متن و پیوند آیه رونوشت شد");
 } catch {
 toast.error("امکان کپی در این مرورگر فراهم نشد");
 }
 };

 useEffect(() => {
 const key = `${surah}:${ayah}`;
 const bookmarks = JSON.parse(localStorage.getItem(scopedKey("tadabbur-bookmarks")) || "[]");
 setBookmarked(bookmarks.includes(key));
 }, [surah, ayah]);

 useEffect(() => {
 if (reflection || ayahData) {
 const key = `${surah}:${ayah}`;
 const translation = reflection?.translation || ayahData?.translation || "";
 localStorage.setItem("tadabbur-last-verse", JSON.stringify({ verse_key: key, translation }));
 }
 }, [reflection, ayahData, surah, ayah]);

 const toggleBookmark = () => {
 const key = `${surah}:${ayah}`;
 const bookmarks = JSON.parse(localStorage.getItem(scopedKey("tadabbur-bookmarks")) || "[]");
 const wasBookmarked = bookmarks.includes(key);
 const updated = wasBookmarked
 ? bookmarks.filter((b) => b !== key)
 : [...bookmarks, key];
 localStorage.setItem(scopedKey("tadabbur-bookmarks"), JSON.stringify(updated));
 setBookmarked(updated.includes(key));
 if (!wasBookmarked) trackEngagement("bookmark");
 };

 useEffect(() => {
 setLoading(true);
 setAyahData(null);
 setReflection(null);
 const key = `${surah}:${ayah}`;
 Promise.all([
 getAyah(Number(surah), Number(ayah)).catch(() => null),
 api.entities.Verse.filter({ verse_key: key }, "-created_date", 5).catch(() => []),
 ])
 .then(async ([a, refls]) => {
 setAyahData(a);
 if (a) { markVerseRead(`${surah}:${ayah}`, { juz: a.juz, surah: Number(surah) }); trackEngagement("verse_read"); }
 const refl = refls[0] || null;
 setReflection(refl);
 if (refl) {
 const ids = [...new Set((refl.reflections || []).map((r) => r.scholar_id).filter(Boolean))];
 const map = {};
 await Promise.all(
 ids.map(async (sid) => {
 try { map[sid] = await api.entities.Scholar.get(sid); } catch { map[sid] = { name: "نامشخص" }; }
 })
 );
 setScholars(map);
 }
 })
 .finally(() => setLoading(false));
 }, [surah, ayah]);

 if (loading) {
 return (
 <div className="flex justify-center py-32">
 <div className="flex flex-col items-center gap-4">
 <Loader2 className="h-10 w-10 animate-spin text-accent" />
 <p className="text-sm text-muted-foreground font-doran">در حال بارگذاری آیه...</p>
 </div>
 </div>
 );
 }

 if (!ayahData && !reflection) {
 return (
 <div className="mx-auto max-w-md py-24 text-center">
 <BookOpen className="h-8 w-8 text-muted-foreground/30 mx-auto mb-3" />
 <p className="text-sm text-muted-foreground mb-4">بارگذاری این آیه ناموفق بود. لطفاً دوباره تلاش کنید.</p>
 <Button variant="accent" onClick={() => router.refresh()} className="gap-2">
 <RotateCw className="h-4 w-4" /> تلاش مجدد
 </Button>
 </div>
 );
 }

 return (
 <div className="animate-fade-in min-h-screen">
 {/* ═══════════════ VERSE HERO — TED Style ═══════════════ */}
 <section className="relative overflow-hidden border-b border-accent/10 bg-gradient-to-b from-background to-background">
 <div className="absolute inset-0 opacity-[0.15] dark:opacity-[0.1] pointer-events-none">
 <img src={MIHRAB_IMG} className="w-full h-full object-cover" alt="" />
 </div>
 <IslamicPattern className="text-foreground" opacity={0.03} />
 <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-accent/8 rounded-full blur-3xl pointer-events-none" />

 <div className="relative page-shell-reading py-6 sm:py-10">
 {/* Navigation & Surah Info */}
 <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
 <BackButton to={`/quran?surah=${surah}`} label={surahName} />
 
 {/* Ayah Stepper */}
 <div className="flex items-center gap-2 sm:gap-3 px-3 py-1.5 rounded-full border border-accent/20 bg-card/85 backdrop-blur-md shadow-soft">
 <Button
 variant="ghost"
 size="icon"
 onClick={goToPrev}
 disabled={!hasPrev}
 title="آیه قبلی"
 className={`p-1 rounded-full transition-all ${hasPrev ? "text-foreground hover:bg-accent/20 hover:text-accent" : "text-muted-foreground/30 cursor-not-allowed opacity-50"}`}
 >
 <ChevronRight className="h-4 w-4" />
 </Button>
 <span className="text-xs sm:text-sm font-bold font-ui text-foreground px-3 py-1 rounded-full bg-muted/60 whitespace-nowrap">
 آیه {fa(ayahNum)} از {fa(totalAyahs)}
 </span>
 <Button
 variant="ghost"
 size="icon"
 onClick={goToNext}
 disabled={!hasNext}
 title="آیه بعدی"
 className={`p-1 rounded-full transition-all ${hasNext ? "text-foreground hover:bg-accent/20 hover:text-accent" : "text-muted-foreground/30 cursor-not-allowed opacity-50"}`}
 >
 <ChevronLeft className="h-4 w-4" />
 </Button>
 </div>
 </div>

 {/* Surah Header — Enhanced */}
 <div className="text-center mb-10">
 <div className="inline-flex items-center justify-center gap-3 text-sm tracking-[0.15em] text-accent mb-4 font-semibold">
 <span className="text-2xl text-accent/60">۞</span>
 <span className="font-rokh-bold text-lg">{surahName}</span>
 <span className="text-muted-foreground/50">·</span>
 <span className="font-mono text-base">آیه {ayah} ({surah}:{ayah})</span>
 <span className="text-2xl text-accent/60">۞</span>
 </div>
 
 {/* Meta Badges — Enhanced with Icons */}
 <div className="flex flex-wrap items-center justify-center gap-2 mb-6">
 {ayahData?.revelationType && (
 <Badge variant="quranic" className="gap-1.5">
 <span className="h-3 w-3">{ayahData.revelationType === "Meccan" ? "🕋" : "🏛️"}</span>
 {ayahData.revelationType === "Meccan" ? "مکی" : "مدنی"}
 </Badge>
 )}
 {difficultyLabel && (
 <Badge variant="secondary" className="gap-1.5">
 <Star className="h-3 w-3" />
 {difficultyLabel}
 </Badge>
 )}
 {reflection?.estimated_reading_time && (
 <Badge variant="secondary" className="gap-1.5">
 <Clock className="h-3 w-3" />
 {reflection.estimated_reading_time} دقیقه
 </Badge>
 )}
 {ayahData?.juz && (
 <Badge variant="secondary" className="gap-1.5">
 <Layers className="h-3 w-3" />
 جزء {ayahData.juz}
 </Badge>
 )}
 {(reflection?.tags || []).slice(0, 4).map((t) => (
 <Badge key={t} variant="outline" className="gap-1">
 <Award className="h-3 w-3" />
 {t}
 </Badge>
 ))}
 </div>
 </div>

 {/* Main Verse Display — Enhanced Arabic Typography */}
 <div className="relative my-12">
 <div className="relative z-10 text-center">
 {/* Arabic Text Container */}
 <div className="relative mx-auto max-w-4xl">
 <div 
 className={`text-foreground/95 will-animate my-8 font-bold ${currentTheme.className} relative`}
 dir="rtl"
 lang="ar"
 style={{
 fontFamily: prefs.arabicFont,
 fontSize: `calc(clamp(2.75rem, 7vw, 4.5rem) * ${prefs.arabicScale || prefs.textScale || 1.15})`,
 lineHeight: prefs.lineHeight || 2.8,
 letterSpacing: '0.02em',
 }}
 >
 {renderQuranWaqf(arabic, prefs.highlightWaqf !== false)}
 </div>
 
 {/* Ayah Number Indicator */}
 <div className="absolute -top-8 left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-3 py-1 rounded-full bg-card/95 backdrop-blur-sm border border-border/50 shadow-soft">
 <span className="text-[10px] font-mono text-muted-foreground/60 tracking-widest uppercase">Ayah</span>
 <span className="text-lg font-bold text-accent font-mono">{fa(ayahNum)}</span>
 </div>
 </div>

 {transliteration && (
 <p className="text-sm text-muted-foreground/50 mt-5 tracking-wide font-light leading-relaxed" dir="ltr" style={{fontFamily: 'var(--font-ui)'}}>
 {transliteration}
 </p>
 )}

 <OrnamentalDivider className="my-10" />

 {prefs.showTranslation && (
 <div className="max-w-3xl mx-auto relative">
 <p
 className="text-foreground/85 font-editorial leading-[2.5] text-lg sm:text-xl relative py-2"
 style={{
 fontSize: `calc(clamp(1.125rem, 2.5vw, 1.5rem) * ${prefs.translationScale || 1.0})`,
 }}
 >
 «{translation}»
 </p>
 {/* Translation Quote Marks */}
 <div className="absolute -top-6 -right-6 text-accent/20 text-8xl font-light select-none" aria-hidden="true">«</div>
 <div className="absolute -bottom-10 -left-6 text-accent/20 text-8xl font-light select-none rotate-180" aria-hidden="true">«</div>
 </div>
 )}
 </div>
 </div>

 {/* Audio Player Bar — Prominent TED Style */}
 {computedAudio && (
 <div className="mt-10 mx-auto max-w-3xl relative">
 <div className="rounded-2xl border border-accent/30 bg-gradient-to-r from-accent/5 via-card/95 to-accent/5 backdrop-blur-md p-5 sm:p-6 shadow-premium relative overflow-hidden">
 <div className="absolute inset-0 bg-gradient-to-r from-accent/10 via-transparent to-accent/10" />
 
 <div className="relative flex items-center gap-4 sm:gap-6">
 {/* Main Play Button */}
 <Button
 variant="quranic"
 size="xl"
 onClick={() => toggleAudio()}
 className="h-14 w-14 sm:h-16 sm:w-16 shrink-0 shadow-emerald-glow hover:shadow-lg transition-all"
 title={isThisVersePlaying ? "توقف تلاوت" : "پخش تلاوت"}
 >
 {isThisVersePlaying ? (
 <Pause className="h-7 w-7 sm:h-8 sm:w-8 fill-current" />
 ) : (
 <Play className="h-7 w-7 sm:h-8 sm:w-8 fill-current mr-0.5" />
 )}
 </Button>

 {/* Track Info */}
 <div className="flex-1 min-w-0 text-right">
 <div className="text-sm font-bold text-foreground truncate">تلاوت ترتیل آیه مبارکه</div>
 <div className="flex items-center justify-end gap-3 mt-1 flex-wrap">
 <span className="text-xs text-muted-foreground truncate max-w-[200px]">{activeReciter.name}</span>
 <span className="text-muted-foreground/30">•</span>
 <span className="text-xs text-accent font-semibold">{isThisVersePlaying ? "در حال پخش" : activeReciter.style}</span>
 </div>
 
 {/* Progress Bar when playing */}
 {isThisVersePlaying && currentTrack?.duration && (
 <div className="mt-3 flex items-center gap-2">
 <span className="text-xs text-muted-foreground font-mono w-16 text-left">
 {formatTime(currentTrack.currentTime || 0)}
 </span>
 <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
 <div
 className="h-full bg-accent rounded-full transition-all duration-100"
 style={{ width: `${((currentTrack.currentTime || 0) / currentTrack.duration) * 100}%` }}
 />
 </div>
 <span className="text-xs text-muted-foreground font-mono w-16 text-right">
 {formatTime(currentTrack.duration)}
 </span>
 </div>
 )}
 </div>

 {/* Reciter Selector */}
 <div className="relative shrink-0">
 <Button
 variant="outline"
 size="sm"
 onClick={() => setShowReciterMenu(!showReciterMenu)}
 className="gap-1.5 px-3 py-2"
 >
 <Volume2 className="h-4 w-4" />
 <span className="hidden sm:inline max-w-[120px] truncate">{activeReciter.name}</span>
 <ChevronDown className="h-3.5 w-3.5" />
 </Button>
 
 {showReciterMenu && (
 <>
 <div className="fixed inset-0 z-40" onClick={() => setShowReciterMenu(false)} />
 <div className="absolute bottom-full left-0 right-0 z-50 mb-2 w-full max-w-xs">
 <div className="rounded-2xl border border-border bg-popover p-1.5 shadow-2xl backdrop-blur-md animate-scale-in font-ui text-xs">
 <div className="px-3 py-2 text-[11px] font-bold text-muted-foreground border-b border-border/50">
 انتخاب قاری ترتیل:
 </div>
 {RECITERS.map((r) => {
 const isChosen = r.id === selectedReciter;
 return (
 <Button
 key={r.id}
 onClick={() => handleReciterChange(r.id)}
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
 </Button>
 );
 })}
 </div>
 </div>
 </>
 )}
 </div>
 </div>
 </div>
 </div>
 )}

 {/* Action Buttons Row — Enhanced Grouped Design */}
 <div className="mt-10">
 <div className="flex flex-wrap items-center justify-center gap-2.5 sm:gap-3">
 {/* Primary Actions */}
 <div className="flex flex-wrap items-center gap-2">
 <Button
 variant="secondary"
 size="sm"
 onClick={() => navigate(`/assistants?q=تدبّر در آیه ${surah}:${ayah}`)}
 className="gap-1.5 px-4 py-2"
 >
 <div className="p-1 rounded bg-primary/10 text-primary">
 <Palette className="h-4 w-4" />
 </div>
 <span>سازماندهی بصری</span>
 </Button>
 <Button
 variant={bookmarked ? "accent" : "outline"}
 size="sm"
 onClick={toggleBookmark}
 className="gap-1.5 px-4 py-2"
 >
 <div className={`${bookmarked ? 'bg-accent/20 text-accent' : 'bg-muted text-muted-foreground'}`}
 >
 <Bookmark className="h-4 w-4" />
 </div>
 <span>{bookmarked ? "نشان شده" : "نشان کردن"}</span>
 </Button>
 </div>
 
 {/* Divider */}
 <div className="h-8 w-px bg-border/50 mx-1 hidden sm:block" />
 
 {/* Secondary Actions */}
 <div className="flex flex-wrap items-center gap-2">
 <Button
 variant="outline"
 size="sm"
 onClick={handleShare}
 className="gap-1.5 px-4 py-2"
 >
 <Share2 className="h-4 w-4" />
 <span className="hidden sm:inline">اشتراک‌گذاری</span>
 </Button>
 <Button
 variant="outline"
 size="sm"
 onClick={() => navigate(`/community?verse=${surah}:${ayah}`)}
 className="gap-1.5 px-4 py-2"
 >
 <MessageSquare className="h-4 w-4" />
 <span className="hidden sm:inline">گفتگوی جامعه</span>
 </Button>
 <Button
 variant="outline"
 size="sm"
 onClick={() => setTab("notes")}
 className="gap-1.5 px-4 py-2"
 >
 <FileText className="h-4 w-4" />
 <span className="hidden sm:inline">یادداشت من</span>
 </Button>
 </div>
 </div>
 
 {/* Keyboard Shortcuts Hint */}
 <div className="mt-4 flex items-center justify-center gap-4 text-[10px] text-muted-foreground/60 font-ui">
 <kbd className="px-1.5 py-0.5 rounded bg-muted/50 border border-border/50 font-mono">←</kbd>
 <span>/</span>
 <kbd className="px-1.5 py-0.5 rounded bg-muted/50 border border-border/50 font-mono">→</kbd>
 <span>ناوبری آیات  •  </span>
 <kbd className="px-1.5 py-0.5 rounded bg-muted/50 border border-border/50 font-mono">Space</kbd>
 <span>پخش/توقف  •  </span>
 <kbd className="px-1.5 py-0.5 rounded bg-muted/50 border border-border/50 font-mono">S</kbd>
 <span>نشان کردن</span>
 </div>
 </div>
 </div>
 </section>

 {/* ═══════════════ TAB BAR — TED Style ═══════════════ */}
 <div className="sticky top-16 z-30 border-b border-accent/10 glass-strong">
 <div className="page-shell">
 <Tabs value={tab} onValueChange={setTab} className="w-full">
 <TabsList className="grid w-full gap-1 p-1 bg-muted/50 rounded-xl" aria-label="بخش‌های آیه">
 {TABS.map(({ id: tid, label, icon: Icon }) => (
 <TabsTrigger
 key={tid}
 value={tid}
 className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium font-ui transition-all duration-200 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=inactive]:text-muted-foreground data-[state=inactive]:hover:text-foreground"
 >
 <Icon className="h-4 w-4" />
 <span className="hidden sm:inline">{label}</span>
 </TabsTrigger>
 ))}
 </TabsList>
 </Tabs>
 </div>
 </div>

 {/* ═══════════════ CONTENT ═══════════════ */}
 <div className="page-shell py-6 sm:py-8">
 <div className="grid lg:grid-cols-[1fr_320px] gap-8 lg:gap-12">
 {/* Main Content */}
 <div className="lg:col-span-1">
 {tab === "overview" && <Overview reflection={reflection} translation={translation} />}
 {tab === "tafsir" && (
 <Tafsir
 reflection={reflection}
 surah={surah}
 ayah={ayah}
 surahName={surahName}
 translation={translation}
 navigate={navigate}
 />
 )}
 {tab === "linguistic" && <Linguistic reflection={reflection} />}
 {tab === "context" && <Context reflection={reflection} />}
 {tab === "reflections" && <Reflections reflection={reflection} scholars={scholars} />}
 {tab === "lessons" && <Lessons reflection={reflection} />}
 {tab === "media" && (
 <Media
 reflection={reflection}
 audio={computedAudio}
 reciter={activeReciter.name}
 />
 )}
 {tab === "related" && <Related reflection={reflection} />}
 {tab === "notes" && <Notes verseKey={`${surah}:${ayah}`} />}
 </div>

 {/* Sidebar — TED Style: Speaker, Chapters, Related */}
 <aside className="hidden lg:block">
 <div className="sticky top-24 space-y-6">
 {/* Speaker / Scholar Card */}
 {reflection?.scholar_id && scholars[reflection.scholar_id] && (
 <ScholarCard item={scholars[reflection.scholar_id]} />
 )}

 {/* Chapters / Timestamps */}
 {chapters.length > 0 && (
 <ChapterList
 chapters={chapters}
 currentTrack={currentTrack}
 isPlaying={isThisVersePlaying}
 onSeek={(time) => seek(time)}
 />
 )}

 {/* Related Verses — Quick Links */}
 {(reflection?.related_verses?.length || reflection?.related_hadith?.length) && (
 <RelatedSidebar
 relatedVerses={reflection.related_verses || []}
 relatedHadith={reflection.related_hadith || []}
 onNavigate={navigate}
 />
 )}

 {/* Share / Download / Report */}
 <ActionSidebar
 verseKey={`${surah}:${ayah}`}
 arabic={arabic}
 translation={translation}
 url={typeof window !== 'undefined' ? window.location.href : ''}
 onShare={handleShare}
 bookmarked={bookmarked}
 onBookmark={toggleBookmark}
 />
 </div>
 </aside>
 </div>
 </div>
 </div>
 );
}

/* ── Helper Components ── */

function formatTime(seconds) {
 const mins = Math.floor(seconds / 60);
 const secs = Math.floor(seconds % 60);
 return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function ChapterList({ chapters, currentTrack, isPlaying, onSeek }) {
 return (
 <Card variant="default" className="p-4">
 <div className="flex items-center justify-between mb-4">
 <h4 className="font-rokh-bold font-bold text-sm text-foreground">فصول و مباحث</h4>
 {isPlaying && (
 <Badge variant="accent" className="text-[10px]">
 <Play className="h-2.5 w-2.5 ml-0.5" />
 در حال پخش
 </Badge>
 )}
 </div>
 <ScrollArea className="h-64">
 <div className="space-y-2">
 {chapters.map((c, i) => (
 <Button
 key={i}
 onClick={() => onSeek(c.timestamp || i * 60)}
 className="w-full text-right p-2 rounded-xl hover:bg-accent/10 transition-colors group"
 >
 <div className="flex items-center justify-between gap-2">
 <span className="text-sm text-foreground font-medium truncate">{c.title}</span>
 <span className="text-xs text-muted-foreground font-mono shrink-0">
 {formatTime(c.timestamp || i * 60)}
 </span>
 </div>
 <div className="h-0.5 bg-muted/50 mt-1 rounded-full overflow-hidden">
 <div
 className="h-full bg-accent/20 rounded-full transition-all duration-300"
 style={{ width: isPlaying && currentTrack?.duration && c.timestamp 
 ? `${Math.min(100, (c.timestamp / currentTrack.duration) * 100)}%` 
 : '0%' }}
 />
 </div>
 </Button>
 ))}
 </div>
 </ScrollArea>
 </Card>
 );
}

function RelatedSidebar({ relatedVerses, relatedHadith, onNavigate }) {
 return (
 <Card variant="default" className="p-4">
 <h4 className="font-rokh-bold font-bold text-sm text-foreground mb-4">مربوط</h4>
 <div className="space-y-3">
 {relatedVerses?.slice(0, 5).map((v, i) => (
 <Button
 key={i}
 onClick={() => {
 const [s, a] = v.split(':').map(Number);
 if (s && a) onNavigate(`/verse/${s}/${a}`);
 }}
 className="w-full text-right p-2 rounded-xl hover:bg-accent/10 transition-colors"
 >
 <div className="flex items-center justify-between">
 <span className="text-sm text-foreground font-medium">{v}</span>
 <ChevronLeft className="h-3.5 w-3.5 text-muted-foreground" />
 </div>
 </Button>
 ))}
 {relatedHadith?.slice(0, 3).map((h, i) => (
 <div key={i} className="p-3 rounded-xl bg-muted/30 border border-border/50">
 <p className="text-xs italic text-muted-foreground leading-relaxed">«{h.text}»</p>
 <div className="text-[10px] text-muted-foreground/70 mt-1 flex items-center gap-1">
 <span className="h-1 w-1 rounded-full bg-accent/40" />
 {h.narrator} · {h.source}
 </div>
 </div>
 ))}
 </div>
 </Card>
 );
}

function ActionSidebar({ verseKey, arabic, translation, url, onShare, bookmarked, onBookmark }) {
 return (
 <Card variant="quranic" className="p-4">
 <h4 className="font-rokh-bold font-bold text-sm text-foreground mb-4">اکشن‌ها</h4>
 <div className="space-y-2">
 <Button variant="outline" className="w-full gap-2 justify-start" onClick={onShare}>
 <Share2 className="h-4 w-4" />
 <span>اشتراک‌گذاری آیه</span>
 </Button>
 <Button 
 variant={bookmarked ? "accent" : "outline"} 
 className="w-full gap-2 justify-start"
 onClick={onBookmark}
 >
 <Bookmark className="h-4 w-4" />
 <span>{bookmarked ? "حذف از نشان‌ها" : "نشان کردن آیه"}</span>
 </Button>
 <Button variant="outline" className="w-full gap-2 justify-start" onClick={() => {
 const text = `${arabic || ""}\n«${translation || ""}»\n${url}`;
 navigator.clipboard?.writeText(text);
 toast.success("متن کپی شد");
 }}>
 <Download className="h-4 w-4" />
 <span>دانلود متن آیه</span>
 </Button>
 <Button variant="ghost" className="w-full gap-2 justify-start text-destructive hover:bg-destructive/10">
 <Flag className="h-4 w-4" />
 <span>گزارش مشکل</span>
 </Button>
 </div>
 </Card>
 );
}

/* ── Content Components (Updated with Sonnat UI) ── */

function Overview({ reflection, translation }) {
 return (
 <div className="space-y-8">
 <Section icon={Compass} title="ترجمه و معنا">
 <Card variant="default" className="p-6">
 <Quote className="h-5 w-5 text-accent/40 mb-3" />
 <Prose>{translation}</Prose>
 </Card>
 </Section>
 <Section icon={Sparkles} title="تدبّر">
 {reflection?.tadabbur ? (
 <Card variant="default" className="p-6"><Prose>{reflection.tadabbur}</Prose></Card>
 ) : <Empty /> }
 </Section>
 {reflection?.questions_to_reflect?.length > 0 && (
 <Section icon={HelpCircle} title="پرسش‌ها برای تدبّر">
 <div className="space-y-3">
 {reflection.questions_to_reflect.map((q, i) => (
 <Card key={i} variant="default" className="p-4">
 <div className="flex gap-3">
 <span className="shrink-0 h-6 w-6 rounded-lg bg-accent/10 text-accent flex items-center justify-center text-xs font-bold">؟</span>
 <span className="text-sm text-muted-foreground leading-relaxed">{q}</span>
 </div>
 </Card>
 ))}
 </div>
 </Section>
 )}
 </div>
 );
}

function Linguistic({ reflection }) {
 if (!reflection) return <Empty />;
 return (
 <div className="space-y-8">
 {reflection.word_analysis?.length > 0 && (
 <Section icon={Languages} title="معنای کلمه‌به‌کلمه">
 <div className="grid sm:grid-cols-2 gap-3">
 {reflection.word_analysis.map((w, i) => (
 <Card key={i} variant="default" className="p-4 hover:border-accent/20 transition-colors">
 <div className="text-right text-2xl text-foreground/80 mb-1" dir="rtl">{w.word}</div>
 <div className="text-xs text-muted-foreground italic">{w.transliteration}</div>
 <div className="text-sm mt-1.5 font-medium">{w.meaning}</div>
 </Card>
 ))}
 </div>
 </Section>
 )}
 {reflection.root_words?.length > 0 && (
 <Section icon={BookOpen} title="ریشه واژه‌ها">
 <div className="grid sm:grid-cols-2 gap-3">
 {reflection.root_words.map((r, i) => (
 <Card key={i} variant="default" className="p-4 flex items-center justify-between">
 <div>
 <div className=" text-2xl text-foreground/80" dir="rtl">{r.root}</div>
 <div className="text-sm text-muted-foreground mt-0.5">{r.meaning}</div>
 </div>
 <span className="text-xs text-accent font-medium shrink-0">{r.occurrences}× در قرآن</span>
 </Card>
 ))}
 </div>
 </Section>
 )}
 {reflection.grammar_breakdown && (
 <Section icon={FileText} title="تجزیه گرامری">
 <Card variant="default" className="p-6"><Prose>{reflection.grammar_breakdown}</Prose></Card>
 </Section>
 )}
 {!reflection.word_analysis?.length && !reflection.root_words?.length && !reflection.grammar_breakdown && <Empty />}
 </div>
 );
}

function Context({ reflection }) {
 if (!reflection) return <Empty />;
 const hasContent = reflection.historical_context || reflection.asbab_al_nuzul;
 if (!hasContent) return <Empty />;

 return (
 <div className="space-y-8">
 <div className="relative pr-6">
 <div className="absolute right-[11px] top-2 bottom-2 w-px bg-gradient-to-b from-accent/30 via-border to-transparent" />
 {reflection.historical_context && (
 <TimelineItem icon={History} title="زمینه تاریخی">
 <Prose>{reflection.historical_context}</Prose>
 </TimelineItem>
 )}
 {reflection.asbab_al_nuzul && (
 <TimelineItem icon={Compass} title="اسباب نزول">
 <Prose>{reflection.asbab_al_nuzul}</Prose>
 </TimelineItem>
 )}
 </div>
 </div>
 );
}

function TimelineItem({ icon: Icon, title, children }) {
 return (
 <div className="relative mb-8">
 <div className="absolute right-0 top-0 h-6 w-6 rounded-full bg-card border-2 border-accent/30 flex items-center justify-center -mr-1.5">
 <Icon className="h-3 w-3 text-accent" />
 </div>
 <div className="mr-8">
 <h3 className="font-rokh-bold font-bold text-lg mb-3">{title}</h3>
 <Card variant="default" className="p-5">{children}</Card>
 </div>
 </div>
 );
}

function Tafsir({ reflection, surah, ayah, surahName, translation, navigate }) {
 if (reflection?.classical_tafsir || reflection?.modern_tafsir) {
 return (
 <div className="space-y-8">
 {reflection.classical_tafsir && (
 <Section icon={BookOpen} title="تفسیر کلاسیک">
 <Card variant="default" className="p-6"><Prose>{reflection.classical_tafsir}</Prose></Card>
 </Section>
 )}
 {reflection.modern_tafsir && (
 <Section icon={Sparkles} title="تفسیر نوین">
 <Card variant="default" className="p-6"><Prose>{reflection.modern_tafsir}</Prose></Card>
 </Section>
 )}
 </div>
 );
 }

 return (
 <Card variant="quranic" className="p-6 sm:p-10 text-center">
 <div className="h-12 w-12 rounded-2xl bg-accent/15 text-accent flex items-center justify-center mx-auto mb-4 border border-accent/20 shadow-xs">
 <Compass className="h-6 w-6" />
 </div>
 <h3 className="font-rokh-bold font-bold text-lg sm:text-xl mb-2 text-foreground">
 تفسیر {surahName}، آیه {fa(ayah)}
 </h3>
 <p className="text-sm text-muted-foreground max-w-lg mx-auto mb-6 leading-relaxed">
 تفسیر سنتی این آیه در دیتابیس محلی موجود نیست. می‌توانید تفسیر، شأن نزول و تدبّر را از دستیار قرآنی بپرسید یا در جامعه تدبّر طرح کنید.
 </p>
 <div className="flex flex-wrap items-center justify-center gap-3">
 <Button
 variant="accent"
 size="sm"
 onClick={() =>
 navigate(
 `/assistants?q=${encodeURIComponent(
 `لطفاً تفسیر، شأن نزول و نکات تدبّری آیه ${ayah} ${surahName} («${translation}») را برایم شرح دهید.`
 )}`
 )
 }
 className="gap-1.5"
 >
 <Bot className="h-4 w-4" />
 پرسش از دستیار قرآنی
 </Button>
 <Button
 variant="outline"
 size="sm"
 onClick={() => navigate(`/community?verse=${surah}:${ayah}`)}
 className="gap-1.5"
 >
 <MessageSquare className="h-4 w-4" />
 گفتگو در جامعه تدبّر
 </Button>
 </div>
 </Card>
 );
}

function Reflections({ reflection, scholars }) {
 if (!reflection?.reflections?.length) return <Empty text="تدبّری برای این آیه ثبت نشده است." />;
 return (
 <div className="grid gap-3">
 {reflection.reflections.map((r, i) => (
 <ReflectionCard key={i} reflection={r} scholarName={r.scholar_id ? scholars[r.scholar_id]?.name : null} />
 ))}
 </div>
 );
}

function Lessons({ reflection }) {
 if (!reflection) return <Empty />;
 return (
 <div className="space-y-8">
 {reflection.life_lessons?.length > 0 && (
 <Section icon={Lightbulb} title="درس‌های زندگی">
 <div className="space-y-3">
 {reflection.life_lessons.map((l, i) => (
 <Card key={i} variant="default" className="p-4">
 <div className="flex gap-3">
 <span className="shrink-0 h-7 w-7 rounded-lg bg-accent/10 text-accent flex items-center justify-center text-xs font-bold">{i + 1}</span>
 <span className="text-sm text-muted-foreground leading-relaxed">{l}</span>
 </div>
 </Card>
 ))}
 </div>
 </Section>
 )}
 {reflection.practical_applications?.length > 0 && (
 <Section icon={Compass} title="کاربردهای عملی">
 <div className="space-y-3">
 {reflection.practical_applications.map((a, i) => (
 <Card key={i} variant="default" className="p-4">
 <div className="flex gap-3">
 <Compass className="shrink-0 h-5 w-5 text-accent mt-0.5" />
 <span className="text-sm text-muted-foreground leading-relaxed">{a}</span>
 </div>
 </Card>
 ))}
 </div>
 </Section>
 )}
 {!reflection.life_lessons?.length && !reflection.practical_applications?.length && <Empty />}
 </div>
 );
}

function Media({ reflection, audio, reciter }) {
 const [isPlaying, setIsPlaying] = useState(false);
 const audioElemRef = useRef(null);

 const toggleMediaPlay = () => {
 if (!audioElemRef.current) return;
 if (isPlaying) {
 audioElemRef.current.pause();
 setIsPlaying(false);
 } else {
 audioElemRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
 }
 };

 return (
 <div className="space-y-8">
 {reflection?.videos?.length > 0 ? (
 <Section icon={Video} title="ویدیوها">
 <div className="grid sm:grid-cols-2 gap-4">
 {reflection.videos.map((v, i) => (
 <Card key={i} variant="interactive" className="overflow-hidden">
 <div className="aspect-video bg-muted/50 flex items-center justify-center relative">
 <Video className="h-8 w-8 text-muted-foreground/30" />
 <div className="absolute inset-0 bg-gradient-to-t from-card/60 to-transparent" />
 </div>
 <CardContent className="p-4">
 <div className="font-medium text-sm">{v.title}</div>
 <div className="text-xs text-muted-foreground mt-1">{v.scholar}{v.duration ? ` · ${v.duration}` : ""}</div>
 </CardContent>
 </Card>
 ))}
 </div>
 </Section>
 ) : <Empty text="ویدیویی برای این آیه موجود نیست." />}
 {audio && (
 <Section icon={Mic} title="تلاوت">
 <Card variant="default" className="p-5">
 <div className="flex items-center gap-4 mb-3">
 <Button
 variant="accent"
 size="icon"
 onClick={toggleMediaPlay}
 className="h-10 w-10 shrink-0 hover:shadow-glow transition-all"
 title={isPlaying ? "توقف تلاوت" : "پخش تلاوت"}
 >
 {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 mr-0.5" />}
 </Button>
 <div>
 <div className="text-sm font-medium">تلاوت آیه</div>
 <div className="text-xs text-muted-foreground">{reciter}</div>
 </div>
 </div>
 <audio
 ref={audioElemRef}
 src={audio}
 onPlay={() => setIsPlaying(true)}
 onPause={() => setIsPlaying(false)}
 onEnded={() => setIsPlaying(false)}
 controls
 className="w-full"
 />
 </Card>
 </Section>
 )}
 </div>
 );
}

function Related({ reflection }) {
 if (!reflection) return <Empty />;
 return (
 <div className="space-y-8">
 {reflection.related_verses?.length > 0 && (
 <Section icon={Link2} title="آیات مرتبط">
 <div className="space-y-3">
 {reflection.related_verses.map((r, i) => (
 <Card key={i} variant="default" className="p-4">
 <div className="flex items-start gap-3">
 <BookMarked className="h-4 w-4 text-accent/50 shrink-0 mt-0.5" />
 <span className="text-sm text-muted-foreground leading-relaxed">{r}</span>
 </div>
 </Card>
 ))}
 </div>
 </Section>
 )}
 {reflection.related_hadith?.length > 0 && (
 <Section icon={BookOpen} title="احادیث مرتبط">
 <div className="space-y-3">
 {reflection.related_hadith.map((h, i) => (
 <Card key={i} variant="default" className="p-5">
 <Quote className="h-4 w-4 text-accent/40 mb-2" />
 <p className="text-sm italic text-muted-foreground leading-relaxed">«{h.text}»</p>
 <div className="text-xs text-muted-foreground/80 mt-3 flex items-center gap-1.5">
 <span className="h-1 w-1 rounded-full bg-accent/40" />
 {h.narrator} · {h.source}
 </div>
 </Card>
 ))}
 </div>
 </Section>
 )}
 {reflection.references?.length > 0 && (
 <Section icon={FileText} title="منابع">
 <Card variant="default" className="p-5 space-y-2">
 {reflection.references.map((r, i) => (
 <div key={i} className="flex gap-3 text-sm text-muted-foreground">
 <span className="text-accent font-mono text-xs shrink-0 mt-0.5">[{i + 1}]</span>
 <span className="leading-relaxed">{r}</span>
 </div>
 ))}
 </Card>
 </Section>
 )}
 {!reflection.related_verses?.length && !reflection.related_hadith?.length && !reflection.references?.length && <Empty text="محتوای مرتبطی برای این آیه یافت نشد." />}
 </div>
 );
}

function Notes({ verseKey }) {
 const [notes, setNotes] = useState("");
 const [savedStatus, setSavedStatus] = useState(false);
 const storageKey = scopedKey(`tadabbur-notes-${verseKey}`);

 useEffect(() => {
 setNotes(localStorage.getItem(storageKey) || "");
 }, [storageKey]);

 const save = (val) => {
 setNotes(val);
 localStorage.setItem(storageKey, val);
 setSavedStatus(true);
 setTimeout(() => setSavedStatus(false), 2000);
 };

 const handleManualSave = () => {
 localStorage.setItem(storageKey, notes);
 setSavedStatus(true);
 toast.success("یادداشت با موفقیت ذخیره شد");
 if (notes.trim()) trackEngagement("note");
 };

 return (
 <div>
 <Section icon={FileText} title="یادداشت شخصی">
 <Card variant="default" className="p-5">
 <Textarea
 value={notes}
 onChange={(e) => save(e.target.value)}
 onBlur={() => { if (notes.trim()) trackEngagement("note"); }}
 placeholder="یادداشت‌تان درباره این آیه..."
 className="w-full min-h-[220px] bg-transparent text-sm leading-relaxed focus:outline-none resize-y placeholder:text-muted-foreground/50"
 dir="rtl"
 />
 <div className="mt-4 pt-3 border-t border-border/40 flex items-center justify-between">
 <span className="text-xs text-muted-foreground">
 {savedStatus ? "✓ ذخیره شد" : "یادداشت‌ها خودکار ذخیره می‌شوند."}
 </span>
 <Button
 onClick={handleManualSave}
 variant="primary"
 size="sm"
 className="gap-1.5"
 >
 ذخیره
 </Button>
 </div>
 </Card>
 </Section>
 </div>
 );
}

/* ── UI Primitives ── */
function ActionBtn({ icon: Icon, label, onClick, active = false, variant = "outline" }) {
 return (
 <Button
 onClick={onClick}
 className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-ui font-bold border transition-all ${
 active ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:text-foreground hover:bg-secondary"
 }`}
 >
 <Icon className="h-3.5 w-3.5" />
 {label}
 </Button>
 );
}

function Section({ icon: Icon, title, children }) {
 return (
 <section className="mb-8 sm:mb-12 animate-fade-in">
 <div className="flex items-center gap-3 mb-5">
 <div className="h-9 w-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
 <Icon className="h-4.5 w-4.5" />
 </div>
 <div>
 <h3 className="font-rokh-bold font-bold text-lg sm:text-xl text-foreground">{title}</h3>
 </div>
 </div>
 {children}
 </section>
 );
}

function Prose({ children }) {
 return <div className="text-foreground/70 leading-[2.1] whitespace-pre-line max-w-none text-[15px] sm:text-base">{children}</div>;
}

function Empty({ text = "محتوایی برای این بخش وجود ندارد." }) {
 return (
 <div className="rounded-2xl border border-dashed border-border/60 p-12 text-center text-sm text-muted-foreground">
 <BookOpen className="h-8 w-8 text-muted-foreground/30 mx-auto mb-3" />
 {text}
 </div>
 );
}

function ReflectionCard({ reflection, scholarName }) {
 return (
 <Card variant="default" className="p-4">
 {scholarName && (
 <div className="flex items-center gap-2 mb-2">
 <div className="h-5 w-5 rounded-full bg-accent/10 text-accent flex items-center justify-center text-xs font-bold">
 {scholarName[0]}
 </div>
 <span className="text-xs font-medium text-accent">{scholarName}</span>
 </div>
 )}
 <p className="text-sm text-muted-foreground leading-relaxed">{reflection.text || reflection.content || reflection}</p>
 {reflection.source && (
 <div className="text-xs text-muted-foreground/70 mt-2 flex items-center gap-1">
 <span className="h-1 w-1 rounded-full bg-accent/40" />
 منبع: {reflection.source}
 </div>
 )}
 </Card>
 );
}