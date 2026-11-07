'use client';
import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import api from "@/lib/api";
import { getSurahList } from "@/lib/quranApi";
import { JUZ_DATA } from "@/lib/juzData";
import { ALL_TOPICS } from "@/lib/topicData";
import { Search, ArrowLeft, Loader2, BookOpen, Compass, Layers } from "lucide-react";

export default function SearchPage() {
  const [params] = useSearchParams();
  const [query, setQuery] = useState(params.get("q") || "");
  const [reflResults, setReflResults] = useState([]);
  const [surahResults, setSurahResults] = useState([]);
  const [topicResults, setTopicResults] = useState([]);
  const [juzResults, setJuzResults] = useState([]);
  const [surahs, setSurahs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    getSurahList().then(setSurahs).catch(() => {});
  }, []);

  useEffect(() => {
    const qParam = params.get("q");
    if (qParam !== null && qParam !== query) {
      setQuery(qParam);
    }
  }, [params]);

  const run = async (q) => {
    if (!q.trim()) {
      setReflResults([]);
      setSurahResults([]);
      setTopicResults([]);
      setJuzResults([]);
      setSearched(false);
      return;
    }
    setLoading(true);
    setSearched(true);
    const ql = q.toLowerCase();
    setSurahResults(
      surahs.filter(
        (s) => s.persianName?.includes(q) || s.englishName?.toLowerCase().includes(ql) || s.name?.includes(q) || String(s.number).includes(q)
      )
    );
    setTopicResults(
      ALL_TOPICS.filter(
        (t) => t.name.includes(q) || t.name_arabic.includes(q) || t.description?.includes(q) || t.categoryName?.includes(q)
      )
    );
    setJuzResults(
      JUZ_DATA.filter(
        (j) => String(j.number).includes(q) || j.persianName.includes(q) || j.arabicName.includes(q) || j.description.includes(q)
      )
    );
    try {
      const all = await api.entities.Verse.list("-created_date", 100);
      setReflResults(
        all.filter(
          (v) =>
            v.translation?.toLowerCase().includes(ql) ||
            v.arabic?.includes(q) ||
            v.tadabbur?.toLowerCase().includes(ql) ||
            (v.tags || []).some((t) => t.toLowerCase().includes(ql)) ||
            (v.life_lessons || []).some((l) => l.toLowerCase().includes(ql)) ||
            (v.root_words || []).some((r) => r.root?.includes(q) || r.meaning?.toLowerCase().includes(ql)) ||
            v.verse_key?.includes(q)
        )
      );
    } catch {
      setReflResults([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    const t = setTimeout(() => run(query), 350);
    return () => clearTimeout(t);
  }, [query, surahs]);

  const parseKey = (vk) => {
    const [s, a] = String(vk).split(":");
    return `/verse/${s}/${a}`;
  };

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-12 animate-fade-in">
      <div className="text-center mb-10">
        <h1 className="font-display font-extrabold text-4xl tracking-tight">جستجو</h1>
        <p className="text-muted-foreground mt-2">جستجو در آیات، ترجمه، سوره‌ها، موضوعات و تدبّرها.</p>
      </div>

      <div className="relative">
        <Search className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <input
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="کلمه عربی، ترجمه فارسی، نام سوره، یا موضوع…"
          className="w-full pr-12 pl-4 py-3.5 rounded-2xl border border-border/50 bg-card/50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all"
        />
      </div>

      <div className="mt-8 space-y-10">
        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-accent" /></div>
        ) : (
          <>
            {surahResults.length > 0 && (
              <div>
                <h3 className="text-xs font-medium tracking-wider text-muted-foreground uppercase mb-3">سوره‌ها</h3>
                <div className="grid sm:grid-cols-2 gap-2">
                  {surahResults.slice(0, 8).map((s) => (
                    <Link key={s.number} to={`/quran?surah=${s.number}`} className="group flex items-center justify-between rounded-xl border border-border/40 bg-card/40 p-3 hover:border-accent/25 hover:shadow-soft transition-all duration-300">
                      <div className="flex items-center gap-3">
                        <span className="h-9 w-9 rounded-lg bg-muted/50 flex items-center justify-center text-sm font-bold">{s.number}</span>
                        <span className="text-sm font-medium">{s.persianName || s.englishName}</span>
                      </div>
                      <span className="font-arabic text-xl text-accent/40 group-hover:text-accent/60 transition-colors" dir="rtl">{s.name}</span>
                    </Link>
                  ))}
                </div>
              </div>
            )}
            {topicResults.length > 0 && (
              <div>
                <h3 className="text-xs font-medium tracking-wider text-muted-foreground mb-3">موضوعات</h3>
                <div className="grid sm:grid-cols-2 gap-2">
                  {topicResults.slice(0, 8).map((t, i) => (
                    <Link key={i} to={`/topics?topic=${encodeURIComponent(t.name)}`} className="group flex items-center justify-between rounded-xl border border-border/40 bg-card/40 p-3 hover:border-accent/25 hover:shadow-soft transition-all duration-300">
                      <div className="flex items-center gap-3">
                        <span className="h-9 w-9 rounded-lg bg-accent/10 flex items-center justify-center text-accent" style={{ backgroundColor: `${t.color}18`, color: t.color }}>
                          <Compass className="h-4 w-4" />
                        </span>
                        <div>
                          <span className="text-sm font-medium">{t.name}</span>
                          <span className="text-xs text-muted-foreground block">{t.categoryName}</span>
                        </div>
                      </div>
                      <span className="font-arabic text-lg text-accent/40 group-hover:text-accent/60 transition-colors" dir="rtl">{t.name_arabic}</span>
                    </Link>
                  ))}
                </div>
              </div>
            )}
            {juzResults.length > 0 && (
              <div>
                <h3 className="text-xs font-medium tracking-wider text-muted-foreground mb-3">اجزاء</h3>
                <div className="grid sm:grid-cols-2 gap-2">
                  {juzResults.map((j) => (
                    <Link key={j.number} to={`/quran?juz=${j.number}`} className="group flex items-center justify-between rounded-xl border border-border/40 bg-card/40 p-3 hover:border-accent/25 hover:shadow-soft transition-all duration-300">
                      <div className="flex items-center gap-3">
                        <span className="h-9 w-9 rounded-lg bg-accent/10 text-accent flex items-center justify-center text-sm font-bold">{j.number}</span>
                        <span className="text-sm font-medium">جزء {j.number} — {j.persianName}</span>
                      </div>
                      <Layers className="h-4 w-4 text-muted-foreground/30 group-hover:text-accent/50 transition-colors" />
                    </Link>
                  ))}
                </div>
              </div>
            )}
            {reflResults.length > 0 && (
              <div>
                <h3 className="text-xs font-medium tracking-wider text-muted-foreground uppercase mb-3">تدبّرها</h3>
                <div className="space-y-3">
                  {reflResults.map((v) => (
                    <Link key={v.id} to={parseKey(v.verse_key)} className="group block rounded-2xl border border-border/40 bg-card/40 p-5 hover:border-accent/25 hover:shadow-premium transition-all duration-300">
                      <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
                        <span className="font-medium">{v.verse_key}</span>
                        <ArrowLeft className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-all" />
                      </div>
                      <div className="text-xl font-arabic text-right text-foreground/80" dir="rtl">{v.arabic}</div>
                      <p className="text-sm text-muted-foreground mt-2 line-clamp-2 leading-relaxed">{v.translation}</p>
                      {v.tags?.length > 0 && (
                        <div className="mt-3 flex gap-1.5 flex-wrap">
                          {v.tags.slice(0, 3).map((t) => <span key={t} className="text-xs px-2.5 py-0.5 rounded-full bg-accent/15 border border-accent/25 text-accent font-medium">#{t}</span>)}
                        </div>
                      )}
                    </Link>
                  ))}
                </div>
              </div>
            )}
            {searched && surahResults.length === 0 && topicResults.length === 0 && juzResults.length === 0 && reflResults.length === 0 && (
              <div className="rounded-2xl border border-dashed border-border/60 p-12 text-center">
                <BookOpen className="h-8 w-8 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">نتیجه‌ای برای «{query}» یافت نشد.</p>
              </div>
            )}
            {!searched && (
              <div className="rounded-2xl border border-dashed border-border/60 p-12 text-center">
                <Search className="h-8 w-8 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">برای جستجو شروع به تایپ کنید.</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}