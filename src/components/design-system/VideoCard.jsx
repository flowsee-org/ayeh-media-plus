'use client';

import Link from 'next/link';
import { useNavigate } from '@/lib/router-compat';
import {
  Play, Eye, Trophy, Volume2,
} from 'lucide-react';
import { fa } from '@/lib/utils';

/**
 * Aparat-style video card — thumbnail-first, soft radius, minimal chrome.
 */
export default function VideoCard({
  item,
  className = '',
  variant = 'default', // 'default' | 'compact' | 'featured' | 'horizontal'
  showCreator = true,
  showMeta = true,
  linkTo = 'auto',
  customHref,
}) {
  const id = item.id || item.video_id || '';
  const title = item.title || item.name || 'محتوای قرآنی';
  const creator = item.reciter_name || item.scholar_name || item.author_name || item.uploader_name || '';
  const creatorId = item.reciter_id || item.scholar_id || item.uploader_id || '';
  const duration = item.duration || '';
  const views = item.views_count || item.views || 0;
  const imageUrl = item.thumbnail_url || item.image_url || item.cover_image || null;
  const isLive = item.is_live || item.live || false;
  const isCompetition = item.is_competition || item.competition || false;
  const isAudio = item.media_type === 'audio' || item.type === 'audio';
  const competitionYear = item.competition_year || '';
  const navigate = useNavigate();

  let href = `/watch/${id}`;
  if (linkTo === 'custom' && customHref) href = customHref;

  const isFeatured = variant === 'featured';
  const isCompact = variant === 'compact';
  const isHorizontal = variant === 'horizontal';

  if (isHorizontal) {
    return (
      <Link
        href={href}
        className={`group flex gap-3 rounded p-1.5 hover:bg-muted/60 transition-colors ${className}`}
      >
        <div className="relative w-[160px] sm:w-[180px] shrink-0 aspect-video rounded overflow-hidden bg-muted">
          {imageUrl ? (
            <img src={imageUrl} alt="" className="w-full h-full object-cover" loading="lazy" />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-accent/20">
              <Play className="h-7 w-7 text-primary/70" />
            </div>
          )}
          {duration && (
            <span className="absolute bottom-1.5 start-1.5 px-1.5 py-0.5 rounded bg-black/80 text-white text-[10px] font-bold">
              {duration}
            </span>
          )}
        </div>
        <div className="min-w-0 flex-1 py-0.5">
          <h3 className="font-bold text-sm leading-snug line-clamp-2 text-foreground group-hover:text-primary transition-colors">
            {title}
          </h3>
          {creator && showCreator && (
            <p className="mt-1 text-xs text-muted-foreground truncate">{creator}</p>
          )}
          {showMeta && (
            <p className="mt-1 text-[11px] text-muted-foreground flex items-center gap-1">
              <Eye className="h-3 w-3" />
              {fa(views)} بازدید
            </p>
          )}
        </div>
      </Link>
    );
  }

  return (
    <article className={`group ${className}`}>
      <Link href={href} className="block">
        <div
          className={`relative overflow-hidden rounded bg-muted ${
            isFeatured ? 'aspect-[16/9]' : isCompact ? 'aspect-video' : 'aspect-video'
          }`}
        >
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={title}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
              loading="lazy"
              decoding="async"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/15 to-accent/20">
              <div className="h-12 w-12 rounded bg-card/90 text-primary flex items-center justify-center shadow-md">
                {isAudio ? <Volume2 className="h-6 w-6" /> : <Play className="h-6 w-6 ms-0.5" />}
              </div>
            </div>
          )}

          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-black/10">
            <div className="h-12 w-12 rounded bg-primary/95 text-primary-foreground flex items-center justify-center shadow-lg scale-95 group-hover:scale-100 transition-transform">
              {isAudio ? <Volume2 className="h-5 w-5" /> : <Play className="h-5 w-5 ms-0.5" />}
            </div>
          </div>

          <div className="absolute top-2 inset-x-2 flex justify-between gap-1 pointer-events-none">
            <div className="flex flex-wrap gap-1">
              {isLive && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-red-500 text-white text-[10px] font-bold">
                  <span className="h-1.5 w-1.5 rounded bg-white animate-pulse" />
                  زنده
                </span>
              )}
            </div>
            {isCompetition && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-primary/95 text-white text-[10px] font-bold">
                <Trophy className="h-3 w-3" />
                {competitionYear || 'مسابقه'}
              </span>
            )}
          </div>

          {duration && (
            <span className="absolute bottom-2 start-2 px-1.5 py-0.5 rounded bg-black/80 text-white text-[11px] font-bold tabular-nums">
              {duration}
            </span>
          )}
        </div>
      </Link>

      <div className={`pt-2.5 ${isCompact ? 'pt-2' : ''}`}>
        <div className="flex gap-2.5">
          {showCreator && (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                if (creatorId) navigate(`/profile/${creatorId}`);
              }}
              className="h-9 w-9 rounded bg-primary/10 text-primary flex items-center justify-center text-xs font-bold shrink-0 border border-primary/15 hover:bg-primary/15 transition-colors"
              aria-label={creator || 'کانال'}
            >
              {(creator || 'آ').charAt(0)}
            </button>
          )}
          <div className="min-w-0 flex-1">
            <Link href={href}>
              <h3
                className={`font-bold leading-snug text-foreground group-hover:text-primary transition-colors ${
                  isFeatured ? 'text-base sm:text-lg line-clamp-2' : isCompact ? 'text-sm line-clamp-2' : 'text-sm sm:text-[15px] line-clamp-2'
                }`}
              >
                {title}
              </h3>
            </Link>
            {creator && showCreator && (
              <button
                type="button"
                onClick={() => creatorId && navigate(`/profile/${creatorId}`)}
                className="mt-1 text-xs text-muted-foreground hover:text-foreground truncate block max-w-full text-start"
              >
                {creator}
              </button>
            )}
            {showMeta && (
              <div className="mt-1 flex items-center gap-1.5 text-[11px] text-muted-foreground">
                <Eye className="h-3 w-3" />
                <span>{fa(views)} بازدید</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}
