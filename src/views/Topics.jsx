'use client';
import { useEffect, useState, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { TOPIC_CATEGORIES } from "@/lib/topicData";
import OrnamentalDivider from "@/components/OrnamentalDivider";
import { IslamicStar, SectionOrnament } from "@/components/IslamicOrnaments";
import { Compass, ChevronRight, BookOpen } from "lucide-react";
import PullToRefresh from "@/components/PullToRefresh";

const verseKeyToPath = (vk) => {
  const [s, a] = String(vk).split(":");
  return `/verse/${s}/${a}`;
};

export default function Topics() {
  const [params, setParams] = useSearchParams();
  const selectedTopic = params.get("topic");
  const catFilter = params.get("cat");

  const [verses, setVerses] = useState([]);
  const [topicEntities, setTopicEntities] = useState([]);

  const load = () => {
    base44.entities.Verse.list("-created_date", 200)
      .then(setVerses)
      .catch(() => {});
    if (selectedTopic) {
      base44.entities.Topic.filter({ name: selectedTopic })
        .then(setTopicEntities)
        .catch(() => {});
    }
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (selectedTopic) {
      base44.entities.Topic.filter({ name: selectedTopic })
        .then(setTopicEntities)
        .catch(() => {});
    } else {
      setTopicEntities([]);
    }
  }, [selectedTopic]);

  const matchingVerses = useMemo(() => {
    if (!selectedTopic) return [];
    const tl = selectedTopic.toLowerCase();
    const topicVerseKeys = new Set();
    topicEntities.forEach((t) => {
      (t.verse_keys || []).forEach((k) => topicVerseKeys.add(k));
    });

    return verses.filter(
      (v) =>
        topicVerseKeys.has(v.verse_key) ||
        (v.tags || []).some((t) => t.toLowerCase().includes(tl)) ||
        v.translation?.toLowerCase().includes(tl) ||
        v.tadabbur?.toLowerCase().includes(tl) ||
        (v.life_lessons || []).some((l) => l.toLowerCase().includes(tl))
    );
  }, [selectedTopic, verses, topicEntities]);

  const filteredCategories = catFilter
    ? TOPIC_CATEGORIES.filter((c) => c.id === catFilter)
    : TOPIC_CATEGORIES;

  /* ── Topic detail view ── */
  if (selectedTopic) {
    return (
      <PullToRefresh onRefresh={load}>
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-8 sm:py-12 animate-fade-in">
        <button
          onClick={() => setParams({})}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-accent transition-colors mb-6 sm:mb-8"
        >
          <ChevronRight className="h-4 w-4" /> همه موضوعات
        </button>

        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-accent/20 bg-accent/5 text-accent text-xs font-medium mb-4">
            <Compass className="h-3.5 w-3.5" /> موضوع
          </div>
          <h1 className="font-display font-extrabold text-3xl sm:text-4xl tracking-tight">{selectedTopic}</h1>
          <OrnamentalDivider className="mt-6" />
        </div>

        {matchingVerses.length > 0 ? (
          <div className="space-y-4">
            {matchingVerses.map((v, i) => (
              <Link
                key={v.id}
                to={verseKeyToPath(v.verse_key)}
                className="group block rounded-xl border border-accent/10 bg-card/40 p-4 sm:p-6 hover:border-accent/30 hover:shadow-premium transition-all duration-300 animate-fade-in-up will-animate"
                style={{ animationDelay: `${i * 0.05}s` }}
              >
                <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
                  <span className="font-medium">{v.verse_key}</span>
                  {v.difficulty_level && (
                    <span className="px-2 py-0.5 rounded-full bg-muted/60 text-xs">
                      {v.difficulty_level === "beginner" ? "مقدماتی" : v.difficulty_level === "intermediate" ? "متوسط" : "پیشرفته"}
                    </span>
                  )}
                </div>
                <div className="text-xl sm:text-2xl font-arabic leading-loose text-right text-foreground/80 mb-3" dir="rtl" lang="ar">{v.arabic}</div>
                <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">{v.translation}</p>
              </Link>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-border/60 p-12 text-center">
            <BookOpen className="h-8 w-8 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">
              هنوز تدبّری برای موضوع «{selectedTopic}» ثبت نشده است.
            </p>
            <p className="text-xs text-muted-foreground/70 mt-2">به‌زودی آیات مرتبط با این موضوع افزوده خواهد شد.</p>
          </div>
        )}
      </div>
      </PullToRefresh>
    );
  }

  /* ── Topic directory view ── */
  return (
    <PullToRefresh onRefresh={load}>
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 sm:py-12 animate-fade-in">
      {/* Clean UI Kit Header with Persian Vault ambiance */}
      <div className="relative overflow-hidden rounded-3xl border border-amber-400/30 bg-card p-6 sm:p-10 mb-8 text-center shadow-soft">
        <div className="absolute inset-0 pointer-events-none z-0">
          <img
            src="/images/art/nasir_vault_ceiling.webp"
            alt=""
            className="w-full h-full object-cover filter brightness-[0.22] dark:brightness-[0.14] contrast-[1.1] scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-card/85 via-card/75 to-card/95 backdrop-blur-[1px]" />
        </div>

        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/15 border border-accent/30 text-accent font-ui text-xs font-semibold mb-3">
            <Compass className="h-3.5 w-3.5" /> کاوش موضوعی و معنایی آیات
          </div>
          <h1 className="font-kalameh font-black text-3xl sm:text-4xl text-foreground tracking-tight mb-2">
            موضوعات و مفاهیم قرآنی
          </h1>
          <p className="font-yekan text-muted-foreground text-sm max-w-lg mx-auto">
            کاوش و تدبّر در معارف وحیانی قرآن کریم بر اساس دسته‌بندی‌های موضوعی کاربردی
          </p>

          {/* Category filter */}
          <div className="flex flex-wrap justify-center gap-2 mt-6 font-ui">
            <button
              onClick={() => setParams({})}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                !catFilter
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-card/80 text-muted-foreground hover:text-foreground border border-border/80 backdrop-blur-sm"
              }`}
            >
              همه موضوعات
            </button>
            {TOPIC_CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setParams({ cat: cat.id })}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                  catFilter === cat.id
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "bg-card/80 text-muted-foreground hover:text-foreground border border-border/80 backdrop-blur-sm"
                }`}
              >
                {cat.title}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Topic cards by category */}
      <div className="space-y-12">
        {filteredCategories.map((cat, ci) => (
          <div key={cat.id}>
            <div className="flex items-center gap-3 mb-6">
              <div
                className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl flex items-center justify-center ring-1 ring-border/40"
                style={{ backgroundColor: `${cat.color}18`, color: cat.color }}
              >
                <Compass className="h-5 w-5" />
              </div>
              <div>
                <h2 className="font-display font-bold text-lg sm:text-2xl tracking-tight">{cat.name}</h2>
                <p className="text-xs text-muted-foreground mt-0.5">{cat.topics.length} موضوع</p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {cat.topics.map((topic, i) => (
                <button
                  key={topic.name}
                  onClick={() => setParams({ topic: topic.name })}
                  className="group relative text-right rounded-2xl border border-accent/20 bg-card/85 backdrop-blur-md p-5 hover:border-accent/50 hover:shadow-premium hover:-translate-y-0.5 transition-all duration-300 flex flex-col justify-between"
                  style={{ animationDelay: `${ci * 0.05 + i * 0.03}s` }}
                >
                  <div>
                    <div className="flex items-start justify-between mb-3">
                      <div
                        className="h-10 w-10 rounded-xl flex items-center justify-center ring-1 ring-border/40 shadow-soft"
                        style={{ backgroundColor: `${cat.color}18`, color: cat.color }}
                      >
                        <IslamicStar size={18} className="text-current" />
                      </div>
                      <div className="font-arabic text-2xl text-accent/50 group-hover:text-accent transition-colors" dir="rtl">
                        {topic.name_arabic}
                      </div>
                    </div>
                    <div className="font-display font-bold text-base text-foreground mb-1 group-hover:text-primary transition-colors">
                      {topic.name}
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">{topic.description}</p>
                  </div>
                  <div className="mt-4 pt-2 border-t border-border/40 text-[11px] font-bold text-accent flex items-center gap-1 group-hover:gap-2 transition-all">
                    <span>مشاهده آیات مرتبط</span>
                    <ChevronRight className="h-3 w-3" />
                  </div>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <SectionOrnament className="mt-12" />
    </div>
    </PullToRefresh>
  );
}