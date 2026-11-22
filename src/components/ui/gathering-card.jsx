'use client';

import Link from 'next/link';
import { Calendar, Users, Play, MapPin, Trophy, Clock, Award } from 'lucide-react';
import { fa } from '@/lib/utils';

import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

/**
 * Quranic Gathering Card (محفل قرآنی)
 * For Quranic gatherings, events, mahafels, and ceremonies.
 * Built on shadcn/ui Card + Badge primitives.
 */
export default function GatheringCard({
  item,
  className = '',
}) {
  const id = item.id || item.gathering_id || '';
  const title = item.title || item.name || 'محفل قرآنی';
  const venue = item.venue || item.location || '';
  const organizer = item.organizer || item.organizer_name || '';
  const reciters = item.reciters || item.reciters_list || [];
  const date = item.event_date || item.date || item.created_date || '';
  const imageUrl = item.thumbnail_url || item.image_url || item.poster_url || item.cover_image || null;
  const isVideo = item.video_available || item.media_url || false;
  const duration = item.duration || '';
  const views = item.views_count || item.views || 0;

  const watchUrl = `/watch/${id}`;

  const formattedDate = date ? new Date(date).toLocaleDateString('fa-IR', { year: 'numeric', month: 'short', day: 'numeric' }) : null;

  return (
    <Link
      href={watchUrl}
      className={`group ${className}`}
    >
      <Card className="rounded border border-border/60 bg-card overflow-hidden transition-all duration-300 hover:border-quranic-saffron/50 hover:shadow-xl hover:-translate-y-0.5">
        <CardHeader className="relative h-56 lg:h-64 p-0">
          <div className="relative h-full overflow-hidden bg-gradient-to-br from-quranic-saffron/20 to-quranic-emerald/20 flex items-center justify-center">
            {imageUrl ? (
              <img
                src={imageUrl}
                alt={title}
                className="w-full h-full object-cover opacity-95 group-hover:opacity-100 group-hover:scale-105 transition-all duration-700"
                loading="lazy"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <div className="relative flex items-center justify-center">
                  <div className="absolute inset-0 bg-black/30" />
                  <div className="relative z-10 h-16 w-16 rounded bg-white text-quranic-saffron flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform">
                    <Users className="h-8 w-8" aria-hidden="true" />
                  </div>
                </div>
              </div>
            )}
            {/* Play overlay */}
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <div className="h-16 w-16 rounded bg-quranic-saffron/95 backdrop-blur-md flex items-center justify-center text-quranic-ink shadow-xl shadow-saffron-glow transform group-hover:scale-110 transition-transform">
                <Play className="h-8 w-8 ml-1" aria-hidden="true" />
              </div>
            </div>
            {/* Top badges */}
            <div className="absolute top-3 left-3 right-3 flex flex-wrap gap-1.5 justify-between">
              <div className="flex flex-wrap gap-1.5">
                {date && (
                  <Badge variant="destructive" className="text-[10px] backdrop-blur-sm border-white/20">
                    <Calendar className="h-3 w-3 text-quranic-saffron" aria-hidden="true" />
                    <span>{formattedDate}</span>
                  </Badge>
                )}
              </div>
              <div className="flex flex-wrap gap-1.5 justify-end">
                {isVideo && (
                  <Badge variant="quranic" className="text-[10px] backdrop-blur-sm border-quranic-emerald/30">
                    <Trophy className="h-3 w-3" aria-hidden="true" />
                    <span>ویدیو</span>
                  </Badge>
                )}
              </div>
            </div>
            {/* Duration - bottom right */}
            {duration && (
              <div className="absolute bottom-3 right-3 inline-flex items-center gap-1 px-2 py-1 rounded bg-black/80 text-white text-[11px] font-bold backdrop-blur-sm border border-white/20">
                <Clock className="h-3 w-3 text-quranic-saffron" aria-hidden="true" />
                <span>{duration}</span>
              </div>
            )}
            {/* Views - bottom left */}
            {views > 0 && (
              <div className="absolute bottom-3 left-3 flex items-center gap-1 px-2 py-1 rounded bg-black/60 text-white text-[10px] font-bold backdrop-blur-md border border-white/20">
                <Award className="h-3 w-3 text-quranic-saffron" aria-hidden="true" />
                <span>{fa(views)}</span>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-4 flex-1 flex flex-col">
          <CardTitle className="font-rokh-bold font-bold text-base sm:text-lg leading-snug line-clamp-2 text-foreground group-hover:text-quranic-emerald transition-colors mb-2">
            {title}
          </CardTitle>
          {organizer && (
            <CardDescription className="text-xs text-quranic-turquoise/80 font-medium mb-2 flex items-center gap-1">
              <MapPin className="h-3 w-3 text-quranic-turquoise" aria-hidden="true" />
              {organizer}
            </CardDescription>
          )}
          {reciters && reciters.length > 0 && (
            <div className="text-xs text-muted-foreground/70 mb-3 flex items-center gap-2">
              <Users className="h-3 w-3 text-muted-foreground/50" aria-hidden="true" />
              <span className="truncate max-w-[200px]">{Array.isArray(reciters) ? reciters.join('، ') : reciters}</span>
            </div>
          )}
        </CardContent>
        <CardFooter className="pt-3 border-t border-border/60 font-ui text-[11px] text-muted-foreground">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" aria-hidden="true" />
              {date ? new Date(date).toLocaleDateString('fa-IR') : 'تاریخ نامشخص'}
            </span>
            <div className="flex items-center gap-1 text-xs font-medium text-quranic-emerald">
              <span>مشاهده ویدیو</span>
              <Play className="h-3 w-3 ml-0.5 group-hover:translate-x-1 transition-transform" aria-hidden="true" />
            </div>
          </div>
        </CardFooter>
      </Card>
    </Link>
  );
}
