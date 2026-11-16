'use client';

import { useEffect, useMemo, useState, useCallback } from "react";
import { useNavigate } from "@/lib/router-compat";
import { useSearchParams } from 'next/navigation';
import api from "@/lib/api";
import { Compass, Search, Flame, Clock, TrendingUp } from "lucide-react";
import PullToRefresh from "@/components/PullToRefresh";
import VideoCard from "@/components/design-system/VideoCard";
import ScholarCard from "@/components/design-system/ScholarCard";
import { SkeletonGrid } from "@/components/design-system/LoadingSkeleton";
import EmptyState from "@/components/design-system/EmptyState";

const CHIPS = [
  { id: "all", label: "همه" },
  { id: "trending", label: "پرطرفدار", icon: Flame },
  { id: "recent", label: "تازه‌ها", icon: Clock },
  { id: "short", label: "شورت‌ها", icon: TrendingUp },
  { id: "recitation", label: "تلاوت" },
  { id: "tafsir", label: "تفسیر" },
  { id: "gathering", label: "محافل" },
  { id: "competition", label: "مسابقات" },
  { id: "talk", label: "گفتار" },
];

function isShortVideo(v) {
  const tags = Array.isArray(v.tags) ? v.tags.join(",") : String(v.tags || "");
  if (v.category === "short" || tags.includes("شورت") || tags.includes("کوتاه")) return true;
  const d = String(v.duration || "");
  const m = d.match(/(\d+)/g);
  if (!m || !d.includes(":")) return false;
  const parts = m.map(Number);
  const secs = parts.length === 3 ? parts[0] * 3600 + parts[1] * 60 + parts[2] : parts[0] * 60 + parts[1];
  return secs > 0 && secs <= 90;
}

export default function Explore() {
  const navigate = useNavigate();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [videos, setVideos] = useState([]);
  const [scholars, setScholars] = useState([]);
  const [chip, setChip] = useState(() => {
    const sort = searchParams.get("sort");
    return sort === "short" ? "short" : "all";
  });
  const [query, setQuery] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [vids, sch] = await Promise.all([
        api.entities.Video.filter(
          { status: { in: ["published", "verified"] } },
          { sort: "-created_date", limit: 100 }
        ).catch(() => ({ items: [] })),
        api.entities.Scholar.list("-created_date", 24).catch(() => ({ items: [] })),
      ]);
      setVideos(vids.items || vids || []);
      setScholars(sch.items || sch || []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    let list = [...videos];
    if (chip === "trending") {
      list.sort((a, b) => (b.views_count || 0) - (a.views_count || 0));
    } else if (chip === "recent") {
      list.sort((a, b) => new Date(b.created_date || 0) - new Date(a.created_date || 0));
    } else if (chip === "short") {
      list = list.filter(isShortVideo);
    } else if (chip === "competition") {
      list = list.filter((v) => v.is_competition || v.category === "competition");
    } else if (chip !== "all") {
      list = list.filter((v) => v.category === chip);
    }
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      list = list.filter((v) =>
        [v.title, v.reciter_name, v.scholar_name, v.description]
          .filter(Boolean)
          .some((t) => String(t).toLowerCase().includes(q))
      );
    }
    return list;
  }, [videos, chip, query]);

  return (
    <PullToRefresh onRefresh={load}>
      <div className="mx-auto max-w-[1400px] space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
          <div>
            <h1 className="font-rokh-bold text-2xl font-bold flex items-center gap-2">
              <Compass className="h-6 w-6 text-primary" />
              کاوش
            </h1>
            <p className="text-sm text-muted-foreground mt-1 font-doran">
              کشف ویدیوهای قرآنی بر اساس موضوع و محبوبیت
            </p>
          </div>
          <button
            onClick={() => navigate("/search")}
            className="inline-flex items-center gap-2 px-4 py-2 rounded border border-border bg-card text-sm font-medium hover:bg-muted"
          >
            <Search className="h-4 w-4" />
            جستجوی پیشرفته
          </button>
        </div>

        <div className="relative">
          <Search className="absolute end-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="جستجو در کاوش..."
            className="w-full h-11 pe-10 ps-4 rounded bg-card border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/25"
          />
        </div>

        <div className="flex gap-2 overflow-x-auto no-scrollbar">
          {CHIPS.map((c) => {
            const Icon = c.icon;
            const active = chip === c.id;
            return (
              <button
                key={c.id}
                onClick={() => setChip(c.id)}
                className={`inline-flex items-center gap-1.5 shrink-0 px-3.5 py-1.5 rounded text-sm font-medium border transition-colors ${
                  active
                    ? "bg-foreground text-background border-foreground"
                    : "bg-card text-foreground/80 border-border hover:bg-muted"
                }`}
              >
                {Icon && <Icon className="h-3.5 w-3.5" />}
                {c.label}
              </button>
            );
          })}
        </div>

        {scholars.length > 0 && chip === "all" && !query && (
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-rokh-bold font-bold text-base inline-flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                کانال‌های پیشنهادی
              </h2>
            </div>
            <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1">
              {scholars.slice(0, 10).map((s) => (
                <ScholarCard key={s.id} item={s} variant="compact" />
              ))}
            </div>
          </section>
        )}

        {loading ? (
          <SkeletonGrid count={8} />
        ) : filtered.length > 0 ? (
          <div className="grid gap-x-4 gap-y-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filtered.map((item) => (
              <VideoCard key={item.id} item={item} showCreator showMeta />
            ))}
          </div>
        ) : (
          <EmptyState type="videos" title="محتوایی یافت نشد" subtitle="فیلتر یا عبارت جستجو را تغییر دهید." />
        )}
      </div>
    </PullToRefresh>
  );
}
