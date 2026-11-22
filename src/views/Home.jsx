'use client';

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import api from "@/lib/api";
import { fa } from "@/lib/utils";
import {
  Play, Video, BookOpen, Flame, Users, Clock, Trophy,
  Mic, ChevronLeft, Eye, User, Compass, Upload, Radio,
} from "lucide-react";

import VideoCard from "@/components/ui/video-card";
import ScholarCard from "@/components/ui/scholar-card";
import ContentSection from "@/components/ui/content-section";
import { SkeletonPage } from "@/components/ui/loading-skeleton";
import EmptyState from "@/components/ui/empty-state";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

const CATEGORY_CHIPS = [
  { label: 'برای شما', key: 'all', icon: Compass },
  { label: 'تلاوت', key: 'recitation', icon: Mic },
  { label: 'تفسیر', key: 'tafsir', icon: BookOpen },
  { label: 'محافل', key: 'gathering', icon: Users },
  { label: 'مسابقات', key: 'competition', icon: Trophy },
  { label: 'زنده', key: 'live', icon: Radio },
];

export default function Home() {
  const router = useRouter();
  const [featured, setFeatured] = useState([]);
  const [allVideos, setAllVideos] = useState([]);
  const [qaris, setQaris] = useState([]);
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('all');

  useEffect(() => {
    let mounted = true;
    const loadData = async () => {
      try {
        const [vids, scholars, cols] = await Promise.all([
          api.entities.Video.filter(
            { status: { in: ["published", "verified"] } },
            { sort: "-created_date", limit: 100 }
          ).catch(() => ({ items: [] })),
          api.entities.Scholar.list("-created_date", 50).catch(() => ({ items: [] })),
          api.entities.Collection.filter({ is_public: true }, { sort: "-created_date", limit: 12 }).catch(() => ({ items: [] })),
        ]);

        if (!mounted) return;

        const items = vids.items || vids || [];
        const scholarItems = scholars.items || scholars || [];

        const featuredIds = new Set();
        const featuredDeduped = items
          .filter((v) => v.is_live || v.is_competition || v.category === 'gathering' || v.is_featured)
          .filter((v) => {
            if (featuredIds.has(v.id)) return false;
            featuredIds.add(v.id);
            return true;
          })
          .slice(0, 5);

        setFeatured(featuredDeduped.length ? featuredDeduped : items.slice(0, 5));
        setAllVideos(items);
        setQaris(scholarItems.slice(0, 8));
        setCollections(cols.items || cols || []);
      } catch (err) {
        console.error("Home load error:", err);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    loadData();
    return () => { mounted = false; };
  }, []);

  const videos = useMemo(() => {
    if (activeCategory === 'all') return allVideos.slice(0, 24);
    if (activeCategory === 'live') return allVideos.filter((v) => v.is_live).slice(0, 24);
    if (activeCategory === 'competition') {
      return allVideos.filter((v) => v.is_competition || v.category === 'competition').slice(0, 24);
    }
    return allVideos.filter((v) => v.category === activeCategory).slice(0, 24);
  }, [allVideos, activeCategory]);

  const hero = featured[0] || null;
  const secondary = featured.slice(1, 5);
  const liveVideos = useMemo(() => allVideos.filter((v) => v.is_live).slice(0, 4), [allVideos]);
  const shorts = useMemo(() => {
    const isShort = (v) => {
      const tags = Array.isArray(v.tags) ? v.tags : String(v.tags || "");
      if (v.category === "short" || (typeof tags === "string" ? tags.includes("شورت") : tags.includes("شورت") || tags.includes("کوتاه"))) {
        return true;
      }
      const d = String(v.duration || "");
      const m = d.match(/(\d+)/g);
      if (!m) return false;
      if (d.includes(":") && m.length >= 2) {
        const parts = m.map(Number);
        const secs = parts.length === 3 ? parts[0] * 3600 + parts[1] * 60 + parts[2] : parts[0] * 60 + parts[1];
        return secs > 0 && secs <= 90;
      }
      return false;
    };
    return allVideos.filter(isShort).slice(0, 12);
  }, [allVideos]);
  const trending = useMemo(
    () => [...allVideos].sort((a, b) => (b.views_count || 0) - (a.views_count || 0)).slice(0, 8),
    [allVideos]
  );

  if (loading) {
    return (
      <div className="mx-auto max-w-[1400px] py-8">
        <SkeletonPage />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1400px] space-y-8 sm:space-y-10">
      {/* Topic chips — Aparat personalized tabs */}
      <section className="sticky top-14 sm:top-16 z-20 -mx-3 sm:-mx-5 lg:-mx-6 px-3 sm:px-5 lg:px-6 py-3 bg-background/90 backdrop-blur-md border-b border-border/60">
        <div className="flex gap-2 overflow-x-auto no-scrollbar">
          <Tabs defaultValue={activeCategory} onValueChange={setActiveCategory}>
            <TabsList className="gap-2">
              {CATEGORY_CHIPS.map((cat) => {
                const Icon = cat.icon;
                const isActive = activeCategory === cat.key;
                return (
                  <TabsTrigger
                    key={cat.key}
                    value={cat.key}
                    className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded text-sm font-medium whitespace-nowrap transition-all border shrink-0 ${
                      isActive
                        ? 'bg-foreground text-background border-foreground'
                        : 'bg-card text-foreground/80 border-border hover:bg-muted'
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {cat.label}
                  </TabsTrigger>
                );
              })}
            </TabsList>
          </Tabs>
        </div>
      </section>

      {/* Featured hero */}
      {hero && (
        <section className="grid gap-4 lg:grid-cols-12">
          <Link
            href={`/watch/${hero.id}`}
            className="group relative lg:col-span-8 overflow-hidden rounded bg-muted aspect-video lg:aspect-auto lg:min-h-[360px]"
          >
            {hero.thumbnail_url ? (
              <img
                src={hero.thumbnail_url}
                alt=""
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.02]"
                loading="eager"
              />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-primary/30 to-accent/20" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent" />
            <div className="absolute inset-0 flex flex-col justify-end p-5 sm:p-7">
              <div className="flex flex-wrap gap-2 mb-3">
                {hero.is_live && (
                  <Badge variant="destructive" className="text-xs font-bold animate-pulse">
                    <span className="h-1.5 w-1.5 rounded bg-white animate-pulse" />
                    زنده
                  </Badge>
                )}
                {hero.is_competition && (
                  <Badge variant="quranic" className="text-xs font-bold">
                    <Trophy className="h-3 w-3" />
                    {hero.competition_year || 'مسابقه'}
                  </Badge>
                )}
              </div>
              <h1 className="font-rokh-bold text-xl sm:text-2xl lg:text-3xl text-white font-bold leading-snug line-clamp-2 mb-3">
                {hero.title}
              </h1>
              <div className="flex flex-wrap items-center gap-3 text-sm text-white/80 mb-4">
                {(hero.reciter_name || hero.scholar_name) && (
                  <span className="inline-flex items-center gap-1.5">
                    <User className="h-4 w-4" />
                    {hero.reciter_name || hero.scholar_name}
                  </span>
                )}
                {hero.duration && (
                  <span className="inline-flex items-center gap-1.5">
                    <Clock className="h-4 w-4" />
                    {hero.duration}
                  </span>
                )}
                {!!hero.views_count && (
                  <span className="inline-flex items-center gap-1.5">
                    <Eye className="h-4 w-4" />
                    {fa(hero.views_count)} بازدید
                  </span>
                )}
              </div>
              <Button variant="primary" className="w-fit px-5 py-2.5 text-sm font-bold shadow-lg group-hover:bg-secondary group-hover:text-white transition-colors">
                <Play className="h-4 w-4" />
                پخش ویدیو
              </Button>
            </div>
          </Link>

          <div className="lg:col-span-4 grid grid-cols-2 lg:grid-cols-1 gap-3">
            {secondary.map((item) => (
              <Link
                key={item.id}
                href={`/watch/${item.id}`}
                className="group relative overflow-hidden rounded bg-muted aspect-video lg:aspect-auto lg:min-h-[84px]"
              >
                {item.thumbnail_url ? (
                  <img
                    src={item.thumbnail_url}
                    alt=""
                    className="absolute inset-0 w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity"
                    loading="lazy"
                  />
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-accent/15" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/75 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-3">
                  <h3 className="text-white text-sm font-bold line-clamp-2 leading-snug">
                    {item.title}
                  </h3>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Live strip */}
      {liveVideos.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-rokh-bold text-lg sm:text-xl font-bold flex items-center gap-2">
              <span className="h-2 w-2 rounded bg-red-500 animate-pulse" />
              پخش زنده
            </h2>
            <Link href="/live" className="text-sm font-medium text-primary hover:underline inline-flex items-center gap-1">
              همه زنده‌ها <ChevronLeft className="h-4 w-4" />
            </Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {liveVideos.map((item) => (
              <VideoCard key={item.id} item={item} showCreator showMeta />
            ))}
          </div>
        </section>
      )}

      {/* Shorts */}
      {shorts.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-rokh-bold text-lg sm:text-xl font-bold inline-flex items-center gap-2">
              <Flame className="h-5 w-5 text-primary" />
              شورت‌ها
            </h2>
            <Link href="/explore?sort=short" className="text-sm font-medium text-primary hover:underline inline-flex items-center gap-1">
              همه شورت‌ها <ChevronLeft className="h-4 w-4" />
            </Link>
          </div>
          <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
            {shorts.map((item) => (
              <Link
                key={`short-${item.id}`}
                href={`/watch/${item.id}`}
                className="group shrink-0 w-[132px] sm:w-[148px]"
              >
                <div className="relative aspect-[9/16] rounded overflow-hidden bg-muted border border-border isolate">
                  {item.thumbnail_url ? (
                    <img
                      src={item.thumbnail_url}
                      alt=""
                      className="absolute inset-0 w-full h-full object-cover scale-[1.04] group-hover:scale-[1.08] transition-transform duration-500"
                      loading="lazy"
                    />
                  ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/25 to-accent/20" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-black/20 pointer-events-none" />
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="h-9 w-9 rounded bg-white/95 text-primary flex items-center justify-center shadow-sm">
                      <Play className="h-3.5 w-3.5 ms-0.5" />
                    </span>
                  </div>
                  {item.duration && (
                    <span className="absolute top-2 end-2 z-10 rounded bg-black/70 px-1.5 py-0.5 text-[10px] font-medium text-white leading-none">
                      {item.duration}
                    </span>
                  )}
                </div>
                <h3 className="mt-2 px-0.5 text-xs font-semibold text-foreground line-clamp-2 leading-relaxed group-hover:text-primary transition-colors">
                  {item.title}
                </h3>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Main feed */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-rokh-bold text-lg sm:text-xl font-bold">
              {activeCategory === 'all' ? 'تازه‌ترین ویدیوها' : CATEGORY_CHIPS.find((c) => c.key === activeCategory)?.label}
            </h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              تلاوت، تفسیر، محافل و مسابقات قرآنی
            </p>
          </div>
          <Link
            href="/explore"
            className="hidden sm:inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
          >
            مشاهده همه <ChevronLeft className="h-4 w-4" />
          </Link>
        </div>

        {videos.length > 0 ? (
          <div className="grid gap-x-4 gap-y-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {videos.map((item) => (
              <VideoCard key={item.id} item={item} showCreator showMeta />
            ))}
          </div>
        ) : (
          <EmptyState type="videos" />
        )}
      </section>

      {/* Trending rail */}
      {trending.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-rokh-bold text-lg sm:text-xl font-bold inline-flex items-center gap-2">
              <Flame className="h-5 w-5 text-quranic-saffron" />
              پرطرفدارها
            </h2>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            {trending.map((item) => (
              <VideoCard key={`trend-${item.id}`} item={item} variant="horizontal" showCreator showMeta />
            ))}
          </div>
        </section>
      )}

      {/* Channels / Scholars */}
      <ContentSection
        title="کانال‌ها و اساتید"
        subtitle="قاریان و اساتید برجسته را دنبال کنید"
        icon={Users}
        to="/scholars"
        viewAllLabel="همه کانال‌ها"
        sectionClassName="py-2"
      >
        {qaris.length > 0 ? (
          qaris.map((item) => (
            <ScholarCard key={`scholar-${item.id}`} item={item} variant="default" />
          ))
        ) : (
          <EmptyState
            type="general"
            title="کانالی ثبت نشده است"
            subtitle="هنوز استاد یا قاری‌ای در سامانه نیست."
            actionLabel="بازگشت"
            actionHref="/"
          />
        )}
      </ContentSection>

      {/* Collections as playlists */}
      {collections.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-rokh-bold text-lg sm:text-xl font-bold">لیست‌های پخش</h2>
            <Link href="/collections" className="text-sm font-medium text-primary hover:underline inline-flex items-center gap-1">
              همه لیست‌ها <ChevronLeft className="h-4 w-4" />
            </Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {collections.slice(0, 8).map((item) => (
              <Card
                key={item.id}
                className="rounded border border-border bg-card p-4 hover:border-primary/30 hover:shadow-sm transition-all"
              >
                <div className="h-28 rounded bg-gradient-to-br from-primary/15 to-accent/10 mb-3 flex items-center justify-center">
                  <Video className="h-8 w-8 text-primary/60 group-hover:scale-110 transition-transform" />
                </div>
                <h3 className="font-bold text-sm line-clamp-2 group-hover:text-primary transition-colors">
                  {item.title || item.name}
                </h3>
                {item.description && (
                  <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{item.description}</p>
                )}
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* Creator CTA */}
      <Card className="rounded border border-border bg-card p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
        <div>
          <h2 className="font-rokh-bold text-xl sm:text-2xl font-bold">ویدیوی قرآنی خود را منتشر کنید</h2>
          <p className="mt-1.5 text-sm text-muted-foreground max-w-xl">
            تلاوت، تفسیر یا محفل خود را آپلود کنید و به مخاطبان آیه پلاس برسانید.
          </p>
        </div>
        <div className="flex flex-wrap gap-3 shrink-0">
          <Button
            onClick={() => router.push('/upload')}
            variant="primary"
            size="sm"
          >
            <Upload className="h-4 w-4" />
            آپلود ویدیو
          </Button>
          <Link
            href="/creator"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded border border-border text-sm font-bold hover:bg-muted"
          >
            داشبورد سازنده
          </Link>
        </div>
      </Card>
    </div>
  );
}
