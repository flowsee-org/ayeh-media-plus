import { useState } from "react";
import { useNavigate } from "@/lib/router-compat";
import { useAudioPlayer } from "@/context/AudioPlayerContext";
import {
 ChevronDown,
 Play,
 Pause,
 RotateCcw,
 RotateCw,
 Clock,
 Sparkles,
 BookOpen,
 ListMusic,
 Gauge,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { IslamicStar } from "@/components/IslamicOrnaments";

function formatSeconds(sec) {
 if (!sec || isNaN(sec) || !isFinite(sec)) return "۰۰:۰۰";
 const m = Math.floor(sec / 60);
 const s = Math.floor(sec % 60);
 const mStr = m.toString().padStart(2, "0");
 const sStr = s.toString().padStart(2, "0");
 return `${mStr}:${sStr}`.replace(/\d/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[d]);
}

const SPEED_OPTIONS = [0.75, 1, 1.25, 1.5, 2];
const SLEEP_OPTIONS = [
 { label: "خاموش", minutes: null },
 { label: "۱۵ دقیقه", minutes: 15 },
 { label: "۳۰ دقیقه", minutes: 30 },
 { label: "۴۵ دقیقه", minutes: 45 },
 { label: "۶۰ دقیقه", minutes: 60 },
];

export default function ExpandedPlayerModal() {
 const navigate = useNavigate();
 const {
 track,
 isPlaying,
 currentTime,
 duration,
 playbackRate,
 sleepTimerMinutes,
 sleepTimeRemaining,
 isExpanded,
 togglePlay,
 seek,
 seekRelative,
 setPlaybackRate,
 setSleepTimer,
 jumpChapter,
 setIsExpanded,
 } = useAudioPlayer();

 const [showSpeedMenu, setShowSpeedMenu] = useState(false);
 const [showSleepMenu, setShowSleepMenu] = useState(false);
 const [activeTab, setActiveTab] = useState("player"); // player | chapters

 if (!isExpanded || !track) return null;

 const chapters = Array.isArray(track.chapters) ? track.chapters : [];

 // Determine current active chapter
 const currentChapterIndex = chapters.reduce((bestIdx, ch, idx) => {
 const chSec = typeof ch.seconds === "number" ? ch.seconds : 0;
 return currentTime >= chSec ? idx : bestIdx;
 }, 0);

 const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

 return (
 <AnimatePresence>
 <motion.div
 initial={{ opacity: 0 }}
 animate={{ opacity: 1 }}
 exit={{ opacity: 0 }}
 className="fixed inset-0 z-50 flex flex-col justify-end bg-black/75 backdrop-blur-md"
 onClick={() => setIsExpanded(false)}
 >
 <motion.div
 initial={{ y: "100%" }}
 animate={{ y: 0 }}
 exit={{ y: "100%" }}
 transition={{ type: "spring", damping: 28, stiffness: 280 }}
 onClick={(e) => e.stopPropagation()}
 className="relative max-h-[92vh] w-full max-w-2xl mx-auto rounded-t-3xl border-t border-accent/40 bg-card/95 backdrop-blur-2xl shadow-2xl flex flex-col overflow-hidden text-right"
 dir="rtl"
 >
 {/* Subtle Islamic ambient background pattern */}
 <div className="pattern-islamic absolute inset-0 opacity-10 pointer-events-none" />

 {/* Top Bar Header */}
 <div className="relative flex items-center justify-between px-5 pt-4 pb-2 border-b border-border/60">
 <button
 onClick={() => setIsExpanded(false)}
 className="h-9 w-9 rounded hover:bg-secondary flex items-center justify-center text-muted-foreground transition-colors"
 aria-label="بستن پنل"
 >
 <ChevronDown className="h-5 w-5" />
 </button>

 <div className="flex items-center gap-2">
 <IslamicStar size={14} className="text-accent" />
 <span className="font-display font-bold text-sm text-foreground">
 {track.type === "quran" ? "تلاوت نورانی کلام‌الله" : "درس‌گفتار و پادکست تفسیری"}
 </span>
 </div>

 {sleepTimeRemaining ? (
 <span className="text-[11px] font-semibold text-accent bg-accent/15 px-2 py-0.5 rounded flex items-center gap-1">
 <Clock className="h-3 w-3" />
 {formatSeconds(sleepTimeRemaining)}
 </span>
 ) : (
 <div className="w-9" />
 )}
 </div>

 {/* Navigation Tabs (Player vs Chapters) */}
 {chapters.length > 0 && (
 <div className="relative flex border-b border-border/40 px-6 pt-2">
 <button
 onClick={() => setActiveTab("player")}
 className={`flex-1 py-2 text-xs font-bold border-b-2 transition-all flex items-center justify-center gap-1.5 ${
 activeTab === "player"
 ? "border-accent text-accent"
 : "border-transparent text-muted-foreground hover:text-foreground"
 }`}
 >
 <Sparkles className="h-3.5 w-3.5" />
 پخش اصلی
 </button>
 <button
 onClick={() => setActiveTab("chapters")}
 className={`flex-1 py-2 text-xs font-bold border-b-2 transition-all flex items-center justify-center gap-1.5 ${
 activeTab === "chapters"
 ? "border-accent text-accent"
 : "border-transparent text-muted-foreground hover:text-foreground"
 }`}
 >
 <ListMusic className="h-3.5 w-3.5" />
 سرفصل‌ها ({chapters.length.toLocaleString("fa-IR")})
 </button>
 </div>
 )}

 {/* Body Content */}
 <div className="relative flex-1 overflow-y-auto px-6 py-5">
 {activeTab === "player" ? (
 <div className="flex flex-col items-center">
 {/* Royal Artwork Cover Frame */}
 <div className="relative w-48 h-48 sm:w-56 sm:h-56 rounded p-2 border-2 border-accent/40 shadow-premium bg-gradient-to-br from-card to-secondary/80 my-2 flex items-center justify-center overflow-hidden">
 <div className="absolute inset-0 pattern-islamic opacity-20" />

 {track.coverImage ? (
 <img
 src={track.coverImage}
 alt={track.title}
 className="w-full h-full object-cover rounded"
 />
 ) : (
 <div className="flex flex-col items-center justify-center text-center p-4">
 <div className="h-16 w-16 rounded bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white shadow-lg mb-3">
 <BookOpen className="h-8 w-8 text-white" />
 </div>
 <span className=" text-accent font-bold text-lg">
 آیه مدیا پلاس
 </span>
 </div>
 )}

 {/* Pulsing ring indicator */}
 {isPlaying && (
 <div className="absolute inset-1 rounded border-2 border-accent/60 pointer-events-none animate-pulse-soft" />
 )}
 </div>

 {/* Track Details */}
 <div className="text-center mt-4 w-full">
 <h3 className="font-display font-extrabold text-lg sm:text-xl text-foreground tracking-tight leading-snug">
 {track.title}
 </h3>
 <p className="font-ui text-sm text-accent font-semibold mt-1">
 {track.scholarName || track.reciter || track.subtitle || "رسانه آیه پلاس"}
 </p>

 {/* Active Chapter name if available */}
 {chapters.length > 0 && chapters[currentChapterIndex] && (
 <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded bg-secondary/80 border border-border text-xs text-muted-foreground font-medium">
 <span className="h-1.5 w-1.5 rounded bg-accent" />
 <span>فصل جاری: {chapters[currentChapterIndex].title}</span>
 </div>
 )}

 {/* Linked Verse Action */}
 {track.verseKey && (
 <div className="mt-3">
 <button
 onClick={() => {
 setIsExpanded(false);
 navigate(`/quran?verse=${track.verseKey}`);
 }}
 className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded bg-primary/10 hover:bg-primary/20 text-primary border border-primary/25 text-xs font-bold transition-colors"
 >
 <BookOpen className="h-3.5 w-3.5" />
 مشاهده آیه {track.verseKey} در مصحف شریف ←
 </button>
 </div>
 )}
 </div>

 {/* Time & Progress Slider */}
 <div className="w-full mt-6 space-y-2">
 <div className="relative flex items-center group">
 <input
 type="range"
 min={0}
 max={duration || 100}
 value={currentTime}
 onChange={(e) => seek(Number(e.target.value))}
 className="w-full h-2 rounded bg-secondary appearance-none cursor-pointer accent-accent"
 />
 </div>
 <div className="flex justify-between text-xs text-muted-foreground font-ui">
 <span>{formatSeconds(currentTime)}</span>
 <span className="text-[11px] opacity-75">
 پیشرفت: {Math.round(progressPercent).toLocaleString("fa-IR")}%
 </span>
 <span>{formatSeconds(duration)}</span>
 </div>
 </div>

 {/* Main Playback Controls */}
 <div className="flex items-center justify-center gap-6 mt-6">
 {/* Rewind 10s */}
 <button
 onClick={() => seekRelative(-10)}
 className="h-11 w-11 rounded bg-secondary hover:bg-secondary/80 flex items-center justify-center text-foreground transition-all hover:scale-105 active:scale-95"
 title="۱۰ ثانیه به عقب"
 >
 <RotateCcw className="h-5 w-5" />
 </button>

 {/* Big Play / Pause Button */}
 <button
 onClick={togglePlay}
 className="h-16 w-16 rounded bg-gradient-to-tr from-accent to-yellow-500 hover:from-accent/90 hover:to-yellow-400 text-stone-950 flex items-center justify-center shadow-gold-glow transition-all hover:scale-105 active:scale-95"
 title={isPlaying ? "توقف" : "پخش"}
 >
 {isPlaying ? (
 <Pause className="h-8 w-8 fill-current" />
 ) : (
 <Play className="h-8 w-8 fill-current mr-0.5" />
 )}
 </button>

 {/* Forward 10s */}
 <button
 onClick={() => seekRelative(10)}
 className="h-11 w-11 rounded bg-secondary hover:bg-secondary/80 flex items-center justify-center text-foreground transition-all hover:scale-105 active:scale-95"
 title="۱۰ ثانیه به جلو"
 >
 <RotateCw className="h-5 w-5" />
 </button>
 </div>

 {/* Control Action Pills (Speed & Sleep Timer) */}
 <div className="flex items-center gap-3 mt-6">
 {/* Speed Pill */}
 <div className="relative">
 <button
 onClick={() => {
 setShowSpeedMenu(!showSpeedMenu);
 setShowSleepMenu(false);
 }}
 className="px-3 py-1.5 rounded border border-border bg-secondary/80 hover:bg-secondary text-xs font-bold text-foreground flex items-center gap-1.5 transition-colors"
 >
 <Gauge className="h-3.5 w-3.5 text-accent" />
 سرعت: {playbackRate.toLocaleString("fa-IR")}x
 </button>

 {showSpeedMenu && (
 <div className="absolute bottom-full mb-2 right-0 rounded border border-accent/30 bg-card shadow-2xl p-2 z-20 flex flex-col gap-1 min-w-[110px]">
 {SPEED_OPTIONS.map((rate) => (
 <button
 key={rate}
 onClick={() => {
 setPlaybackRate(rate);
 setShowSpeedMenu(false);
 }}
 className={`px-3 py-1.5 rounded text-xs font-bold text-right transition-colors ${
 playbackRate === rate
 ? "bg-accent text-accent-foreground"
 : "hover:bg-secondary text-muted-foreground hover:text-foreground"
 }`}
 >
 {rate.toLocaleString("fa-IR")}x {rate === 1 && "(عادی)"}
 </button>
 ))}
 </div>
 )}
 </div>

 {/* Sleep Timer Pill */}
 <div className="relative">
 <button
 onClick={() => {
 setShowSleepMenu(!showSleepMenu);
 setShowSpeedMenu(false);
 }}
 className="px-3 py-1.5 rounded border border-border bg-secondary/80 hover:bg-secondary text-xs font-bold text-foreground flex items-center gap-1.5 transition-colors"
 >
 <Clock className="h-3.5 w-3.5 text-accent" />
 {sleepTimerMinutes ? `خواب: ${sleepTimerMinutes.toLocaleString("fa-IR")} د` : "تایمر خواب"}
 </button>

 {showSleepMenu && (
 <div className="absolute bottom-full mb-2 left-0 rounded border border-accent/30 bg-card shadow-2xl p-2 z-20 flex flex-col gap-1 min-w-[130px]">
 {SLEEP_OPTIONS.map((opt) => (
 <button
 key={String(opt.minutes)}
 onClick={() => {
 setSleepTimer(opt.minutes);
 setShowSleepMenu(false);
 }}
 className={`px-3 py-1.5 rounded text-xs font-bold text-right transition-colors ${
 sleepTimerMinutes === opt.minutes
 ? "bg-accent text-accent-foreground"
 : "hover:bg-secondary text-muted-foreground hover:text-foreground"
 }`}
 >
 {opt.label}
 </button>
 ))}
 </div>
 )}
 </div>
 </div>
 </div>
 ) : (
 /* Chapters List View */
 <div className="space-y-2">
 <div className="flex items-center justify-between pb-2 border-b border-border/50 text-xs font-bold text-muted-foreground">
 <span>سرفصل‌های گفتار</span>
 <span>زمان شروع</span>
 </div>

 {chapters.map((ch, idx) => {
 const isActive = idx === currentChapterIndex;
 const sec = typeof ch.seconds === "number" ? ch.seconds : 0;
 return (
 <button
 key={idx}
 onClick={() => jumpChapter(sec)}
 className={`w-full flex items-center justify-between p-3 rounded border transition-all text-right ${
 isActive
 ? "bg-accent/15 border-accent text-accent font-bold shadow-soft"
 : "border-border/60 hover:bg-secondary/70 text-foreground"
 }`}
 >
 <div className="flex items-center gap-3 min-w-0">
 <span
 className={`h-7 w-7 rounded flex items-center justify-center text-xs shrink-0 font-bold ${
 isActive
 ? "bg-accent text-accent-foreground"
 : "bg-secondary text-muted-foreground"
 }`}
 >
 {(idx + 1).toLocaleString("fa-IR")}
 </span>
 <span className="text-sm truncate">{ch.title}</span>
 </div>

 <span className="text-xs font-mono px-2 py-0.5 rounded bg-secondary text-muted-foreground">
 {ch.timestamp || formatSeconds(sec)}
 </span>
 </button>
 );
 })}
 </div>
 )}
 </div>
 </motion.div>
 </motion.div>
 </AnimatePresence>
 );
}
