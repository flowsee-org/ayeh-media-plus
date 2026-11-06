'use client';
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { toast } from "react-hot-toast";
import { getBookmarks, removeBookmark, getSavedPosts, toggleSavedPost } from "@/lib/readingTracker";
import { getAyah, getSurahList } from "@/lib/quranApi";
import OrnamentalDivider from "@/components/OrnamentalDivider";
import PullToRefresh from "@/components/PullToRefresh";
import {
  Bookmark, Loader2, BookOpen, Trash2, BookMarked, MessageCircle, Sparkles,
} from "lucide-react";

export default function Bookmarks() {
  const [tab, setTab] = useState("verses");
  const [keys, setKeys] = useState([]);
  const [verses, setVerses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [surahs, setSurahs] = useState([]);
  const [posts, setPosts] = useState([]);
  const [postsLoading, setPostsLoading] = useState(true);

  const loadVerses = () => {
    const ordered = [...getBookmarks()].reverse();
    setKeys(ordered);
    getSurahList().catch(() => []).then(setSurahs);

    Promise.all(
      ordered.map((key) => {
        const [s, a] = key.split(":");
        return getAyah(Number(s), Number(a))
          .catch(() => null)
          .then((data) => ({ key, data }));
      })
    ).then((results) => {
      setVerses(results);
      setLoading(false);
    });
  };

  const loadPosts = () => {
    const ids = getSavedPosts();
    if (ids.length === 0) {
      setPosts([]);
      setPostsLoading(false);
      return;
    }
    base44.entities.Post.filter({ id: { $in: ids } }, "-created_date", 50)
      .then(setPosts)
      .catch(() => setPosts([]))
      .finally(() => setPostsLoading(false));
  };

  useEffect(() => {
    loadVerses();
    loadPosts();
  }, []);

  const handleRemove = (key) => {
    const updated = removeBookmark(key);
    setKeys([...updated].reverse());
    setVerses((prev) => prev.filter((v) => v.key !== key));
    toast.success("آیه از نشان‌شده‌ها حذف شد");
  };

  const handleUnsavePost = (id) => {
    toggleSavedPost(id);
    setPosts((prev) => prev.filter((p) => p.id !== id));
    toast.success("پست از نشان‌شده‌ها حذف شد");
  };

  const surahName = (num) => {
    const s = surahs.find((x) => x.number === num);
    return s ? s.persianName || s.englishName : `سوره ${num}`;
  };

  const loadingActive = tab === "verses" ? loading : postsLoading;

  return (
    <PullToRefresh onRefresh={() => Promise.all([loadVerses(), loadPosts()])}>
    <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-8 sm:py-12 animate-fade-in">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-accent/20 bg-accent/5 text-accent text-xs font-medium mb-4">
          <BookMarked className="h-3.5 w-3.5" /> نشان‌گذاری‌های من
        </div>
        <h1 className="font-display font-extrabold text-3xl sm:text-4xl">نشان‌شده‌های من</h1>
        <OrnamentalDivider className="mt-6" />
      </div>

      {/* Tabs */}
      <div className="flex justify-center gap-2 mb-8">
        <button
          onClick={() => setTab("verses")}
          className={`inline-flex items-center gap-1.5 px-5 py-2 rounded-full text-sm font-medium transition-all ${tab === "verses" ? "bg-accent text-accent-foreground shadow-soft" : "bg-muted/40 text-muted-foreground hover:text-foreground"}`}
        >
          <Bookmark className="h-4 w-4" /> آیات
          {keys.length > 0 && <span className="text-xs opacity-70">({keys.length.toLocaleString("fa-IR")})</span>}
        </button>
        <button
          onClick={() => setTab("posts")}
          className={`inline-flex items-center gap-1.5 px-5 py-2 rounded-full text-sm font-medium transition-all ${tab === "posts" ? "bg-accent text-accent-foreground shadow-soft" : "bg-muted/40 text-muted-foreground hover:text-foreground"}`}
        >
          <MessageCircle className="h-4 w-4" /> پست‌ها
          {posts.length > 0 && <span className="text-xs opacity-70">({posts.length.toLocaleString("fa-IR")})</span>}
        </button>
      </div>

      {loadingActive ? (
        <div className="flex justify-center py-24"><Loader2 className="h-10 w-10 animate-spin text-accent" /></div>
      ) : tab === "verses" ? (
        keys.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border/60 p-12 text-center">
            <Bookmark className="h-8 w-8 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground mb-4">
              هنوز آیه‌ای نشان‌گذاری نکرده‌اید. در صفحه هر آیه، دکمه نشان را برای ذخیره فشار دهید.
            </p>
            <Link
              to="/quran"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-accent text-accent-foreground text-sm font-medium hover:shadow-glow transition-all"
            >
              <BookOpen className="h-4 w-4" /> مرور قرآن
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {verses.map(({ key, data }) => {
              const [s, a] = key.split(":");
              return (
                <div
                  key={key}
                  className="group rounded-xl border border-accent/10 bg-card/40 hover:border-accent/30 hover:shadow-premium transition-all duration-300 animate-fade-in-up will-animate"
                >
                  <div className="flex items-center justify-between gap-3 px-5 pt-5 pb-3">
                    <Link to={`/verse/${s}/${a}`} className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="h-9 w-9 rounded-lg bg-accent/10 text-accent flex items-center justify-center text-[11px] font-bold shrink-0">
                        {key}
                      </div>
                      <div>
                        <div className="text-sm font-medium">{surahName(Number(s))}</div>
                        <div className="text-xs text-muted-foreground">آیه {Number(a).toLocaleString("fa-IR")}</div>
                      </div>
                    </Link>
                    <button
                      onClick={() => handleRemove(key)}
                      className="h-11 w-11 rounded-lg flex items-center justify-center text-muted-foreground/40 hover:text-destructive hover:bg-destructive/5 transition-colors shrink-0"
                      title="حذف نشان"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  {data?.arabic && (
                    <Link to={`/verse/${s}/${a}`} className="block px-5 pb-5">
                      <div className="text-xl sm:text-2xl font-arabic leading-[2.2] text-foreground/95 text-right mb-2" dir="rtl" lang="ar">
                        {data.arabic}
                      </div>
                      {data.translation && (
                        <p className="text-sm text-foreground/70 leading-[2.1] line-clamp-2">{data.translation}</p>
                      )}
                    </Link>
                  )}
                </div>
              );
            })}
          </div>
        )
      ) : posts.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border/60 p-12 text-center">
          <MessageCircle className="h-8 w-8 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground mb-4">
            هنوز پستی ذخیره نکرده‌اید. در فید جامعه، دکمه نشان روی هر پست را فشار دهید.
          </p>
          <Link
            to="/community"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-accent text-accent-foreground text-sm font-medium hover:shadow-glow transition-all"
          >
            <Sparkles className="h-4 w-4" /> رفتن به جامعه
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map((p) => (
            <div
              key={p.id}
              className="rounded-xl border border-accent/10 bg-card/40 hover:border-accent/30 hover:shadow-premium transition-all duration-300 animate-fade-in-up will-animate"
            >
              <div className="flex items-center justify-between gap-3 px-5 pt-5 pb-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-9 w-9 rounded-lg bg-accent/10 text-accent flex items-center justify-center shrink-0">
                    <MessageCircle className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-medium truncate">{p.author_name}</div>
                    <div className="text-xs text-muted-foreground">پست جامعه</div>
                  </div>
                </div>
                <button
                  onClick={() => handleUnsavePost(p.id)}
                  className="h-11 w-11 rounded-lg flex items-center justify-center text-muted-foreground/40 hover:text-destructive hover:bg-destructive/5 transition-colors shrink-0"
                  title="حذف از نشان‌ها"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              <Link to={`/community/${p.id}`} className="block px-5 pb-5">
                <p className="text-sm text-foreground/80 leading-[2] whitespace-pre-line line-clamp-4">{p.content}</p>
                <span className="text-xs text-accent mt-2 inline-block">مشاهده پست ←</span>
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
    </PullToRefresh>
  );
}