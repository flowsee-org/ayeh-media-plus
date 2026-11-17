import { useAudioPlayer } from "@/context/AudioPlayerContext";
import ExpandedPlayerModal from "./ExpandedPlayerModal";
import { Play, Pause, RotateCcw, RotateCw, X, Maximize2, BookOpen } from "lucide-react";

function formatSeconds(sec) {
  if (!sec || isNaN(sec) || !isFinite(sec)) return "۰۰:۰۰";
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  const mStr = m.toString().padStart(2, "0");
  const sStr = s.toString().padStart(2, "0");
  return `${mStr}:${sStr}`.replace(/\d/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[d]);
}

export default function GlobalAudioPlayer() {
  const {
    track,
    isPlaying,
    currentTime,
    duration,
    togglePlay,
    seekRelative,
    setIsExpanded,
    closePlayer,
  } = useAudioPlayer();

  if (!track) return null;

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;
  const chapters = Array.isArray(track.chapters) ? track.chapters : [];
  const activeChapter = chapters.reduce((best, ch) => {
    const chSec = typeof ch.seconds === "number" ? ch.seconds : 0;
    return currentTime >= chSec ? ch : best;
  }, null);

  return (
    <>
      {/* Floating Bottom Dock */}
      <div
        className="fixed z-40 bottom-[68px] sm:bottom-4 right-3 left-3 sm:right-auto sm:left-1/2 sm:-translate-x-1/2 sm:w-[620px] max-w-full pointer-events-auto animate-fade-in-up"
        dir="rtl"
      >
        <div className="relative overflow-hidden rounded border border-accent/40 bg-card/95 backdrop-blur-xl shadow-premium p-2 sm:px-3 sm:py-2.5 flex items-center gap-3">
          {/* Top Thin Progress Line */}
          <div className="absolute top-0 right-0 left-0 h-1 bg-secondary overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-accent via-yellow-400 to-accent transition-all duration-200"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          {/* Artwork & Playing Indicator */}
          <button
            onClick={() => setIsExpanded(true)}
            className="relative h-11 w-11 rounded overflow-hidden shrink-0 border border-accent/30 bg-secondary flex items-center justify-center group"
            title="بزرگنمایی پلیر"
          >
            {track.coverImage ? (
              <img
                src={track.coverImage}
                alt={track.title}
                className="w-full h-full object-cover transition-transform group-hover:scale-110"
              />
            ) : (
              <div className="flex items-center justify-center text-accent">
                <BookOpen className="h-5 w-5" />
              </div>
            )}
            {isPlaying && (
              <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                <span className="h-2 w-2 rounded bg-accent animate-ping" />
              </div>
            )}
          </button>

          {/* Track Info (Click to Expand) */}
          <div
            onClick={() => setIsExpanded(true)}
            className="flex-1 min-w-0 cursor-pointer pr-0.5"
          >
            <div className="flex items-center gap-1.5">
              <span className="font-display font-bold text-xs sm:text-sm text-foreground truncate">
                {track.title}
              </span>
              {track.type === "quran" && (
                <span className="px-1.5 py-0.2 rounded bg-primary/15 text-primary text-[10px] font-bold shrink-0">
                  تلاوت
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 text-[11px] text-muted-foreground truncate mt-0.5">
              <span className="text-accent font-semibold truncate">
                {track.scholarName || track.reciter || track.subtitle}
              </span>
              {activeChapter && (
                <span className="hidden sm:inline text-muted-foreground/80 truncate">
                  • {activeChapter.title}
                </span>
              )}
              <span className="font-mono text-[10px] text-muted-foreground shrink-0">
                ({formatSeconds(currentTime)} / {formatSeconds(duration)})
              </span>
            </div>
          </div>

          {/* Quick Controls */}
          <div className="flex items-center gap-1 shrink-0">
            {/* Rewind 10s */}
            <button
              onClick={() => seekRelative(-10)}
              className="h-8 w-8 rounded hover:bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
              title="۱۰ ثانیه قبل"
            >
              <RotateCcw className="h-4 w-4" />
            </button>

            {/* Play / Pause */}
            <button
              onClick={togglePlay}
              className="h-9 w-9 rounded bg-accent hover:bg-accent/90 text-stone-950 flex items-center justify-center shadow-gold-glow transition-all hover:scale-105 active:scale-95"
              title={isPlaying ? "توقف" : "پخش"}
            >
              {isPlaying ? (
                <Pause className="h-4 w-4 fill-current" />
              ) : (
                <Play className="h-4 w-4 fill-current mr-0.5" />
              )}
            </button>

            {/* Forward 10s */}
            <button
              onClick={() => seekRelative(10)}
              className="h-8 w-8 rounded hover:bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
              title="۱۰ ثانیه بعد"
            >
              <RotateCw className="h-4 w-4" />
            </button>

            {/* Expand Modal */}
            <button
              onClick={() => setIsExpanded(true)}
              className="hidden sm:flex h-8 w-8 rounded hover:bg-secondary items-center justify-center text-muted-foreground hover:text-accent transition-colors"
              title="نمایش پنل تمام‌صفحه"
            >
              <Maximize2 className="h-3.5 w-3.5" />
            </button>

            {/* Dismiss / Close */}
            <button
              onClick={closePlayer}
              className="h-8 w-8 rounded hover:bg-secondary flex items-center justify-center text-muted-foreground hover:text-destructive transition-colors mr-0.5"
              title="بستن پلیر"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Expanded Modal */}
      <ExpandedPlayerModal />
    </>
  );
}
