'use client';

import Link from 'next/link';
import {
  BookOpen, Search, Users, Trophy, Video, Sparkles, Clock, Mic,
} from 'lucide-react';

import { Card, CardContent, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

/**
 * Empty State Component — Guides users toward useful actions
 * Consistent empty state design across the platform.
 * Built on shadcn/ui Card + Button primitives.
 */
const EMPTY_STATE_CONFIGS = {
  search: {
    icon: Search,
    title: 'نتیجه‌ای یافت نشد',
    subtitle: 'عبارت دیگری امتحان کنید یا فیلترها را بررسی کنید.',
    actionLabel: 'جستجوی جدید',
    actionHref: '/search',
  },
  content: {
    icon: BookOpen,
    title: 'محتوا ثبت نشده است',
    subtitle: 'به‌زودی محتوای جدید در این بخش منتشر می‌شود.',
    actionLabel: 'بازگشت به صفحه اصلی',
    actionHref: '/',
  },
  recitations: {
    icon: Mic,
    title: 'تلاوتی یافت نشد',
    subtitle: 'هیچ تلاوت قرآنی در این دسته‌بندی ثبت نشده است.',
    actionLabel: 'مشاهده همه تلاوت‌ها',
    actionHref: '/talks',
  },
  competitions: {
    icon: Trophy,
    title: 'مسابقه‌ای ثبت نشده است',
    subtitle: 'ثبت‌نام به‌زودی شروع می‌شود.',
    actionLabel: 'مشاهده همه مسابقات',
    actionHref: '/competitions',
  },
  gatherings: {
    icon: Users,
    title: 'محفل یافت نشد',
    subtitle: 'هیچ محفل قرآنی در این دسته‌بندی ثبت نشده است.',
    actionLabel: 'مشاهده همه محافل',
    actionHref: '/explore',
  },
  videos: {
    icon: Video,
    title: 'ویدیویی یافت نشد',
    subtitle: 'هیچ ویدیویی در این بخش ثبت نشده است.',
    actionLabel: 'مشاهده همه ویدیوها',
    actionHref: '/talks',
  },
  general: {
    icon: Sparkles,
    title: 'هیچ محتوایی یافت نشد',
    subtitle: 'با بازدید از بخش‌های دیگر سایت، محتوای جالبی پیدا کنید.',
    actionLabel: 'بازگشت به خانه',
    actionHref: '/',
  },
  bookmarks: {
    icon: Clock,
    title: 'نشان‌شده‌ای ندارید',
    subtitle: 'محتوای مورد علاقه خود را برای مشاهدة در آینده نشان بزنید.',
    actionLabel: 'مشاهده محتوای محبوب',
    actionHref: '/',
  },
  history: {
    icon: Clock,
    title: 'تاریخچه تماشا خالی است',
    subtitle: 'ویدیوهایی که تماشا می‌کنید اینجا نمایش داده می‌شوند.',
    actionLabel: 'کاوش محتوا',
    actionHref: '/explore',
  },
};

export default function EmptyState({
  type = 'general',
  title,
  subtitle,
  icon: Icon,
  actionLabel,
  actionHref,
  onAction,
  showAction = true,
  className = '',
}) {
  const config = EMPTY_STATE_CONFIGS[type];
  const displayTitle = title || config.title;
  const displaySubtitle = subtitle || config.subtitle;
  const DisplayIcon = Icon || config.icon;
  const displayActionLabel = actionLabel || config.actionLabel;
  const displayActionHref = actionHref || config.actionHref;

  return (
    <Card className={`border-dashed border-border/60 p-8 sm:p-12 text-center ${className}`}>
      <CardContent className="flex flex-col items-center justify-center">
        <DisplayIcon className="h-10 w-10 text-muted-foreground/30 mx-auto mb-4" />
        <CardTitle className="mb-2">{displayTitle}</CardTitle>
        <CardDescription className="max-w-md mx-auto mb-6">
          {displaySubtitle}
        </CardDescription>
        {showAction && onAction && (
          <Button variant="primary" className="w-auto">
            {displayActionLabel}
          </Button>
        )}
        {showAction && !onAction && (
          <Link href={displayActionHref}>
            <Button variant="primary" className="w-auto">
              {displayActionLabel}
            </Button>
          </Link>
        )}
      </CardContent>
    </Card>
  );
}
