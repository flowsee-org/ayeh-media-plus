'use client';

import Link from 'next/link';
import { FolderHeart, BookOpen, Users, Sparkles } from 'lucide-react';
import { fa } from '@/lib/utils';

/**
 * Quranic Collection Card
 * For curated collections, playlists, and thematic collections.
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

  // Map theme colors to Tailwind classes
  const colorMap = {
    'quranic-emerald': { bg: 'quranic-emerald', text: 'text-quranic-emerald', border: 'border-quranic-emerald' },
    'quranic-turquoise': { bg: 'quranic-turquoise', text: 'text-quranic-turquoise', border: 'border-quranic-turquoise' },
    'quranic-saffron': { bg: 'quranic-saffron', text: 'text-quranic-saffron', border: 'border-quranic-saffron' },
    '#D97706': { bg: 'amber-500', text: 'text-amber-500', border: 'border-amber-500' },
    '#0D9488': { bg: 'teal-500', text: 'text-teal-500', border: 'border-teal-500' },
    'amber': { bg: 'amber-500', text: 'text-amber-500', border: 'border-amber-500' },
    'teal': { bg: 'teal-500', text: 'text-teal-500', border: 'border-teal-500' },
    'emerald': { bg: 'emerald-500', text: 'text-emerald-500', border: 'border-emerald-500' },
  };

  const colors = colorMap[themeColor] || colorMap['quranic-emerald'];

  return (
    <Link
      href={`/collections/${id}`}
      className={`group block rounded-2xl border border-border/60 bg-card overflow-hidden transition-all duration-300 hover:border-${colors.border}/50 hover:shadow-xl hover:-translate-y-0.5 ${className}`}
    >
      <div className="relative h-48 lg:h-56 overflow-hidden bg-gradient-to-br from-quranic-emerald-dark/15 to-quranic-turquoise-dark/15 flex items-center justify-center">
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
              <div className="relative z-10 h-20 w-20 rounded-full bg-white text-quranic-emerald flex items-center justify-center shadow-xl group-hover:scale-105 transition-transform">
                <FolderHeart className="h-10 w-10" aria-hidden="true" />
              </div>
            </div>
          </div>
        )}

        {/* Theme color accent bar at top */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-current to-transparent" style={{ backgroundColor: `var(--${themeColor})` }} aria-hidden="true" />

        {/* Item count badge */}
        <div className="absolute top-3 right-3 inline-flex items-center gap-1 px-2 py-1 rounded-full bg-black/70 text-white text-[10px] font-bold backdrop-blur-sm border border-white/20">
          <BookOpen className="h-3 w-3" style={{ color: `var(--${colors.text})` }} aria-hidden="true" />
          <span>{fa(itemCount)} مورد</span>
        </div>
      </div>

      <div className="p-4 flex-1 flex flex-col">
        <h3 className="font-rokh-bold font-bold text-base sm:text-lg leading-snug line-clamp-2 text-foreground group-hover:text-quranic-emerald transition-colors mb-2">
          {name}
        </h3>

        {description && (
          <p className="text-xs text-muted-foreground/70 line-clamp-2 mb-3">
            {description}
          </p>
        )}

        <div className="mt-auto pt-3 border-t border-border/60 flex items-center justify-between font-ui text-[11px] text-muted-foreground">
          <div className="flex items-center gap-1">
            <Sparkles className="h-3 w-3" style={{ color: `var(--${colors.text})` }} aria-hidden="true" />
            <span>{fa(itemCount)} آیته/ویدیو</span>
          </div>
          <div className="flex items-center gap-1">
            <Users className="h-3 w-3" aria-hidden="true" />
            <span>{creator || 'مجموعه عوامی'}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}