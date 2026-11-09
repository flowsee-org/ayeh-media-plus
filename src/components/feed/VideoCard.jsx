'use client';

import Link from "next/link";
import {
  Play, Clock, Eye, BookOpen, Trophy,
} from "lucide-react";
import { fa } from "@/lib/utils";

export default function VideoCard({ item, className = "" }) {
  const verseKey = item.verse_key || item.verseKey || "";
  const title = item.title || item.name || "محتوای قرآنی";
  const scholar = item.scholar || item.author_name || item.scholar_name || "";
  const duration = item.duration || "";
  const views = item.views_count || item.views || 0;
  const imageUrl = item.image_url || item.media_url || item.cover_image || null;
  const verseArabic = item.verse_arabic || item.verseArabic || item.arabic || "";
  const isLive = item.is_live || item.live || false;
  const isCompetition = item.is_competition || item.competition || false;
  const status = item.status || "published"; // pending_review, verified, archived
  const competitionYear = item.competition_year || "";

  return (
    <Link
      href={verseKey ? `/verse/${verseKey.replace(":", "/")}` : "/quran"}
      className={`group relative flex flex-col justify-between rounded-2xl border border-border bg-card overflow-hidden transition-all duration-300 ${className}`}
    >
      {/* Live indicator badge */}
      {isLive && (
        <div className="absolute top-3 left-3 z-10 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-quranic-saffron text-quranic-ink text-xs font-bold animate-[live-pulse_1.5s_infinite] shadow-saffron-glow">
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

      {/* Status badge for pending/verified/archived content */}
      {status !== "published" && status !== "verified" && (
        <div className="absolute top-3 left-3 z-10 inline-flex items-center gap-1 px-2 py-1 rounded-full bg-amber-500/90 text-amber-900 text-[10px] font-bold backdrop-blur-sm border border-amber-200">
          {status === "pending_review" ? "در انتظار بررسی" : status === "archived" ? "بایگانی شده" : status}
        </div>
      )}

      {/* Thumbnail */}
      <div className="relative h-48 md:h-56 lg:h-64 overflow-hidden bg-gradient-to-br from-quranic-emerald-dark/30 to-quranic-emerald-dark/50 flex items-center justify-center">
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
              <div className="relative z-10 h-14 w-14 rounded-full bg-white text-quranic-emerald flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform">
                <Play className="h-7 w-7 ml-1" />
              </div>
            </div>
          </div>
        )}
        {/* Play button overlay on hover */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className="h-16 w-16 rounded-full bg-quranic-emerald/95 backdrop-blur-md flex items-center justify-center text-white shadow-xl shadow-quranic-glow transform group-hover:scale-110 transition-transform">
            <Play className="h-8 w-8 ml-1" />
          </div>
        </div>
        {/* Duration badge */}
        {duration && (
          <div className="absolute bottom-3 right-3 inline-flex items-center gap-1 px-2 py-1 rounded-full bg-black/80 text-white text-[11px] font-bold backdrop-blur-sm border border-white/20">
            <Clock className="h-3 w-3 text-quranic-saffron" />
            <span>{duration}</span>
          </div>
        )}
        {/* Verse badge */}
        {verseKey && (
          <div className="absolute top-3 left-3 inline-flex items-center gap-1 px-2 py-1 rounded-full bg-quranic-saffron/90 text-quranic-ink text-[11px] font-bold backdrop-blur-sm border border-quranic-saffron/30">
            <BookOpen className="h-3 w-3" />
            <span>{verseKey}</span>
          </div>
        )}
        {/* Views overlay */}
        <div className="absolute bottom-3 left-3 flex items-center gap-1 px-2 py-1 rounded-full bg-black/60 text-white text-[10px] font-bold backdrop-blur-md border border-white/20">
          <Eye className="h-3 w-3 text-quranic-saffron" />
          <span>{fa(views)}</span>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 flex-1 flex flex-col">
        <div className="flex items-start justify-between mb-2">
          <h3 className="font-rokh-bold font-bold text-base sm:text-lg leading-snug line-clamp-2 text-foreground group-hover:text-quranic-emerald transition-colors">
            {title}
          </h3>
          {scholar && (
            <div className="flex items-center gap-1.5 text-[10px] font-medium text-quranic-turquoise bg-quranic-turquoise/10 px-2 py-0.5 rounded-full border border-quranic-turquoise/20">
              <span className="h-2 w-2 rounded-full bg-quranic-turquoise" />
              {scholar}
            </div>
          )}
        </div>

        {verseArabic && (
          <p
            className="font-arabic text-xs sm:text-sm text-foreground/60 mt-1 line-clamp-1 italic"
            dir="rtl"
            lang="ar"
          >
            {verseArabic}
          </p>
        )}

        <div className="mt-auto pt-3 border-t border-border/60 flex items-center justify-between font-ui text-[11px] text-muted-foreground">
          <div className="flex items-center gap-1">
            <Eye className="h-3 w-3 text-muted-foreground" />
            <span>{fa(views)} نمایش</span>
          </div>
          <div className="flex items-center gap-1 text-xs font-medium text-quranic-emerald">
            <span>مشاهده ویدیو</span>
            <Play className="h-3 w-3 ml-0.5 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>
      </div>
    </Link>
  );
}