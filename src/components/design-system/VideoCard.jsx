'use client';

import Link from 'next/link';
import { useNavigate } from '@/lib/router-compat';
import {
  Play, Clock, Eye, BookOpen, Trophy, Volume2,
} from 'lucide-react';
import { fa } from '@/lib/utils';

/**
 * Universal Video Card — Aparat-style video-first card
 * Used for: videos, recitations, talks, gatherings, competitions
 * Supports: live badge, competition badge, verse badge, duration, views, creator info
 */

export default function VideoCard({
  item,
  className = '',
  variant = 'default', // 'default' | 'compact' | 'featured'
  showCreator = true,
  showMeta = true,
  linkTo = 'auto', // 'auto' | 'verse' | 'video' | 'quran' | 'custom'
  customHref,
}) {
  const id = item.id || item.video_id || '';
  const title = item.title || item.name || 'محتوای قرآنی';
  const creator = item.reciter_name || item.scholar_name || item.author_name || item.uploader_name || '';
  const creatorId = item.reciter_id || item.scholar_id || item.uploader_id || '';
  const duration = item.duration || '';
  const views = item.views_count || item.views || 0;
  const imageUrl = item.thumbnail_url || item.image_url || item.cover_image || null;
  const verseArabic = item.verse_arabic || item.verseArabic || item.arabic || '';
  const verseKey = item.verse_key || item.verseKey || '';
  const isLive = item.is_live || item.live || false;
  const isCompetition = item.is_competition || item.competition || false;
  const isAudio = item.media_type === 'audio' || item.type === 'audio';
  const status = item.status || 'published';
  const competitionYear = item.competition_year || '';
  const navigate = useNavigate();
  const category = item.category || 'recitation';

  // Determine link destination
  let href = '/quran';
  if (linkTo === 'custom' && customHref) {
    href = customHref;
  } else if (linkTo === 'video' || (linkTo === 'auto' && !verseKey)) {
    href = `/watch/${id}`;
  } else if (linkTo === 'verse' || (linkTo === 'auto' && verseKey)) {
    // Videos with verse_key should still go to watch page, not verse page
    // verse page is for static Quran verses, not video content
    href = `/watch/${id}`;
  }

  const isFeatured = variant === 'featured';
  const isCompact = variant === 'compact';

  const cardClasses = [
    'group relative block rounded-2xl border bg-card overflow-hidden transition-all duration-300',
    isFeatured
      ? 'border-quranic-emerald/20 hover:border-quranic-emerald/40 hover:shadow-card-hover hover:-translate-y-1 shadow-lg shadow-quranic-emerald/10'
      : isCompact
        ? 'border-border/60 hover:border-quranic-turquoise/40 hover:shadow-md'
        : 'border-border/60 hover:border-quranic-turquoise/40 hover:shadow-xl hover:-translate-y-0.5',
    className,
  ].filter(Boolean).join(' ');

  const thumbnailHeight = isFeatured ? 'h-64 lg:h-72' : isCompact ? 'h-32' : 'h-48 md:h-56 lg:h-64';
  const thumbnailClasses = `${thumbnailHeight} overflow-hidden bg-gradient-to-br from-quranic-emerald-dark/20 to-quranic-emerald-dark/40 flex items-center justify-center relative`;

  return (
    <Link
      href={href}
      className={cardClasses}
      onClick={(e) => {
        // Handle navigation
      }}
    >
      {/* Thumbnail */}
      <div className={thumbnailClasses}>
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={title}
            className="w-full h-full object-cover opacity-95 group-hover:opacity-100 group-hover:scale-105 transition-all duration-700"
            loading="lazy"
            decoding="async"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className="relative flex items-center justify-center">
              <div className="absolute inset-0 bg-black/30" />
              <div className="relative z-10 h-14 w-14 rounded-full bg-white text-quranic-emerald flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform">
                {isAudio ? (
                  <Volume2 className="h-7 w-7 ml-1" />
                ) : (
                  <Play className="h-7 w-7 ml-1" />
                )}
              </div>
            </div>
          </div>
        )}

        {/* Play button overlay */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className={`h-16 w-16 rounded-full bg-quranic-emerald/95 backdrop-blur-md flex items-center justify-center text-white shadow-xl shadow-quranic-glow transform group-hover:scale-110 transition-transform ${isFeatured ? 'h-20 w-20' : ''}`}>
            {isAudio ? (
              <Volume2 className={`h-8 w-8 ml-1 ${isFeatured ? 'h-10 w-10' : ''}`} />
            ) : (
              <Play className={`h-8 w-8 ml-1 ${isFeatured ? 'h-10 w-10' : ''}`} />
            )}
          </div>
        </div>

        {/* Badges row - top */}
        <div className="absolute top-3 left-3 right-3 flex flex-wrap gap-1.5 justify-between">
          {/* Left badges */}
          <div className="flex flex-wrap gap-1.5">
            {isLive && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-quranic-saffron text-quranic-ink text-xs font-bold animate-[live-pulse_1.5s_infinite] shadow-saffron-glow" aria-live="polite">
                <span className="h-2 w-2 rounded-full bg-quranic-ink animate-[breathe_2s_infinite]" aria-hidden="true" />
                زنده
              </span>
            )}
            {status !== 'published' && status !== 'verified' && (
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-amber-500/90 text-amber-900 text-[10px] font-bold backdrop-blur-sm border border-amber-200">
                {status === 'pending_review' ? 'در انتظار بررسی' : status === 'archived' ? 'بایگانی شده' : status}
              </span>
            )}
          </div>

          {/* Right badges */}
          <div className="flex flex-wrap gap-1.5 justify-end">
            {isCompetition && (
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-quranic-emerald text-white text-[10px] font-bold backdrop-blur-sm border border-quranic-emerald/30">
                <Trophy className="h-3 w-3" aria-hidden="true" />
                <span>{competitionYear || 'مسابقه'}</span>
              </span>
            )}
            {isAudio && !isLive && !isCompetition && (
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-quranic-turquoise/90 text-white text-[10px] font-bold backdrop-blur-sm border border-quranic-turquoise/30">
                <Volume2 className="h-3 w-3" aria-hidden="true" />
                <span>صوتی</span>
              </span>
            )}
          </div>
        </div>

        {/* Duration badge - bottom right */}
        {duration && (
          <div className="absolute bottom-3 right-3 inline-flex items-center gap-1 px-2 py-1 rounded-full bg-black/80 text-white text-[11px] font-bold backdrop-blur-sm border border-white/20">
            <Clock className="h-3 w-3 text-quranic-saffron" aria-hidden="true" />
            <span>{duration}</span>
          </div>
        )}

        {/* Verse badge - bottom left */}
        {verseKey && !isFeatured && (
          <div className="absolute bottom-3 left-3 inline-flex items-center gap-1 px-2 py-1 rounded-full bg-quranic-saffron/90 text-quranic-ink text-[11px] font-bold backdrop-blur-sm border border-quranic-saffron/30">
            <BookOpen className="h-3 w-3" aria-hidden="true" />
            <span>{verseKey}</span>
          </div>
        )}

        {/* Views overlay - bottom left (when no verse badge) */}
        {showMeta && views > 0 && !verseKey && (
          <div className="absolute bottom-3 left-3 flex items-center gap-1 px-2 py-1 rounded-full bg-black/60 text-white text-[10px] font-bold backdrop-blur-md border border-white/20">
            <Eye className="h-3 w-3 text-quranic-saffron" aria-hidden="true" />
            <span>{fa(views)} نمایش</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className={`p-4 flex-1 flex flex-col ${isFeatured ? 'p-6' : isCompact ? 'p-3' : ''}`}>
        <div className="flex items-start justify-between mb-2">
          <h3 className={`font-rokh-bold font-bold ${isFeatured ? 'text-lg sm:text-xl' : isCompact ? 'text-sm' : 'text-base sm:text-lg'} leading-snug line-clamp-2 text-foreground group-hover:text-quranic-emerald transition-colors pr-4`}>
            {title}
          </h3>
          {creator && showCreator && (
            <div className="flex items-center gap-1.5 text-[10px] font-medium text-quranic-turquoise bg-quranic-turquoise/10 px-2 py-0.5 rounded-full border border-quranic-turquoise/20 shrink-0">
              <span className="h-2 w-2 rounded-full bg-quranic-turquoise" aria-hidden="true" />
              {creatorId ? (
                <button
                  onClick={() => navigate(`/profile/${creatorId}`)}
                  className="text-quranic-turquoise hover:underline cursor-pointer"
                >
                  {creator}
                </button>
              ) : (
                <span>{creator}</span>
              )}
            </div>
          )}
        </div>

        {verseArabic && !isFeatured && !isCompact && (
          <p className="font-arabic text-xs sm:text-sm text-foreground/60 mt-1 line-clamp-1 italic" dir="rtl" lang="ar">
            {verseArabic}
          </p>
        )}

        <div className={`mt-auto pt-3 border-t border-border/60 flex items-center justify-between font-ui text-[11px] text-muted-foreground ${isFeatured ? 'mt-6' : isCompact ? 'mt-2' : ''}`}>
          <div className="flex items-center gap-1">
            <Eye className="h-3 w-3 text-muted-foreground" aria-hidden="true" />
            <span>{fa(views)} نمایش</span>
          </div>
          <div className="flex items-center gap-1 text-xs font-medium text-quranic-emerald">
            <span>{isAudio ? 'پخش صوت' : 'مشاهده ویدیو'}</span>
            {isAudio ? (
              <Volume2 className="h-3 w-3 ml-0.5 group-hover:scale-110 transition-transform" aria-hidden="true" />
            ) : (
              <Play className="h-3 w-3 ml-0.5 group-hover:translate-x-1 transition-transform" aria-hidden="true" />
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}