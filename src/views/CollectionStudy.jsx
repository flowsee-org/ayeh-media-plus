'use client';
import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, Link } from "@/lib/router-compat";
import api from "@/lib/api";
import { getAyah, getSurahList } from "@/lib/quranApi";
import { markVerseRead, getReadVerses } from "@/lib/readingTracker";
import { scopedKey } from "@/lib/storageScope";
import { toast } from "react-hot-toast";
import OrnamentalDivider from "@/components/OrnamentalDivider";
import BackButton from "@/components/BackButton";
import EmptyState from "@/components/design-system/EmptyState";
import {
 ChevronRight, ChevronLeft, BookOpen, Loader2, Languages,
 Compass, Sparkles, Users, Clock, Play, Pause, Tag, CheckCircle2,
} from "lucide-react";

const TABS = [
 { id: "linguistic", label: "زبان‌شناسی", icon: Languages },
 { id: "commentary", label: "تفسیر علما", icon: Users },
 { id: "tafsir", label: "تفسیر کلاسیک", icon: Compass },
 { id: "reflection", label: "تدبّر", icon: Sparkles },
];

export default function CollectionStudy() {
 const { id } = useParams();
 const [collection, setCollection] = useState(null);
 const [verses, setVerses] = useState([]);
 const [surahs, setSurahs] = useState({});
 const [scholars, setScholars] = useState({});
 const [loading, setLoading] = useState(true);
 const [selectedIdx, setSelectedIdx] = useState(0);
 const [tab, setTab] = useState("linguistic");
 const [playing, setPlaying] = useState(false);
 const [readVerses, setReadVerses] = useState(() => getReadVerses());
 const audioRef = useRef(null);

 const toggleAudio = () => {
 if (!audioRef.current) return;
 if (playing) {
 audioRef.current.pause();
 setPlaying(false);
 } else {
 audioRef.current.play().then(() => setPlaying(true)).catch(() => {});
 }
 };

 const toggleMarkRead = (v) => {
 if (!v?.verse_key) return;
 const isCurrentlyRead = !!readVerses[v.verse_key];
 const updated = { ...readVerses };
 if (isCurrentlyRead) {
 delete updated[v.verse_key];
 localStorage.setItem(scopedKey("tadabbur-read-verses"), JSON.stringify(updated));
 setReadVerses(updated);
 toast.success("علامت مطالعه برداشته شد");
 } else {
 markVerseRead(v.verse_key, { surah: v.surah_number, juz: v.juz });
 setReadVerses(getReadVerses());
 toast.success("آیه به عنوان مطالعه‌شده ثبت شد");
 }
 };

 useEffect(() => {
 setLoading(true);
 Promise.all([
 api.entities.Collection.get(id).catch(() => null),
 getSurahList(),
 api.entities.Scholar.list({ limit: 50 }).catch(() => ({ items: [] })),
 ]).then(async ([col, surahList, scholarList]) => {
 setCollection(col);
 const sm = {};
 surahList.forEach(s => { sm[s.number] = s; });
 setSurahs(sm);
 const smap = {};
 (scholarList.items || []).forEach(s => { smap[s.id] = s; });
 setScholars(smap);

 if (col?.verse_keys?.length) {
 const allVerses = await api.entities.Verse.list("-created_date", 200).catch(() => []);
 const entityMap = {};
 allVerses.forEach(v => { entityMap[v.verse_key] = v; });

 const loaded = [];
 for (const key of col.verse_keys) {
 if (entityMap[key]) {
 loaded.push({ ...entityMap[key], _enriched: true });
 } else {
 const [s, a] = key.split(":");
 try {
 const ayah = await getAyah(Number(s), Number(a));
 loaded.push({
 verse_key: key,
 arabic: ayah.arabic,
 translation: ayah.translation,
 transliteration: ayah.transliteration,
 surah_number: Number(s),
 verse_number: Number(a),
 audio_url: ayah.audio,
 surah_name_arabic: ayah.surahName || sm[Number(s)]?.name || "",
 _fromApi: true,
 });
 } catch { /* skip */ }
 }
 }
 setVerses(loaded);
 }
 }).finally(() => setLoading(false));
 }, [id]);

 const selectVerse = useCallback((idx) => {
 setSelectedIdx(idx);
 setTab("linguistic");
 setPlaying(false);
 }, []);

 const goNext = useCallback(() => {
 setSelectedIdx(i => Math.min(i + 1, verses.length - 1));
 setTab("linguistic");
 setPlaying(false);
 }, [verses.length]);

 const goPrev = useCallback(() => {
 setSelectedIdx(i => Math.max(i - 1, 0));
 setTab("linguistic");
 setPlaying(false);
 }, []);

 if (loading) {
 return <div className="flex justify-center py-32"><Loader2 className="h-10 w-10 animate-spin text-accent" /></div>;
 }

 if (!collection) {
 return (
 <div className="mx-auto max-w-md py-24 text-center">
 <BookOpen className="h-8 w-8 text-muted-foreground/30 mx-auto mb-3" />
 <p className="text-sm text-muted-foreground">مجموعه یافت نشد.</p>
 <Link to="/collections" className="inline-flex items-center gap-1.5 mt-4 text-sm text-accent">بازگشت به مجموعه‌ها</Link>
 </div>
 );
 }

 const color = collection.theme_color || "#0d9488";
 const verse = verses[selectedIdx];
 const surah = surahs[verse?.surah_number];

 return (
 <div className="animate-fade-in pb-24">
 {/* ── Compact Header ── */}
 <div className="border-b border-border/40 bg-card/30">
 <div className="mx-auto max-w-4xl px-4 sm:px-6 py-4">
 <BackButton to={`/collections/${id}`} label="صفحه مجموعه" className="mb-3" />
 <div className="flex items-center gap-3">
 <div className="h-10 w-10 rounded flex items-center justify-center shrink-0" style={{ backgroundColor: `${color}18`, color }}>
 <BookOpen className="h-5 w-5" />
 </div>
 <div className="min-w-0">
 <h1 className="font-rokh-bold font-bold text-lg sm:text-xl truncate">{collection.name}</h1>
 <p className="text-xs text-muted-foreground">{verses.length} آیه • مطالعه تعاملی</p>
 </div>
 </div>
 </div>
 </div>

 {/* ── Verse Selector Strip ── */}
 <div className="sticky top-0 z-20 border-b border-border/40 bg-background/95 backdrop-blur">
 <div className="mx-auto max-w-4xl px-4 sm:px-6 py-3">
 <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-1">
 {verses.map((v, i) => {
 const [s, a] = (v.verse_key || "").split(":");
 const isActive = i === selectedIdx;
 return (
 <button
 key={v.id || i}
 onClick={() => selectVerse(i)}
 className={`shrink-0 rounded px-4 py-2 text-sm font-medium border transition-all ${
 isActive
 ? "text-accent-foreground shadow-soft"
 : "border-border/40 text-muted-foreground hover:text-foreground hover:border-accent/30"
 }`}
 style={isActive ? { backgroundColor: color, borderColor: color } : {}}
 >
 {s}:{a}
 {v._enriched ? <span className="ml-1.5 inline-block h-1.5 w-1.5 rounded bg-accent" /> : null}
 </button>
 );
 })}
 </div>
 </div>
 </div>

 {/* ── Verse Detail ── */}
 {!verse ? (
 <div className="mx-auto max-w-4xl px-4 py-16 text-center">
 <BookOpen className="h-8 w-8 text-muted-foreground/30 mx-auto mb-3" />
 <p className="text-sm text-muted-foreground">آیه‌ای در این مجموعه ثبت نشده است.</p>
 </div>
 ) : (
 <div className="mx-auto max-w-4xl px-4 sm:px-6 py-6">
 {/* Verse card */}
 <div className="rounded border border-accent/15 bg-card/50 p-6 mb-6">
 <div className="flex items-center justify-between text-xs text-muted-foreground mb-4">
 <span className="font-medium">
 {verse.surah_name_arabic || surah?.name || `سوره ${verse.surah_number}`} {verse.verse_key}
 </span>
 {verse._enriched ? (
 <span className="inline-flex items-center gap-1 text-accent">
 <BookOpen className="h-3 w-3" /> تدبّر موجود
 </span>
 ) : (
 <span className="text-muted-foreground/60">آیه (بدون تدبّر)</span>
 )}
 </div>

 <div className="text-2xl sm:text-3xl leading-loose text-right text-foreground/90 mb-4" dir="rtl">
 {verse.arabic}
 </div>

 <p className="text-base text-foreground/80 leading-relaxed mb-2">{verse.translation}</p>

 {verse.transliteration ? (
 <p className="text-sm text-muted-foreground italic mb-4">{verse.transliteration}</p>
 ) : null}

 {/* Audio & Mark as read */}
 <div className="mt-4 pt-3 border-t border-border/40 flex flex-wrap items-center justify-between gap-3">
 {verse.audio_url ? (
 <div className="flex items-center gap-2.5 flex-1 min-w-[200px]">
 <button
 onClick={toggleAudio}
 className="h-10 w-10 rounded bg-accent text-accent-foreground flex items-center justify-center shrink-0 hover:shadow-glow transition-all"
 title={playing ? "توقف تلاوت" : "پخش تلاوت"}
 >
 {playing ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5 mr-0.5" />}
 </button>
 <audio
 ref={audioRef}
 src={verse.audio_url}
 onPlay={() => setPlaying(true)}
 onPause={() => setPlaying(false)}
 onEnded={() => setPlaying(false)}
 controls
 className="h-8 flex-1"
 />
 </div>
 ) : <div />}

 {/* Mark as read toggle button */}
 <button
 onClick={() => toggleMarkRead(verse)}
 className={`inline-flex items-center gap-1.5 px-4 py-2 rounded text-xs font-ui font-bold border transition-all ${
 readVerses[verse.verse_key]
 ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-600 dark:text-emerald-400"
 : "border-border text-muted-foreground hover:text-foreground hover:bg-secondary"
 }`}
 >
 <CheckCircle2 className={`h-4 w-4 ${readVerses[verse.verse_key] ? "fill-emerald-500/20" : ""}`} />
 <span>{readVerses[verse.verse_key] ? "خوانده شده ✓" : "علامت‌گذاری به عنوان خوانده‌شده"}</span>
 </button>
 </div>
 </div>

 {/* Tabs */}
 <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide mb-4">
 {TABS.map(t => {
 const Icon = t.icon;
 const isActive = tab === t.id;
 return (
 <button
 key={t.id}
 onClick={() => setTab(t.id)}
 className={`shrink-0 inline-flex items-center gap-1.5 px-4 py-2 rounded text-sm font-medium border transition-all ${
 isActive
 ? "border-accent/40 bg-accent/10 text-accent"
 : "border-border/40 text-muted-foreground hover:text-foreground hover:bg-muted/50"
 }`}
 >
 <Icon className="h-3.5 w-3.5" />
 {t.label}
 </button>
 );
 })}
 </div>

 {/* Tab Content */}
 <div className="min-h-[200px]">
 {tab === "linguistic" && <LinguisticTab verse={verse} color={color} />}
 {tab === "commentary" && <CommentaryTab verse={verse} scholars={scholars} color={color} />}
 {tab === "tafsir" && <TafsirTab verse={verse} color={color} />}
 {tab === "reflection" && (
 <ReflectionTab verse={verse} color={color} />
 )}
 </div>

 {/* Prev / Next */}
 <OrnamentalDivider className="my-8" />
 <div className="flex items-center justify-between gap-3">
 <button
 onClick={goPrev}
 disabled={selectedIdx === 0}
 className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded text-sm font-medium border border-border/50 text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
 >
 <ChevronRight className="h-4 w-4" />
 آیه قبلی
 </button>
 <span className="text-xs text-muted-foreground">
 {selectedIdx + 1} از {verses.length}
 </span>
 <button
 onClick={goNext}
 disabled={selectedIdx === verses.length - 1}
 className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded text-sm font-medium border border-border/50 text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
 >
 آیه بعدی
 <ChevronLeft className="h-4 w-4" />
 </button>
 </div>
 </div>
 )}
 </div>
 );
}

/* ── Linguistic Tab ── */
function LinguisticTab({ verse, color }) {
 const hasCurated =
 verse._enriched &&
 (verse.word_analysis?.length || verse.root_words?.length || verse.grammar_breakdown);
 if (!hasCurated) {
 // Functional fallback from quranApi (no Verse entity required)
 return (
 <div className="space-y-5">
 <SectionTitle icon={Languages} title="ترجمه و آوانگاری" color={color} />
 {verse.transliteration ? (
 <p className="text-sm text-muted-foreground leading-relaxed rounded border border-border/40 bg-card/30 p-4" dir="ltr">
 {verse.transliteration}
 </p>
 ) : null}
 {verse.translation ? (
 <p className="text-sm text-foreground/80 leading-relaxed rounded border border-border/40 bg-card/30 p-4">
 {verse.translation}
 </p>
 ) : (
 <EmptyState type="content" showAction={false} title="تحلیل زبانی برای این آیه موجود نیست." subtitle=" " />
 )}
 </div>
 );
 }
 return (
 <div className="space-y-6">
 {/* Word Analysis */}
 {verse.word_analysis?.length ? (
 <section>
 <SectionTitle icon={Languages} title="تحلیل کلمات" color={color} />
 <div className="space-y-2">
 {verse.word_analysis.map((w, i) => (
 <div key={i} className="flex items-start gap-3 rounded border border-border/40 bg-card/30 p-3">
 <span className=" text-lg text-right min-w-[80px]" dir="rtl">{w.word}</span>
 <div className="flex-1">
 <p className="text-sm text-muted-foreground">{w.transliteration}</p>
 <p className="text-sm text-foreground/80">{w.meaning}</p>
 </div>
 </div>
 ))}
 </div>
 </section>
 ) : null}

 {/* Root Words */}
 {verse.root_words?.length ? (
 <section>
 <SectionTitle icon={Tag} title="ریشه‌ها" color={color} />
 <div className="grid sm:grid-cols-2 gap-3">
 {verse.root_words.map((r, i) => (
 <div key={i} className="rounded border border-border/40 bg-card/30 p-4">
 <p className=" text-xl text-center mb-2" dir="rtl">{r.root}</p>
 <p className="text-sm text-foreground/80 mb-1">{r.meaning}</p>
 {r.occurrences ? (
 <p className="text-xs text-muted-foreground">{r.occurrences} بار در قرآن</p>
 ) : null}
 </div>
 ))}
 </div>
 </section>
 ) : null}

 {/* Grammar */}
 {verse.grammar_breakdown ? (
 <section>
 <SectionTitle icon={Compass} title="تجزیه گرامری" color={color} />
 <p className="text-sm text-foreground/80 leading-relaxed rounded border border-border/40 bg-card/30 p-4">
 {verse.grammar_breakdown}
 </p>
 </section>
 ) : null}
 </div>
 );
}

/* ── Commentary Tab (scholar reflections) ── */
function CommentaryTab({ verse, scholars, color }) {
 const reflections = (verse.reflections || []).filter(r => r.scholar_id);
 if (!reflections.length) {
 return <EmptyState type="content" showAction={false} title="هیچ تفسیری از علما برای این آیه ثبت نشده است." subtitle=" " />;
 }
 return (
 <div className="space-y-4">
 <SectionTitle icon={Users} title="تفسیر علما" color={color} />
 {reflections.map((r, i) => {
 const scholar = scholars[r.scholar_id];
 const name = scholar?.name || "نامشخص";
 const title = scholar?.title || "";
 return (
 <div key={i} className="rounded border border-border/40 bg-card/40 p-5">
 <div className="flex items-center gap-3 mb-3">
 <div className="h-10 w-10 rounded bg-gradient-to-br from-accent/25 to-accent/5 border border-accent/20 flex items-center justify-center text-accent font-bold shrink-0">
 {name[0]}
 </div>
 <div className="min-w-0">
 <p className="text-sm font-semibold truncate">{name}</p>
 {title ? <p className="text-xs text-muted-foreground">{title}</p> : null}
 </div>
 </div>
 {r.title ? (
 <p className="text-sm font-medium text-accent mb-2">{r.title}</p>
 ) : null}
 <p className="text-sm text-foreground/80 leading-relaxed">{r.content}</p>
 </div>
 );
 })}
 </div>
 );
}

/* ── Classical Tafsir Tab ── */
function TafsirTab({ verse, color }) {
 const hasContent = verse.classical_tafsir || verse.asbab_al_nuzul || verse.historical_context || verse.tafsir;
 if (!hasContent) {
 if (verse.translation) {
 return (
 <div className="space-y-5">
 <SectionTitle icon={Compass} title="معنای آیه" color={color} />
 <p className="text-sm text-foreground/80 leading-relaxed rounded border border-border/40 bg-card/30 p-4">
 {verse.translation}
 </p>
 <p className="text-xs text-muted-foreground">
 تفسیر تفصیلی کلاسیک برای این آیه هنوز در پایگاه داده ثبت نشده است.
 </p>
 </div>
 );
 }
 return <EmptyState type="content" showAction={false} title="تفسیر کلاسیک برای این آیه موجود نیست." subtitle=" " />;
 }
 return (
 <div className="space-y-5">
 {verse.classical_tafsir ? (
 <section>
 <SectionTitle icon={Compass} title="تفسیر کلاسیک" color={color} />
 <p className="text-sm text-foreground/80 leading-relaxed rounded border border-border/40 bg-card/30 p-4">
 {verse.classical_tafsir}
 </p>
 </section>
 ) : null}
 {verse.asbab_al_nuzul ? (
 <section>
 <SectionTitle icon={BookOpen} title="اسباب نزول" color={color} />
 <p className="text-sm text-foreground/80 leading-relaxed rounded border border-border/40 bg-card/30 p-4">
 {verse.asbab_al_nuzul}
 </p>
 </section>
 ) : null}
 {verse.historical_context ? (
 <section>
 <SectionTitle icon={Clock} title="بستر تاریخی" color={color} />
 <p className="text-sm text-foreground/80 leading-relaxed rounded border border-border/40 bg-card/30 p-4">
 {verse.historical_context}
 </p>
 </section>
 ) : null}
 </div>
 );
}

/* ── Tadabbur Tab ── */
function ReflectionTab({ verse, color }) {
 if (!verse._enriched) {
 return <EmptyState type="content" showAction={false} title="تدبّر برای این آیه موجود نیست." subtitle=" " />;
 }
 const hasContent = verse.tadabbur || verse.life_lessons?.length || verse.practical_applications?.length || verse.questions_to_reflect?.length;
 if (!hasContent) {
 return <EmptyState type="content" showAction={false} title="تدبّر برای این آیه موجود نیست." subtitle=" " />;
 }
 return (
 <div className="space-y-5">
 {verse.tadabbur ? (
 <section>
 <SectionTitle icon={Sparkles} title="تدبّر" color={color} />
 <p className="text-sm text-foreground/80 leading-relaxed rounded border border-accent/15 bg-accent/5 p-4">
 {verse.tadabbur}
 </p>
 </section>
 ) : null}
 {verse.life_lessons?.length ? (
 <section>
 <SectionTitle icon={BookOpen} title="درس‌های زندگی" color={color} />
 <ul className="space-y-2">
 {verse.life_lessons.map((l, i) => (
 <li key={i} className="flex items-start gap-2 text-sm text-foreground/80">
 <span className="mt-1.5 h-1.5 w-1.5 rounded shrink-0" style={{ backgroundColor: color }} />
 {l}
 </li>
 ))}
 </ul>
 </section>
 ) : null}
 {verse.practical_applications?.length ? (
 <section>
 <SectionTitle icon={Compass} title="کاربردهای عملی" color={color} />
 <ul className="space-y-2">
 {verse.practical_applications.map((p, i) => (
 <li key={i} className="flex items-start gap-2 text-sm text-foreground/80">
 <span className="mt-1.5 h-1.5 w-1.5 rounded shrink-0" style={{ backgroundColor: color }} />
 {p}
 </li>
 ))}
 </ul>
 </section>
 ) : null}
 {verse.questions_to_reflect?.length ? (
 <section>
 <SectionTitle icon={Sparkles} title="سوالات برای تدبّر" color={color} />
 <ul className="space-y-2">
 {verse.questions_to_reflect.map((q, i) => (
 <li key={i} className="flex items-start gap-2 text-sm text-foreground/80">
 <span className="mt-1.5 text-accent shrink-0">؟</span>
 {q}
 </li>
 ))}
 </ul>
 </section>
 ) : null}
 </div>
 );
}

function SectionTitle({ icon: Icon, title, color }) {
 return (
 <div className="flex items-center gap-2.5 mb-3">
 <div className="h-8 w-8 rounded flex items-center justify-center" style={{ backgroundColor: `${color}18`, color }}>
 <Icon className="h-4 w-4" />
 </div>
 <h3 className="font-rokh-bold font-bold text-base">{title}</h3>
 </div>
 );
}
