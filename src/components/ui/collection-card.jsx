'use client';

import Link from 'next/link';
import { FolderHeart, BookOpen, Users, Sparkles } from 'lucide-react';
import { fa } from '@/lib/utils';

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

/**
 * Quranic Collection Card
 * For curated collections, playlists, and thematic collections.
 * Built on shadcn/ui Card + Badge primitives.
 */
export default function CollectionCard({
  item,
  className = '',
}) {
  const id = item.id || item.collection_id || '';
  const name = item.name || item.title || 'مجموعه قرآنی';
  const description = item.description || '';
  const itemCount = item.item_count || item.verse_count || item.videos_count || 0;
  const creator = item.creator_name || item.curator_name || '';
  const coverImage = item.cover_image || item.thumbnail_url || item.image_url || null;
  const themeColor = item.theme_color || 'quranic-emerald';
  const isPublic = item.is_public !== false;

  const colorMap = {
    'quranic-emerald': { badge: 'quranic', border: 'quranic-emerald' },
    'quranic-turquoise': { badge: 'accent', border: 'quranic-turquoise' },
    'quranic-saffron': { badge: 'destructive', border: 'quranic-saffron' },
    '#D97706': { badge: 'warning', border: 'amber-500' },
    '#0D9488': { badge: 'accent', border: 'teal-500' },
    'amber': { badge: 'warning', border: 'amber-500' },
    'teal': { badge: 'accent', border: 'teal-500' },
    'emerald': { badge: 'quranic', border: 'emerald-500' },
  };

  const colors = colorMap[themeColor] || colorMap['quranic-emerald'];

  return (
    <Link
      href={`/collections/${id}`}
      className={`group ${className}`}
    >
      <Card className="rounded border border-border/60 bg-card overflow-hidden transition-all duration-300 hover:border-quranic-emerald/50 hover:shadow-xl hover:-translate-y-0.5">
        <CardHeader className="relative h-48 lg:h-56 p-0">
          <div className="relative h-full overflow-hidden bg-gradient-to-br from-quranic-emerald-dark/15 to-quranic-turquoise-dark/15 flex items-center justify-center">
            {coverImage ? (
              <img
                src={coverImage}
                alt={name}
                className="w-full h-full object-cover opacity-95 group-hover:opacity-100 group-hover:scale-105 transition-all duration-700"
                loading="lazy"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <div className="relative flex items-center justify-center">
                  <div className="absolute inset-0 bg-black/20" />
                  <div className="relative z-10 h-20 w-20 rounded bg-white text-primary flex items-center justify-center shadow-xl group-hover:scale-105 transition-transform">
                    <FolderHeart className="h-10 w-10" aria-hidden="true" />
                  </div>
                </div>
              </div>
            )}
            {/* Theme color accent bar at top */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-current to-transparent" style={{ backgroundColor: `var(--${themeColor})` }} aria-hidden="true" />
            {/* Item count badge */}
            <Badge variant={colors.badge} className="absolute top-3 right-3 inline-flex items-center gap-1 px-2 py-1 text-[10px]">
              <BookOpen className="h-3 w-3" aria-hidden="true" />
              <span>{fa(itemCount)} مورد</span>
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-4 flex-1 flex flex-col">
          <CardTitle className="font-rokh-bold font-bold text-base sm:text-lg leading-snug line-clamp-2 text-foreground group-hover:text-quranic-emerald transition-colors mb-2">
            {name}
          </CardTitle>
          {description && (
            <CardDescription className="text-xs text-muted-foreground/70 line-clamp-2 mb-3">
              {description}
            </CardDescription>
          )}
        </CardContent>
        <CardFooter className="pt-3 border-t border-border/60 font-ui text-[11px] text-muted-foreground">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <Sparkles className="h-3 w-3" aria-hidden="true" />
              <span>{fa(itemCount)} آیته/ویدیو</span>
            </div>
            <div className="flex items-center gap-1">
              <Users className="h-3 w-3" aria-hidden="true" />
              <span>{creator || 'مجموعه عوامی'}</span>
            </div>
          </div>
        </CardFooter>
      </Card>
    </Link>
  );
}
