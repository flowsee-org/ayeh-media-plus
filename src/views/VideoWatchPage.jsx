'use client';

import { useEffect, useState, useCallback, useRef } from "react";
import Hls from 'hls.js';
import { useParams } from "next/navigation";
import Link from "next/link";
import api from "@/lib/api";
import { useAuth } from "@/lib/AuthContext";
import { toast } from "react-hot-toast";
import { fa } from "@/lib/utils";
import { recordWatch } from "@/lib/watchHistory";
import {
  Play, Pause, Volume2, VolumeX, Maximize, Minimize,
  Clock, BookOpen, ThumbsUp, Headphones, Layout,
  Trophy, Users, Download, Eye, RotateCcw, RotateCw,
} from "lucide-react";
import BackButton from "@/components/BackButton";
import RelatedVideos from "@/components/video/RelatedVideos";
import InteractionToolbar from "@/components/ui/interaction-toolbar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function VideoWatchPage() {
  const { id } = useParams();
  const { user: authUser, openAuthModal } = useAuth();

  const [video, setVideo] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isAudioOnly, setIsAudioOnly] = useState(false);
  const [theaterMode, setTheaterMode] = useState(false);
  const [activeAyah, setActiveAyah] = useState(null);
  const [showComments, setShowComments] = useState(true);
  const [userInteraction, setUserInteraction] = useState({
    liked: false,
    bookmarked: false,
  });
  const [commentText, setCommentText] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);
  const [replyTo, setReplyTo] = useState(null);
  const [descriptionExpanded, setDescriptionExpanded] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const videoRef = useRef(null);
  const containerRef = useRef(null);
  const hlsRef = useRef(null);
  const lastReportedTimeRef = useRef(-1);
  const [selectedQuality, setSelectedQuality] = useState(null);
  const [availableQualities, setAvailableQualities] = useState([]);
  const [playbackRate, setPlaybackRate] = useState(1);

  useEffect(() => {
    loadVideo();
  }, [id]);

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

  const initHls = useCallback((hlsUrl) => {
    cleanupHls();
    if (!Hls.isSupported()) {
      if (videoRef.current) videoRef.current.src = hlsUrl;
      return;
    }
    const hls = new Hls();
    hlsRef.current = hls;
    hls.loadSource(hlsUrl);
    hls.attachMedia(videoRef.current);
    hls.on(Hls.Events.MANIFEST_PARSED, () => {
      const levels = hls.levels;
      if (levels?.length > 0) {
        const qualityNames = levels.map((l, i) => ({
          name: l.height ? `${l.height}p` : 'auto',
          level: i,
        }));
        setAvailableQualities(qualityNames);
        setSelectedQuality(qualityNames[0]?.name || null);
      }
    });
    hls.on(Hls.Events.ERROR, (event, data) => {
      console.error("HLS Error:", data);
      setError("خطا در بارگذاری جریان ویدیو (HLS). لطفاً منبع ویدیو را بررسی کنید.");
      setIsPlaying(false);
    });
  }, [cleanupHls]);

  const loadVideo = async () => {
    try {
      setLoading(true);
      const [vid, cmts] = await Promise.all([
        api.entities.Video.get(id),
        api.entities.Comment.filter({ video_id: id, status: "published" }, "-created_date", 50),
      ]);

      setVideo(vid);
      setComments(cmts || []);

      if (vid.hls_url && vid.qualities) {
        const qualities = typeof vid.qualities === 'string' ? JSON.parse(vid.qualities) : vid.qualities;
        setAvailableQualities(qualities);
        setSelectedQuality(qualities[0]?.name || qualities[0] || null);
        initHls(vid.hls_url);
      } else if (vid.hls_url) {
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
    const t = videoRef.current.currentTime;
    const d = videoRef.current.duration || 0;
    setCurrentTime(t);
    setDuration(d);
    const currentInterval = Math.floor(t / 30);
    if (currentInterval > lastReportedTimeRef.current) {
      lastReportedTimeRef.current = currentInterval;
      api.entities.Video.update(id, {
        views_count: (video.views_count || 0) + 1,
      }).catch(() => {});
      const completion = d > 0 ? Math.round((t / d) * 100) : 0;
      try {
        recordWatch({
          video_id: id,
          title: video.title || "",
          thumbnail_url: video.thumbnail_url || null,
          watch_seconds: 30,
          completion_percentage: completion,
        });
      } catch {}
    }
  }, [video, id]);

  const setHlsQuality = useCallback((qualityName) => {
    const hls = hlsRef.current;
    if (!hls?.levels) return;
    const levelIndex = hls.levels.findIndex((l) => {
      const name = l.height ? `${l.height}p` : 'auto';
      return name === qualityName;
    });
    if (levelIndex >= 0) {
      hls.currentLevel = levelIndex;
      setSelectedQuality(qualityName);
    }
  }, []);

  useEffect(() => () => cleanupHls(), [cleanupHls]);

  useEffect(() => {
    const onFs = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onFs);
    return () => document.removeEventListener('fullscreenchange', onFs);
  }, []);

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
        status: "published",
      });
      setCommentText("");
      setReplyTo(null);
      toast.success("نظر شما ثبت شد.");
      loadVideo();
    } catch {
      toast.error("خطا در ارسال نظر");
    } finally {
      setSubmittingComment(false);
    }
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
  };

  const formatTime = (seconds) => {
    if (!seconds || Number.isNaN(seconds)) return "0:00";
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const togglePlayPause = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play();
      setIsPlaying(true);
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !videoRef.current.muted;
    setIsMuted(videoRef.current.muted);
  };

  const seekBy = (delta) => {
    if (!videoRef.current) return;
    videoRef.current.currentTime = Math.max(
      0,
      Math.min(videoRef.current.duration || 0, videoRef.current.currentTime + delta)
    );
  };

  const isAparatUrl = (url) => !!url && url.includes("aparat.com");

  const chapters = video?.chapters
    ? (typeof video.chapters === "string" ? JSON.parse(video.chapters) : video.chapters)
    : [];
  const chapterMarkers = chapters.length > 0
    ? chapters
    : (video?.verse_key ? [{ title: "آغاز تلاوت", start_time: 0, verse_key: video.verse_key }] : []);

  const channelName = video?.reciter_name || video?.scholar_name || video?.uploader_name || "کانال آیه پلاس";
  const channelId = video?.reciter_id || video?.scholar_id || video?.uploader_id;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="h-10 w-10 border-4 border-primary/20 border-t-primary rounded animate-spin" />
        <p className="mt-4 text-muted-foreground text-sm font-doran">در حال بارگذاری...</p>
      </div>
    );
  }

  if (error || !video) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-6">
        <BookOpen className="h-12 w-12 text-muted-foreground/30 mb-4" />
        <h2 className="font-rokh-bold font-bold text-xl text-foreground mb-2">{error || "ویدیو یافت نشد"}</h2>
        <Button onClick={loadVideo} className="mt-4 px-6 py-2 rounded bg-primary text-primary-foreground text-sm font-medium font-doran hover:opacity-90">
          تلاش مجدد
        </Button>
      </div>
    );
  }

  const statusConfig = {
    pending_review: { label: "در انتظار بررسی", variant: "warning" },
    verified: { label: "تایید شده", variant: "success" },
    published: { label: "منتشر شده", variant: "success" },
    rejected: { label: "رد شده", variant: "destructive" },
    archived: { label: "بایگانی شده", variant: "secondary" },
  };

  return (
    <div className="watch-page min-h-screen bg-background">
      {/* Compact watch header */}
      <div className="sticky top-0 z-40 border-b border-border bg-card/95 backdrop-blur-md px-3 sm:px-5 h-12 flex items-center gap-3">
        <BackButton />
        <span className="text-sm font-medium text-foreground/80 truncate font-doran">{video.title}</span>
      </div>

      <div className={`mx-auto ${theaterMode ? 'max-w-[1600px]' : 'max-w-[1400px]'} px-0 sm:px-4 lg:px-5 py-0 sm:py-4`}>
        <div className={`grid gap-5 ${theaterMode ? '' : 'lg:grid-cols-12'}`}>
          {/* Main column */}
          <div className={theaterMode ? '' : 'lg:col-span-8 space-y-4'}>
            {/* Player */}
            <div
              ref={containerRef}
              className="relative bg-black aspect-video sm:rounded overflow-hidden group"
            >
              {video.media_url || video.hls_url ? (
                isAparatUrl(video.media_url) ? (
                  <iframe
                    src={video.media_url}
                    className="w-full h-full"
                    title={video.title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                ) : (
                  <video
                    ref={videoRef}
                    src={!video.hls_url ? (video.media_url || undefined) : undefined}
                    className={`w-full h-full ${isAudioOnly ? 'opacity-0' : 'object-contain'}`}
                    playsInline
                    preload="metadata"
                    onTimeUpdate={trackWatchTime}
                    onPlay={() => setIsPlaying(true)}
                    onPause={() => setIsPlaying(false)}
                    onClick={togglePlayPause}
                    onError={(e) => {
                      setError("فایل ویدیو قابل پخش نیست یا منبع معتبری ندارد.");
                      setIsPlaying(false);
                    }}
                  />
                )
              ) : (
                <div className="w-full h-full flex items-center justify-center text-white/60 text-sm">
                  منبع ویدیو موجود نیست
                </div>
              )}

              {isAudioOnly && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-primary/40 to-accent/30 text-white gap-3 pointer-events-none">
                  <Headphones className="h-12 w-12" />
                  <p className="text-sm font-medium">حالت صوتی</p>
                </div>
              )}

              {/* Controls */}
              {!isAparatUrl(video.media_url) && (video.media_url || video.hls_url) && (
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent p-3 sm:p-4 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                  <Input
                    type="range"
                    min="0"
                    max={duration || 100}
                    value={currentTime || 0}
                    className="w-full h-1.5 accent-primary cursor-pointer mb-3"
                    onChange={(e) => {
                      if (videoRef.current) {
                        videoRef.current.currentTime = parseFloat(e.target.value);
                        setCurrentTime(parseFloat(e.target.value));
                      }
                    }}
                  />
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 sm:gap-2">
                      <Button onClick={() => seekBy(-10)} className="p-2 rounded text-white hover:bg-white/15" title="۱۰ ثانیه عقب">
                        <RotateCcw className="h-4 w-4" />
                      </Button>
                      <Button onClick={togglePlayPause} className="h-10 w-10 rounded bg-white text-foreground flex items-center justify-center hover:scale-105 transition-transform">
                        {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 ms-0.5" />}
                      </Button>
                      <Button onClick={() => seekBy(10)} className="p-2 rounded text-white hover:bg-white/15" title="۱۰ ثانیه جلو">
                        <RotateCw className="h-4 w-4" />
                      </Button>
                      <Button onClick={toggleMute} className="p-2 rounded text-white hover:bg-white/15">
                        {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                      </Button>
                      <span className="text-[11px] text-white/80 font-mono tabular-nums hidden sm:inline">
                        {formatTime(currentTime)} / {formatTime(duration)}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Select
                        value={String(playbackRate)}
                        onValueChange={(v) => {
                          const rate = parseFloat(v);
                          setPlaybackRate(rate);
                          if (videoRef.current) videoRef.current.playbackRate = rate;
                        }}
                      >
                        <SelectTrigger className="bg-black/50 border border-white/20 text-white text-[11px] rounded px-2 py-1">
                        <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                        {[0.5, 1, 1.25, 1.5, 2].map((r) => (
                          <SelectItem key={r} value={String(r)}>{r}×</SelectItem>
                        ))}
                        </SelectContent>
                      </Select>
                      {availableQualities.length > 0 && (
                        <Select
                          value={selectedQuality || ''}
                          onValueChange={(v) => setHlsQuality(v)}
                        >
                          <SelectTrigger className="bg-black/50 border border-white/20 text-white text-[11px] rounded px-2 py-1">
                          <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                          {availableQualities.map((q) => {
                            const name = typeof q === 'string' ? q : q.name;
                            return <SelectItem key={name} value={name}>{name}</SelectItem>;
                          })}
                          </SelectContent>
                        </Select>
                      )}
                      <Button
                        onClick={() => setIsAudioOnly((v) => !v)}
                        className="p-2 rounded text-white hover:bg-white/15"
                        title="حالت صوتی"
                      >
                        <Headphones className="h-4 w-4" />
                      </Button>
                      <Button
                        onClick={() => setTheaterMode((v) => !v)}
                        className="p-2 rounded text-white hover:bg-white/15 hidden sm:inline-flex"
                        title="حالت تئاتر"
                      >
                        <Layout className="h-4 w-4" />
                      </Button>
                      <Button onClick={toggleFullscreen} className="p-2 rounded text-white hover:bg-white/15">
                        {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Title + meta (below player — Aparat pattern) */}
            <div className="px-3 sm:px-0 space-y-3">
              <div className="flex flex-wrap gap-2">
                <Badge variant={statusConfig[video.status]?.variant || "secondary"} size="sm" className="text-[11px]">
                  {statusConfig[video.status]?.label}
                </Badge>
                {video.is_live && (
                  <Badge variant="destructive" size="sm" className="text-[11px] font-bold animate-pulse">
                    <span className="h-1.5 w-1.5 rounded bg-white animate-pulse" />
                    زنده
                  </Badge>
                )}
                {video.is_competition && (
                  <Badge variant="quranic" size="sm" className="text-[11px] font-bold border border-primary/20">
                    <Trophy className="h-3 w-3 mr-1" />
                    {video.competition_year || 'مسابقه'}
                  </Badge>
                )}
              </div>

              <h1 className="font-rokh-bold text-lg sm:text-xl lg:text-2xl font-bold leading-snug text-foreground">
                {video.title}
              </h1>

              <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground font-doran">
                <span className="inline-flex items-center gap-1"><Eye className="h-3.5 w-3.5" />{fa(video.views_count || 0)} بازدید</span>
                {video.duration && (
                  <span className="inline-flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{video.duration}</span>
                )}
                {video.verse_key && (
                  <span className="inline-flex items-center gap-1"><BookOpen className="h-3.5 w-3.5" />{video.verse_key}</span>
                )}
              </div>

              {/* Channel row */}
              <div className="flex items-center justify-between gap-3 py-2 border-y border-border">
                <Link
                  href={channelId ? `/profile/${channelId}` : '/scholars'}
                  className="flex items-center gap-3 min-w-0 hover:opacity-90"
                >
                  <div className="h-10 w-10 rounded bg-primary/10 text-primary flex items-center justify-center font-bold border border-primary/20 shrink-0">
                    {channelName.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <div className="font-bold text-sm truncate font-doran">{channelName}</div>
                    <div className="text-[11px] text-muted-foreground font-doran">کانال آیه پلاس</div>
                  </div>
                </Link>
                {video.download_enabled && video.download_url && (
                  <Button
                    variant="outline"
                    size="sm"
                    asChild
                  >
                    <a href={video.download_url} download className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium shrink-0">
                      <Download className="h-3.5 w-3.5" /> دانلود
                    </a>
                  </Button>
                )}
              </div>

              <InteractionToolbar
                videoId={id}
                initialLiked={userInteraction.liked}
                initialBookmarked={userInteraction.bookmarked}
                likesCount={video.likes_count || 0}
                commentsCount={comments.length || video.comments_count || 0}
              />

              {/* Description */}
              {(video.description || (video.tags && video.tags.length > 0)) && (
                <div className="rounded bg-muted/50 p-4">
                  <p className={`text-sm text-foreground/90 leading-relaxed whitespace-pre-line ${descriptionExpanded ? '' : 'line-clamp-3'}`}>
                    {video.description}
                  </p>
                  {video.description && video.description.length > 120 && (
                    <Button
                      variant="link"
                      size="sm"
                      onClick={() => setDescriptionExpanded((v) => !v)}
                      className="mt-2 text-xs font-bold text-primary font-doran"
                    >
                      {descriptionExpanded ? 'بستن' : 'ادامه مطلب'}
                    </Button>
                  )}
                  {video.tags?.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {video.tags.map((tag, i) => (
                        <Badge key={i} variant="secondary" size="sm" className="text-[11px] font-doran">
                          #{tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Chapters */}
              {chapterMarkers.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <BookOpen className="h-4 w-4 text-primary" />
                    <span className="font-bold text-sm font-doran">فصل‌ها</span>
                  </div>
                  <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                    {chapterMarkers.map((chapter, i) => (
                      <Button
                        key={i}
                        variant={activeAyah === chapter.verse_key ? "primary" : "outline"}
                        size="sm"
                        onClick={() => {
                          if (videoRef.current) videoRef.current.currentTime = chapter.start_time || 0;
                          setActiveAyah(chapter.verse_key);
                        }}
                        className="shrink-0 px-3 py-1.5 rounded text-xs font-medium border transition-colors"
                      >
                        {chapter.title}
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              {/* Comments */}
              <section className="space-y-4 pt-2">
                <div className="flex items-center justify-between">
                  <h3 className="font-rokh-bold font-bold text-base inline-flex items-center gap-2">
                    <Users className="h-4 w-4 text-primary" />
                    نظرات ({fa(comments.length)})
                  </h3>
                  <Button onClick={() => setShowComments((v) => !v)} className="text-xs font-medium text-primary font-doran">
                    {showComments ? 'مخفی' : 'نمایش'}
                  </Button>
                </div>

                {showComments && (
                  <div className="space-y-4">
                    <form onSubmit={handleComment} className="rounded border border-border bg-card p-3 space-y-3">
                      {replyTo && (
                        <div className="flex items-start justify-between gap-2 rounded bg-muted p-2.5 text-xs">
                          <p className="text-muted-foreground line-clamp-2 font-doran">پاسخ به: {replyTo.content}</p>
                          <Button type="button" onClick={() => setReplyTo(null)} className="text-primary font-medium font-doran shrink-0">لغو</Button>
                        </div>
                      )}
                      <Textarea
                        value={commentText}
                        onChange={(e) => setCommentText(e.target.value)}
                        placeholder="نظر خود را بنویسید..."
                        rows={3}
                        className="w-full px-3 py-2 rounded bg-background border border-input text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/30"
                      />
                      <div className="flex justify-end">
                        <Button
                          type="submit"
                          disabled={submittingComment || !commentText.trim()}
                          className="px-4 py-2 rounded bg-primary text-primary-foreground text-sm font-bold disabled:opacity-50"
                        >
                          {submittingComment ? '...' : 'ارسال'}
                        </Button>
                      </div>
                    </form>

                    <div className="space-y-3">
                      {comments.map((comment) => (
                        <CommentThread
                          key={comment.id}
                          comment={comment}
                          onReply={() => setReplyTo(comment)}
                        />
                      ))}
                      {comments.length === 0 && (
                        <p className="text-center py-6 text-sm text-muted-foreground font-doran">هنوز نظری ثبت نشده است.</p>
                      )}
                    </div>
                  </div>
                )}
              </section>
            </div>
          </div>

          {/* Related sidebar */}
          {!theaterMode && (
            <aside className="lg:col-span-4 px-3 sm:px-0">
              <h3 className="font-rokh-bold font-bold text-sm mb-3 text-foreground">ویدیوهای مرتبط</h3>
              <RelatedVideos videoId={id} category={video.category || "recitation"} limit={8} />
            </aside>
          )}
        </div>
      </div>
    </div>
  );
}

function CommentThread({ comment, onReply }) {
  const [likeState, setLikeState] = useState(false);

  return (
    <div className="flex gap-3">
      <div className="shrink-0 h-9 w-9 rounded bg-muted flex items-center justify-center text-muted-foreground text-xs font-bold font-doran border border-border">
        {(comment.author_name || 'ک').charAt(0)}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-semibold text-sm font-doran">{comment.author_name}</span>
          <span className="text-[10px] text-muted-foreground font-doran">
            {comment.created_date ? new Date(comment.created_date).toLocaleDateString("fa-IR") : ''}
          </span>
        </div>
        <p className="text-sm text-foreground/90 leading-relaxed whitespace-pre-line mt-1 font-doran">{comment.content}</p>
        <div className="flex items-center gap-3 pt-1.5">
          <Button
            onClick={() => setLikeState(!likeState)}
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary"
          >
            <ThumbsUp className={`h-3 w-3 ${likeState ? 'text-primary fill-current' : ''}`} />
            {fa(comment.likes_count || 0)}
          </Button>
          <Button onClick={() => onReply(comment)} className="text-xs text-muted-foreground hover:text-primary font-medium">
            پاسخ
          </Button>
        </div>
      </div>
    </div>
  );
}
