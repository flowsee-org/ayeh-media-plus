'use client';

import Link from "next/link";
import {
  Play, Clock, Eye, BookOpen, Trophy,
} from "lucide-react";
import { fa } from "@/lib/utils";

import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

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

  const route = verseKey ? `/verse/${verseKey.replace(":", "/")}` : "/quran";

  return (
    <Link
      href={route}
      className={`group ${className}`}
    >
      <Card className="rounded border border-border bg-card overflow-hidden transition-all duration-300 hover:border-quranic-emerald/50 hover:shadow-xl hover:-translate-y-0.5">
        <CardHeader className="relative p-0">
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
                  <div className="relative z-10 h-14 w-14 rounded bg-white text-quranic-emerald flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform">
                    <Play className="h-7 w-7 ml-1" />
                  </div>
                </div>
              </div>
            )}
            {/* Play button overlay on hover */}
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <div className="h-16 w-16 rounded bg-quranic-emerald/95 backdrop-blur-md flex items-center justify-center text-white shadow-xl shadow-quranic-glow transform group-hover:scale-110 transition-transform">
                <Play className="h-8 w-8 ml-1" />
              </div>
            </div>
            {/* Duration badge */}
            {duration && (
              <div className="absolute bottom-3 right-3 inline-flex items-center gap-1 px-2 py-1 rounded bg-black/80 text-white text-[11px] font-bold backdrop-blur-sm border border-white/20">
                <Clock className="h-3 w-3 text-quranic-saffron" />
                <span>{duration}</span>
              </div>
            )}
            {/* Verse badge */}
            {verseKey && (
              <Badge variant="destructive" className="absolute top-3 left-3 text-quranic-ink text-[11px] backdrop-blur-sm border-quranic-saffron/30">
                <BookOpen className="h-3 w-3" />
                <span>{verseKey}</span>
              </Badge>
            )}
            {/* Views overlay */}
            <div className="absolute bottom-3 left-3 flex items-center gap-1 px-2 py-1 rounded bg-black/60 text-white text-[10px] font-bold backdrop-blur-md border border-white/20">
              <Eye className="h-3 w-3 text-quranic-saffron" />
              <span>{fa(views)}</span>
            </div>
            {/* Live indicator badge */}
            {isLive && (
              <Badge variant="destructive" className="absolute top-3 left-3 z-10 animate-[live-pulse_1.5s_infinite] text-xs font-bold">
                <span className="h-2 w-2 rounded bg-quranic-ink animate-[breathe_2s_infinite]" />
                زنده
              </Badge>
            )}
            {/* Competition badge */}
            {isCompetition && (
              <Badge variant="quranic" className="absolute top-3 right-3 z-10 text-[10px] font-bold backdrop-blur-sm border-quranic-emerald/30">
                <Trophy className="h-3 w-3" />
                <span>{competitionYear || "مسابقه"}</span>
              </Badge>
            )}
            {/* Status badge for pending/verified/archived content */}
            {status !== "published" && status !== "verified" && (
              <Badge variant="warning" className="absolute top-3 left-3 z-10 text-[10px] font-bold backdrop-blur-sm border-quranic-saffron/30">
                {status === "pending_review" ? "در انتظار بررسی" : status === "archived" ? "بایگانی شده" : status}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-4 flex-1 flex flex-col">
          <div className="flex items-start justify-between mb-2">
            <CardTitle className="font-rokh-bold font-bold text-base sm:text-lg leading-snug line-clamp-2 text-foreground group-hover:text-quranic-emerald transition-colors">
              {title}
            </CardTitle>
            {scholar && (
              <Badge variant="accent" className="flex items-center gap-1.5 text-[10px] font-medium backdrop-blur-sm border-quranic-turquoise/20">
                <span className="h-2 w-2 rounded bg-quranic-turquoise" />
                {scholar}
              </Badge>
            )}
          </div>
          {verseArabic && (
            <p className=" text-xs sm:text-sm text-foreground/60 mt-1 line-clamp-1 italic" dir="rtl" lang="ar">
              {verseArabic}
            </p>
          )}
        </CardContent>
        <CardFooter className="pt-3 border-t border-border/60 font-ui text-[11px] text-muted-foreground">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <Eye className="h-3 w-3 text-muted-foreground" />
              <span>{fa(views)} نمایش</span>
            </div>
            <div className="flex items-center gap-1 text-xs font-medium text-quranic-emerald">
              <span>مشاهده ویدیو</span>
              <Play className="h-3 w-3 ml-0.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </CardFooter>
      </Card>
    </Link>
  );
}
