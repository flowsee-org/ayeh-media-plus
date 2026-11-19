'use client';
import { useEffect, useState, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import api from "@/lib/api";
import { TOPIC_CATEGORIES, TOPIC_VERSE_KEYS } from "@/lib/topicData";
import { getAyah } from "@/lib/quranApi";
import OrnamentalDivider from "@/components/OrnamentalDivider";
import { Compass, ChevronRight, BookOpen, Loader2 } from "lucide-react";
import PullToRefresh from "@/components/PullToRefresh";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const verseKeyToPath = (vk) => {
  const [s, a] = String(vk).split(":");
  return `/verse/${s}/${a}`;
};

function normalizeKeys(keys) {
  if (!keys) return [];
  if (Array.isArray(keys)) return keys.filter(Boolean);
  if (typeof keys === "string") {
    try {
      const parsed = JSON.parse(keys);
      if (Array.isArray(parsed)) return parsed.filter(Boolean);
    } catch {
      return keys.split(",").map((s) => s.trim()).filter(Boolean);
    }
  }
  return [];
}

export default function Topics() {
  const params = useSearchParams();
  const router = useRouter();
  const selectedTopic = params.get("topic");
  const catFilter = params.get("cat");

  const [matchingVerses, setMatchingVerses] = useState([]);
  const [topicEntities, setTopicEntities] = useState([]);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const loadTopics = () =>
    api.entities.Topic.list("-created_date", 200)
      .then((rows) => setTopicEntities(Array.isArray(rows) ? rows : rows?.items || []))
      .catch(() => setTopicEntities([]));

  useEffect(() => {
    loadTopics();
  }, []);

  useEffect(() => {
    if (!selectedTopic) {
      setMatchingVerses([]);
      return;
    }

    let cancelled = false;
    setLoadingDetail(true);

    (async () => {
      const tl = selectedTopic.toLowerCase();
      const topicVerseKeys = new Set();

      (TOPIC_VERSE_KEYS[selectedTopic] || []).forEach((k) => topicVerseKeys.add(k));

      const entities =
        topicEntities.length > 0
          ? topicEntities
          : await api.entities.Topic.list("-created_date", 200)
            .then((rows) => (Array.isArray(rows) ? rows : rows?.items || []))
            .catch(() => []);

      entities.forEach((t) => {
        const name = (t.name || "").toLowerCase();
        if (
          name === tl ||
          name.includes(tl) ||
          tl.includes(name) ||
          (t.slug && t.slug.toLowerCase() === tl)
        ) {
          normalizeKeys(t.verse_keys).forEach((k) => topicVerseKeys.add(k));
          if (TOPIC_VERSE_KEYS[t.name]) {
            TOPIC_VERSE_KEYS[t.name].forEach((k) => topicVerseKeys.add(k));
          }
        }
      });

      const keys = [...topicVerseKeys];
      const loaded = [];
      for (const key of keys) {
        const [s, a] = String(key).split(":");
        const surah = Number(s);
        const ayah = Number(a);
        if (!surah || !ayah) continue;
        try {
          const ayahData = await getAyah(surah, ayah);
          loaded.push({
            id: key,
            verse_key: key,
            arabic: ayahData.arabic,
            translation: ayahData.translation,
            surah_number: surah,
            verse_number: ayah,
          });
        } catch {
          /* skip unavailable ayah */
        }
      }

      if (!cancelled) {
        setMatchingVerses(loaded);
        setLoadingDetail(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [selectedTopic, topicEntities]);

  const filteredCategories = useMemo(
    () => (catFilter ? TOPIC_CATEGORIES.filter((c) => c.id === catFilter) : TOPIC_CATEGORIES),
    [catFilter]
  );

  /* ── Topic detail view ── */
  if (selectedTopic) {
    return (
      <PullToRefresh
        onRefresh={async () => {
          await loadTopics();
        }}
      >
        <div className="page-shell-reading animate-fade-in">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push('/topics')}
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-accent transition-colors mb-6 sm:mb-8"
          >
            <ChevronRight className="h-4 w-4" /> همه موضوعات
          </Button>

          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded border border-accent/20 bg-accent/5 text-accent text-xs font-medium mb-4">
              <Compass className="h-3.5 w-3.5" /> موضوع
            </div>
            <h1 className="font-rokh-bold font-extrabold text-3xl sm:text-4xl tracking-tight">{selectedTopic}</h1>
            <OrnamentalDivider className="mt-6" />
          </div>

          {loadingDetail ? (
            <div className="flex justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-accent" />
            </div>
          ) : matchingVerses.length > 0 ? (
            <div className="space-y-4">
              {matchingVerses.map((v, i) => (
                <Link
                  key={v.id || v.verse_key}
                  href={verseKeyToPath(v.verse_key)}
                  className="group block rounded border border-accent/10 bg-card/40 p-4 sm:p-6 hover:border-accent/30 hover:shadow-premium transition-all duration-300 animate-fade-in-up will-animate"
                  style={{ animationDelay: `${i * 0.05}s` }}
                >
                  <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
                    <span className="font-medium">{v.verse_key}</span>
                  </div>
                  <div
                    className="text-xl sm:text-2xl leading-loose text-right text-foreground/80 mb-3"
                    dir="rtl"
                    lang="ar"
                  >
                    {v.arabic}
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">
                    {v.translation}
                  </p>
                </Link>
              ))}
            </div>
          ) : (
            <div className="rounded border border-dashed border-border/60 p-12 text-center">
              <BookOpen className="h-8 w-8 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">
                هنوز آیه‌ای برای موضوع «{selectedTopic}» ثبت نشده است.
              </p>
            </div>
          )}
        </div>
      </PullToRefresh>
    );
  }

  /* ── Topic directory view ── */
  return (
    <PullToRefresh onRefresh={loadTopics}>
      <div className="page-shell animate-fade-in">
        <div className="relative overflow-hidden rounded border border-amber-400/30 bg-card p-6 sm:p-10 mb-8 text-center shadow-soft">
          <div className="absolute inset-0 pointer-events-none z-0">
            <img
              src="/images/art/nasir_vault_ceiling.webp"
              alt=""
              className="w-full h-full object-cover filter brightness-[0.22] dark:brightness-[0.14] contrast-[1.1] scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-card/85 via-card/75 to-card/95 backdrop-blur-[1px]" />
          </div>

          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-accent/15 border border-accent/30 text-accent font-ui text-xs font-semibold mb-3">
              <Compass className="h-3.5 w-3.5" /> کاوش موضوعی و معنایی آیات
            </div>
            <h1 className="font-rokh-bold font-black text-3xl sm:text-4xl text-foreground tracking-tight mb-2">
              موضوعات و مفاهیم قرآنی
            </h1>
            <p className="font-doran text-muted-foreground text-sm max-w-lg mx-auto">
              کاوش و تدبّر در معارف وحیانی قرآن کریم بر اساس دسته‌بندی‌های موضوعی کاربردی
            </p>

            <div className="flex flex-wrap justify-center gap-2 mt-6 font-ui">
              <Tabs defaultValue={catFilter || "all"} onValueChange={(v) => { const sp = new URLSearchParams(params.toString()); if (v === "all") { sp.delete("cat"); } else { sp.set("cat", v); } router.push(`/topics?${sp.toString()}`); }}>
                <TabsList className="gap-2">
                  <TabsTrigger value="all" variant="outline" className="px-4 py-2 rounded text-xs sm:text-sm font-bold shrink-0">
                    همه موضوعات
                  </TabsTrigger>
                  {TOPIC_CATEGORIES.map((cat) => (
                    <TabsTrigger
                      key={cat.id}
                      value={cat.id}
                      variant="outline"
                      className="px-4 py-2 rounded text-xs sm:text-sm font-bold shrink-0 border"
                    >
                      {cat.title || cat.name}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>
            </div>
          </div>
        </div>

        <div className="space-y-12">
          {filteredCategories.map((cat) => (
            <div key={cat.id}>
              <div className="flex items-center gap-3 mb-6">
                <div
                  className="h-9 w-9 sm:h-10 sm:w-10 rounded flex items-center justify-center ring-1 ring-border/40"
                  style={{ backgroundColor: `${cat.color}18`, color: cat.color }}
                >
                  <Compass className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="font-rokh-bold font-bold text-lg sm:text-2xl tracking-tight">{cat.name}</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">{cat.topics.length} موضوع</p>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {cat.topics.map((topic, i) => (
                  <Card
                    key={topic.name}
                    className="rounded border border-border/60 bg-card/60 p-4 hover:border-accent/30 hover:shadow-soft transition-all text-right animate-fade-in-up will-animate"
                    style={{ animationDelay: `${i * 0.03}s` }}
                    onClick={() => { const sp = new URLSearchParams(); sp.set("topic", topic.name); router.push(`/topics?${sp.toString()}`); }}
                  >
                    <CardContent className="p-0">
                      <CardTitle className="font-rokh-bold font-bold text-sm mb-1">{topic.name}</CardTitle>
                      {topic.name_arabic && (
                        <div className="text-xs text-accent/80 mb-2" dir="rtl" lang="ar">
                          {topic.name_arabic}
                        </div>
                      )}
                      <CardDescription className="text-xs text-muted-foreground line-clamp-2">
                        {topic.description}
                      </CardDescription>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </PullToRefresh>
  );
}
