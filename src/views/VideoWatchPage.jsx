'use client';

import { useEffect, useState, useCallback, useRef } from "react";
import Hls from 'hls.js';
import { useParams, Link, useNavigate } from "@/lib/router-compat";
import api from "@/lib/api";
import { useAuth } from "@/lib/AuthContext";
import { toast } from "react-hot-toast";
import { fa } from "@/lib/utils";
import { STATUS_COLORS } from "@/lib/design-tokens";
import { recordWatch } from "@/lib/watchHistory";
import {
  Play, Pause, Volume2, VolumeX, Maximize, Minimize,
  Clock, BookOpen, ThumbsUp, ThumbsDown, Bookmark, Share2,
  Download, Microphone, Headphones, Settings, ChevronLeft,
  Speaker, Volume, PlayCircle, Timer, Wand2, Users, Trophy,
  Award, Mic, StopWatch, Language, Layout, MoreHorizontal, Video,
} from "lucide-react";
import BackButton from "@/components/BackButton";
import OrnamentalDivider from "@/components/OrnamentalDivider";
import { useAudioPlayer } from "@/context/AudioPlayerContext";
import RelatedVideos from "@/components/video/RelatedVideos";
import { AnimatePresence, motion } from "framer-motion";

// New design system
import InteractionToolbar from "@/components/design-system/InteractionToolbar";
import EmptyState from "@/components/design-system/EmptyState";

/**
 * Ayeh Media Plus — Video Watch Page Redesign
 * Aparat-style professional media player experience for Quranic recitations,
 * tafsir, competitions, and gatherings.
 */

export default function VideoWatchPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user: authUser, openAuthModal } = useAuth();
  const { playTrack, track: currentTrack, isPlaying, togglePlay, setTrack } = useAudioPlayer();

  const [video, setVideo] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAudioOnly, setIsAudioOnly] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showComments, setShowComments] = useState(true);
  const [activeAyah, setActiveAyah] = useState(null);
  const [userInteraction, setUserInteraction] = useState({
    liked: false,
    bookmarked: false,
  });
  const [commentText, setCommentText] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);
  const [replyTo, setReplyTo] = useState(null);
  const [theaterMode, setTheaterMode] = useState(false);

  const videoRef = useRef(null);
  const containerRef = useRef(null);
  const hlsRef = useRef(null);
  const lastReportedTimeRef = useRef(-1); // Track last reported 30-second interval
  const [selectedQuality, setSelectedQuality] = useState(null);
  const [availableQualities, setAvailableQualities] = useState([]);

  // Load video data
  useEffect(() => {
    loadVideo();
  }, [id]);

  const loadVideo = async () => {
    try {
      setLoading(true);
      const [vid, cmts] = await Promise.all([
        api.entities.Video.get(id),
        api.entities.Comment.filter({ video_id: id, status: "published" }, "-created_date", 50),
      ]);

      setVideo(vid);
      setComments(cmts || []);

      // Initialize HLS if transcoded stream is available
      if (vid.hls_url && vid.qualities) {
        const qualities = typeof vid.qualities === 'string' ? JSON.parse(vid.qualities) : vid.qualities;
        setAvailableQualities(qualities);
        setSelectedQuality(qualities[0] || null);
        initHls(vid.hls_url);
      } else {
        setAvailableQualities([]);
        setSelectedQuality(null);
        cleanupHls();
      }

      if (authUser) {
        const likes = await api.entities.Like.filter({ user_id: authUser.id, video_id: id }).catch(() => []);
        const bookmarks = await api.entities.Bookmark.filter({ user_id: authUser.id, video_id: id }).catch(() => []);
        setUserInteraction({
          liked: likes.length > 0,
          bookmarked: bookmarks.length > 0,
        });
      }

      setLoading(false);
    } catch (err) {
      setError(err.message || "خطا در بارگذاری ویدیو");
      setLoading(false);
    }
  };

  const trackWatchTime = useCallback(() => {
    if (!video || !videoRef.current) return;
    const currentTime = videoRef.current.currentTime;
    const duration = videoRef.current.duration || 0;
    const currentInterval = Math.floor(currentTime / 30);
    // Only report once per 30-second interval
    if (currentInterval > lastReportedTimeRef.current) {
      lastReportedTimeRef.current = currentInterval;
      // Server-side view count
      api.entities.Video.update(id, {
        views_count: (video.views_count || 0) + 1,
      }).catch(() => {});
      // Local watch history
      const completion = duration > 0 ? Math.round((currentTime / duration) * 100) : 0;
      recordWatch({
        video_id: id,
        title: video.title || "",
        thumbnail_url: video.thumbnail_url || null,
        watch_seconds: 30,
        completion_percentage: completion,
      }).catch(() => {});
    }
  }, [video, id]);

  // ── HLS playback ──
  const initHls = useCallback((hlsUrl) => {
    cleanupHls();
    if (!Hls.isSupported()) {
      // Native HLS support (Safari) — set src directly
      if (videoRef.current) {
        videoRef.current.src = hlsUrl;
      }
      return;
    }
    const hls = new Hls();
    hlsRef.current = hls;
    hls.loadSource(hlsUrl);
    hls.attachMedia(videoRef.current);
    hls.on(Hls.Events.MANIFEST_PARSED, () => {
      // Auto-select first quality
      const levels = hls.levels;
      if (levels && levels.length > 0) {
        const qualityNames = levels.map((l, i) => ({
          name: l.height ? `${l.height}p` : `auto`,
          level: i,
        }));
        setAvailableQualities(qualityNames);
        setSelectedQuality(qualityNames[0]);
      }
    });
  }, []);

  const setHlsQuality = useCallback((qualityName) => {
    const hls = hlsRef.current;
    if (!hls || !hls.levels) return;
    const levelIndex = hls.levels.findIndex(l => {
      const name = l.height ? `${l.height}p` : 'auto';
      return name === qualityName;
    });
    if (levelIndex >= 0) {
      hls.currentLevel = levelIndex;
      setSelectedQuality(qualityName);
    }
  }, []);

  const cleanupHls = useCallback(() => {
    const hls = hlsRef.current;
    if (hls) {
      hls.destroy();
      hlsRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.src = '';
      videoRef.current.load();
    }
  }, []);

  // Cleanup HLS on unmount
  useEffect(() => {
    return () => {
      cleanupHls();
    };
  }, [cleanupHls]);

  const handleLike = async () => {
    if (!authUser) { openAuthModal(); return; }
    try {
      if (userInteraction.liked) {
        const likes = await api.entities.Like.filter({ user_id: authUser.id, video_id: id }).catch(() => []);
        if (likes[0]) await api.entities.Like.delete(likes[0].id);
        setUserInteraction(prev => ({ ...prev, liked: false }));
        await api.entities.Video.update(id, { likes_count: Math.max(0, (video.likes_count || 0) - 1) });
      } else {
        await api.entities.Like.create({ user_id: authUser.id, video_id, type: "like" });
        setUserInteraction(prev => ({ ...prev, liked: true }));
        await api.entities.Video.update(id, { likes_count: (video.likes_count || 0) + 1 });
      }
    } catch (err) {
      toast.error("خطا در ثبت لایک");
    }
  };

  const handleBookmark = async () => {
    if (!authUser) { openAuthModal(); return; }
    try {
      if (userInteraction.bookmarked) {
        const bms = await api.entities.Bookmark.filter({ user_id: authUser.id, video_id: id }).catch(() => []);
        if (bms[0]) await api.entities.Bookmark.delete(bms[0].id);
        setUserInteraction(prev => ({ ...prev, bookmarked: false }));
      } else {
        await api.entities.Bookmark.create({ user_id: authUser.id, video_id });
        setUserInteraction(prev => ({ ...prev, bookmarked: true }));
      }
    } catch (err) {
      toast.error("خطا در ذخیره");
    }
  };

  const handleComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    if (!authUser) { openAuthModal(); return; }
    setSubmittingComment(true);
    try {
      await api.entities.Comment.create({
        video_id: id,
        author_id: authUser.id,
        author_name: authUser.full_name || "کاربر آیه",
        author_avatar: authUser.avatar_url,
        content: commentText.trim(),
        parent_id: replyTo?.id || null,
        status: "pending_review",
      });
      setCommentText("");
      setReplyTo(null);
      toast.success("نظر شما ثبت شد و پس از بررسی منتشر می‌شود.");
      loadVideo();
    } catch (err) {
      toast.error("خطا در ارسال نظر");
    } finally {
      setSubmittingComment(false);
    }
  };

  const toggleAudioOnly = () => {
    setIsAudioOnly(!isAudioOnly);
    if (videoRef.current) {
      if (!isAudioOnly) videoRef.current.play();
      else videoRef.current.pause();
    }
  };

  const toggleTheaterMode = () => setTheaterMode(!theaterMode);

  const formatTime = (seconds) => {
    if (!seconds) return "0:00";
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const chapters = video?.chapters ? (typeof video.chapters === 'string' ? JSON.parse(video.chapters) : video.chapters) : [];

  // Fullscreen toggle
  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!isFullscreen) {
      if (containerRef.current.requestFullscreen) {
        containerRef.current.requestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
    setIsFullscreen(!isFullscreen);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="h-12 w-12 border-4 border-quranic-emerald/30 border-t-quranic-emerald rounded-full animate-spin" />
        <p className="mt-4 text-muted-foreground font-doran">در حال بارگذاری...</p>
      </div>
    );
  }

  if (error || !video) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-6">
        <BookOpen className="h-12 w-12 text-muted-foreground/30 mb-4" />
        <h2 className="font-rokh-bold font-bold text-xl text-foreground mb-2">{error || "ویدیو یافت نشد"}</h2>
        <button onClick={loadVideo} className="mt-4 px-6 py-2 rounded-xl bg-quranic-emerald text-white text-sm font-medium hover:opacity-90 transition-colors">
          تلاش مجدد
        </button>
      </div>
    );
  }

  const chapterMarkers = chapters.length > 0 ? chapters : [
    { title: "آغاز تلاوت", start_time: 0, verse_key: video.verse_key },
  ];

  const statusConfig = STATUS_COLORS[video.status] || STATUS_COLORS.published;

  return (
    <div className="watch-page min-h-screen bg-background font-doran">
      {/* Audio-only backdrop */}
      {isAudioOnly && (
        <div className="fixed inset-0 bg-quranic-midnight z-50 flex flex-col items-center justify-center text-white">
          <div className="text-center space-y-6">
            <div className="relative">
              <div className="h-32 w-32 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center animate-pulse">
                <Play className="h-12 w-12 text-emerald-500 ml-1" />
              </div>
              <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20">
                <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-sm font-medium">صوت در حال پخش در Background</span>
              </div>
            </div>
            <h1 className="font-rokh-bold font-bold text-3xl text-white">{video.title}</h1>
            <p className="text-emerald-100/90">{video.reciter_name}</p>
            <button
              onClick={toggleAudioOnly}
              className="px-8 py-3 rounded-full bg-white text-quranic-midnight font-bold hover:bg-emerald-100 transition-all"
            >
              بازگشت به حالت ویدیو
            </button>
          </div>
        </div>
      )}

      {/* Main Layout */}
      <div ref={containerRef} className={`relative z-10 ${isAudioOnly ? 'hidden' : ''} ${theaterMode ? 'lg:grid-cols-1' : ''}`}>
        {/* Video Hero Section */}
        <section className={`relative bg-black/90 ${theaterMode ? 'h-[70vh]' : ''}`}>
          <div className="relative aspect-video bg-gradient-to-br from-emerald-900/50 to-black overflow-hidden">
            {video.media_url || video.hls_url ? (
              <video
                ref={videoRef}
                src={
                  video.hls_url && !Hls.isSupported()
                    ? video.hls_url
                    : video.hls_url && Hls.isSupported()
                    ? undefined
                    : video.media_url || undefined
                }
                className="w-full h-full object-cover"
                playsInline
                preload="metadata"
                onTimeUpdate={trackWatchTime}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-muted-foreground/60">
                <span>منبع ویدیو موجود نیست</span>
              </div>
            )}
            {/* Player Controls Overlay */}
            <div className="absolute inset-0 flex flex-col justify-between p-4 pointer-events-none">
              {/* Top Bar */}
              <div className="absolute top-0 left-0 right-0 p-6 pointer-events-auto">
                <div className="max-w-5xl mx-auto">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${statusConfig.bg || 'bg-emerald-100'} ${statusConfig.text || 'text-emerald-700'} border ${statusConfig.border || 'border-emerald-200'}`}>
                        {statusConfig.label || 'منتشر شده'}
                      </span>
                      {video.is_competition && (
                        <span className="px-2.5 py-1 rounded-full bg-saffron-100 text-saffron-900 text-xs font-bold border border-saffron-200">
                          ⏵ مسابقه قرآنی
                        </span>
                      )}
                      {video.is_live && (
                        <span className="px-2.5 py-1 rounded-full bg-red-500 text-white text-xs font-bold animate-pulse">
                          ⏺ زنده
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <select
                        value={playbackRate}
                        onChange={(e) => {
                          setPlaybackRate(parseFloat(e.target.value));
                          if (videoRef.current) videoRef.current.playbackRate = parseFloat(e.target.value);
                        }}
                        className="bg-black/60 border border-white/20 text-white text-xs rounded-lg px-3 py-1.5 focus:outline-none focus:border-emerald-400"
                      >
                        <option value="0.5">0.5×</option>
                        <option value="1">1×</option>
                        <option value="1.25">1.25×</option>
                        <option value="1.5">1.5×</option>
                        <option value="2">2×</option>
                      </select>
                      {availableQualities.length > 0 && (
                        <select
                          value={selectedQuality}
                          onChange={(e) => setHlsQuality(e.target.value)}
                          className="bg-black/60 border border-white/20 text-white text-xs rounded-lg px-3 py-1.5 focus:outline-none focus:border-emerald-400 ml-2"
                        >
                          {availableQualities.map((q) => (
                            <option key={q.name} value={q.name}>
                              {q.name}
                            </option>
                          ))}
                        </select>
                      )}
                      <button
                        onClick={toggleAudioOnly}
                        className="p-2.5 rounded-lg bg-black/50 text-white hover:bg-white/20 transition-colors"
                        title={isAudioOnly ? "نمایش ویدیو" : "حالت صوتی"}
                      >
                        {isAudioOnly ? <Video className="h-4 w-4" /> : <Headphones className="h-4 w-4" />}
                      </button>
                      <button
                        onClick={toggleTheaterMode}
                        className="p-2.5 rounded-lg bg-black/50 text-white hover:bg-white/20 transition-colors"
                        title={theaterMode ? "حالت معمولی" : "حالت تئاتر"}
                      >
                        {theaterMode ? <Layout className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
                      </button>
                      <button
                        onClick={toggleFullscreen}
                        className="p-2.5 rounded-lg bg-black/50 text-white hover:bg-white/20 transition-colors"
                        title={isFullscreen ? "بازگشت" : "حالت کامل"}
                      >
                        {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  <h1 className="font-rokh-bold font-black text-2xl sm:text-3xl text-white tracking-tight leading-tight mb-2">
                    {video.title}
                  </h1>
                  {video.description && (
                    <p className="text-slate-200/90 text-sm sm:text-base leading-relaxed max-w-2xl">
                      {video.description}
                    </p>
                  )}
                </div>
              </div>

              {/* Bottom Controls */}
              <div className="absolute bottom-0 left-0 right-0 p-4 pb-8 pointer-events-auto bg-gradient-to-t from-black/80 via-black/40 to-transparent">
                <div className="max-w-5xl mx-auto">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs text-slate-300 font-mono">{formatTime(videoRef.current?.currentTime || 0)}</span>
                    <span className="text-xs text-slate-300 font-mono">/{formatTime(videoRef.current?.duration || 0)}</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max={videoRef.current?.duration || 100}
                    value={videoRef.current?.currentTime || 0}
                    className="w-full h-1.5 bg-slate-600 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                    onInput={(e) => {
                      if (videoRef.current) videoRef.current.currentTime = parseFloat(e.target.value);
                    }}
                  />
                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center gap-6">
                      <button
                        onClick={() => {
                          if (videoRef.current) {
                            videoRef.current.currentTime = Math.max(0, videoRef.current.currentTime - 10);
                          }
                        }}
                        className="p-2.5 rounded-lg bg-black/50 text-white hover:bg-white/20 transition-colors"
                        title="بازگشت ۱۰ ثانیه قبل"
                      >
                        <Timer className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => {
                          if (videoRef.current) {
                            if (videoRef.current.paused) videoRef.current.play();
                            else videoRef.current.pause();
                          }
                        }}
                        className="h-12 w-12 rounded-full bg-white text-quranic-midnight flex items-center justify-center shadow-xl hover:scale-105 transition-transform"
                      >
                        {videoRef.current?.paused ? <Play className="h-6 w-6 ml-0.5" /> : <Pause className="h-6 w-6" />}
                      </button>
                      <button
                        onClick={() => {
                          if (videoRef.current) {
                            videoRef.current.currentTime = Math.min(videoRef.current.duration || 0, videoRef.current.currentTime + 10);
                          }
                        }}
                        className="p-2.5 rounded-lg bg-black/50 text-white hover:bg-white/20 transition-colors"
                        title="پیش رفت ۱۰ ثانیه"
                      >
                        <Timer className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          if (videoRef.current) videoRef.current.muted = !videoRef.current.muted;
                        }}
                        className="p-2.5 rounded-lg bg-black/50 text-white hover:bg-white/20 transition-colors"
                      >
                        {videoRef.current?.muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                      </button>
                      <button
                        onClick={toggleFullscreen}
                        className="p-2.5 rounded-lg bg-black/50 text-white hover:bg-white/20 transition-colors"
                      >
                        {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Chapter Markers */}
          {chapterMarkers.length > 0 && (
            <div className="bg-card/90 backdrop-blur-md border-b border-border px-6 py-4">
              <div className="flex items-center gap-2 mb-3">
                <BookOpen className="h-4 w-4 text-emerald-600" />
                <span className="font-rokh-bold font-semibold text-sm text-foreground">ستون‌های آیه‌ای</span>
              </div>
              <div className="overflow-x-auto pb-2 no-scrollbar">
                <div className="flex gap-3">
                  {chapterMarkers.map((chapter, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        if (videoRef.current) videoRef.current.currentTime = chapter.start_time;
                        setActiveAyah(chapter.verse_key);
                      }}
                      className={`flex-shrink-0 px-4 py-2 rounded-xl text-sm font-medium transition-all border ${
                        activeAyah === chapter.verse_key
                          ? "bg-quranic-emerald text-white border-quranic-emerald shadow-quranic-glow"
                          : "bg-transparent text-muted-foreground border-border/50 hover:border-quranic-emerald/30 hover:bg-quranic-emerald/5"
                      }`}
                    >
                      {chapter.title}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </section>

        {/* Content Grid */}
        <div className="container-quranic py-8">
          <div className={`grid gap-8 lg:grid-cols-12 ${theaterMode ? 'lg:grid-cols-1' : ''}`}>
            {/* Left Column: Video Meta + Engagement */}
            <div className="lg:col-span-8 space-y-8">
              {/* Metadata Panel */}
              <section className="rounded-2xl border border-border bg-card p-6 shadow-soft">
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-10 w-10 rounded-xl bg-quranic-emerald/10 flex items-center justify-center text-quranic-emerald font-bold">
                    {(video.reciter_name || "ق").charAt(0)}
                  </div>
                  <div>
                    {video.reciter_id ? (
                      <Link href={video.scholar_id ? `/scholars/${video.scholar_id}` : `/profile/${video.reciter_id}`} className="block">
                        <div className="font-rokh-bold font-bold text-base text-foreground leading-tight group-hover:text-quranic-emerald transition-colors">
                          {video.reciter_name || video.scholar_name || "قاری نامشخص"}
                        </div>
                        {video.competition_name && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                            <Trophy className="h-3 w-3 text-saffron-500" />
                            <span>{video.competition_name}</span>
                          </div>
                        )}
                      </Link>
                    ) : (
                      <div>
                        <div className="font-rokh-bold font-bold text-base text-foreground leading-tight">
                          {video.reciter_name || video.scholar_name || "قاری نامشخص"}
                        </div>
                        {video.competition_name && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                            <Trophy className="h-3 w-3 text-saffron-500" />
                            <span>{video.competition_name}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                  <MetaItem label="سوره / آیه" value={video.verse_key || "—"} icon={<BookOpen className="h-3 w-3" />} />
                  <MetaItem label="دوره" value={video.competition_year || "—"} icon={<Trophy className="h-3 w-3" />} />
                  <MetaItem label="مدت زمان" value={video.duration || "—"} icon={<Clock className="h-3 w-3" />} />
                  <MetaItem label="بازدید" value={fa(video.views_count || 0)} icon={<Users className="h-3 w-3" />} />
                </div>

                {video.tags && video.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-6">
                    {video.tags.map((tag, i) => (
                      <span key={i} className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-medium border border-emerald-100">
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}

                {video.download_enabled && video.download_url && (
                  <a href={video.download_url} download className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-700 text-sm font-medium hover:bg-emerald-100 transition-colors">
                    <Download className="h-4 w-4" /> دانلود فایل
                  </a>
                )}
              </section>

              {/* Interaction Toolbar */}
              <InteractionToolbar
                videoId={id}
                initialLiked={userInteraction.liked}
                initialBookmarked={userInteraction.bookmarked}
                likesCount={video.likes_count || 0}
                commentsCount={video.comments_count || 0}
              />

              {/* Comments Section */}
              <section className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-emerald-600" />
                    <h3 className="font-rokh-bold font-bold text-lg text-foreground">بحث و تدبّر ({comments.length})</h3>
                  </div>
                  {authUser && (
                    <button
                      onClick={() => setShowComments(!showComments)}
                      className="text-xs font-medium text-emerald-600 hover:underline"
                    >
                      {showComments ? "مخفی کردن" : "نمایش نظرات"}
                    </button>
                  )}
                </div>

                {showComments && (
                  <div className="space-y-4">
                    {/* Comment Input */}
                    <div className="rounded-2xl border border-border bg-card p-4 shadow-xs">
                      {replyTo && (
                        <div className="flex items-start gap-3 mb-3 p-3 rounded-xl bg-emerald-50 border border-emerald-100">
                          <div className="h-8 w-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 text-xs font-bold">
                            {replyTo.author_name.charAt(0)}
                          </div>
                          <div className="flex-1">
                            <p className="text-xs text-muted-foreground leading-relaxed">{replyTo.content}</p>
                            <button
                              onClick={() => setReplyTo(null)}
                              className="mt-1 text-xs text-emerald-600 hover:underline font-medium"
                            >
                              پاسخ به این نظر را لغو کنید
                            </button>
                          </div>
                        </div>
                      )}
                      <form onSubmit={handleComment} className="space-y-3">
                        <textarea
                          value={commentText}
                          onChange={(e) => setCommentText(e.target.value)}
                          placeholder={replyTo ? "پاسخ به این نظر..." : "نظر یا تدبّر خود را بنویسید..."}
                          rows={3}
                          className="w-full px-3 py-2.5 rounded-xl bg-background border border-input text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/30 resize-none"
                        />
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">
                            نظرات پس از بررسی مدیران منتشر می‌شوند
                          </span>
                          <button
                            type="submit"
                            disabled={submittingComment || !commentText.trim()}
                            className="px-5 py-2 rounded-xl bg-quranic-emerald text-white text-sm font-bold disabled:opacity-50 hover:opacity-90 transition-colors"
                          >
                            {submittingComment ? "ثبت..." : "ارسال نظر"}
                          </button>
                        </div>
                      </form>
                    </div>

                    {/* Comment List */}
                    <div className="space-y-3">
                      {comments.map((comment) => (
                        <CommentThread
                          key={comment.id}
                          comment={comment}
                          videoId={id}
                          currentUser={authUser}
                          onLike={() => {}}
                          onReply={() => setReplyTo(comment)}
                        />
                      ))}
                      {comments.length === 0 && (
                        <div className="text-center py-8 text-muted-foreground">
                          <p>هیچ نظری هنوز ثبت نشده است. اولین نظر شما باشد.</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </section>
            </div>

            {/* Right Sidebar: Related + Info */}
            <div className="lg:col-span-4 space-y-6">
              {/* Related Videos */}
              <section className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <div className="h-5 w-5 rounded-full bg-turquoise-500/20 flex items-center justify-center text-turquoise-600">
                    <PlayCircle className="h-2.5 w-2.5" />
                  </div>
                  <h3 className="font-rokh-bold font-bold text-sm text-foreground">متناسب با این تلاوت</h3>
                </div>
                <RelatedVideos videoId={id} category={video.category || "recitation"} limit={6} />
              </section>

              {/* Audio-only tip */}
              <section className="rounded-2xl border border-emerald-100 bg-emerald-50 p-5">
                <div className="flex items-start gap-3">
                  <div className="shrink-0 h-8 w-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                    <Headphones className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="font-rokh-bold font-bold text-sm text-emerald-900 mb-1">حالت صوتی</div>
                    <p className="text-xs text-emerald-700 leading-relaxed">
                      برای تمرکز بیشتر بر کلام وحی، می‌توانید ویدیو را غیرفعال کرده و تنها صدا را گوش دهید.
                    </p>
                  </div>
                </div>
              </section>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MetaItem({ label, value, icon: Icon }) {
  return (
    <div className="space-y-1">
      <div className="flex items-center gap-1 text-xs text-muted-foreground font-ui">
        {Icon}
        <span>{label}</span>
      </div>
      <div className="font-rokh-bold font-semibold text-sm text-foreground">{value}</div>
    </div>
  );
}

function CommentThread({ comment, videoId, currentUser, onLike, onReply }) {
  const [replies, setReplies] = useState([]);
  const [showReplies, setShowReplies] = useState(false);
  const [likeState, setLikeState] = useState(false);

  useEffect(() => {
    if (comment.parent_id) return;
    api.entities.Comment.filter({ parent_id: comment.id, status: "published" }, "-created_date", 20)
      .then(setReplies)
      .catch(() => {});
  }, [comment.id]);

  return (
    <div className="flex gap-3">
      <div className="shrink-0 h-9 w-9 rounded-full bg-muted/50 flex items-center justify-center text-muted-foreground/60 text-xs font-bold border border-border/50">
        {comment.author_name.charAt(0)}
      </div>
      <div className="flex-1 space-y-1">
        <div className="flex items-center gap-2">
          <span className="font-rokh-bold font-semibold text-sm text-foreground">{comment.author_name}</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-border/50 text-muted-foreground border border-border/30">
            {new Date(comment.created_date).toLocaleDateString("fa-IR")}
          </span>
          {comment.status === "pending_review" && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-500/10 text-amber-700 border border-amber-500/20">
              در انتظار بررسی
            </span>
          )}
        </div>
        <p className="text-sm text-foreground/90 leading-relaxed whitespace-pre-line">{comment.content}</p>
        <div className="flex items-center gap-3 pt-2">
          <button
            onClick={() => setLikeState(!likeState)}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-emerald-600 transition-colors font-medium"
          >
            <ThumbsUp className={`h-3 w-3 ${likeState ? 'text-emerald-600 fill-current' : ''}`} />
            <span>{fa(comment.likes_count || 0)}</span>
          </button>
          <button
            onClick={() => onReply(comment)}
            className="text-xs text-muted-foreground hover:text-emerald-600 transition-colors font-medium"
          >
            پاسخ
          </button>
        </div>
      </div>
    </div>
  );
}
