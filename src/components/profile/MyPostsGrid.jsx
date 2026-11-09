import { useCallback, useEffect, useState } from "react";
import { Link } from "@/lib/router-compat";
import api from "@/lib/api";
import { Image } from "@/components/ui/image";
import { Heart, MessageCircle, Loader2, NotebookPen, LogIn, RefreshCw } from "lucide-react";

const fa = (n) => (n || 0).toLocaleString("fa-IR");
const PAGE_SIZE = 30;

/** Instagram-style grid of the user's own posts, with pagination. */
export default function MyPostsGrid({ userId }) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    if (!userId) {
      setPosts([]);
      setHasMore(false);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(false);
    try {
      const res = await api.entities.Post.filter(
        { author_id: userId },
        { sort: "-created_date", limit: PAGE_SIZE, skip: 0 }
      );
      setPosts(res.items || []);
      setHasMore(!!res.has_more);
    } catch {
      // A failed request is not "no posts" — surface it so users/support can
      // tell the difference between empty data and a broken backend.
      setError(true);
      setPosts([]);
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    load();
  }, [load]);

  const loadMore = async () => {
    if (!userId || loadingMore || !hasMore) return;
    setLoadingMore(true);
    try {
      const res = await api.entities.Post.filter(
        { author_id: userId },
        { sort: "-created_date", limit: PAGE_SIZE, skip: posts.length }
      );
      const next = res.items || [];
      setPosts((prev) => [...prev, ...next]);
      setHasMore(!!res.has_more && next.length > 0);
    } catch {
      setError(true);
    } finally {
      setLoadingMore(false);
    }
  };

  // Guests: explain how to sign in instead of spinning forever.
  if (!userId) {
    return (
      <div className="rounded-2xl border border-dashed border-border/60 p-10 text-center">
        <LogIn className="h-7 w-7 text-muted-foreground/30 mx-auto mb-2" />
        <p className="text-sm text-muted-foreground mb-4">
          برای مشاهده پست‌های خود وارد حساب کاربری شوید.
        </p>
        <Link
          to="/login"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-accent text-accent-foreground text-sm font-medium hover:shadow-glow transition-all"
        >
          ورود به حساب
        </Link>
      </div>
    );
  }

  if (loading) {
    return <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-accent" /></div>;
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-destructive/30 bg-destructive/[0.03] p-10 text-center">
        <RefreshCw className="h-7 w-7 text-destructive/50 mx-auto mb-2" />
        <p className="text-sm text-muted-foreground mb-4">
          دریافت پست‌ها با خطا مواجه شد. اتصال خود را بررسی کنید و دوباره تلاش کنید.
        </p>
        <button
          type="button"
          onClick={load}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-secondary text-foreground text-sm font-medium hover:bg-secondary/70 transition-all border border-border"
        >
          <RefreshCw className="h-4 w-4" /> تلاش دوباره
        </button>
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border/60 p-10 text-center">
        <NotebookPen className="h-7 w-7 text-muted-foreground/30 mx-auto mb-2" />
        <p className="text-sm text-muted-foreground mb-4">هنوز پستی منتشر نکرده‌اید.</p>
        <Link
          to="/community"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-accent text-accent-foreground text-sm font-medium hover:shadow-glow transition-all"
        >
          انتشار اولین تدبّر
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="grid grid-cols-3 gap-1 sm:gap-2">
        {posts.map((p) => (
          <Link
            key={p.id}
            to={`/community/${p.id}`}
            className="relative group aspect-square rounded-lg overflow-hidden border border-accent/10 bg-card/40"
          >
            {p.image_url ? (
              <Image src={p.image_url} fittingType="fill" className="absolute inset-0 w-full h-full" />
            ) : (
              <div className="absolute inset-0 pattern-islamic bg-gradient-to-br from-card to-accent/10 p-2.5 flex items-center justify-center">
                <p className="text-xs text-foreground/70 leading-[1.9] line-clamp-5 text-center">{p.content}</p>
              </div>
            )}
            <div className="absolute inset-0 bg-black/55 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3 text-white text-xs font-medium">
              <span className="flex items-center gap-1"><Heart className="h-3.5 w-3.5" /> {fa(p.likes_count)}</span>
              <span className="flex items-center gap-1"><MessageCircle className="h-3.5 w-3.5" /> {fa(p.comments_count)}</span>
            </div>
          </Link>
        ))}
      </div>

      {hasMore && (
        <div className="flex justify-center mt-4">
          <button
            type="button"
            onClick={loadMore}
            disabled={loadingMore}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-secondary text-foreground text-sm font-medium hover:bg-secondary/70 transition-all border border-border disabled:opacity-60"
          >
            {loadingMore ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            نمایش پست‌های بیشتر
          </button>
        </div>
      )}
    </div>
  );
}
