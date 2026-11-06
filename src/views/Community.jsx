'use client';
import { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { togglePostLike } from "@/lib/social";
import { toast } from "react-hot-toast";
import PullToRefresh from "@/components/PullToRefresh";
import PostCard from "@/components/community/PostCard";
import CreatePost from "@/components/community/CreatePost";
import ActivePrizeStrip from "@/components/community/ActivePrizeStrip";
import VerseCardStudio from "@/components/cards/VerseCardStudio";
import { Avatar } from "@/components/community/shared";
import {
  Plus, Loader2, Sparkles, Trophy, Palette, BookOpen,
  HelpCircle, Video, Compass,
} from "lucide-react";

const CHIPS = [
  { id: "all", label: "همه", icon: Sparkles },
  { id: "tadabbur", label: "تدبّر", icon: Sparkles, match: (p) => p.type === "reflection" || (p.tags || []).includes("تدبّر") },
  { id: "recitation", label: "تلاوت", icon: Video, match: (p) => (p.tags || []).includes("تلاوت") || p.type === "video" },
  { id: "tafsir", label: "تفسیر", icon: Compass, match: (p) => (p.tags || []).includes("تفسیر") },
  { id: "verses", label: "آیات", icon: BookOpen, match: (p) => Boolean(p.verse_key) || p.type === "verse_share" },
  { id: "questions", label: "پرسش‌ها", icon: HelpCircle, match: (p) => p.type === "question" },
];

export default function Community() {
  const { user: authUser, openAuthModal } = useAuth();
  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [showStudio, setShowStudio] = useState(false);
  const [selectedChip, setSelectedChip] = useState("all");

  const currentUser = authUser || user;

  useEffect(() => {
    if (!authUser) {
      base44.auth.me().then(setUser).catch(() => {});
    }
  }, [authUser]);

  useEffect(() => {
    loadPosts();
  }, []);

  const loadPosts = async () => {
    setLoading(true);
    try {
      setPosts(await base44.entities.Post.list("-created_date", 60));
    } catch {}
    setLoading(false);
  };

  const handleOpenCreate = () => {
    if (currentUser) {
      setShowCreate(true);
    } else {
      openAuthModal((loggedIn) => {
        setUser(loggedIn);
        setShowCreate(true);
      });
    }
  };

  const handleOpenStudio = () => {
    if (currentUser) {
      setShowStudio(true);
    } else {
      openAuthModal((loggedIn) => {
        setUser(loggedIn);
        setShowStudio(true);
      });
    }
  };

  const handleLike = async (post) => {
    if (!currentUser) {
      openAuthModal((loggedIn) => {
        setUser(loggedIn);
      });
      return;
    }
    const likedBy = post.liked_by || [];
    const isLiked = likedBy.includes(currentUser.id);
    const newLikedBy = isLiked ? likedBy.filter((id) => id !== currentUser.id) : [...likedBy, currentUser.id];
    // Optimistic: update immediately, revert if the API call fails
    setPosts((prev) =>
      prev.map((p) =>
        p.id === post.id ? { ...p, liked_by: newLikedBy, likes_count: newLikedBy.length } : p
      )
    );
    try {
      await togglePostLike(post, currentUser);
    } catch {
      setPosts((prev) => prev.map((p) => (p.id === post.id ? post : p)));
      toast.error("ثبت لایک ناموفق بود. دوباره تلاش کنید.");
    }
  };

  const handleDelete = async (post) => {
    if (!currentUser || post.author_id !== currentUser.id) return;
    if (!window.confirm("آیا از حذف این پست مطمئن هستید؟")) return;
    try {
      await base44.entities.Post.delete(post.id);
      setPosts((prev) => prev.filter((p) => p.id !== post.id));
      toast.success("پست با موفقیت حذف شد");
    } catch {
      toast.error("خطا در حذف پست");
    }
  };

  const filteredPosts = useMemo(() => {
    const chipConfig = CHIPS.find((c) => c.id === selectedChip);
    if (!chipConfig || !chipConfig.match) return posts;
    return posts.filter(chipConfig.match);
  }, [posts, selectedChip]);

  return (
    <PullToRefresh onRefresh={loadPosts}>
      <div className="mx-auto max-w-[500px] px-3 pb-8 pt-2 sm:px-0 sm:py-6 animate-fade-in font-yekan">
        {/* Compact & Clean Page Header */}
        <div className="mb-4 flex items-center justify-between gap-3 px-1 pt-1">
          <div>
            <h1 className="font-kalameh font-bold text-2xl text-foreground tracking-tight">
              جامعه قرآنی
            </h1>
            <p className="font-yekan text-xs text-muted-foreground mt-0.5">
              آیه، تلاوت و تجربیات معنوی اهل تدبّر
            </p>
          </div>
          <Link
            to="/competitions"
            className="flex shrink-0 items-center gap-1.5 rounded-full border border-accent/20 bg-accent/10 px-3.5 py-1.5 font-ui text-xs font-bold text-accent transition-all hover:bg-accent/20 hover:scale-[1.02]"
          >
            <Trophy className="h-3.5 w-3.5 text-accent" />
            <span>مسابقات</span>
          </Link>
        </div>

        {/* Active Competitions / Prizes */}
        <ActivePrizeStrip />

        {/* Quick Create Prompt Bar */}
        <div className="mb-4 rounded-2xl border border-border/70 bg-card p-3.5 shadow-soft transition-all hover:border-primary/40">
          <button
            onClick={handleOpenCreate}
            className="flex w-full items-center gap-3 text-right group"
          >
            <Avatar
              name={currentUser?.full_name || currentUser?.phone || "کاربر"}
              size={38}
              avatar={currentUser?.avatar || currentUser?.avatar_url}
              className="ring-2 ring-primary/20"
            />
            <span className="flex-1 text-xs sm:text-sm text-muted-foreground group-hover:text-foreground transition-colors font-medium">
              آیه، تدبّر یا نکته‌ای قرآنی به اشتراک بگذارید...
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent/10 text-accent group-hover:bg-accent group-hover:text-accent-foreground transition-colors">
              <Plus className="h-4 w-4" />
            </div>
          </button>

          {/* Quick Actions Row */}
          <div className="mt-3 flex items-center gap-2 border-t border-border/50 pt-2.5">
            <button
              onClick={handleOpenStudio}
              className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-accent/10 py-1.5 text-xs font-semibold text-accent transition-colors hover:bg-accent/20 font-ui"
            >
              <Palette className="h-3.5 w-3.5" />
              <span>ساخت کارت آیه</span>
            </button>
            <button
              onClick={handleOpenCreate}
              className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-secondary/80 py-1.5 text-xs font-semibold text-foreground transition-colors hover:bg-secondary font-ui"
            >
              <Sparkles className="h-3.5 w-3.5 text-accent" />
              <span>ثبت تدبّر</span>
            </button>
          </div>
        </div>

        {/* Filter Chips Bar */}
        <div className="mb-4 flex items-center gap-2 overflow-x-auto no-scrollbar py-1 px-0.5">
          {CHIPS.map((chip) => {
            const isSelected = selectedChip === chip.id;
            const Icon = chip.icon;
            return (
              <button
                key={chip.id}
                onClick={() => setSelectedChip(chip.id)}
                className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold font-ui transition-all ${
                  isSelected
                    ? "bg-primary text-primary-foreground shadow-xs scale-[1.02]"
                    : "bg-card border border-border/70 text-muted-foreground hover:border-primary/40 hover:text-foreground"
                }`}
              >
                <Icon className="h-3 w-3" />
                <span>{chip.label}</span>
              </button>
            );
          })}
        </div>

        {/* Feed List */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-accent" />
            <p className="text-xs text-muted-foreground">در حال بارگذاری مطالب جامعه قرآنی...</p>
          </div>
        ) : filteredPosts.length > 0 ? (
          <div className="space-y-4">
            {filteredPosts.map((p) => (
              <PostCard
                key={p.id}
                post={p}
                currentUser={currentUser}
                onLike={handleLike}
                onDelete={handleDelete}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-border/70 bg-card/50 p-10 text-center animate-fade-in">
            <Sparkles className="h-8 w-8 text-accent/50 mx-auto mb-3" />
            <p className="text-sm font-semibold text-foreground mb-1">
              {selectedChip === "all"
                ? "هنوز پستی منتشر نشده است"
                : "در این دسته‌بندی پستی یافت نشد"}
            </p>
            <p className="text-xs text-muted-foreground mb-4">
              نخستین نفری باشید که در این بخش تدبّر یا آیه‌ای به اشتراک می‌گذارد!
            </p>
            <button
              onClick={handleOpenCreate}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-accent text-accent-foreground text-xs font-bold hover:shadow-soft transition-all"
            >
              <Plus className="h-4 w-4" />
              <span>ارسال پست جدید</span>
            </button>
          </div>
        )}

        {/* Create Post Modal */}
        {showCreate && currentUser && (
          <CreatePost
            user={currentUser}
            onClose={() => setShowCreate(false)}
            onPosted={() => {
              setShowCreate(false);
              loadPosts();
            }}
          />
        )}

        {/* Verse Card Studio Modal */}
        {showStudio && currentUser && (
          <VerseCardStudio
            user={currentUser}
            onClose={() => setShowStudio(false)}
            onPosted={() => {
              setShowStudio(false);
              loadPosts();
            }}
          />
        )}
      </div>
    </PullToRefresh>
  );
}
