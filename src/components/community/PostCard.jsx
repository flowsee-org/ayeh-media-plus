import { useState, useRef } from "react";
import { Link } from "react-router-dom";
import api from "@/lib/api";
import { Image } from "@/components/ui/image";
import {
  Heart, MessageCircle, Send, BookOpen, Video, Image as ImageIcon,
  HelpCircle, Sparkles, Trash2, Loader2, Bookmark, MoreHorizontal,
  Play, Pause, Copy, ExternalLink,
} from "lucide-react";
import { toast } from "react-hot-toast";
import { getSavedPosts, toggleSavedPost } from "@/lib/readingTracker";
import { Avatar, timeAgo, POST_TYPE_LABELS } from "./shared";
import { trackEngagement } from "@/lib/engagement";
import CommentSection from "./CommentSection";
import { useAudioPlayer } from "@/context/AudioPlayerContext";
import { getAudioUrl } from "@/lib/quranApi";
import { getSurahByNumber } from "@/lib/surahData";

const TYPE_ICONS = {
  reflection: Sparkles,
  verse_share: BookOpen,
  image: ImageIcon,
  video: Video,
  question: HelpCircle,
};

const fa = (n) => (n || 0).toLocaleString("fa-IR");

/**
 * Modern Hybrid PostCard (Threads/X style with refined Quranic identity)
 */
export default function PostCard({ post, currentUser, onLike, onDelete }) {
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [commentCount, setCommentCount] = useState(post.comments_count || 0);
  const [liking, setLiking] = useState(false);
  const [savedPost, setSavedPost] = useState(() => getSavedPosts().includes(post.id));
  const [showMenu, setShowMenu] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [heartPop, setHeartPop] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  const lastTapRef = useRef(0);
  const heartTimerRef = useRef(null);

  // Audio integration
  const { playTrack, track: currentTrack, isPlaying, togglePlay } = useAudioPlayer();

  const isLiked = (post.liked_by || []).includes(currentUser?.id);
  const isOwn = post.author_id === currentUser?.id;
  const TypeIcon = TYPE_ICONS[post.type] || Sparkles;

  // Surah parsing if verse_key is present
  const verseInfo = (() => {
    if (!post.verse_key) return null;
    const parts = post.verse_key.split(":").map(Number);
    if (parts.length !== 2 || isNaN(parts[0]) || isNaN(parts[1])) return null;
    const [surahNum, ayahNum] = parts;
    const meta = getSurahByNumber(surahNum);
    return {
      surahNum,
      ayahNum,
      surahName: meta ? meta.persianName : `سوره ${surahNum}`,
      arabicName: meta ? meta.name : "",
      audioUrl: post.audio_url || getAudioUrl(surahNum, ayahNum),
    };
  })();

  const isThisVersePlaying =
    isPlaying && currentTrack?.verseKey === post.verse_key;

  const handleToggleAudio = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!verseInfo) return;

    trackEngagement("audio_play");
    if (currentTrack?.verseKey === post.verse_key) {
      togglePlay();
    } else {
      playTrack({
        id: `verse-${verseInfo.surahNum}-${verseInfo.ayahNum}`,
        title: `سوره ${verseInfo.surahName} — آیه ${fa(verseInfo.ayahNum)}`,
        subtitle: "تلاوت ترتیل • مشاری العفاسی",
        audioUrl: verseInfo.audioUrl,
        type: "quran",
        verseKey: post.verse_key,
        reciter: "مشاری العفاسی",
      });
    }
  };

  const handleSave = () => {
    const isNowSaved = toggleSavedPost(post.id);
    setSavedPost(isNowSaved);
    toast.success(isNowSaved ? "پست به نشان‌شده‌ها اضافه شد" : "پست از نشان‌شده‌ها حذف شد");
  };

  const handleShare = async () => {
    const url = `${window.location.origin}/community/${post.id}`;
    const text = `${post.author_name} در آیه پلاس:\n${post.content || ""}\n${url}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: post.author_name, text, url });
        return;
      } catch {}
    }
    if (navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(url);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
        toast.success("پیوند پست رونوشت شد");
      } catch {
        toast.error("امکان کپی در این مرورگر فراهم نشد");
      }
    }
  };

  const triggerHeartBurst = () => {
    setHeartPop(true);
    if (heartTimerRef.current) clearTimeout(heartTimerRef.current);
    heartTimerRef.current = setTimeout(() => {
      setHeartPop(false);
    }, 850);
  };

  const handleDoubleTap = () => {
    const now = Date.now();
    if (now - lastTapRef.current < 300) {
      triggerHeartBurst();
      if (!isLiked) {
        handleLike();
      }
    }
    lastTapRef.current = now;
  };

  const toggleComments = async () => {
    if (!showComments) {
      setLoadingComments(true);
      try {
        const c = await api.entities.Comment.filter({ post_id: post.id }, "-created_date", 50);
        setComments(c);
      } catch {}
      setLoadingComments(false);
    }
    setShowComments(!showComments);
  };

  const handleLike = async () => {
    if (!currentUser) {
      toast.error("برای پسندیدن پست، ابتدا وارد حساب کاربری خود شوید");
      return;
    }
    if (liking) return;
    setLiking(true);
    if (!isLiked) trackEngagement("social");
    await onLike(post);
    setLiking(false);
  };

  const isLongText = (post.content || "").length > 220;
  const displayContent = isExpanded || !isLongText
    ? post.content
    : (post.content || "").slice(0, 220) + "...";

  return (
    <article className="relative overflow-hidden rounded-2xl border border-border/70 bg-card/95 backdrop-blur-sm shadow-soft transition-all duration-300 hover:border-primary/40 hover:shadow-card-hover group mb-4">
      {/* Author Header */}
      <div className="flex items-center justify-between gap-3 px-4 py-3.5 border-b border-border/40">
        <div className="flex items-center gap-3 min-w-0">
          <Avatar name={post.author_name} size={40} avatar={post.author_avatar} className="ring-2 ring-border/50 ring-offset-1" />
          <div className="min-w-0 flex-1 leading-snug">
            <div className="flex items-center gap-2">
              <span className="truncate text-sm font-bold text-foreground font-kalameh tracking-wide">
                {post.author_name}
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-secondary/80 px-2 py-0.5 text-xs font-medium text-accent border border-border/40">
                <TypeIcon className="h-2.5 w-2.5 text-accent" />
                {POST_TYPE_LABELS[post.type] || "پست"}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5 font-yekan">
              <span>{timeAgo(post.created_date)}</span>
            </div>
          </div>
        </div>

        {/* Menu & Actions */}
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            aria-label="گزینه‌ها"
          >
            <MoreHorizontal className="h-4 w-4" />
          </button>

          {showMenu && (
            <>
              <div className="fixed inset-0 z-30" onClick={() => setShowMenu(false)} />
              <div className="absolute left-0 top-9 z-40 w-44 rounded-xl border border-border bg-popover/95 p-1.5 shadow-lg backdrop-blur-md animate-scale-in font-ui text-xs">
                <button
                  onClick={() => {
                    handleShare();
                    setShowMenu(false);
                  }}
                  className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-foreground transition-colors hover:bg-secondary"
                >
                  <Copy className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>رونوشت پیوند</span>
                </button>

                <Link
                  to={`/community/${post.id}`}
                  className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-foreground transition-colors hover:bg-secondary"
                  onClick={() => setShowMenu(false)}
                >
                  <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>مشاهده صفحه پست</span>
                </Link>

                {isOwn && onDelete && (
                  <button
                    onClick={() => {
                      setShowMenu(false);
                      onDelete(post);
                    }}
                    className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-destructive transition-colors hover:bg-destructive/10"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>حذف پست</span>
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Media or Visual Content */}
      <div className="relative select-none" onDoubleClick={handleDoubleTap}>
        {/* Heart Pop Animation Overlay */}
        {heartPop && (
          <div className="absolute inset-0 z-30 flex items-center justify-center pointer-events-none animate-scale-in">
            <div className="rounded-full bg-background/60 p-5 backdrop-blur-md shadow-2xl border border-white/20">
              <Heart className="h-16 w-16 fill-red-500 text-red-500 drop-shadow-md animate-bounce" />
            </div>
          </div>
        )}

        {post.type === "video" && post.video_url ? (
          <div className="relative overflow-hidden bg-black/90">
            <video
              src={post.video_url}
              controls
              poster={post.image_url}
              preload="metadata"
              playsInline
              className="w-full max-h-[520px] object-contain"
            />
          </div>
        ) : post.image_url ? (
          <div className="relative overflow-hidden bg-muted/20">
            <Link to={`/community/${post.id}`} className="block">
              <Image
                src={post.image_url}
                fittingType="cover"
                className="max-h-[520px] w-full object-cover transition-transform duration-500 hover:scale-[1.01]"
              />
            </Link>
          </div>
        ) : null}

        {/* Quranic Verse Embed (Islamic Arch Frame) */}
        {post.verse_key && (
          <div className="p-3.5 sm:p-4">
            <div className="relative overflow-hidden rounded-2xl border border-primary/25 bg-gradient-to-b from-card via-primary/5 to-secondary/30 p-4 sm:p-5 shadow-sm transition-all hover:border-primary/45 group/verse">
              {/* Top Header of Verse: Surah Name Badge + Audio Recitation Button */}
              <div className="flex items-center justify-between gap-2 border-b border-border/50 pb-3">
                <Link
                  to={`/verse/${post.verse_key.replace(":", "/")}`}
                  className="inline-flex items-center gap-1.5 rounded-full bg-background/80 px-3 py-1 font-kalameh text-xs font-bold text-foreground border border-border shadow-xs hover:border-accent transition-colors"
                >
                  <BookOpen className="h-3.5 w-3.5 text-accent" />
                  <span>
                    {verseInfo ? `سوره ${verseInfo.surahName} • آیه ${fa(verseInfo.ayahNum)}` : `آیه شریفه ${post.verse_key}`}
                  </span>
                </Link>

                {/* Recitation Play/Pause Button */}
                {verseInfo && (
                  <button
                    onClick={handleToggleAudio}
                    className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold font-ui transition-all shadow-xs ${
                      isThisVersePlaying
                        ? "bg-accent text-accent-foreground ring-2 ring-accent/30 animate-pulse"
                        : "bg-secondary text-primary hover:bg-accent/15 hover:text-accent border border-border/60"
                    }`}
                    title={isThisVersePlaying ? "توقف صوت تلاوت" : "پخش تلاوت آیه"}
                  >
                    {isThisVersePlaying ? (
                      <>
                        <Pause className="h-3.5 w-3.5 fill-current" />
                        <span className="hidden sm:inline">در حال پخش</span>
                      </>
                    ) : (
                      <>
                        <Play className="h-3.5 w-3.5 fill-current ml-0.5" />
                        <span>تلاوت آیه</span>
                      </>
                    )}
                  </button>
                )}
              </div>

              {/* Arabic Calligraphy */}
              {post.verse_arabic && (
                <div
                  className="my-3 font-arabic text-xl sm:text-2xl leading-[2.4] text-foreground text-center font-bold tracking-wide"
                  dir="rtl"
                  lang="ar"
                >
                  {post.verse_arabic}
                </div>
              )}

              {/* Persian Translation */}
              {post.verse_text && (
                <p className="font-yekan text-xs sm:text-sm leading-relaxed text-muted-foreground/90 text-center font-medium mt-1">
                  «{post.verse_text}»
                </p>
              )}

              {/* Link to Verse Details */}
              <div className="mt-3.5 flex justify-end">
                <Link
                  to={`/verse/${post.verse_key.replace(":", "/")}`}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-accent hover:underline font-ui"
                >
                  <span>مشاهده تفسیر و تدبر کامل</span>
                  <ExternalLink className="h-3 w-3" />
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Action Row */}
      <div className="flex items-center justify-between px-3 pt-2.5">
        <div className="flex items-center gap-1">
          {/* Like Button */}
          <button
            onClick={handleLike}
            disabled={liking}
            className={`flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-full transition-transform active:scale-80 ${
              isLiked ? "text-red-500" : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
            }`}
            aria-label={isLiked ? "حذف لایک" : "پسندیدن"}
          >
            <Heart
              className={`h-[22px] w-[22px] transition-all ${
                isLiked ? "fill-current scale-110 drop-shadow-sm" : ""
              } ${liking ? "animate-pulse" : ""}`}
            />
          </button>

          {/* Comment Button */}
          <button
            onClick={toggleComments}
            className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-full text-muted-foreground transition-colors hover:text-foreground hover:bg-secondary/60"
            aria-label="نظرات"
          >
            <MessageCircle className="h-[21px] w-[21px]" />
          </button>

          {/* Share Button */}
          <button
            onClick={handleShare}
            className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-full text-muted-foreground transition-colors hover:text-foreground hover:bg-secondary/60"
            aria-label="اشتراک‌گذاری"
          >
            <Send className="h-[20px] w-[20px]" />
          </button>
        </div>

        {/* Bookmark Button */}
        <button
          onClick={handleSave}
          className={`flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-full transition-colors ${
            savedPost ? "text-accent" : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
          }`}
          aria-label={savedPost ? "حذف از نشان‌ها" : "ذخیره"}
        >
          <Bookmark className={`h-[21px] w-[21px] ${savedPost ? "fill-current" : ""}`} />
        </button>
      </div>

      {/* Likes Count */}
      <div className="px-4 pb-1 text-xs sm:text-[13px] font-bold text-foreground font-yekan">
        {post.likes_count > 0 ? `${fa(post.likes_count)} پسند` : "اولین نفری باشید که می‌پسندید"}
      </div>

      {/* Caption Content */}
      {post.content && (
        <div className="px-4 pb-2 text-xs sm:text-sm leading-[2] text-foreground/95 font-yekan">
          <Link to={`/community/${post.id}`} className="ml-1.5 font-bold font-kalameh text-foreground hover:underline">
            {post.author_name}
          </Link>
          <span className="whitespace-pre-line">{displayContent}</span>
          {isLongText && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="mr-1.5 font-bold text-xs text-accent hover:underline inline-block"
            >
              {isExpanded ? "بستن" : "بیشتر..."}
            </button>
          )}
        </div>
      )}

      {/* Tags */}
      {post.tags?.length > 0 && (
        <div className="flex flex-wrap gap-1.5 px-4 pb-2">
          {post.tags.map((t) => (
            <span
              key={t}
              className="inline-block rounded-md bg-secondary/60 px-2 py-0.5 text-xs font-medium text-accent border border-border/30 font-ui"
            >
              #{t}
            </span>
          ))}
        </div>
      )}

      {/* Comments Count / Toggle */}
      <div className="px-4 pb-3 pt-0.5">
        <button
          onClick={toggleComments}
          className="text-xs sm:text-[13px] text-muted-foreground hover:text-foreground transition-colors font-yekan"
        >
          {showComments ? "بستن نظرات" : commentCount > 0 ? `مشاهده هر ${fa(commentCount)} نظر` : "ثبت اولین نظر..."}
        </button>
      </div>

      {/* Inline Comments Drawer */}
      {showComments && (
        <div className="border-t border-border/50 bg-secondary/15 pt-2">
          {loadingComments ? (
            <div className="flex justify-center py-6">
              <Loader2 className="h-5 w-5 animate-spin text-accent" />
            </div>
          ) : (
            <>
              <CommentSection
                postId={post.id}
                post={post}
                currentUser={currentUser}
                comments={comments}
                onCountChange={setCommentCount}
              />
              <div className="px-3 pb-3 text-center">
                <Link to={`/community/${post.id}`} className="text-xs text-accent hover:underline font-ui font-medium">
                  مشاهده صفحه کامل پست و تمام گفتگوها ←
                </Link>
              </div>
            </>
          )}
        </div>
      )}
    </article>
  );
}
