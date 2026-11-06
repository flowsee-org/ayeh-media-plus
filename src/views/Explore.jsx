'use client';
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { togglePostLike } from "@/lib/social";
import { toast } from "react-hot-toast";
import { trackSessionSignal, detectMood } from "@/lib/exploreEngine";
import { getCuratedFeed, rankCuratedFeed } from "@/lib/curatedFeed";
import { trackSearch, getInferenceSummary, buildInferredProfile } from "@/lib/interestInference";
import { Image } from "@/components/ui/image";
import { Avatar } from "@/components/community/shared";
import {
  Search, Heart, MessageCircle, Play, Loader2, Compass, HelpCircle,
  X, Sparkles, BookOpen, Users, Moon, Sun, Image as ImageIcon,
} from "lucide-react";
import PullToRefresh from "@/components/PullToRefresh";

const fa = (n) => (n || 0).toLocaleString("fa-IR");

const CHIPS = [
  { id: "all", label: "همه", match: () => true },
  { id: "recitation", label: "تلاوت", match: (p) => (p.tags || []).includes("تلاوت") },
  { id: "tafsir", label: "تفسیر", match: (p) => (p.tags || []).includes("تفسیر") },
  { id: "tadabbur", label: "تدبّر", match: (p) => (p.tags || []).includes("تدبّر") || p.type === "reflection" },
  { id: "verses", label: "آیات", match: (p) => p.type === "verse_share" || !!p.verse_key },
  { id: "art", label: "خوشنویسی", match: (p) => (p.tags || []).includes("خوشنویسی") },
  { id: "video", label: "ویدیو", match: (p) => p.type === "video" },
  { id: "ask", label: "گفتگو", match: (p) => p.type === "question" },
];

const ASPECTS = ["aspect-square", "aspect-[3/4]", "aspect-[4/5]"];

const MOOD_ICONS = {
  Sparkles, BookOpen, Users, HelpCircle, Compass, ImageIcon, Moon, Sun,
};

export default function Explore() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [posts, setPosts] = useState([]);
  const [user, setUser] = useState(null);
  const [chip, setChip] = useState("all");
  const [query, setQuery] = useState("");
  const [mood, setMood] = useState(null);
  const [summary, setSummary] = useState("");
  const [topInterests, setTopInterests] = useState([]);
  const [refreshKey, setRefreshKey] = useState(0);

  const load = async () => {
    const [ps, me, verses, collections] = await Promise.all([
      base44.entities.Post.list("-created_date", 80).catch(() => []),
      base44.auth.me().catch(() => null),
      base44.entities.Verse.list("-created_date", 100).catch(() => []),
      base44.entities.Collection.list("-created_date", 30).catch(() => []),
    ]);
    setUser(me);

    // Curated feed: pre-generates explore cards from verses + collections + posts,
    // then matches them to the user's inferred interest profile
    const { ranked, profile, mood: detectedMood, topInterests: interests } =
      getCuratedFeed(verses, collections, ps, 80);
    setMood(detectedMood);
    setSummary(getInferenceSummary(profile));
    setTopInterests(interests);
    setPosts(ranked.map((r) => r.post));
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (refreshKey > 0) load();
  }, [refreshKey]);

  const toggleLike = async (post, e) => {
    e.stopPropagation();
    if (!user) {
      toast.error("برای پسندیدن پست، ابتدا وارد حساب کاربری خود شوید");
      return;
    }
    try {
      const updated = await togglePostLike(post, user);
      const updatedPosts = posts.map((p) => (p.id === post.id ? { ...p, ...updated } : p));
      setPosts(updatedPosts);

      const tags = (post.tags || []).length ? post.tags : [post.type].filter(Boolean);
      trackSessionSignal({
        type: "like",
        tags,
        author: post.author_name,
        postType: post.type,
        weight: 3,
      });

      // Re-rank: rebuild inferred profile + re-score existing cards
      const profile = buildInferredProfile();
      const detectedMood = detectMood();
      const { ranked, topInterests: interests } = rankCuratedFeed(updatedPosts, profile, detectedMood, 80);
      setMood(detectedMood);
      setSummary(getInferenceSummary(profile));
      setTopInterests(interests);
      setPosts(ranked.map((r) => r.post));
    } catch {}
  };

  const filtered = useMemo(() => {
    const q = query.trim();
    return posts.filter((p) => {
      const chipMatch = CHIPS.find((c) => c.id === chip)?.match(p) ?? true;
      if (!q) return chipMatch;
      const hay = [p.content, p.author_name, ...(p.tags || []), p.verse_key, p.video_title].filter(Boolean).join(" ");
      return chipMatch && hay.includes(q);
    });
  }, [posts, chip, query]);

  const authors = useMemo(() => {
    const seen = new Map();
    posts.forEach((p) => {
      if (!seen.has(p.author_name)) seen.set(p.author_name, p.author_avatar || "");
    });
    return [...seen.entries()].map(([name, avatar]) => ({ name, avatar }));
  }, [posts]);

  const columns = useMemo(() => {
    const cols = [[], [], []];
    filtered.forEach((p, i) => cols[i % 3].push(p));
    return cols;
  }, [filtered]);

  if (loading) {
    return <div className="flex justify-center py-32"><Loader2 className="h-10 w-10 animate-spin text-accent" /></div>;
  }

  const MoodIcon = mood ? MOOD_ICONS[mood.icon] || Sparkles : Sparkles;

  return (
    <PullToRefresh onRefresh={() => setRefreshKey((k) => k + 1)}>
    <div className="min-h-screen pb-8">
      <div className="sticky top-16 z-30 glass-header border-b border-border">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-3 space-y-3">
          <div className="flex items-center gap-3">
            <div className="flex-1 relative">
              <Search className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60" />
              <input
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  if (e.target.value.trim().length >= 3) {
                    trackSearch(e.target.value.trim());
                  }
                }}
                placeholder="جستجو در کاوش — تلاوت، تفسیر، خوشنویسی، آیه…"
                className="w-full rounded-2xl border border-border bg-card text-foreground font-ui py-2.5 pr-11 pl-11 text-sm placeholder:text-muted-foreground/60 focus:border-primary focus:ring-2 focus:ring-primary/15 focus:outline-none transition-all shadow-soft"
              />
              {query && (
                <button
                  onClick={() => setQuery("")}
                  className="absolute left-3 top-1/2 -translate-y-1/2 h-6 w-6 rounded-full bg-muted text-muted-foreground flex items-center justify-center hover:bg-muted/70 transition-colors"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
            <div className="hidden sm:flex items-center gap-2 text-accent text-sm font-medium shrink-0">
              <Compass className="h-4 w-4" /> کاوش
            </div>
          </div>
          <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-1 px-1">
            {CHIPS.map((c) => (
              <button
                key={c.id}
                onClick={() => setChip(c.id)}
                className={`shrink-0 px-4 py-1.5 rounded-full text-xs font-medium border transition-all ${
                  chip === c.id
                    ? "bg-primary text-primary-foreground border-primary shadow-soft"
                    : "border-border/50 text-muted-foreground hover:text-foreground hover:bg-muted/50"
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {!query.trim() && chip === "all" && mood && (
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 pt-4 space-y-2">
          <div className="flex items-center gap-2.5 rounded-2xl border border-accent/15 bg-accent/5 px-4 py-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-accent/15 text-accent shrink-0">
              <MoodIcon className="h-4 w-4" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-foreground/90">
                حال امروز: <span className="text-accent">{mood.label}</span>
              </p>
              <p className="text-xs text-muted-foreground truncate">{summary}</p>
            </div>
          </div>
          {topInterests.length > 0 && (
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
              <span className="text-xs text-muted-foreground shrink-0 ml-1">علاقه‌مندی‌ها:</span>
              {topInterests.map((interest) => (
                <button
                  key={interest.topic}
                  onClick={() => setQuery(interest.topic)}
                  className="shrink-0 px-3 py-1 rounded-full text-xs font-medium border border-accent/20 bg-accent/5 text-accent hover:bg-accent/10 transition-colors"
                >
                  {interest.topic}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 pt-4">
        <div className="flex gap-4 overflow-x-auto no-scrollbar py-1">
          {authors.map((a) => {
            const active = query.trim() === a.name;
            return (
              <button
                key={a.name}
                onClick={() => setQuery(active ? "" : a.name)}
                className="shrink-0 flex flex-col items-center gap-1.5 group"
              >
                <span
                  className={`h-16 w-16 rounded-full p-[2.5px] bg-gradient-to-tr from-accent via-accent/70 to-primary transition-transform group-hover:scale-105 ${
                    active ? "ring-2 ring-accent/50 ring-offset-2 ring-offset-background" : ""
                  }`}
                >
                  <span className="block h-full w-full rounded-full overflow-hidden bg-card">
                    <Avatar name={a.name} size={60} avatar={a.avatar} className="h-full w-full" />
                  </span>
                </span>
                <span className={`text-xs max-w-[64px] truncate ${active ? "text-accent font-medium" : "text-muted-foreground"}`}>
                  {a.name}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 pt-3">
        {filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border/60 p-16 text-center">
            <Search className="h-8 w-8 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">چیزی پیدا نشد — عبارت دیگری را جستجو کنید</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-1 sm:gap-2">
            {columns.map((col, ci) => (
              <div key={ci} className="flex flex-col gap-1 sm:gap-2">
                {col.map((post, ri) => {
                  const aspect =
                    post.type === "video" || post.type === "question"
                      ? "aspect-[4/5]"
                      : ASPECTS[(ci + ri) % ASPECTS.length];
                  return (
                    <ExploreTile
                      key={post.id}
                      post={post}
                      aspect={aspect}
                      isLiked={(post.liked_by || []).includes(user?.id)}
                      onOpen={() => navigate(`/community/${post.id}`)}
                      onLike={(e) => toggleLike(post, e)}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
    </PullToRefresh>
  );
}

function ExploreTile({ post, aspect, isLiked, onOpen, onLike }) {
  const hasThumb = !!post.image_url;
  return (
    <div
      onClick={onOpen}
      className={`relative group cursor-pointer rounded-lg sm:rounded-xl overflow-hidden border border-accent/10 bg-card/40 ${aspect} will-animate`}
    >
      {hasThumb ? (
        <Image src={post.image_url} fittingType="fill" className="absolute inset-0 w-full h-full" />
      ) : (
        <div className={`absolute inset-0 pattern-islamic bg-gradient-to-br from-card to-accent/10 flex flex-col items-center justify-center p-5 text-center`}>
          <HelpCircle className="h-7 w-7 text-accent/40 mb-3" />
          <p className="text-sm text-foreground/80 leading-[2] line-clamp-6">{post.content}</p>
          <span className="mt-3 text-xs text-accent font-medium">@{post.author_name}</span>
        </div>
      )}

      {post.type === "video" && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <span className="h-12 w-12 rounded-full bg-black/45 backdrop-blur-sm flex items-center justify-center text-white group-hover:scale-110 transition-transform">
            <Play className="h-5 w-5 mr-0.5" />
          </span>
        </div>
      )}

      <button
        onClick={onLike}
        className="absolute top-2 left-2 z-10 h-11 w-11 rounded-full bg-black/35 backdrop-blur-sm flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-all hover:bg-black/55"
        title={isLiked ? "حذف لایک" : "لایک"}
      >
        <Heart className={`h-4 w-4 ${isLiked ? "fill-current text-red-400" : ""}`} />
      </button>

      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/25 to-black/10 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3 pointer-events-none">
        <div className="flex items-center gap-3 text-white text-xs font-medium">
          <span className="flex items-center gap-1">
            <Heart className={`h-3.5 w-3.5 ${isLiked ? "fill-current text-red-400" : ""}`} /> {fa(post.likes_count)}
          </span>
          <span className="flex items-center gap-1">
            <MessageCircle className="h-3.5 w-3.5" /> {fa(post.comments_count)}
          </span>
        </div>
        <div className="mt-1.5 text-xs text-white/80 truncate">{post.author_name}</div>
      </div>
    </div>
  );
}