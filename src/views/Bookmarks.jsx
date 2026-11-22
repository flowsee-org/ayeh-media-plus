'use client';
import { useEffect, useState } from "react";
import Link from "next/link";
import api from "@/lib/api";
import { toast } from "react-hot-toast";
import { getBookmarks, removeBookmark, getSavedPosts, toggleSavedPost } from "@/lib/readingTracker";
import { getAyah, getSurahList } from "@/lib/quranApi";
import PullToRefresh from "@/components/PullToRefresh";
import EmptyState from "@/components/ui/empty-state";
import {
  Bookmark, Loader2, Trash2, BookMarked, MessageCircle,
} from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

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
    api.entities.Post.filter({ id: { $in: ids } }, "-created_date", 50)
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

  const renderVerses = () => {
    if (loadingActive) {
      return <div className="flex justify-center py-24"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>;
    }
    if (keys.length === 0) {
      return (
        <EmptyState
          type="bookmarks"
          title="هنوز آیه‌ای نشان‌گذاری نکرده‌اید"
          subtitle="در صفحه هر آیه، دکمه نشان را برای ذخیره فشار دهید."
          actionLabel="مرور قرآن"
          actionHref="/quran"
        />
      );
    }
    return (
      <div className="space-y-4">
        {verses.map(({ key, data }) => {
          const [s, a] = key.split(":");
          return (
            <Card key={key} className="rounded border border-accent/10 bg-card hover:border-accent/30 hover:shadow-premium transition-all duration-300 animate-fade-in-up will-animate">
              <CardHeader className="px-5 pt-5 pb-3">
                <div className="flex items-center justify-between gap-3">
                  <Link href={`/verse/${s}/${a}`} className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="h-9 w-9 rounded bg-accent/10 text-accent flex items-center justify-center text-[11px] font-bold shrink-0">
                      {key}
                    </div>
                    <div>
                      <div className="text-sm font-medium">{surahName(Number(s))}</div>
                      <div className="text-xs text-muted-foreground">آیه {Number(a).toLocaleString("fa-IR")}</div>
                    </div>
                  </Link>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemove(key)}
                    className="h-11 w-11 rounded text-muted-foreground/40 hover:text-destructive hover:bg-destructive/5 shrink-0"
                    title="حذف نشان"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                {data?.arabic && (
                  <Link href={`/verse/${s}/${a}`} className="block px-5 pb-5">
                    <div className="text-xl sm:text-2xl leading-[2.2] text-foreground/95 text-right mb-2" dir="rtl" lang="ar">
                      {data.arabic}
                    </div>
                    {data.translation && (
                      <p className="text-sm text-foreground/70 leading-[2.1] line-clamp-2">{data.translation}</p>
                    )}
                  </Link>
                )}
              </CardHeader>
            </Card>
          );
        })}
      </div>
    );
  };

  const renderPosts = () => {
    if (posts.length === 0) {
      return (
        <EmptyState
          type="bookmarks"
          title="هنوز پستی ذخیره نکرده‌اید"
          subtitle="در فید جامعه، دکمه نشان روی هر پست را فشار دهید."
          actionLabel="رفتن به جامعه"
          actionHref="/community"
        />
      );
    }
    return (
      <div className="space-y-4">
        {posts.map((p) => (
          <Card key={p.id} className="rounded border border-accent/10 bg-card hover:border-accent/30 hover:shadow-premium transition-all duration-300 animate-fade-in-up will-animate">
            <CardHeader className="px-5 pt-5 pb-3">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-9 w-9 rounded bg-accent/10 text-accent flex items-center justify-center shrink-0">
                    <MessageCircle className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-medium truncate">{p.author_name}</div>
                    <div className="text-xs text-muted-foreground">پست جامعه</div>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleUnsavePost(p.id)}
                  className="h-11 w-11 rounded text-muted-foreground/40 hover:text-destructive hover:bg-destructive/5 shrink-0"
                  title="حذف از نشان‌ها"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <Link href={`/community/${p.id}`} className="block px-5 pb-5">
                <p className="text-sm text-foreground/80 leading-[2] whitespace-pre-line line-clamp-4">{p.content}</p>
                <span className="text-xs text-accent mt-2 inline-block">مشاهده پست ←</span>
              </Link>
            </CardHeader>
          </Card>
        ))}
      </div>
    );
  };

  return (
    <PullToRefresh onRefresh={() => Promise.all([loadVerses(), loadPosts()])}>
      <div className="page-shell-narrow animate-fade-in font-doran">
        <div className="mb-6">
          <div className="inline-flex items-center gap-2 text-primary text-xs font-medium mb-2">
            <BookMarked className="h-3.5 w-3.5" /> نشان‌گذاری‌ها
          </div>
          <h1 className="font-rokh-bold font-bold text-2xl sm:text-3xl text-foreground">نشان‌شده‌های من</h1>
          <p className="text-sm text-muted-foreground mt-1.5 font-editorial">
            آیات و پست‌هایی که برای مطالعه دوباره ذخیره کرده‌اید
          </p>
        </div>

        <Tabs defaultValue={tab} onValueChange={setTab}>
          <div className="flex gap-2 mb-6">
            <TabsList className="gap-2">
              <TabsTrigger
                value="verses"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded text-sm font-medium transition-all"
              >
                <Bookmark className="h-4 w-4" /> آیات
                {keys.length > 0 && <Badge variant="secondary" size="sm">({keys.length.toLocaleString("fa-IR")})</Badge>}
              </TabsTrigger>
              <TabsTrigger
                value="posts"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded text-sm font-medium transition-all"
              >
                <MessageCircle className="h-4 w-4" /> پست‌ها
                {posts.length > 0 && <Badge variant="secondary" size="sm">({posts.length.toLocaleString("fa-IR")})</Badge>}
              </TabsTrigger>
            </TabsList>
          </div>

          <Separator />

          <TabsContent value="verses" className="pt-4">
            {renderVerses()}
          </TabsContent>

          <TabsContent value="posts" className="pt-4">
            {renderPosts()}
          </TabsContent>
        </Tabs>
      </div>
    </PullToRefresh>
  );
}
