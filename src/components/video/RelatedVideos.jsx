'use client';

import { useEffect, useState } from "react";
import Link from "next/link";
import { Play, Clock, Eye, Trophy, BookOpen } from "lucide-react";
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
        // Fetch videos from the same category, excluding current video
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
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-48 rounded-2xl bg-muted/40 animate-pulse" />
        ))}
      </div>
    );
  }

  if (videos.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p className="text-xs">تلاوت‌های متعلقھی یافت نشد</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {videos.map((item) => {
        const verseKey = item.verse_key || item.verseKey || "";
        const title = item.title || item.name || "محتوای قرآنی";
        const scholar = item.scholar || item.author_name || item.scholar_name || "";
        const duration = item.duration || "";
        const views = item.views_count || item.views || 0;
        const imageUrl = item.image_url || item.media_url || item.cover_image || null;
        const isLive = item.is_live || item.live || false;
        const isCompetition = item.is_competition || item.competition || false;
        const competitionYear = item.competition_year || "";

        return (
          <Link
            key={item.id}
            href={verseKey ? `/verse/${verseKey.replace(":", "/")}` : "/quran"}
            className="group flex flex-col gap-2"
          >
            {/* Thumbnail */}
            <div className="relative aspect-video rounded-2xl overflow-hidden bg-gradient-to-br from-quranic-emerald-dark/30 to-quranic-emerald-dark/50 flex items-center justify-center">
              {imageUrl ? (
                <img
                  src={imageUrl}
                  alt={title}
                  className="w-full h-full object-cover opacity-90 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500"
                  loading="lazy"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <div className="relative flex items-center justify-center">
                    <div className="absolute inset-0 bg-black/30" />
                    <div className="relative z-10 h-12 w-12 rounded-full bg-white text-quranic-emerald flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform">
                      <Play className="h-6 w-6 ml-1" />
                    </div>
                  </div>
                </div>
              )}
              {/* Live indicator */}
              {isLive && (
                <div className="absolute top-3 left-3 z-10 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-quranic-saffron text-quranic-ink text-[10px] font-bold animate-[live-pulse_1.5s_infinite] shadow-saffron-glow">
                  <span className="h-2 w-2 rounded-full bg-quranic-ink animate-[breathe_2s_infinite]" />
                  زنده
                </div>
              )}
              {/* Competition badge */}
              {isCompetition && (
                <div className="absolute top-3 right-3 z-10 inline-flex items-center gap-1 px-2 py-1 rounded-full bg-quranic-emerald text-white text-[10px] font-bold backdrop-blur-sm border border-quranic-emerald/30">
                  <Trophy className="h-3 w-3" />
                  <span>{competitionYear || "مسابقه"}</span>
                </div>
              )}
              {/* Duration badge */}
              {duration && (
                <div className="absolute bottom-3 right-3 inline-flex items-center gap-1 px-2 py-1 rounded-full bg-black/80 text-white text-[10px] font-bold backdrop-blur-sm border border-white/20">
                  <Clock className="h-3 w-3 text-quranic-saffron" />
                  <span>{duration}</span>
                </div>
              )}
              {/* Verse badge */}
              {verseKey && (
                <div className="absolute bottom-3 left-3 inline-flex items-center gap-1 px-2 py-1 rounded-full bg-quranic-saffron/90 text-quranic-ink text-[10px] font-bold backdrop-blur-sm border border-quranic-saffron/30">
                  <BookOpen className="h-3 w-3" />
                  <span>{verseKey}</span>
                </div>
              )}
              {/* Views overlay */}
              <div className="absolute bottom-3 right-16 flex items-center gap-1 px-2 py-1 rounded-full bg-black/60 text-white text-[10px] font-bold backdrop-blur-md border border-white/20">
                <Eye className="h-3 w-3 text-quranic-saffron" />
                <span>{fa(views)}</span>
              </div>
              {/* Play overlay on hover */}
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className="h-14 w-14 rounded-full bg-quranic-emerald/95 backdrop-blur-md flex items-center justify-center text-white shadow-xl shadow-quranic-glow transform group-hover:scale-110 transition-transform">
                  <Play className="h-7 w-7 ml-1" />
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="flex flex-col gap-1.5">
              <h3 className="font-rokh-bold font-bold text-sm leading-tight line-clamp-2 text-foreground group-hover:text-quranic-emerald transition-colors">
                {title}
              </h3>
              {scholar && (
                <span className="font-ui text-[10px] text-quranic-turquoise font-medium">
                  {scholar}
                </span>
              )}
              <div className="flex items-center gap-1.5 font-ui text-[10px] text-muted-foreground">
                <Eye className="h-3 w-3 text-muted-foreground" />
                <span>{fa(views)} نمایش</span>
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
