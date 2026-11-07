'use client';
import { useEffect, useState, useMemo, useCallback } from "react";
import { Link } from "react-router-dom";
import api from "@/lib/api";
import OrnamentalDivider from "@/components/OrnamentalDivider";
import { IslamicNumberBadge } from "@/components/IslamicOrnaments";
import {
  Video,
  Clock,
  PlayCircle,
  Loader2,
  BookOpen,
  Filter,
  ArrowRight,
  LayoutGrid,
  Library,
  Mic,
  Headphones,
  ListMusic,
  Pause,
  Play,
  Volume2,
} from "lucide-react";
import PullToRefresh from "@/components/PullToRefresh";
import { useScholar } from "@/lib/scholarAccess";
import { useAudioPlayer } from "@/context/AudioPlayerContext";
import TalkStudioModal from "@/components/talks/TalkStudioModal";

export default function Talks() {
  const { user, isScholar } = useScholar();
  const { playTrack, track: currentTrack, isPlaying, togglePlay } = useAudioPlayer();

  const [activeMediaType, setActiveMediaType] = useState("audio"); // "audio" (podcasts) | "video"
  const [podcasts, setPodcasts] = useState([]);
  const [verses, setVerses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState("all");
  const [selectedSurah, setSelectedSurah] = useState(null);
  const [scholarFilter, setScholarFilter] = useState("all");
  const [studioOpen, setStudioOpen] = useState(false);

  const loadData = useCallback(() => {
    setLoading(true);
    Promise.all([
      api.entities.Podcast.list("-created_date", 100).catch(() => ({ items: [] })),
      api.entities.Verse.list("-created_date", 200).catch(() => ({ items: [] })),
    ])
      .then(([podRes, verseRes]) => {
        setPodcasts(podRes.items || podRes || []);
        setVerses(verseRes.items || verseRes || []);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Video talks extracted from Verse records
  const videoTalks = useMemo(() => {
    const list = [];
    verses.forEach((v) => {
      (v.videos || []).forEach((vid, i) => {
        list.push({
          ...vid,
          id: `${v.id}-${i}`,
          verse_id: v.id,
          verse_key: v.verse_key,
          surah_number: parseInt(v.verse_key?.split(":")[0] || "0", 10),
          surah_name: v.surah_name_english || v.surah_name_transliteration || "",
          surah_name_arabic: v.surah_name_arabic || "",
          tags: v.tags || [],
          difficulty: v.difficulty_level,
        });
      });
    });
    return list;
  }, [verses]);

  const scholars = useMemo(() => {
    const set = new Set();
    if (activeMediaType === "audio") {
      podcasts.forEach((p) => p.scholar_name && set.add(p.scholar_name));
    } else {
      videoTalks.forEach((t) => t.scholar && set.add(t.scholar));
    }
    return Array.from(set);
  }, [activeMediaType, podcasts, videoTalks]);

  const surahGroups = useMemo(() => {
    const groups = {};
    videoTalks.forEach((t) => {
      if (!groups[t.surah_number]) {
        groups[t.surah_number] = {
          surah_number: t.surah_number,
          surah_name: t.surah_name,
          surah_name_arabic: t.surah_name_arabic,
          talks: [],
        };
      }
      groups[t.surah_number].talks.push(t);
    });
    return Object.values(groups).sort((a, b) => a.surah_number - b.surah_number);
  }, [videoTalks]);

  const filteredVideoTalks = useMemo(() => {
    let result = videoTalks;
    if (viewMode === "surah" && selectedSurah !== null) {
      result = result.filter((t) => t.surah_number === selectedSurah);
    }
    if (scholarFilter !== "all") {
      result = result.filter((t) => t.scholar === scholarFilter);
    }
    return result;
  }, [videoTalks, viewMode, selectedSurah, scholarFilter]);

  const filteredPodcasts = useMemo(() => {
    let result = podcasts;
    if (scholarFilter !== "all") {
      result = result.filter((p) => p.scholar_name === scholarFilter);
    }
    return result;
  }, [podcasts, scholarFilter]);

  const handlePlayPodcast = (pod) => {
    if (currentTrack?.id === pod.id) {
      togglePlay();
    } else {
      playTrack({
        id: pod.id,
        title: pod.title,
        scholarName: pod.scholar_name,
        audioUrl: pod.audio_url,
        coverImage: pod.cover_image,
        type: "podcast",
        chapters: pod.chapters || [],
        verseKey: (pod.verse_keys && pod.verse_keys[0]) || "",
        duration: pod.duration,
      });
    }
  };

  const selectedSurahGroup = surahGroups.find((g) => g.surah_number === selectedSurah);

  return (
    <PullToRefresh onRefresh={loadData}>
      <div className="animate-fade-in mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 sm:py-12" dir="rtl">
        {/* Header Hero */}
        <div className="relative overflow-hidden rounded-3xl border border-amber-400/30 bg-card p-6 sm:p-10 mb-8 text-center shadow-premium">
          <div className="absolute inset-0 pointer-events-none z-0">
            <img
              src="/images/art/nasir_light_columns.jpg"
              alt=""
              className="w-full h-full object-cover filter brightness-[0.22] dark:brightness-[0.14] contrast-[1.1] scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-card/85 via-card/75 to-card/95 backdrop-blur-[1px]" />
          </div>
          <div className="pattern-islamic absolute inset-0 opacity-10 pointer-events-none z-0" />

          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-accent/15 border border-accent/30 text-accent font-ui text-xs font-semibold mb-3">
              <Headphones className="h-3.5 w-3.5" /> درس‌گفتارهای صوتی و تصویری اساتید
            </div>
            <h1 className="font-kalameh font-black text-3xl sm:text-4xl text-foreground tracking-tight mb-2">
              گفتارها و پادکست‌های تفسیری
            </h1>
            <p className="font-yekan text-muted-foreground text-sm max-w-xl mx-auto">
              سلسله مباحث تدبّر در قرآن و درس‌های معرفتی — همراه با قابلیت پخش پیوسته در سراسر سایت، سرفصل‌های موضوعی و کنترل سرعت.
            </p>

            {/* Scholar Studio Action Button */}
            {isScholar && (
              <div className="mt-6 flex justify-center">
                <button
                  onClick={() => setStudioOpen(true)}
                  className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-accent to-yellow-500 hover:from-accent/90 text-stone-950 text-xs sm:text-sm font-bold shadow-gold-glow flex items-center gap-2 transition-all hover:scale-105 active:scale-95"
                >
                  <Mic className="h-4 w-4" />
                  <span>استودیوی ضبط و بارگذاری گفتار جدید</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Media Type Switcher Tabs (Audio Podcasts vs Video Talks) */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <button
            onClick={() => {
              setActiveMediaType("audio");
              setScholarFilter("all");
            }}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-2xl text-sm font-bold transition-all ${
              activeMediaType === "audio"
                ? "bg-accent text-stone-950 shadow-gold-glow scale-105"
                : "bg-secondary text-muted-foreground hover:text-foreground border border-border"
            }`}
          >
            <Headphones className="h-4 w-4" />
            <span>پادکست‌ها و دروس صوتی ({podcasts.length.toLocaleString("fa-IR")})</span>
          </button>

          <button
            onClick={() => {
              setActiveMediaType("video");
              setScholarFilter("all");
            }}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-2xl text-sm font-bold transition-all ${
              activeMediaType === "video"
                ? "bg-accent text-stone-950 shadow-gold-glow scale-105"
                : "bg-secondary text-muted-foreground hover:text-foreground border border-border"
            }`}
          >
            <Video className="h-4 w-4" />
            <span>کلیپ‌های تصویری ({videoTalks.length.toLocaleString("fa-IR")})</span>
          </button>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-accent" />
          </div>
        ) : activeMediaType === "audio" ? (
          /* ── AUDIO PODCASTS VIEW ── */
          <div>
            {/* Scholars Filter */}
            {scholars.length > 0 && (
              <div className="flex items-center gap-2 mb-8 overflow-x-auto no-scrollbar pb-1">
                <span className="text-xs text-muted-foreground shrink-0 flex items-center gap-1">
                  <Filter className="h-3.5 w-3.5" /> استاد:
                </span>
                <button
                  onClick={() => setScholarFilter("all")}
                  className={`px-4 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                    scholarFilter === "all"
                      ? "bg-accent text-accent-foreground shadow-soft"
                      : "text-muted-foreground hover:text-foreground border border-accent/15"
                  }`}
                >
                  همه اساتید
                </button>
                {scholars.map((s) => (
                  <button
                    key={s}
                    onClick={() => setScholarFilter(s)}
                    className={`px-4 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                      scholarFilter === s
                        ? "bg-accent text-accent-foreground shadow-soft"
                        : "text-muted-foreground hover:text-foreground border border-accent/15"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}

            {filteredPodcasts.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-accent/20 p-12 text-center max-w-md mx-auto">
                <Headphones className="h-8 w-8 text-muted-foreground/40 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">هنوز گفتار صوتی در این بخش ثبت نشده است.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredPodcasts.map((pod) => {
                  const isCurrent = currentTrack?.id === pod.id;
                  const isPodPlaying = isCurrent && isPlaying;
                  const chapters = Array.isArray(pod.chapters) ? pod.chapters : [];

                  return (
                    <div
                      key={pod.id}
                      className={`relative rounded-3xl border overflow-hidden transition-all duration-300 hover:shadow-premium flex flex-col justify-between ${
                        isCurrent
                          ? "border-accent bg-card shadow-gold-glow/20 ring-1 ring-accent"
                          : "border-border bg-card/80 hover:border-accent/40"
                      }`}
                    >
                      {/* Top Header Card */}
                      <div className="p-5">
                        <div className="flex items-start gap-4 mb-3">
                          <button
                            onClick={() => handlePlayPodcast(pod)}
                            className="relative h-14 w-14 rounded-2xl overflow-hidden shrink-0 border border-accent/30 bg-secondary flex items-center justify-center group/btn shadow-soft"
                            title={isPodPlaying ? "توقف" : "پخش در پلیر سراسری"}
                          >
                            {pod.cover_image ? (
                              <img
                                src={pod.cover_image}
                                alt={pod.title}
                                className="w-full h-full object-cover transition-transform group-hover/btn:scale-110"
                              />
                            ) : (
                              <div className="h-full w-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white">
                                <Headphones className="h-6 w-6" />
                              </div>
                            )}

                            {/* Play overlay icon */}
                            <div
                              className={`absolute inset-0 flex items-center justify-center transition-all ${
                                isPodPlaying
                                  ? "bg-black/40 text-accent"
                                  : "bg-black/30 text-white opacity-0 group-hover/btn:opacity-100"
                              }`}
                            >
                              {isPodPlaying ? (
                                <Pause className="h-6 w-6 fill-current" />
                              ) : (
                                <Play className="h-6 w-6 fill-current mr-0.5" />
                              )}
                            </div>
                          </button>

                          <div className="flex-1 min-w-0">
                            <h3 className="font-display font-bold text-base text-foreground leading-snug line-clamp-2">
                              {pod.title}
                            </h3>
                            <div className="text-xs text-accent font-semibold mt-1 flex items-center gap-1.5">
                              <span>{pod.scholar_name || "استاد محترم"}</span>
                            </div>
                          </div>
                        </div>

                        {pod.description && (
                          <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed mb-3">
                            {pod.description}
                          </p>
                        )}

                        {/* Chapters Preview Bar */}
                        {chapters.length > 0 && (
                          <div className="mt-3 pt-3 border-t border-border/50">
                            <div className="flex items-center justify-between text-[11px] font-semibold text-muted-foreground mb-1.5">
                              <span className="flex items-center gap-1">
                                <ListMusic className="h-3 w-3 text-accent" />
                                <span>سرفصل‌ها ({chapters.length.toLocaleString("fa-IR")} بخش)</span>
                              </span>
                              <span>{pod.duration || "۱۵:۰۰"}</span>
                            </div>
                            <div className="flex flex-wrap gap-1">
                              {chapters.slice(0, 3).map((ch, idx) => (
                                <span
                                  key={idx}
                                  className="text-[10px] px-2 py-0.5 rounded-lg bg-secondary text-muted-foreground truncate max-w-[150px]"
                                >
                                  {ch.title}
                                </span>
                              ))}
                              {chapters.length > 3 && (
                                <span className="text-[10px] px-1.5 py-0.5 text-accent font-bold">
                                  +{(chapters.length - 3).toLocaleString("fa-IR")} دیگر
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Card Bottom Actions */}
                      <div className="px-5 py-3 border-t border-border/40 bg-secondary/30 flex items-center justify-between">
                        <button
                          onClick={() => handlePlayPodcast(pod)}
                          className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                            isPodPlaying
                              ? "bg-accent text-stone-950 shadow-gold-glow"
                              : "bg-primary text-primary-foreground hover:shadow-emerald-glow"
                          }`}
                        >
                          {isPodPlaying ? (
                            <>
                              <Volume2 className="h-3.5 w-3.5 animate-pulse" />
                              <span>در حال پخش</span>
                            </>
                          ) : (
                            <>
                              <Play className="h-3.5 w-3.5 fill-current" />
                              <span>پخش گفتار</span>
                            </>
                          )}
                        </button>

                        {pod.verse_keys?.[0] && (
                          <Link
                            to={`/quran?verse=${pod.verse_keys[0]}`}
                            className="text-xs text-muted-foreground hover:text-accent font-medium flex items-center gap-1 transition-colors"
                          >
                            <BookOpen className="h-3 w-3" />
                            <span>آیه {pod.verse_keys[0]}</span>
                          </Link>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          /* ── VIDEO TALKS VIEW ── */
          <div>
            {/* View mode toggle */}
            <div className="flex items-center justify-center gap-2 mb-8">
              <button
                onClick={() => {
                  setViewMode("all");
                  setSelectedSurah(null);
                }}
                className={`inline-flex items-center gap-2 px-5 py-2 rounded-full text-xs font-medium transition-all ${
                  viewMode === "all"
                    ? "bg-accent text-accent-foreground shadow-soft"
                    : "text-muted-foreground hover:text-foreground border border-accent/10"
                }`}
              >
                <LayoutGrid className="h-4 w-4" />
                همه گفتارهای تصویری
              </button>
              <button
                onClick={() => {
                  setViewMode("surah");
                  setSelectedSurah(null);
                }}
                className={`inline-flex items-center gap-2 px-5 py-2 rounded-full text-xs font-medium transition-all ${
                  viewMode === "surah"
                    ? "bg-accent text-accent-foreground shadow-soft"
                    : "text-muted-foreground hover:text-foreground border border-accent/10"
                }`}
              >
                <Library className="h-4 w-4" />
                دسته‌بندی سوره‌ها
              </button>
            </div>

            {/* Surah browse mode: surah list */}
            {viewMode === "surah" && selectedSurah === null && (
              <>
                <div className="text-center mb-6">
                  <p className="text-sm text-muted-foreground">
                    {surahGroups.length.toLocaleString("fa-IR")} سوره دارای گفتار تفسیری
                  </p>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {surahGroups.map((group, i) => (
                    <SurahCard
                      key={group.surah_number}
                      group={group}
                      delay={i * 0.04}
                      onClick={() => setSelectedSurah(group.surah_number)}
                    />
                  ))}
                </div>
                <OrnamentalDivider className="mt-12" />
              </>
            )}

            {/* Surah browse mode: talks for selected surah */}
            {viewMode === "surah" && selectedSurah !== null && (
              <>
                <button
                  onClick={() => setSelectedSurah(null)}
                  className="inline-flex items-center gap-2 mb-6 text-sm text-muted-foreground hover:text-accent transition-colors"
                >
                  <ArrowRight className="h-4 w-4" />
                  بازگشت به سوره‌ها
                </button>

                {selectedSurahGroup && (
                  <div className="relative rounded-2xl border border-accent/15 bg-gradient-to-br from-accent/8 to-card/40 p-6 mb-8 overflow-hidden">
                    <div className="absolute inset-0 pattern-islamic opacity-20" />
                    <div className="relative flex items-center gap-5">
                      <IslamicNumberBadge number={selectedSurahGroup.surah_number} size={56} />
                      <div className="flex-1">
                        {selectedSurahGroup.surah_name_arabic && (
                          <div className="font-arabic text-3xl text-accent/70 mb-1" dir="rtl">
                            {selectedSurahGroup.surah_name_arabic}
                          </div>
                        )}
                        <h2 className="font-display font-bold text-xl">
                          {selectedSurahGroup.surah_name}
                        </h2>
                        <p className="text-xs text-muted-foreground mt-1">
                          {filteredVideoTalks.length.toLocaleString("fa-IR")} گفتار
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {filteredVideoTalks.length > 0 ? (
                  <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredVideoTalks.map((talk, i) => (
                      <TalkCard key={talk.id} talk={talk} delay={i * 0.05} />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-sm text-muted-foreground">
                    گفتاری برای این سوره یافت نشد.
                  </div>
                )}
              </>
            )}

            {/* All video talks mode */}
            {viewMode === "all" && (
              <>
                {scholars.length > 0 && (
                  <div className="flex items-center gap-2 mb-8 overflow-x-auto no-scrollbar pb-1">
                    <span className="text-xs text-muted-foreground shrink-0 flex items-center gap-1">
                      <Filter className="h-3.5 w-3.5" /> استاد:
                    </span>
                    <button
                      onClick={() => setScholarFilter("all")}
                      className={`px-4 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                        scholarFilter === "all"
                          ? "bg-accent text-accent-foreground shadow-soft"
                          : "text-muted-foreground hover:text-foreground border border-accent/10"
                      }`}
                    >
                      همه
                    </button>
                    {scholars.map((s) => (
                      <button
                        key={s}
                        onClick={() => setScholarFilter(s)}
                        className={`px-4 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                          scholarFilter === s
                            ? "bg-accent text-accent-foreground shadow-soft"
                            : "text-muted-foreground hover:text-foreground border border-accent/10"
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                )}

                <div className="flex items-center gap-4 mb-6 text-xs text-muted-foreground">
                  <span>{filteredVideoTalks.length.toLocaleString("fa-IR")} گفتار ویدیویی</span>
                  {scholars.length > 0 && (
                    <span>· {scholars.length.toLocaleString("fa-IR")} استاد</span>
                  )}
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredVideoTalks.map((talk, i) => (
                    <TalkCard key={talk.id} talk={talk} delay={i * 0.05} />
                  ))}
                </div>

                {filteredVideoTalks.length === 0 && (
                  <div className="text-center py-12 text-sm text-muted-foreground">
                    گفتار تصویری با این فیلتر یافت نشد.
                  </div>
                )}

                <OrnamentalDivider className="mt-12" />
              </>
            )}
          </div>
        )}

        {/* Talk Studio Modal for Scholars */}
        <TalkStudioModal
          isOpen={studioOpen}
          onClose={() => setStudioOpen(false)}
          onCreated={() => loadData()}
          user={user}
        />
      </div>
    </PullToRefresh>
  );
}

function SurahCard({ group, onClick, delay = 0 }) {
  return (
    <button
      onClick={onClick}
      className="group relative block w-full rounded-2xl border border-accent/15 bg-card/60 overflow-hidden hover:border-accent/30 hover:shadow-premium transition-all duration-300 text-right p-5 animate-fade-in-up will-animate"
      style={{ animationDelay: `${delay}s` }}
    >
      <div className="absolute inset-0 pattern-islamic opacity-20" />
      <div className="relative flex items-center gap-4">
        <IslamicNumberBadge number={group.surah_number} size={48} />
        <div className="flex-1 text-right">
          {group.surah_name_arabic && (
            <div className="font-arabic text-xl text-accent/70 mb-1" dir="rtl">
              {group.surah_name_arabic}
            </div>
          )}
          <div className="font-display font-semibold text-sm">
            {group.surah_name || `سوره ${group.surah_number}`}
          </div>
          <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
            <PlayCircle className="h-3 w-3 text-accent/50" />
            {group.talks.length.toLocaleString("fa-IR")} گفتار
          </div>
        </div>
        <div className="h-9 w-9 rounded-full bg-accent/10 text-accent flex items-center justify-center group-hover:bg-accent group-hover:text-accent-foreground transition-all duration-300 shrink-0">
          <PlayCircle className="h-5 w-5" />
        </div>
      </div>
    </button>
  );
}

function TalkCard({ talk, delay = 0 }) {
  return (
    <Link
      to={talk.verse_key ? `/verse/${talk.verse_key.replace(":", "/")}` : "/talks"}
      className="group relative block rounded-2xl border border-accent/15 bg-card/60 overflow-hidden hover:border-accent/30 hover:shadow-premium transition-all duration-300 animate-fade-in-up will-animate"
      style={{ animationDelay: `${delay}s` }}
    >
      {/* Thumbnail */}
      <div className="relative h-40 overflow-hidden bg-gradient-to-br from-accent/15 via-accent/8 to-primary/10">
        <div className="absolute inset-0 pattern-islamic opacity-30" />
        {talk.surah_name_arabic && (
          <div className="absolute top-3 right-3 font-arabic text-lg text-accent/40" dir="rtl">
            {talk.surah_name_arabic}
          </div>
        )}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="h-14 w-14 rounded-full bg-card/80 backdrop-blur-sm flex items-center justify-center text-accent ring-2 ring-accent/20 group-hover:scale-110 group-hover:bg-accent group-hover:text-accent-foreground transition-all duration-300 shadow-premium">
            <PlayCircle className="h-7 w-7" />
          </div>
        </div>
        {talk.duration && (
          <div className="absolute bottom-3 left-3 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/50 backdrop-blur-sm text-white text-xs font-medium">
            <Clock className="h-2.5 w-2.5" />
            {talk.duration}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        {talk.verse_key && (
          <div className="text-xs text-accent font-medium mb-1.5 flex items-center gap-1">
            <BookOpen className="h-3 w-3" />
            {talk.verse_key} · {talk.surah_name}
          </div>
        )}
        <h3 className="font-display font-semibold text-[15px] leading-snug mb-2 line-clamp-2 group-hover:text-accent transition-colors">
          {talk.title || "گفتار قرآنی"}
        </h3>
        {talk.scholar && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <div className="h-5 w-5 rounded-full bg-accent/10 text-accent flex items-center justify-center text-xs font-bold">
              {talk.scholar[0]}
            </div>
            {talk.scholar}
          </div>
        )}
        {talk.tags?.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2.5">
            {talk.tags.slice(0, 3).map((t) => (
              <span key={t} className="text-xs px-2 py-0.5 rounded-full bg-accent/8 text-accent">
                #{t}
              </span>
            ))}
          </div>
        )}
      </div>
    </Link>
  );
}
