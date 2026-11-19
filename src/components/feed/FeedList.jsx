import { useCallback, useEffect, useRef, useState } from "react";
import api from "@/lib/api";
import { useAuth } from "@/lib/AuthContext";
import { toast } from "react-hot-toast";
import { togglePostLike } from "@/lib/social";
import PostCard from "@/components/community/PostCard";
import CreatePost from "@/components/community/CreatePost";
import { Avatar } from "@/components/community/shared";
import ActivePrizeStrip from "@/components/community/ActivePrizeStrip";
import CompanionBanner from "@/components/feed/CompanionBanner";
import { Loader2, Plus, ImageIcon, Sparkles, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";

const PAGE_SIZE = 4;

/** Instagram-style vertical feed with cursor-based infinite scroll. */
export default function FeedList() {
  const { user: authUser, openAuthModal } = useAuth();
  const [localUser, setLocalUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [cursor, setCursor] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const sentinelRef = useRef(null);

  const user = authUser || localUser;

  const fetchPage = useCallback(async (nextCursor) => {
    const page = await api.entities.Post.list({
      sort: "-created_date",
      limit: PAGE_SIZE,
      ...(nextCursor ? { cursor: nextCursor } : {}),
    });
    return { items: page?.items || [], next: page?.next_cursor || null, more: !!page?.has_more };
  }, []);

  const reset = useCallback(async () => {
    setLoading(true);
    try {
      const { items, next, more } = await fetchPage(null);
      setPosts(items);
      setCursor(next);
      setHasMore(more);
    } catch {}
    setLoading(false);
  }, [fetchPage]);

  useEffect(() => {
    api.auth.me().then(setLocalUser).catch(() => {});
    reset();
  }, [reset]);

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore || !cursor) return;
    setLoadingMore(true);
    try {
      const { items, next, more } = await fetchPage(cursor);
      setPosts((prev) => {
        const seen = new Set(prev.map((p) => p.id));
        return [...prev, ...items.filter((p) => !seen.has(p.id))];
      });
      setCursor(next);
      setHasMore(more);
    } catch {}
    setLoadingMore(false);
  }, [cursor, fetchPage, hasMore, loadingMore]);

  // Infinite scroll: observe a sentinel below the last card
  useEffect(() => {
    const node = sentinelRef.current;
    if (!node || loading || !hasMore) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) loadMore();
      },
      { rootMargin: "600px 0px" }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [loadMore, loading, hasMore]);

  const handleLike = async (post) => {
    if (!user) {
      toast.error("برای پسندیدن پست، ابتدا وارد حساب کاربری خود شوید");
      return;
    }
    const likedBy = post.liked_by || [];
    const isLiked = likedBy.includes(user.id);
    const newLikedBy = isLiked ? likedBy.filter((id) => id !== user.id) : [...likedBy, user.id];
    setPosts((prev) =>
      prev.map((p) =>
        p.id === post.id ? { ...p, liked_by: newLikedBy, likes_count: newLikedBy.length } : p
      )
    );
    try {
      await togglePostLike(post, user);
    } catch {
      setPosts((prev) => prev.map((p) => (p.id === post.id ? post : p)));
      toast.error("ثبت لایک ناموفق بود.");
    }
  };

  const handleDelete = async (post) => {
    if (!user || post.author_id !== user.id) return;
    if (!window.confirm("این پست حذف شود؟")) return;
    try {
      await api.entities.Post.delete(post.id);
      setPosts((prev) => prev.filter((p) => p.id !== post.id));
    } catch {}
  };

  return (
    <div className="w-full">
      {/* Smart verse guidance entry */}
      <CompanionBanner />

      {/* Active competitions with prizes */}
      <ActivePrizeStrip />

      {/* Composer */}
      <div className="mb-4 border-b border-border bg-card px-3.5 py-3 sm:rounded sm:border">
        <Button
          onClick={() => (user ? setShowCreate(true) : openAuthModal(() => setShowCreate(true)))}
          className="flex w-full items-center gap-3 text-right"
        >
          <Avatar name={user?.full_name || "؟"} size={38} avatar={user?.avatar_config} />
          <span className="flex-1 text-sm text-muted-foreground">چه چیزی به اشتراک می‌گذارید؟</span>
          <span className="flex h-9 w-9 items-center justify-center rounded bg-accent/10 text-accent">
            <Plus className="h-4 w-4" />
          </span>
        </Button>
        <div className="mt-3 flex gap-2 border-t border-border/50 pt-2.5">
          <Button
            onClick={() => (user ? setShowCreate(true) : openAuthModal(() => setShowCreate(true)))}
            className="inline-flex flex-1 items-center justify-center gap-1.5 rounded bg-muted/50 py-2 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <BookOpen className="h-3.5 w-3.5" /> متن یا آیه
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-accent" />
        </div>
      ) : posts.length === 0 ? (
        <div className="m-4 rounded border border-dashed border-border p-12 text-center sm:m-0">
          <Sparkles className="mx-auto mb-3 h-8 w-8 text-muted-foreground/30" />
          <p className="mb-4 text-sm text-muted-foreground">هنوز پستی منتشر نشده است.</p>
          {user && (
            <Button
              onClick={() => setShowCreate(true)}
              className="inline-flex items-center gap-2 rounded bg-accent px-5 py-2.5 text-sm font-medium text-accent-foreground transition-all hover:shadow-glow"
            >
              <ImageIcon className="h-4 w-4" /> انتشار اولین پست
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-5 sm:space-y-8">
          {posts.map((p) => (
            <PostCard
              key={p.id}
              post={p}
              currentUser={user}
              onLike={handleLike}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {!loading && posts.length > 0 && (
        <div ref={sentinelRef} className="flex justify-center py-6">
          {loadingMore ? (
            <Loader2 className="h-6 w-6 animate-spin text-accent" />
          ) : hasMore ? (
            <Button
              onClick={loadMore}
              className="rounded border border-border/60 px-5 py-2 text-xs font-medium text-muted-foreground hover:border-accent/30 hover:text-foreground transition-colors"
            >
              نمایش بیشتر
            </Button>
          ) : (
            <p className="text-xs text-muted-foreground/60">به پایان پست‌ها رسیدید</p>
          )}
        </div>
      )}

      {showCreate && user && (
        <CreatePost
          user={user}
          onClose={() => setShowCreate(false)}
          onPosted={(created) => {
            setShowCreate(false);
            if (created) setPosts((prev) => [created, ...prev]);
            else reset();
          }}
        />
      )}
    </div>
  );
}