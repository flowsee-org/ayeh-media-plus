'use client';

import Link from 'next/link';
import { Users, ShieldCheck } from 'lucide-react';
import { fa } from '@/lib/utils';

/**
 * Channel / scholar card — Aparat-style compact channel tile
 */
export default function ScholarCard({
  item,
  className = '',
  variant = 'default',
}) {
  const isScholarEntity = !!(item.name_arabic || item.scholar_title || (item.verified !== undefined && !item.is_scholar));
  const id = item.id || item.scholar_id || '';
  const name = item.name || item.scholar_name || item.reciter_name || item.full_name || 'نامشخص';
  const title = item.title || item.scholar_title || item.role || '';
  const avatarUrl = item.avatar_url || item.avatar || item.image_url || null;
  const verified = item.verified || false;
  const followersCount = item.followers_count || item.followers || 0;
  const contentCount = item.content_count || item.videos_count || item.posts_count || 0;
  const href = isScholarEntity ? `/scholars/${id}` : `/profile/${id}`;
  const compact = variant === 'compact';

  return (
    <Link
      href={href}
      className={`group flex flex-col items-center text-center rounded-xl border border-border bg-card p-4 min-w-[140px] sm:min-w-[160px] hover:border-primary/30 hover:shadow-sm transition-all ${className}`}
    >
      <div className={`relative ${compact ? 'h-16 w-16' : 'h-20 w-20'} rounded-full overflow-hidden bg-muted border border-border mb-3`}>
        {avatarUrl ? (
          <img src={avatarUrl} alt={name} className="w-full h-full object-cover" loading="lazy" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-primary/10 text-primary">
            <Users className="h-8 w-8" />
          </div>
        )}
        {verified && (
          <span className="absolute bottom-0 end-0 h-5 w-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center border-2 border-card">
            <ShieldCheck className="h-3 w-3" />
          </span>
        )}
      </div>
      <h3 className="font-bold text-sm text-foreground line-clamp-1 group-hover:text-primary transition-colors w-full">
        {name}
      </h3>
      {title && (
        <p className="mt-0.5 text-[11px] text-muted-foreground line-clamp-1 w-full">{title}</p>
      )}
      <div className="mt-2 flex items-center justify-center gap-2 text-[10px] text-muted-foreground">
        {followersCount > 0 && <span>{fa(followersCount)} دنبال‌کننده</span>}
        {contentCount > 0 && <span>{fa(contentCount)} ویدیو</span>}
      </div>
    </Link>
  );
}
