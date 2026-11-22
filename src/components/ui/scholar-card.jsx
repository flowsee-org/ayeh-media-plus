'use client';

import Link from 'next/link';
import { Users, ShieldCheck } from 'lucide-react';
import { fa } from '@/lib/utils';

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

/**
 * Channel / scholar card — Aparat-style compact channel tile
 * Built on shadcn/ui Card + Avatar + Badge primitives.
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
      className={`group ${className}`}
    >
      <Card variant={compact ? 'default' : 'default'} className="w-full min-w-[140px] sm:min-w-[160px] hover:border-primary/30 hover:shadow-sm transition-all">
        <CardHeader className="flex flex-col items-center pt-4 pb-2 gap-2">
          <Avatar className={`relative ${compact ? 'h-16 w-16' : 'h-20 w-20'} rounded overflow-hidden bg-muted border border-border mb-1`}>
            {avatarUrl ? (
              <AvatarImage src={avatarUrl} alt={name} className="w-full h-full object-cover" loading="lazy" />
            ) : (
              <AvatarFallback className="w-full h-full flex items-center justify-center bg-primary/10 text-primary">
                <Users className={`h-8 w-8`} />
              </AvatarFallback>
            )}
            {verified && (
              <span className="absolute bottom-0 end-0 h-5 w-5 rounded bg-primary text-primary-foreground flex items-center justify-center border-2 border-card">
                <ShieldCheck className="h-3 w-3" />
              </span>
            )}
          </Avatar>
          <h3 className="font-bold text-sm text-foreground line-clamp-1 group-hover:text-primary transition-colors w-full">
            {name}
          </h3>
          {title && (
            <p className="mt-0.5 text-[11px] text-muted-foreground line-clamp-1 w-full">{title}</p>
          )}
        </CardHeader>
        <CardContent className="px-2 pt-1">
          <div className="flex items-center justify-center gap-2 text-[10px] text-muted-foreground">
            {followersCount > 0 && <span>{fa(followersCount)} دنبال‌کننده</span>}
            {contentCount > 0 && <span>{fa(contentCount)} ویدیو</span>}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
