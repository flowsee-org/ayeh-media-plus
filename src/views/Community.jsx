'use client';
import { useEffect, useState, useMemo } from "react";
import { Link } from "@/lib/router-compat";
import api from "@/lib/api";
import { useAuth } from "@/lib/AuthContext";
import { isScholarUser } from "@/lib/scholarAccess";
import { togglePostLike } from "@/lib/social";
import { toast } from "react-hot-toast";
import PullToRefresh from "@/components/PullToRefresh";
import PostCard from "@/components/community/PostCard";
import CreatePost from "@/components/community/CreatePost";
import ActivePrizeStrip from "@/components/community/ActivePrizeStrip";
import { Avatar } from "@/components/community/shared";
import EmptyState from "@/components/design-system/EmptyState";
import {
  Plus, Loader2, Sparkles, Trophy, BookOpen,
  HelpCircle, Video, Compass,
} from "lucide-react";

const CHIPS = [
  { id: "all", label: "همه تدبّرها", icon: Sparkles },
  { id: "tadabbur", label: "تدبّر و تفکر", icon: Sparkles, match: (p) => p.type === "reflection" || (p.tags || []).includes("تدبّر") },
  { id: "recitation", label: "تلاوت‌ها", icon: Video, match: (p) => (p.tags || []).includes("تلاوت") || p.type === "video" },
  { id: "tafsir", label: "تفسیر و نکات", icon: Compass, match: (p) => (p.tags || []).includes("تفسیر") },
  { id: "verses", label: "آیات در زندگی", icon: BookOpen, match: (p) => Boolean(p.verse_key) || p.type === "verse_share" },
  { id: "questions", label: "پرسش و پاسخ", icon: HelpCircle, match: (p) => p.type === "question" },
];

export default function Community() {
  const { user: authUser, openAuthModal } = useAuth();
  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [selectedChip, setSelectedChip] = useState("all");

  const currentUser = authUser || user;
  const isScholar = isScholarUser(currentUser);

  useEffect(() => {
    if (!authUser) {
      api.auth.me().then(setUser).catch(() => {});
    }
  }, [authUser]);

  useEffect(() => {
    loadPosts();
  }, []);

  const loadPosts = async () => {
    setLoading(true);
    try {
      setPosts(await api.entities.Post.list("-created_date", 60));
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
      await api.entities.Post.delete(post.id);
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
      <div className="page-shell-narrow animate-fade-in space-y-4 font-doran pb-8">
        {/* Compact & Clean Page Header */}
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="font-rokh-bold font-bold text-2xl text-foreground tracking-tight">
              جامعه تدبّر
            </h1>
            <p className="font-editorial text-sm text-muted-foreground mt-1">
              جایی که آیات در زندگی‌ها رویداد می‌شوند
            </p>
          </div>
          <Link
            to="/competitions"
            className="flex shrink-0 items-center gap-1.5 rounded-xl border border-primary/20 bg-primary/10 px-3.5 py-1.5 text-xs font-bold text-primary transition-all hover:bg-primary/15"
          >
            <Trophy className="h-3.5 w-3.5" />
            <span>چالش‌های قرآنی</span>
          </Link>
        </div>

        {/* Active Competitions / Prizes */}
        <ActivePrizeStrip />

        {/* Quick Create Prompt Bar */}
        <div className="rounded-2xl border border-border bg-card p-3.5 shadow-soft transition-all hover:border-primary/40">
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
            <span className="flex-1 text-xs sm:text-sm text-muted-foreground group-hover:text-foreground transition-colors font-medium font-doran">
              آیه‌ای لمس کردت؟ تدبّری داری؟ با جامعه به اشتراک بگذار
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
              <Plus className="h-4 w-4" />
            </div>
          </button>

          {/* Quick Actions Row */}
          <div className="mt-3 flex items-center gap-2 border-t border-border/50 pt-2.5">
            <button
              onClick={handleOpenCreate}
              className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-secondary py-1.5 text-xs font-semibold text-foreground transition-colors hover:bg-muted"
            >
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              <span>نوشتن تدبّر</span>
            </button>
          </div>
        </div>

        {/* Filter Chips Bar */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
          {CHIPS.map((chip) => {
            const isSelected = selectedChip === chip.id;
            const Icon = chip.icon;
            return (
              <button
                key={chip.id}
                onClick={() => setSelectedChip(chip.id)}
                className={`inline-flex shrink-0 items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-all border ${
                  isSelected
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-card border-border text-muted-foreground hover:border-primary/40 hover:text-foreground"
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
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
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
          <EmptyState
            type="general"
            icon={Sparkles}
            title={
              selectedChip === "all"
                ? "هنوز کسی تدبّری به اشتراک نگذاشته"
                : "در این دسته‌بندی تدبّری یافت نشد"
            }
            subtitle="نخستین نفری باشید که آیه‌ای را به زندگی خود متصل می‌کند و با دیگران به اشتراک می‌گذارد"
            {...(isScholar
              ? {
                  actionLabel: "تدبّر خود را بنویسید",
                  onAction: handleOpenCreate,
                }
              : {})}
          />
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
      </div>
    </PullToRefresh>
  );
}
