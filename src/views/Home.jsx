'use client';

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import api from "@/lib/api";
import { fa } from "@/lib/utils";
import {
  Play, Sparkles, Video, BookOpen, Flame, Users, Clock, Trophy,
  Mic, ChevronRight, Eye, User, Compass, Volume2, Award, Star,
  Upload, Smartphone, Loader2,
} from "lucide-react";

import VideoCard from "@/components/design-system/VideoCard";
import ScholarCard from "@/components/design-system/ScholarCard";
import GatheringCard from "@/components/design-system/GatheringCard";
import ContentSection from "@/components/design-system/ContentSection";
import { SkeletonPage, SkeletonGrid } from "@/components/design-system/LoadingSkeleton";
import EmptyState from "@/components/design-system/EmptyState";

/**
 * Ayeh Media Plus — Homepage
 * Pure video platform inspired by Aparat.
 * Sections: Hero/Featured, Trending, Recitations, Shorts, Live, Qaris, Collections
 */

const CATEGORY_CHIPS = [
  { label: 'همه', key: 'all', icon: Compass },
  { label: 'تلاوت', key: 'recitation', icon: Mic },
  { label: 'تفسیر', key: 'tafsir', icon: BookOpen },
  { label: 'مسابقات', key: 'competition', icon: Trophy },
  { label: 'محافل', key: 'gathering', icon: Users },
];

export default function Home() {
  const router = useRouter();
  const [featured, setFeatured] = useState([]);
  const [trending, setTrending] = useState([]);
  const [videos, setVideos] = useState([]);
  const [qaris, setQaris] = useState([]);
  const [gatherings, setGatherings] = useState([]);
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('all');

  useEffect(() => {
    let mounted = true;
    const loadData = async () => {
      try {
        const [vids, scholars, collections] = await Promise.all([
          api.entities.Video.filter(
            { status: { in: ["published", "verified"] } },
            { sort: "-created_date", limit: 100 }
          ).catch(() => ({ items: [] })),
          api.entities.Scholar.list("-created_date", 50).catch(() => ({ items: [] })),
          api.entities.Collection.filter({ is_public: true }, { sort: "-created_date", limit: 12 }).catch(() => ({ items: [] })),
        ]);

        const items = vids.items || vids || [];
        const scholarItems = scholars.items || scholars || [];

        // Deduplicate featured
        const featuredIds = new Set();
        const featuredDeduped = items
          .filter(v => v.is_live || v.is_competition || v.category === 'gathering')
          .filter(v => { if (featuredIds.has(v.id)) return false; featuredIds.add(v.id); return true; })
          .slice(0, 6);

        setFeatured(featuredDeduped);
        setTrending(items.filter(v => v.category === 'recitation' || !v.category).slice(0, 12));
        setVideos(items.filter(v => activeCategory === 'all' || v.category === activeCategory).slice(0, 20));
        setQaris(scholarItems.slice(0, 8));
        setGatherings(items.filter(v => v.category === 'gathering').slice(0, 8));
        setCollections(collections.items || collections || []);
      } catch (err) {
        console.error("Home load error:", err);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    loadData();
    return () => { mounted = false; };
  }, [activeCategory]);

  const hero = useMemo(() => {
    if (!featured.length) return null;
    return featured[0];
  }, [featured]);

  const secondary = useMemo(() => featured.slice(1, 4), [featured]);

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <SkeletonPage />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      {/* ── Hero Section ── */}
      {hero && (
        <section className="relative py-10 sm:py-14 lg:py-20 overflow-hidden">
          <div className="container-quranic relative z-10">
            {/* Primary Featured */}
            <article className="relative group">
              <Link
                href={`/watch/${hero.id}`}
                className="block rounded-2xl overflow-hidden bg-gradient-to-br from-quranic-emerald-dark/20 via-quranic-emerald/10 to-quranic-turquoise/20 border border-quranic-emerald/20 hover:border-quranic-emerald/40 transition-all duration-500 h-[320px] lg:h-[400px]"
              >
                <div className="absolute inset-0 z-0">
                  {hero.thumbnail_url ? (
                    <img
                      src={hero.thumbnail_url}
                      alt=""
                      className="w-full h-full object-cover opacity-25 group-hover:opacity-35 transition-opacity duration-700"
                      loading="eager"
                      decoding="async"
                      aria-hidden="true"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-quranic-emerald-dark/30 to-quranic-turquoise/30" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                </div>

                <div className="relative z-10 h-full flex flex-col justify-end p-5 sm:p-6 lg:p-8">
                  {/* Badges */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {hero.is_live && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-quranic-saffron text-quranic-ink text-xs font-bold animate-[live-pulse_1.5s_infinite] shadow-saffron-glow">
                        <span className="h-2 w-2 rounded-full bg-quranic-ink animate-[breathe_2s_infinite]" aria-hidden="true" />
                        زنده
                      </span>
                    )}
                    {hero.is_competition && (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-quranic-emerald text-white text-[10px] font-bold backdrop-blur-sm border border-quranic-emerald/30">
                        <Trophy className="h-3 w-3" aria-hidden="true" />
                        <span>{hero.competition_year || 'مسابقه'}</span>
                      </span>
                    )}
                  </div>

                  <h1 className="font-rokh-bold font-bold text-2xl sm:text-3xl lg:text-4xl leading-tight text-white mb-4 line-clamp-2 group-hover:text-quranic-saffron transition-colors">
                    {hero.title}
                  </h1>

                  <div className="flex flex-wrap items-center gap-3 text-sm sm:text-base text-white/80 mb-6">
                    {hero.duration && (
                      <span className="inline-flex items-center gap-1.5 font-medium">
                        <Clock className="h-4 w-4 text-quranic-saffron" aria-hidden="true" />
                        <span>{hero.duration}</span>
                      </span>
                    )}
                    {hero.views_count && (
                      <span className="inline-flex items-center gap-1.5 font-medium">
                        <Eye className="h-4 w-4 text-quranic-saffron" aria-hidden="true" />
                        <span>{fa(hero.views_count)} نمایش</span>
                      </span>
                    )}
                    {(hero.reciter_name || hero.scholar_name) && (
                      <span className="inline-flex items-center gap-1.5 font-medium">
                        <User className="h-4 w-4 text-quranic-saffron" aria-hidden="true" />
                        <span>{hero.reciter_name || hero.scholar_name}</span>
                      </span>
                    )}
                  </div>

                  <button
                    onClick={() => router.push(`/watch/${hero.id}`)}
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white text-quranic-emerald font-rokh-bold font-bold hover:bg-quranic-saffron/10 transition-all shadow-xl group-hover:scale-105"
                  >
                    <Play className="h-5 w-5" aria-hidden="true" />
                    <span>مشاهده و استماع</span>
                  </button>
                </div>
              </Link>
            </article>

            {/* Secondary Featured */}
            {secondary.length > 0 && (
              <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {secondary.map((item) => (
                  <article key={item.id} className="relative group">
                    <Link
                      href={`/watch/${item.id}`}
                      className="group relative block rounded-xl overflow-hidden bg-gradient-to-br from-quranic-emerald-dark/20 to-quranic-turquoise/20 border border-border/60 hover:border-quranic-emerald/40 hover:shadow-xl transition-all duration-500 h-[140px] sm:h-[160px]"
                    >
                      <div className="absolute inset-0 z-0">
                        {item.thumbnail_url ? (
                          <img
                            src={item.thumbnail_url}
                            alt=""
                            className="w-full h-full object-cover opacity-35 group-hover:opacity-45 group-hover:scale-105 transition-all duration-700"
                            loading="lazy"
                            decoding="async"
                            aria-hidden="true"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-quranic-emerald-dark/30 to-quranic-turquoise/30" />
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
                      </div>

                      <div className="relative z-10 h-full flex flex-col justify-end p-4">
                        <div className="flex flex-wrap gap-1 mb-2">
                          {item.is_live && (
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-quranic-saffron text-quranic-ink text-[10px] font-bold animate-[live-pulse_1.5s_infinite]">
                              <span className="h-1.5 w-1.5 rounded-full bg-quranic-ink animate-[breathe_2s_infinite]" aria-hidden="true" />
                              زنده
                            </span>
                          )}
                        </div>
                        <h3 className="font-rokh-bold font-bold text-base sm:text-lg leading-snug text-white line-clamp-2 group-hover:text-quranic-saffron transition-colors mb-2">
                          {item.title}
                        </h3>
                        <div className="inline-flex items-center gap-1.5 text-xs text-white/70">
                          <Play className="h-3.5 w-3.5 text-quranic-saffron" aria-hidden="true" />
                          <span>مشاهده</span>
                        </div>
                      </div>
                    </Link>
                  </article>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* ── Category Filter Chips ── */}
      <section className="py-6 sm:py-8 border-b border-border/50">
        <div className="container-quranic">
          <div className="flex flex-wrap gap-2 sm:gap-3 overflow-x-auto no-scrollbar pb-3">
            {CATEGORY_CHIPS.map((cat) => {
              const Icon = cat.icon;
              const isActive = activeCategory === cat.key;
              return (
                <button
                  key={cat.key}
                  onClick={() => setActiveCategory(cat.key)}
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all border ${
                    isActive
                      ? 'bg-quranic-saffron text-quranic-ink border-quranic-saffron shadow-saffron-glow'
                      : 'bg-transparent text-muted-foreground border-border/50 hover:bg-muted/50 hover:text-foreground hover:border-border'
                  }`}
                >
                  <Icon className={`h-3 w-3 ${isActive ? 'text-quranic-ink' : 'text-muted-foreground/60'}`} />
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Main Video Grid ── */}
      <section className="py-10 sm:py-12 lg:py-16">
        <div className="container-quranic">
          <div className="flex items-center justify-between mb-8 sm:mb-10">
            <div>
              <h2 className="font-rokh-bold font-bold text-2xl sm:text-3xl text-foreground">
                ویدیوهای محبوب
              </h2>
              <p className="font-doran text-sm text-muted-foreground mt-1">
                تلاوت‌ها، تفسیرها، محافل و مسابقات قرآنی
              </p>
            </div>
            <Link
              href="/explore"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-quranic-emerald text-white font-rokh-bold font-bold hover:bg-quranic-turquoise transition-all shadow-quranic-glow hidden sm:flex"
            >
              مشاهده همه <ChevronRight className="h-4 w-4" />
            </Link>
          </div>

          {videos.length > 0 ? (
            <div className="grid gap-6 sm:gap-8 lg:gap-10 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {videos.map((item) => (
                <VideoCard
                  key={item.id}
                  item={item}
                  variant="default"
                  showCreator
                  showMeta
                />
              ))}
            </div>
          ) : (
            <EmptyState type="videos" />
          )}
        </div>
      </section>

      {/* ── Qaris & Scholars ── */}
      <ContentSection
        title="قریهان و اساتید معتبر"
        subtitle="شناسایی قریهان برجسته و اساتید تفسیر و معارف قرآنی"
        icon={Users}
        to="/scholars"
        viewAllLabel="مشاهده همه اساتید"
        sectionClassName="py-10 sm:py-12 lg:py-16"
      >
        {qaris.length > 0 ? (
          qaris.map((item) => (
            <ScholarCard key={`scholar-${item.id}`} item={item} variant="default" />
          ))
        ) : (
          <EmptyState type="general" title="استادی ثبت نشده است" subtitle="هیچ استاد یا قاری در سیستم ثبت نشده است." actionLabel="بازگشت به خانه" actionHref="/" />
        )}
      </ContentSection>

      {/* ── Collections ── */}
      <ContentSection
        title="مجموعه‌های موضوعی"
        subtitle="مجموعه‌های انتقادی از آیات و تلاوت‌ها بر اساس موضوع و مفهوم"
        icon={Star}
        to="/collections"
        viewAllLabel="مشاهده همه مجموعه‌ها"
        sectionClassName="py-10 sm:py-12 lg:py-16"
      >
        {collections.length > 0 ? (
          collections.map((item) => (
            <VideoCard key={`collection-${item.id}`} item={item} variant="default" showCreator showMeta />
          ))
        ) : (
          <EmptyState type="general" title="مجموعه‌ای یافت نشد" subtitle="هیچ مجموعه موضوعی در این بخش ثبت نشده است." actionLabel="مشاهده همه مجموعه‌ها" actionHref="/collections" />
        )}
      </ContentSection>

      {/* ── Shorts ── */}
      <section className="py-10 sm:py-12 lg:py-16">
        <div className="container-quranic">
          <div className="flex items-center justify-between mb-8 sm:mb-10">
            <div>
              <h2 className="font-rokh-bold font-bold text-2xl sm:text-3xl text-foreground">
                شارٹس
              </h2>
              <p className="font-doran text-sm text-muted-foreground mt-1">
                ویدیوهای کوتاه قرآنی برای لحظه‌هایומי
              </p>
            </div>
            <Link
              href="/explore?category=shorts"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-quranic-emerald text-white font-rokh-bold font-bold hover:bg-quranic-turquoise transition-all shadow-quranic-glow hidden sm:flex"
            >
              مشاهده همه شارٹس <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="grid gap-4 sm:gap-6 lg:gap-8 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="relative group">
                <div className="aspect-[9/16] rounded-xl overflow-hidden bg-muted/30 flex items-center justify-center">
                  <div className="absolute inset-0 bg-black/20" />
                  <div className="relative z-10 h-14 w-14 rounded-full bg-white text-quranic-emerald flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform">
                    <Play className="h-7 w-7 ml-1" />
                  </div>
                  <div className="absolute bottom-2 right-2 rounded-full bg-black/80 text-white text-[10px] font-bold px-2 py-0.5">
                    0:{i * 10 + 15}
                  </div>
                </div>
                <h3 className="mt-2 font-rokh-bold font-bold text-sm leading-snug line-clamp-2 text-foreground group-hover:text-quranic-emerald transition-colors">
                  شارٹ قرآنی {i}
                </h3>
                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                  <User className="h-3 w-3" />
                  <span>قاری {i}</span>
                  <span>•</span>
                  <span>{fa(Math.floor(Math.random() * 10000))} نمایش</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Live ── */}
      <section className="py-10 sm:py-12 lg:py-16">
        <div className="container-quranic">
          <div className="flex items-center justify-between mb-8 sm:mb-10">
            <div>
              <h2 className="font-rokh-bold font-bold text-2xl sm:text-3xl text-foreground">
                زنده
              </h2>
              <p className="font-doran text-sm text-muted-foreground mt-1">
                محافل زنده و تلاوت‌های زنده از سراسر جهان
              </p>
            </div>
            <Link
              href="/live"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-quranic-saffron text-white font-rokh-bold font-bold hover:bg-quranic-saffron-light transition-all shadow-saffron-glow hidden sm:flex"
            >
              مشاهده همه زنده‌ها <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="grid gap-6 sm:gap-8 lg:gap-10 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="relative group">
                <div className="aspect-video rounded-xl overflow-hidden bg-black flex items-center justify-center">
                  <div className="absolute inset-0 bg-black/40" />
                  <div className="absolute top-2 left-2 inline-flex items-center gap-1 px-2 py-1 rounded-full bg-red-500 text-white text-[10px] font-bold animate-pulse">
                    <span className="h-2 w-2 rounded-full bg-white animate-pulse" />
                    زنده
                  </div>
                  <div className="relative z-10 h-16 w-16 rounded-full bg-white text-red-500 flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform">
                    <Play className="h-7 w-7 ml-1" />
                  </div>
                  <div className="absolute bottom-2 right-2 rounded-full bg-black/80 text-white text-[10px] font-bold px-2 py-0.5">
                    ۲:{i * 10 + 5}
                  </div>
                  <div className="absolute bottom-2 left-2 flex items-center gap-2 px-3 py-1 rounded-full bg-black/80 text-white">
                    <span className="text-xs">{fa(1200 + i * 100)} نماینده</span>
                    <Users className="h-3 w-3 text-white" />
                  </div>
                </div>
                <h3 className="mt-2 font-rokh-bold font-bold text-sm leading-snug line-clamp-2 text-foreground group-hover:text-quranic-saffron transition-colors">
                  محفل زنده قرآنی {i}
                </h3>
                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                  <User className="h-3 w-3" />
                  <span>استاد {i}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-12 sm:py-14 lg:py-18 bg-quranic-emerald-dark/10 border-y border-border/50">
        <div className="container-quranic text-center">
          <div className="max-w-3xl mx-auto">
            <h2 className="font-rokh-bold font-black text-3xl sm:text-4xl lg:text-5xl text-foreground leading-tight mb-4">
              همه قرآن، در یک مکان
            </h2>
            <p className="font-doran text-lg text-muted-foreground mb-8 leading-relaxed">
              تلاوت، تفسیر، تدبّر، محافل، مسابقات و جامعه قرآنی — تجربه‌ای یکپارچه برای دل‌های پیوسته به قرآن
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/quran"
                className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-quranic-emerald text-white font-rokh-bold font-bold hover:bg-quranic-turquoise transition-all shadow-quranic-glow hover:shadow-[0_0_30px_-6px_hsl(var(--quranic-emerald)_/0.6)]"
              >
                <BookOpen className="h-5 w-5" aria-hidden="true" />
                <span>شروع مطالعه قرآن</span>
              </Link>
              <Link
                href="/upload"
                className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl border-2 border-quranic-emerald text-quranic-emerald font-rokh-bold font-bold hover:bg-quranic-emerald/5 transition-all"
              >
                <Upload className="h-5 w-5" aria-hidden="true" />
                <span>بارگذاری ویدیو</span>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
