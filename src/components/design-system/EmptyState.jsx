'use client';

import Link from 'next/link';
import {
  BookOpen, Search, Users, Trophy, Video, Sparkles, Clock, Mic,
} from 'lucide-react';

/**
 * Empty State Component — Guides users toward useful actions
 * Consistent empty state design across the platform.
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
};

export default function EmptyState({
  type = 'general',
  title,
  subtitle,
  icon: Icon,
  actionLabel,
  actionHref,
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
    <div
      className={`rounded-2xl border border-dashed border-border/60 p-12 sm:p-16 text-center ${className}`}
    >
      <DisplayIcon className="h-10 w-10 text-muted-foreground/30 mx-auto mb-4" />
      <h3 className="font-rokh-bold font-bold text-lg sm:text-xl text-foreground mb-2">
        {displayTitle}
      </h3>
      <p className="font-doran text-sm text-muted-foreground max-w-md mx-auto leading-relaxed mb-8">
        {displaySubtitle}
      </p>
      {showAction && (
        <Link
          href={displayActionHref}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-quranic-emerald text-white font-rokh-bold font-bold hover:bg-quranic-turquoise transition-all shadow-quranic-glow hover:shadow-[0_0_30px_-6px_hsl(var(--quranic-emerald)_/0.6)]"
        >
          {displayActionLabel}
        </Link>
      )}
    </div>
  );
}
