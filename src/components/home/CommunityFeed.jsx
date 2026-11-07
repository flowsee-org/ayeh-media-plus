import { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import api from "@/lib/api";
import { toast } from "react-hot-toast";
import PostCard from "@/components/community/PostCard";
import { MessageCircle, TrendingUp, Heart, Sparkles, Trophy, ArrowLeft, Plus, Loader2, Hash } from "lucide-react";

export default function CommunityFeed() {
  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [competitions, setCompetitions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.auth.me().then(setUser).catch(() => {});
    Promise.all([
      api.entities.Post.list("-created_date", 100).catch(() => []),
      api.entities.Competition.filter({ status: "active" }).catch(() => []),
    ]).then(([p, c]) => {
      setPosts(p);
      setCompetitions(c);
      setLoading(false);
    });
  }, []);

  const stats = useMemo(() => {
    const likes = posts.reduce((s, p) => s + (p.likes_count || 0), 0);
    const comments = posts.reduce((s, p) => s + (p.comments_count || 0), 0);
    return { posts: posts.length, likes, comments };
  }, [posts]);

  const trendingTags = useMemo(() => {
    const counts = {};
    posts.forEach((p) => (p.tags || []).forEach((t) => { counts[t] = (counts[t] || 0) + 1; }));
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([tag]) => tag);
  }, [posts]);

  const displayPosts = posts.slice(0, 4);

  const handleLike = async (post) => {
    if (!user) return;
    const likedBy = post.liked_by || [];
    const isLiked = likedBy.includes(user.id);
    const newLikedBy = isLiked ? likedBy.filter((id) => id !== user.id) : [...likedBy, user.id];
    // Optimistic: update immediately, revert if the API call fails
    setPosts((prev) => prev.map((p) => (p.id === post.id ? { ...p, liked_by: newLikedBy, likes_count: newLikedBy.length } : p)));
    try {
      await api.entities.Post.update(post.id, { liked_by: newLikedBy, likes_count: newLikedBy.length });
    } catch {
      setPosts((prev) => prev.map((p) => (p.id === post.id ? post : p)));
      toast.error("ثبت لایک ناموفق بود. دوباره تلاش کنید.");
    }
  };

  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
      {/* Section header */}
      <div className="flex items-center justify-between mb-6 sm:mb-8 gap-3">
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
          <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center ring-1 ring-primary/10 shrink-0">
            <MessageCircle className="h-4 w-4 sm:h-5 sm:w-5" />
          </div>
          <div className="min-w-0">
            <h2 className="font-display font-bold text-lg sm:text-2xl tracking-tight truncate">جامعه تدبّر</h2>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 truncate">تازه‌ترین تدبّرها و گفت‌وگوهای قرآنی</p>
          </div>
        </div>
        <Link to="/community" className="flex items-center gap-1 text-xs sm:text-sm text-muted-foreground hover:text-primary transition-colors shrink-0 whitespace-nowrap">
          جامعه کامل <ArrowLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
        </Link>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main feed */}
        <div className="lg:col-span-2 space-y-5">
          {/* Create post CTA */}
          <Link
            to="/community"
            className="flex items-center gap-3 rounded-2xl border border-accent/15 bg-card/60 p-4 hover:border-accent/30 hover:shadow-soft transition-all group"
          >
            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-accent/20 to-accent/5 border border-accent/15 flex items-center justify-center text-accent">
              <Plus className="h-5 w-5" />
            </div>
            <span className="text-sm text-muted-foreground flex-1 group-hover:text-foreground transition-colors">تدبّر یا آیه‌ای را به اشتراک بگذارید…</span>
            <Sparkles className="h-4 w-4 text-accent/50 group-hover:text-accent transition-colors" />
          </Link>

          {loading ? (
            <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-accent" /></div>
          ) : displayPosts.length > 0 ? (
            displayPosts.map((p) => (
              <PostCard key={p.id} post={p} currentUser={user} onLike={handleLike} />
            ))
          ) : (
            <div className="rounded-2xl border border-dashed border-accent/15 p-12 text-center">
              <MessageCircle className="h-8 w-8 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground mb-4">هنوز پستی منتشر نشده است. اولین تدبّر را شما به اشتراک بگذارید!</p>
              <Link to="/community" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-accent text-accent-foreground text-sm font-medium hover:shadow-glow transition-all">
                <Plus className="h-4 w-4" /> شروع کنید
              </Link>
            </div>
          )}

          {!loading && displayPosts.length > 0 && (
            <div className="text-center pt-2">
              <Link to="/community" className="inline-flex items-center gap-2 px-6 py-3 rounded-full border border-accent/20 text-accent text-sm font-medium hover:bg-accent/5 transition-all">
                مشاهده همه پست‌ها <ArrowLeft className="h-4 w-4" />
              </Link>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-5">
          {/* Community stats */}
          <div className="rounded-2xl border border-accent/15 bg-card/60 p-5">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="h-4 w-4 text-accent" />
              <h3 className="font-display font-semibold text-sm">آمار جامعه</h3>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <StatBox icon={Sparkles} value={stats.posts} label="تدبّر" />
              <StatBox icon={Heart} value={stats.likes} label="لایک" />
              <StatBox icon={MessageCircle} value={stats.comments} label="نظر" />
            </div>
          </div>

          {/* Active competitions */}
          {competitions.length > 0 && (
            <div className="rounded-2xl border border-accent/15 bg-card/60 p-5">
              <div className="flex items-center gap-2 mb-3">
                <Trophy className="h-4 w-4 text-accent" />
                <h3 className="font-display font-semibold text-sm">مسابقات فعال</h3>
              </div>
              <div className="space-y-2">
                {competitions.slice(0, 3).map((c) => (
                  <Link
                    key={c.id}
                    to={`/competitions/${c.id}`}
                    className="flex items-center gap-3 rounded-xl p-2 hover:bg-accent/5 transition-colors group"
                  >
                    <div className="h-9 w-9 rounded-lg bg-accent/10 text-accent flex items-center justify-center shrink-0">
                      <Trophy className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate group-hover:text-accent transition-colors">{c.title}</div>
                      <div className="text-xs text-muted-foreground">{(c.participants_count || 0).toLocaleString("fa-IR")} شرکت‌کننده</div>
                    </div>
                  </Link>
                ))}
              </div>
              <Link to="/competitions" className="block text-center mt-3 text-xs text-accent hover:underline">
                همه مسابقات ←
              </Link>
            </div>
          )}

          {/* Trending tags */}
          {trendingTags.length > 0 && (
            <div className="rounded-2xl border border-accent/15 bg-card/60 p-5">
              <div className="flex items-center gap-2 mb-3">
                <Hash className="h-4 w-4 text-accent" />
                <h3 className="font-display font-semibold text-sm">موضوعات داغ</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {trendingTags.map((tag) => (
                  <Link
                    key={tag}
                    to={`/community`}
                    className="text-xs px-3 py-1.5 rounded-full bg-accent/8 text-accent border border-accent/10 hover:bg-accent/15 transition-colors"
                  >
                    #{tag}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function StatBox({ icon: Icon, value, label }) {
  return (
    <div className="text-center rounded-xl bg-accent/[0.03] border border-accent/8 p-3">
      <Icon className="h-4 w-4 text-accent mx-auto mb-1.5" />
      <div className="font-display font-bold text-lg text-foreground">{value.toLocaleString("fa-IR")}</div>
      <div className="text-xs text-muted-foreground mt-0.5">{label}</div>
    </div>
  );
}