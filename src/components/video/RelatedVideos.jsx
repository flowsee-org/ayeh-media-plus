'use client';

import { useEffect, useState } from "react";
import Link from "next/link";
import { Play, Eye } from "lucide-react";
import api from "@/lib/api";
import { fa } from "@/lib/utils";

export default function RelatedVideos({ videoId, category, limit = 8 }) {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const fetchRelated = async () => {
      try {
        setLoading(true);
        const result = await api.entities.Video.filter(
          { status: "published", category },
          "-created_date",
          limit + 5
        );
        const filtered = (result.items || result).filter((v) => v.id !== videoId).slice(0, limit);
        if (mounted) setVideos(filtered);
      } catch (err) {
        console.error("Related videos error:", err);
        if (mounted) setVideos([]);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    fetchRelated();
    return () => { mounted = false; };
  }, [videoId, category, limit]);

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex gap-3 animate-pulse">
            <div className="w-[150px] aspect-video rounded bg-muted shrink-0" />
            <div className="flex-1 space-y-2 py-1">
              <div className="h-3.5 bg-muted rounded w-full" />
              <div className="h-3 bg-muted rounded w-2/3" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (videos.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p className="text-xs">ویدیوی مرتبطی یافت نشد</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {videos.map((item) => {
        const title = item.title || item.name || "محتوای قرآنی";
        const scholar = item.reciter_name || item.scholar_name || item.author_name || "";
        const duration = item.duration || "";
        const views = item.views_count || item.views || 0;
        const imageUrl = item.thumbnail_url || item.image_url || item.cover_image || null;

        return (
          <Link
            key={item.id}
            href={`/watch/${item.id}`}
            className="group flex gap-3 rounded p-1 hover:bg-muted/70 transition-colors"
          >
            <div className="relative w-[150px] sm:w-[168px] aspect-video rounded overflow-hidden bg-muted shrink-0">
              {imageUrl ? (
                <img
                  src={imageUrl}
                  alt=""
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/15 to-accent/15">
                  <Play className="h-6 w-6 text-primary/50" />
                </div>
              )}
              {duration && (
                <span className="absolute bottom-1 start-1 px-1.5 py-0.5 rounded bg-black/80 text-white text-[10px] font-bold">
                  {duration}
                </span>
              )}
              {item.is_live && (
                <span className="absolute top-1 start-1 px-1.5 py-0.5 rounded bg-red-500 text-white text-[9px] font-bold">
                  زنده
                </span>
              )}
            </div>
            <div className="min-w-0 flex-1 py-0.5">
              <h4 className="text-sm font-bold leading-snug line-clamp-2 text-foreground group-hover:text-primary transition-colors">
                {title}
              </h4>
              {scholar && (
                <p className="mt-1 text-xs text-muted-foreground truncate">{scholar}</p>
              )}
              <p className="mt-1 text-[11px] text-muted-foreground inline-flex items-center gap-1">
                <Eye className="h-3 w-3" />
                {fa(views)} بازدید
              </p>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
