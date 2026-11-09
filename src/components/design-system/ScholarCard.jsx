'use client';

import Link from 'next/link';
import { Users, Trophy, BookOpen } from 'lucide-react';
import { fa } from '@/lib/utils';

/**
 * Scholar / Creator Card
 * For Qaris, scholars, teachers, and content creators.
 * Routes to /scholars/[id] for Scholar entities, /profile/[id] for Users
 */

export default function ScholarCard({
  item,
  className = '',
  variant = 'default',
}) {
  // Detect if this is a Scholar entity (has name_arabic, title, verified but no is_scholar/role)
  // vs a User entity (has is_scholar, role, full_name)
  const isScholarEntity = !!(item.name_arabic || item.scholar_title || (item.verified !== undefined && !item.is_scholar));
  const isUserEntity = !!(item.is_scholar !== undefined || item.role || item.full_name);

  const id = item.id || item.scholar_id || '';
  const name = item.name || item.scholar_name || item.reciter_name || item.full_name || 'نامشخص';
  const nameArabic = item.name_arabic || item.nameArabic || '';
  const title = item.title || item.scholar_title || item.role || '';
  const bio = item.bio || item.biography || '';
  const avatarUrl = item.avatar_url || item.avatar || item.image_url || null;
  const verified = item.verified || false;
  const followersCount = item.followers_count || item.followers || 0;
  const contentCount = item.content_count || item.videos_count || item.posts_count || 0;
  const specialization = item.specialization || '';

  // Route to /scholars/[id] for Scholar entities, /profile/[id] for User entities
  const href = isScholarEntity ? `/scholars/${id}` : `/profile/${id}`;

  return (
    <Link
      href={href}
      className={`group flex flex-col rounded-2xl border border-border/60 bg-card overflow-hidden transition-all duration-300 hover:border-quranic-turquoise/50 hover:shadow-xl hover:-translate-y-0.5 ${className}`}
    >
      <div className="relative h-48 lg:h-56 overflow-hidden bg-gradient-to-br from-quranic-emerald-dark/15 to-quranic-turquoise/15 flex items-center justify-center">
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={name}
            className="w-full h-full object-cover opacity-95 group-hover:opacity-100 group-hover:scale-105 transition-all duration-700"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className="relative flex items-center justify-center">
              <div className="absolute inset-0 bg-black/20" />
              <div className="relative z-10 h-20 w-20 rounded-full bg-white text-quranic-emerald flex items-center justify-center shadow-xl group-hover:scale-105 transition-transform">
                <Users className="h-10 w-10" aria-hidden="true" />
              </div>
            </div>
          </div>
        )}

        {/* Verified badge */}
        {verified && (
          <div className="absolute -bottom-3 -right-3 z-20 h-10 w-10 rounded-full bg-quranic-emerald text-white flex items-center justify-center shadow-lg ring-2 ring-card border-white group-hover:scale-110 transition-transform">
            <Trophy className="h-5 w-5 fill-current" aria-hidden="true" />
          </div>
        )}

        {/* Quick stats overlay */}
        <div className="absolute bottom-3 left-3 right-3 flex justify-between px-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-black/70 text-white text-[10px] font-bold backdrop-blur-sm border border-white/20">
            <Users className="h-3 w-3 text-quranic-saffron" aria-hidden="true" />
            <span>{fa(followersCount)}</span>
          </div>
          <div className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-black/70 text-white text-[10px] font-bold backdrop-blur-sm border border-white/20">
            <BookOpen className="h-3 w-3 text-quranic-turquoise" aria-hidden="true" />
            <span>{fa(contentCount)}</span>
          </div>
        </div>
      </div>

      <div className="p-4 flex-1 flex flex-col">
        <div className="mb-2">
          {nameArabic && (
            <div className="font-arabic text-lg text-quranic-emerald/60 mb-1 text-center" dir="rtl" lang="ar">
              {nameArabic}
            </div>
          )}
          <h3 className="font-rokh-bold font-bold text-base sm:text-lg leading-snug text-foreground group-hover:text-quranic-emerald transition-colors text-center">
            {name}
          </h3>
        </div>

        {title && (
          <p className="text-xs text-quranic-turquoise/80 font-medium mb-2 text-center">
            {title}
          </p>
        )}

        {specialization && (
          <p className="text-xs text-muted-foreground/70 line-clamp-2 mb-3 text-center">
            {specialization}
          </p>
        )}

        <div className="mt-auto pt-3 border-t border-border/60 flex items-center justify-between font-ui text-[11px] text-muted-foreground">
          <div className="flex items-center gap-1">
            <Users className="h-3 w-3" aria-hidden="true" />
            <span>{fa(followersCount)} فالور</span>
          </div>
          <div className="flex items-center gap-1">
            <BookOpen className="h-3 w-3" aria-hidden="true" />
            <span>{fa(contentCount)} محتوا</span>
          </div>
        </div>
      </div>
    </Link>
  );
}