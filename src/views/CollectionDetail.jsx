'use client';
import { useEffect, useState, useRef } from "react";
import { useParams, Link } from "@/lib/router-compat";
import api from "@/lib/api";
import { scopedKey } from "@/lib/storageScope";
import { toast } from "react-hot-toast";
import { getAyah, getSurahList } from "@/lib/quranApi";
import { CollectionCover, IslamicBorder, SectionOrnament, VerseMarker } from "@/components/IslamicDecorations";
import OrnamentalDivider from "@/components/OrnamentalDivider";
import { ChevronRight, Bookmark, Share2, Clock, BookOpen, Loader2, Play, Pause, Tag, Users } from "lucide-react";
import BackButton from "@/components/BackButton";

export default function CollectionDetail() {
 const { id } = useParams();
 const [collection, setCollection] = useState(null);
 const [verses, setVerses] = useState([]);
 const [surahs, setSurahs] = useState({});
 const [loading, setLoading] = useState(true);
 const [saved, setSaved] = useState(false);

 useEffect(() => {
 const savedList = JSON.parse(localStorage.getItem(scopedKey("saved-collections")) || "[]");
 setSaved(savedList.includes(id));
 }, [id]);

 useEffect(() => {
 setLoading(true);
 Promise.all([
 api.entities.Collection.get(id).catch(() => null),
 getSurahList(),
 ]).then(async ([col, surahList]) => {
 setCollection(col);
 const sm = {};
 surahList.forEach(s => { sm[s.number] = s; });
 setSurahs(sm);

 if (col?.verse_keys?.length) {
 // Load verses: first from entity, then from API
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

 const toggleSave = () => {
 const savedList = JSON.parse(localStorage.getItem(scopedKey("saved-collections")) || "[]");
 const isSaved = savedList.includes(id);
 const updated = isSaved ? savedList.filter(s => s !== id) : [...savedList, id];
 localStorage.setItem(scopedKey("saved-collections"), JSON.stringify(updated));
 setSaved(!isSaved);
 toast.success(!isSaved ? "مجموعه به نشان‌شده‌ها اضافه شد" : "مجموعه از نشان‌شده‌ها حذف شد");
 };

 const handleShare = async () => {
 const url = window.location.href;
 const text = `${collection?.name || ""}\n${collection?.description || ""}\n${url}`;
 if (navigator.share) {
 try {
 await navigator.share({ title: collection?.name, text, url });
 return;
 } catch {}
 }
 try {
 if (navigator.clipboard?.writeText) {
 await navigator.clipboard.writeText(url);
 } else {
 const ta = document.createElement("textarea");
 ta.value = url;
 document.body.appendChild(ta);
 ta.select();
 document.execCommand("copy");
 document.body.removeChild(ta);
 }
 toast.success("پیوند مجموعه در حافظه رونوشت شد");
 } catch {
 toast.error("امکان اشتراک‌گذاری فراهم نشد");
 }
 };

 if (loading) return <div className="flex justify-center py-32"><Loader2 className="h-10 w-10 animate-spin text-accent" /></div>;
 if (!collection) return (
 <div className="mx-auto max-w-md py-24 text-center">
 <BookOpen className="h-8 w-8 text-muted-foreground/30 mx-auto mb-3" />
 <p className="text-sm text-muted-foreground">مجموعه یافت نشد.</p>
 <Link to="/collections" className="inline-flex items-center gap-1.5 mt-4 text-sm text-accent">بازگشت به مجموعه‌ها</Link>
 </div>
 );

 const color = collection.theme_color || "#c5a059";
 const pattern = collection.cover_pattern || "stars";

 return (
 <div className="animate-fade-in">
 {/* ── Hero with Cover ── */}
 <div className="relative overflow-hidden border-b border-border/40">
 <div className="relative h-56 sm:h-64">
 <CollectionCover color={color} pattern={pattern} />
 <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
 </div>

 <div className="relative mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 pb-8 -mt-12">
 <BackButton to="/collections" label="همه مجموعه‌ها" className="mb-6" />

 <div className="text-center">
 <h1 className="font-display font-extrabold text-3xl sm:text-4xl tracking-tight mb-3">{collection.name}</h1>
 <p className="text-muted-foreground max-w-2xl mx-auto leading-relaxed mb-6">{collection.description}</p>

 <OrnamentalDivider className="mb-6" />

 {/* Metadata badges */}
 <div className="flex items-center justify-center gap-3 flex-wrap">
 <Badge icon={BookOpen} label={`${collection.verse_count || verses.length || 0} آیه`} color={color} />
 {collection.reading_time ? <Badge icon={Clock} label={`${collection.reading_time} دقیقه`} color={color} /> : null}
 {collection.related_topics?.length ? <Badge icon={Tag} label={`${collection.related_topics.length} موضوع`} color={color} /> : null}
 </div>

 {/* Actions */}
 <div className="mt-6 flex items-center justify-center gap-2">
 <button
 onClick={toggleSave}
 className={`inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full text-sm font-medium border transition-all ${
 saved ? "border-accent/40 bg-accent/10 text-accent" : "border-border/50 text-muted-foreground hover:text-foreground hover:bg-muted/50"
 }`}
 >
 <Bookmark className={`h-4 w-4 ${saved ? "fill-current" : ""}`} />
 {saved ? "ذخیره شد" : "ذخیره"}
 </button>
 <button
 onClick={handleShare}
 className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full text-sm font-medium border border-border/50 text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all"
 title="اشتراک‌گذاری مجموعه"
 >
 <Share2 className="h-4 w-4" /> اشتراک
 </button>
 <Link
 to={`/collections/${id}/study`}
 className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full text-sm font-medium bg-accent text-accent-foreground hover:shadow-glow transition-all"
 >
 <BookOpen className="h-4 w-4" /> مطالعه تعاملی
 </Link>
 </div>
 </div>
 </div>
 </div>

 {/* ── Verses ── */}
 <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-12">
 {verses.length === 0 ? (
 <div className="rounded-2xl border border-dashed border-border/60 p-12 text-center">
 <BookOpen className="h-8 w-8 text-muted-foreground/30 mx-auto mb-3" />
 <p className="text-sm text-muted-foreground">آیه‌ای در این مجموعه ثبت نشده است.</p>
 </div>
 ) : (
 <div className="space-y-4">
 {verses.map((v, i) => (
 <VerseCard key={v.id || i} verse={v} surah={surahs[v.surah_number]} color={color} delay={i * 0.04} />
 ))}
 </div>
 )}
 </div>

 {/* ── Related Topics ── */}
 {collection.related_topics?.length > 0 && (
 <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 pb-12">
 <IslamicBorder className="mb-8" />
 <div className="flex items-center gap-3 mb-6">
 <div className="h-9 w-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${color}15`, color }}>
 <Tag className="h-4 w-4" />
 </div>
 <h2 className="font-display font-bold text-xl">موضوعات مرتبط</h2>
 </div>
 <div className="flex flex-wrap gap-2">
 {collection.related_topics.map((t, i) => (
 <Link
 key={i}
 to={`/topics?topic=${encodeURIComponent(t)}`}
 className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-border/40 text-sm hover:border-accent/25 hover:shadow-soft transition-all"
 >
 {t}
 </Link>
 ))}
 </div>
 </div>
 )}

 {/* ── Related Scholars ── */}
 {collection.related_scholars?.length > 0 && (
 <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 pb-12">
 <div className="flex items-center gap-3 mb-6">
 <div className="h-9 w-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${color}15`, color }}>
 <Users className="h-4 w-4" />
 </div>
 <h2 className="font-display font-bold text-xl">علما و مفسران مرتبط</h2>
 </div>
 <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
 {collection.related_scholars.map((s, i) => (
 <div key={i} className="flex items-center gap-3 rounded-2xl border border-border/40 bg-card/40 p-4">
 <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-accent/25 to-accent/5 border border-accent/20 flex items-center justify-center text-accent font-bold">
 {s[0]}
 </div>
 <span className="text-sm font-medium">{s}</span>
 </div>
 ))}
 </div>
 </div>
 )}

 <SectionOrnament className="pb-12" />
 </div>
 );
}

function VerseCard({ verse, surah, _color, delay = 0 }) {
 const [playing, setPlaying] = useState(false);
 const audioRef = useRef(null);
 const audio = verse.audio_url || verse.audio;
 const surahName = verse.surah_name_arabic || surah?.name || "";
 const [s, a] = (verse.verse_key || "").split(":");

 const togglePlay = () => {
 if (!audioRef.current) return;
 if (playing) {
 audioRef.current.pause();
 setPlaying(false);
 } else {
 audioRef.current.play().then(() => setPlaying(true)).catch(() => {});
 }
 };

 return (
 <div
 className="group relative rounded-xl border border-accent/10 bg-card/40 p-6 hover:border-accent/30 hover:shadow-premium transition-all duration-300 animate-fade-in-up will-animate"
 style={{ animationDelay: `${delay}s` }}
 >
 <div className="flex items-start gap-5">
 <VerseMarker number={a || verse.verse_number} size={44} />

 <div className="flex-1 min-w-0">
 {/* Verse key */}
 <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
 <span className="font-medium">{surahName} {verse.verse_key}</span>
 {verse._enriched ? (
 <span className="inline-flex items-center gap-1 text-accent">
 <BookOpen className="h-3 w-3" /> تدبّر موجود
 </span>
 ) : null}
 </div>

 {/* Arabic */}
 <div className="text-2xl sm:text-3xl leading-loose text-right text-foreground/90" dir="rtl" lang="ar">
 {verse.arabic}
 </div>

 {/* Translation */}
 <p className="text-sm sm:text-base text-muted-foreground mt-3 leading-relaxed">{verse.translation}</p>

 {/* Audio */}
 {audio ? (
 <div className="mt-4 flex items-center gap-3">
 <button
 type="button"
 onClick={togglePlay}
 className="h-11 w-11 rounded-full bg-accent text-accent-foreground flex items-center justify-center shrink-0 hover:shadow-glow transition-all"
 title={playing ? "توقف تلاوت" : "پخش تلاوت"}
 >
 {playing ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5 mr-0.5" />}
 </button>
 <audio
 ref={audioRef}
 src={audio}
 onPlay={() => setPlaying(true)}
 onPause={() => setPlaying(false)}
 onEnded={() => setPlaying(false)}
 controls
 className="h-8 flex-1"
 />
 </div>
 ) : null}

 {/* Link to verse detail if enriched */}
 {verse._enriched && verse.verse_key ? (
 <Link
 to={`/verse/${s}/${a}`}
 className="mt-4 inline-flex items-center gap-1 text-xs text-accent hover:gap-2 transition-all"
 >
 مشاهده تدبّر کامل <ChevronRight className="h-3 w-3" />
 </Link>
 ) : verse.verse_key ? (
 <Link
 to={`/verse/${s}/${a}`}
 className="mt-4 inline-flex items-center gap-1 text-xs text-accent hover:gap-2 transition-all"
 >
 مشاهده صفحه آیه <ChevronRight className="h-3 w-3" />
 </Link>
 ) : null}
 </div>
 </div>
 </div>
 );
}

function Badge({ icon: Icon, label, color }) {
 return (
 <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-muted/50 text-xs text-muted-foreground font-medium ring-1 ring-border/30">
 <Icon className="h-3 w-3" style={{ color }} />
 {label}
 </span>
 );
}