'use client';
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import api from "@/lib/api";
import { getSurahList } from "@/lib/quranApi";
import { JUZ_DATA } from "@/lib/juzData";
import { ALL_TOPICS } from "@/lib/topicData";
import { Search, ArrowLeft, Loader2, BookOpen, Compass, Layers, Mic, Trophy, ChevronRight, Users } from "lucide-react";

// New design system
import ContentSection from "@/components/design-system/ContentSection";
import VideoCard from "@/components/design-system/VideoCard";
import RecitationCard from "@/components/design-system/RecitationCard";
import ScholarCard from "@/components/design-system/ScholarCard";
import GatheringCard from "@/components/design-system/GatheringCard";
import CollectionCard from "@/components/design-system/CollectionCard";
import { SkeletonGrid } from "@/components/design-system/LoadingSkeleton";
import EmptyState from "@/components/design-system/EmptyState";

/**
 * Search Categories — Persian labels with icons
 */
const SEARCH_FILTERS = [
  { id: 'all', label: 'همه', icon: Search },
  { id: 'surah', label: 'سوره', icon: BookOpen },
  { id: 'reciters', label: 'قاری', icon: Mic },
  { id: 'scholar', label: 'استاد', icon: Users },
  { id: 'tafsir', label: 'تفسیر', icon: BookOpen },
  { id: 'competitions', label: 'مسابقات', icon: Trophy },
  { id: 'gathering', label: 'محافل', icon: Users },
  { id: 'videos', label: 'ویدئوها', icon: ChevronRight },
  { id: 'verses', label: 'آیه', icon: ChevronRight },
  { id: 'qari', label: 'قاری', icon: Mic }, // legacy alias
  { id: 'ayah', label: 'آیه', icon: ChevronRight }, // legacy alias
];

// Map legacy/incoming category IDs to internal filter IDs
const CATEGORY_MAP = {
  'reciters': 'reciters',
  'verses': 'verses',
  'qari': 'reciters',
  'ayah': 'verses',
};

/**
 * Normalize Persian/Arabic text for search
 * Removes diacritics, normalizes alef/yeh variants, lowercases
 */
function normalizeText(text) {
  if (!text) return '';
  return String(text)
    .toLowerCase()
    .replace(/[\u064b-\u065f]/g, '') // Remove Arabic diacritics
    .replace(/[أإآ]/g, 'ا') // Normalize alef
    .replace(/ي/g, 'ی') // Normalize yeh
    .replace(/ك/g, 'ک') // Normalize kaf
    .replace(/[^\u0600-\u06ffa-z0-9\s]/g, '') // Keep Persian/Arabic + alphanumeric
    .trim();
}

export default function SearchPage() {
  const [params] = useSearchParams();
  const [query, setQuery] = useState(params.get("q") || "");
  const [activeFilter, setActiveFilter] = useState(params.get("category") || "all");
  const [results, setResults] = useState({
    ayahs: [],
    surahs: [],
    qaris: [],
    scholars: [],
    tafsir: [],
    competitions: [],
    gatherings: [],
    videos: [],
    collections: [],
  });
  const [surahs, setSurahs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    getSurahList().then(setSurahs).catch(() => {});
  }, []);

  useEffect(() => {
    const qParam = params.get("q");
    if (qParam !== null && qParam !== query) {
      setQuery(qParam);
    }
    const catParam = params.get("category");
    if (catParam && catParam !== activeFilter) {
      setActiveFilter(catParam);
    }
  }, [params, query, activeFilter]);

  const runSearch = async (q) => {
    if (!q.trim()) {
      setResults({
        ayahs: [], surahs: [], qaris: [], scholars: [], tafsir: [],
        competitions: [], gatherings: [], videos: [], collections: [],
      });
      setSearched(false);
      setError(null);
      return;
    }

    setLoading(true);
    setSearched(true);
    setError(null);
    const ql = normalizeText(q);

    try {
      // ── Surahs ──
      const surahMatches = surahs.filter(
        (s) =>
          normalizeText(s.persianName || '').includes(ql) ||
          normalizeText(s.englishName || '').includes(ql) ||
          normalizeText(s.name || '').includes(ql) ||
          String(s.number).includes(q)
      );

      // ── Verses (Ayahs) ──
      // Search verses from the external Quran API instead of non-existent Verse model
      let ayahMatches = [];
      try {
        const { getSurahVerses } = await import('@/lib/quranApi');
        // Search in a few key surahs for performance
        const keySurahs = [1, 2, 3, 4, 5, 6, 7, 18, 36, 55, 67, 112, 113, 114];
        const versePromises = keySurahs.map((s) => getSurahVerses(s).catch(() => null));
        const surahVerses = await Promise.all(versePromises);
        
        surahVerses.forEach((sv) => {
          if (sv && sv.verses) {
            sv.verses.forEach((v) => {
              if (
                normalizeText(v.translation || '').includes(ql) ||
                normalizeText(v.text_arabic || '').includes(ql) ||
                v.verse_key?.includes(q)
              ) {
                ayahMatches.push({
                  id: v.verse_key,
                  verse_key: v.verse_key,
                  surah: v.surah,
                  arabic: v.text_arabic,
                  translation: v.translation,
                });
              }
            });
          }
        });
      } catch (err) {
        console.error("Verse search error:", err);
      }

      // ── Topics ──
      const topicMatches = ALL_TOPICS.filter(
        (t) =>
          normalizeText(t.name).includes(ql) ||
          normalizeText(t.name_arabic || '').includes(ql) ||
          normalizeText(t.description || '').includes(ql) ||
          normalizeText(t.categoryName || '').includes(ql)
      );

      // ── Videos ──
      let videoMatches = [];
      try {
        const allVideos = await api.entities.Video.filter(
          { status: "published" },
          { sort: "-created_date", limit: 200 }
        );
        const videos = allVideos.items || allVideos || [];
        videoMatches = videos.filter(
          (v) =>
            normalizeText(v.title || '').includes(ql) ||
            normalizeText(v.description || '').includes(ql) ||
            normalizeText(v.reciter_name || '').includes(ql) ||
            normalizeText(v.scholar_name || '').includes(ql) ||
            (v.tags || []).some((t) => normalizeText(t).includes(ql)) ||
            v.verse_key?.includes(q)
        );
      } catch (err) {
        console.error("Video search error:", err);
      }

      // ── Gatherings ── (CRITICAL FIX: properly connected)
      let gatheringMatches = [];
      try {
        // Search gatherings as videos with category=gathering
        const allGatherings = await api.entities.Video.filter(
          { category: "gathering", status: "published" },
          { sort: "-created_date", limit: 200 }
        );
        const gatherings = allGatherings.items || allGatherings || [];
        gatheringMatches = gatherings.filter(
          (g) =>
            normalizeText(g.title || '').includes(ql) ||
            normalizeText(g.description || '').includes(ql) ||
            normalizeText(g.venue || '').includes(ql) ||
            normalizeText(g.reciters || '').includes(ql) ||
            (g.tags || []).some((t) => normalizeText(t).includes(ql))
        );
        // Also try the gathering entity directly if it exists
        try {
          const gatheringEntities = await api.entities.Gathering.list("-created_date", 100);
          const ge = gatheringEntities.items || gatheringEntities || [];
          ge.forEach((g) => {
            if (
              normalizeText(g.title || '').includes(ql) ||
              normalizeText(g.description || '').includes(ql)
            ) {
              if (!gatheringMatches.find((m) => m.id === g.id)) {
                gatheringMatches.push(g);
              }
            }
          });
        } catch {
          // Gathering entity may not exist - handled via Video category
        }
      } catch (err) {
        console.error("Gathering search error:", err);
      }

      // ── Scholars/Qaris ──
      let scholarMatches = [];
      let qariMatches = [];
      try {
        const allScholars = await api.entities.Scholar.list("-created_date", 100);
        const scholarsList = allScholars.items || allScholars || [];
        scholarMatches = scholarsList.filter(
          (s) =>
            normalizeText(s.name || '').includes(ql) ||
            normalizeText(s.name_arabic || '').includes(ql) ||
            normalizeText(s.title || '').includes(ql) ||
            normalizeText(s.bio || '').includes(ql)
        );
        // Filter for actual reciters (those with reciter role or reciter_id)
        qariMatches = scholarsList.filter(
          (s) =>
            (s.reciter_id || s.is_reciter || s.role === 'reciter') &&
            (normalizeText(s.name || '').includes(ql) ||
              normalizeText(s.name_arabic || '').includes(ql) ||
              normalizeText(s.title || '').includes(ql) ||
              normalizeText(s.bio || '').includes(ql))
        );
        // If no explicit reciters found, use all scholars as fallback for qaris
        if (qariMatches.length === 0) {
          qariMatches = scholarMatches;
        }
      } catch (err) {
        console.error("Scholar search error:", err);
      }

      // ── Competitions ──
      let competitionMatches = [];
      try {
        const allCompetitions = await api.entities.Competition.list("-created_date", 100);
        const competitions = allCompetitions.items || allCompetitions || [];
        competitionMatches = competitions.filter(
          (c) =>
            normalizeText(c.title || '').includes(ql) ||
            normalizeText(c.title_arabic || '').includes(ql) ||
            normalizeText(c.description || '').includes(ql) ||
            normalizeText(c.type || '').includes(ql)
        );
      } catch (err) {
        console.error("Competition search error:", err);
      }

      // ── Collections ──
      let collectionMatches = [];
      try {
        const allCollections = await api.entities.Collection.list("-created_date", 100);
        const collections = allCollections.items || allCollections || [];
        collectionMatches = collections.filter(
          (c) =>
            normalizeText(c.name || '').includes(ql) ||
            normalizeText(c.description || '').includes(ql)
        );
      } catch (err) {
        console.error("Collection search error:", err);
      }

      // ── Tafsir Videos ──
      let tafsirMatches = [];
      try {
        const allTafsir = await api.entities.Video.filter(
          { category: "tafsir", status: "published" },
          { sort: "-created_date", limit: 200 }
        );
        const tafsirVideos = allTafsir.items || allTafsir || [];
        tafsirMatches = tafsirVideos.filter(
          (v) =>
            normalizeText(v.title || '').includes(ql) ||
            normalizeText(v.description || '').includes(ql) ||
            normalizeText(v.reciter_name || '').includes(ql) ||
            normalizeText(v.scholar_name || '').includes(ql) ||
            (v.tags || []).some((t) => normalizeText(t).includes(ql))
        );
      } catch (err) {
        console.error("Tafsir search error:", err);
      }

      setResults({
        ayahs: ayahMatches,
        surahs: surahMatches,
        qaris: qariMatches,
        scholars: scholarMatches,
        tafsir: tafsirMatches,
        competitions: competitionMatches,
        gatherings: gatheringMatches,
        videos: videoMatches,
        collections: collectionMatches,
      });
    } catch (err) {
      setError(err.message || "خطا در انجام جستجو");
      console.error("Search error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const t = setTimeout(() => runSearch(query), 350);
    return () => clearTimeout(t);
  }, [query, surahs, activeFilter]);

  // Get filtered results based on active filter
  // Normalize incoming category ID to internal filter ID
  const normalizeCategory = (cat) => {
    return CATEGORY_MAP[cat] || cat;
  };

  const internalFilter = normalizeCategory(activeFilter);

  const getFilteredResults = () => {
    switch (internalFilter) {
      case 'verses': return results.ayahs;
      case 'surah': return results.surahs;
      case 'reciters': return results.qaris;
      case 'scholar': return results.scholars;
      case 'tafsir': return results.tafsir;
      case 'competitions': return results.competitions;
      case 'gathering': return results.gatherings;
      case 'videos': return results.videos;
      case 'collections': return results.collections;
      default: return results; // all
    }
  };

  const filteredResults = getFilteredResults();
  const totalCount = internalFilter === 'all'
    ? Object.values(results).reduce((sum, arr) => sum + arr.length, 0)
    : filteredResults.length;

  const parseKey = (vk) => {
    const [s, a] = String(vk).split(":");
    return `/verse/${s}/${a}`;
  };

  // Render result items by type
  const renderResultItem = (item, type) => {
    switch (type) {
      case 'surah':
        return (
          <div key={item.number} className="group flex items-center justify-between rounded-xl border border-border/40 bg-card/40 p-3 hover:border-accent/25 hover:shadow-soft transition-all duration-300">
            <div className="flex items-center gap-3">
              <span className="h-9 w-9 rounded-lg bg-muted/50 flex items-center justify-center text-sm font-bold">{item.number}</span>
              <span className="text-sm font-medium">{item.persianName || item.englishName}</span>
            </div>
            <span className="font-arabic text-xl text-accent/40 group-hover:text-accent/60 transition-colors" dir="rtl">{item.name}</span>
          </div>
        );
      case 'ayah':
        return (
          <div key={item.id} className="group block rounded-2xl border border-border/40 bg-card/40 p-5 hover:border-accent/25 hover:shadow-premium transition-all duration-300">
            <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
              <span className="font-medium">{item.verse_key}</span>
              <ArrowLeft className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-all" />
            </div>
            <div className="text-xl font-arabic text-right text-foreground/80" dir="rtl">{item.arabic}</div>
            <p className="text-sm text-muted-foreground mt-2 line-clamp-2 leading-relaxed">{item.translation}</p>
          </div>
        );
      case 'qari':
      case 'scholar':
        return (
          <ScholarCard key={item.id} item={item} variant="default" />
        );
      case 'competitions':
        return (
          <VideoCard key={item.id} item={{ ...item, is_competition: true }} variant="default" showCreator showMeta />
        );
      case 'gathering':
        return (
          <GatheringCard key={item.id} item={item} />
        );
      case 'videos':
        return (
          <VideoCard key={item.id} item={item} variant="default" showCreator showMeta />
        );
      case 'collections':
        return (
          <CollectionCard key={item.id} item={item} />
        );
      default:
        return null;
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 animate-fade-in">
      <div className="text-center mb-10">
        <h1 className="font-display font-extrabold text-4xl sm:text-5xl tracking-tight">جستجو</h1>
        <p className="text-muted-foreground mt-2">
          جستجو در آیات، ترجمه، سوره‌ها، قاریان، اساتید، تفسیر، مسابقات، محافل و ویدیوها.
        </p>
      </div>

      {/* Search Input */}
      <div className="relative mb-10">
        <Search className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <input
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="کلمه عربی، ترجمه فارسی، نام سوره، نام قاری، یا موضوع…"
          className="w-full pr-12 pl-4 py-3.5 rounded-2xl border border-border/50 bg-card/50 text-sm focus:outline-none focus:ring-2 focus-ring focus:ring-primary/20 focus:border-primary/30 transition-all"
        />
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-4 mb-8 border-b border-border/60">
        {SEARCH_FILTERS.map((filter) => {
          const Icon = filter.icon;
          const isActive = activeFilter === filter.id;
          return (
            <button
              key={filter.id}
              onClick={() => setActiveFilter(filter.id)}
              className={`shrink-0 inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-medium font-ui transition-all border ${
                isActive
                  ? 'bg-quranic-emerald text-white shadow-quranic-glow'
                  : 'bg-transparent text-muted-foreground border-border/50 hover:bg-muted/50 hover:text-foreground'
              }`}
            >
              <Icon className={`h-3 w-3 ${isActive ? 'text-white' : 'text-muted-foreground/60'}`} />
              {filter.label}
            </button>
          );
        })}
      </div>

      {/* Results */}
      {loading ? (
        <div className="flex justify-center py-20">
          <SkeletonGrid count={6} />
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-destructive/20 bg-destructive/[0.03] p-12 text-center">
          <BookOpen className="h-8 w-8 text-destructive/30 mx-auto mb-3" />
          <h3 className="font-rokh-bold font-bold text-lg text-destructive mb-2">خطا در جستجو</h3>
          <p className="text-sm text-muted-foreground">{error}</p>
          <button
            onClick={() => runSearch(query)}
            className="mt-4 px-6 py-2 rounded-xl bg-quranic-emerald text-white text-sm font-medium hover:opacity-90 transition-colors"
          >
            تلاش مجدد
          </button>
        </div>
      ) : (
        <>
          {searched && totalCount === 0 && (
            <EmptyState
              type="search"
              title="نتیجه‌ای یافت نشد"
              subtitle={`هیچ نتایجی برای «${query}» در دسته‌بندی "${SEARCH_FILTERS.find(f => f.id === internalFilter)?.label || 'همه'}" یافت نشد.`}
              actionLabel="جستجوی جدید"
              actionHref="/search"
            />
          )}

          {searched && totalCount > 0 && (
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <span className="font-ui text-xs text-muted-foreground">
                  {totalCount} نتیجه یافت شد
                </span>
                <span className="font-ui text-xs text-quranic-emerald font-semibold">
                  فیلتر: {SEARCH_FILTERS.find(f => f.id === internalFilter)?.label || 'همه'}
                </span>
              </div>

              {activeFilter === 'all' && (
                <div className="grid gap-8">
                  {results.surahs.length > 0 && (
                    <div>
                      <h3 className="text-xs font-medium tracking-wider text-muted-foreground uppercase mb-3">سوره‌ها</h3>
                      <div className="grid sm:grid-cols-2 gap-2">
                        {results.surahs.slice(0, 8).map((s) => renderResultItem(s, 'surah'))}
                      </div>
                    </div>
                  )}
                  {results.qaris.length > 0 && (
                    <div>
                      <h3 className="text-xs font-medium tracking-wider text-muted-foreground uppercase mb-3">قاریان</h3>
                      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {results.qaris.slice(0, 6).map((q) => renderResultItem(q, 'qari'))}
                      </div>
                    </div>
                  )}
                  {results.scholars.length > 0 && (
                    <div>
                      <h3 className="text-xs font-medium tracking-wider text-muted-foreground uppercase mb-3">اساتید</h3>
                      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {results.scholars.slice(0, 6).map((s) => renderResultItem(s, 'scholar'))}
                      </div>
                    </div>
                  )}
                  {results.gatherings.length > 0 && (
                    <div>
                      <h3 className="text-xs font-medium tracking-wider text-muted-foreground uppercase mb-3">محافل</h3>
                      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {results.gatherings.slice(0, 6).map((g) => renderResultItem(g, 'gathering'))}
                      </div>
                    </div>
                  )}
                  {results.tafsir.length > 0 && (
                    <div>
                      <h3 className="text-xs font-medium tracking-wider text-muted-foreground uppercase mb-3">تفسیر</h3>
                      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {results.tafsir.slice(0, 6).map((t) => renderResultItem(t, 'videos'))}
                      </div>
                    </div>
                  )}
                  {results.competitions.length > 0 && (
                    <div>
                      <h3 className="text-xs font-medium tracking-wider text-muted-foreground uppercase mb-3">مسابقات</h3>
                      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {results.competitions.slice(0, 6).map((c) => renderResultItem(c, 'competitions'))}
                      </div>
                    </div>
                  )}
                  {results.videos.length > 0 && (
                    <div>
                      <h3 className="text-xs font-medium tracking-wider text-muted-foreground uppercase mb-3">ویدئوها</h3>
                      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {results.videos.slice(0, 6).map((v) => renderResultItem(v, 'videos'))}
                      </div>
                    </div>
                  )}
                  {results.collections.length > 0 && (
                    <div>
                      <h3 className="text-xs font-medium tracking-wider text-muted-foreground uppercase mb-3">مجموعه‌ها</h3>
                      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {results.collections.slice(0, 6).map((c) => renderResultItem(c, 'collections'))}
                      </div>
                    </div>
                  )}
                  {results.ayahs.length > 0 && (
                    <div>
                      <h3 className="text-xs font-medium tracking-wider text-muted-foreground uppercase mb-3">آیات</h3>
                      <div className="space-y-3">
                        {results.ayahs.slice(0, 8).map((a) => renderResultItem(a, 'ayah'))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeFilter !== 'all' && filteredResults.length > 0 && (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {filteredResults.map((item) => {
                    if (activeFilter === 'ayah') return renderResultItem(item, 'ayah');
                    if (activeFilter === 'surah') return renderResultItem(item, 'surah');
                    if (activeFilter === 'qari' || activeFilter === 'scholar') return renderResultItem(item, 'scholar');
                    if (activeFilter === 'competitions') return renderResultItem(item, 'competitions');
                    if (activeFilter === 'gathering') return renderResultItem(item, 'gathering');
                    if (activeFilter === 'videos') return renderResultItem(item, 'videos');
                    if (activeFilter === 'collections') return renderResultItem(item, 'collections');
                    return null;
                  })}
                </div>
              )}
            </div>
          )}

          {!searched && (
            <div className="rounded-2xl border border-dashed border-border/60 p-16 text-center">
              <Search className="h-10 w-10 text-muted-foreground/30 mx-auto mb-4" />
              <p className="text-sm text-muted-foreground">برای جستجو شروع به تایپ کنید.</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
