'use client';

import { useEffect, useMemo, useState, useCallback } from "react";
import api from "@/lib/api";
import { Search, Video, Mic, Filter } from "lucide-react";
import PullToRefresh from "@/components/PullToRefresh";
import VideoCard from "@/components/design-system/VideoCard";
import { SkeletonGrid } from "@/components/design-system/LoadingSkeleton";
import EmptyState from "@/components/design-system/EmptyState";

const FILTERS = [
  { id: "all", label: "همه" },
  { id: "talk", label: "گفتار" },
  { id: "lecture", label: "درس‌گفتار" },
  { id: "tafsir", label: "تفسیر" },
  { id: "recitation", label: "تلاوت" },
  { id: "gathering", label: "محفل" },
];

export default function Talks() {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [mediaType, setMediaType] = useState("all"); // all | video | audio

  const loadData = useCallback(() => {
    setLoading(true);
    api.entities.Video.filter(
      { status: { in: ["published", "verified"] } },
      { sort: "-created_date", limit: 120 }
    )
      .then((res) => setVideos(res.items || res || []))
      .catch(() => setVideos([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filtered = useMemo(() => {
    let list = videos;
    if (filter !== "all") list = list.filter((v) => v.category === filter);
    if (mediaType === "audio") list = list.filter((v) => v.media_type === "audio" || v.type === "audio");
    if (mediaType === "video") list = list.filter((v) => v.media_type !== "audio" && v.type !== "audio");
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      list = list.filter((v) =>
        [v.title, v.reciter_name, v.scholar_name, v.description]
          .filter(Boolean)
          .some((t) => String(t).toLowerCase().includes(q))
      );
    }
    return list;
  }, [videos, filter, mediaType, query]);

  return (
    <PullToRefresh onRefresh={async () => loadData()}>
      <div className="mx-auto max-w-[1400px] space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
          <div>
            <h1 className="font-rokh-bold text-2xl font-bold text-foreground flex items-center gap-2">
              <Video className="h-6 w-6 text-primary" />
              ویدیوها
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              گفتارها، تفسیرها، تلاوت‌ها و محافل قرآنی
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setMediaType("all")}
              className={`px-3 py-1.5 rounded text-xs font-bold border ${mediaType === "all" ? "bg-foreground text-background border-foreground" : "bg-card border-border"}`}
            >
              همه
            </button>
            <button
              onClick={() => setMediaType("video")}
              className={`inline-flex items-center gap-1 px-3 py-1.5 rounded text-xs font-bold border ${mediaType === "video" ? "bg-foreground text-background border-foreground" : "bg-card border-border"}`}
            >
              <Video className="h-3.5 w-3.5" /> ویدیو
            </button>
            <button
              onClick={() => setMediaType("audio")}
              className={`inline-flex items-center gap-1 px-3 py-1.5 rounded text-xs font-bold border ${mediaType === "audio" ? "bg-foreground text-background border-foreground" : "bg-card border-border"}`}
            >
              <Mic className="h-3.5 w-3.5" /> صوت
            </button>
          </div>
        </div>

        <div className="relative">
          <Search className="absolute end-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="جستجو در عنوان، قاری یا استاد..."
            className="w-full h-11 pe-10 ps-4 rounded bg-card border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/25"
          />
        </div>

        <div className="flex gap-2 overflow-x-auto no-scrollbar">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`inline-flex items-center gap-1.5 shrink-0 px-3.5 py-1.5 rounded text-sm font-medium border transition-colors ${
                filter === f.id
                  ? "bg-foreground text-background border-foreground"
                  : "bg-card text-foreground/80 border-border hover:bg-muted"
              }`}
            >
              {f.id === "all" && <Filter className="h-3.5 w-3.5" />}
              {f.label}
            </button>
          ))}
        </div>

        {loading ? (
          <SkeletonGrid count={8} />
        ) : filtered.length > 0 ? (
          <div className="grid gap-x-4 gap-y-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filtered.map((item) => (
              <VideoCard key={item.id} item={item} showCreator showMeta />
            ))}
          </div>
        ) : (
          <EmptyState type="videos" title="ویدیویی یافت نشد" subtitle="با فیلتر یا عبارت دیگری جستجو کنید." />
        )}
      </div>
    </PullToRefresh>
  );
}
