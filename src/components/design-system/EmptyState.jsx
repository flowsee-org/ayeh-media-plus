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
  const actionClassName =
    'inline-flex items-center gap-2 px-6 py-3 rounded bg-primary text-primary-foreground font-doran font-semibold text-sm hover:opacity-90 shadow-sm transition-all';

  return (
    <div
      className={`rounded border border-dashed border-border/60 p-12 sm:p-16 text-center ${className}`}
    >
      <DisplayIcon className="h-10 w-10 text-muted-foreground/30 mx-auto mb-4" />
      <h3 className="font-rokh-bold font-bold text-lg sm:text-xl text-foreground mb-2">
        {displayTitle}
      </h3>
      <p className="font-doran text-sm text-muted-foreground max-w-md mx-auto leading-relaxed mb-8">
        {displaySubtitle}
      </p>
      {showAction && onAction && (
        <button type="button" onClick={onAction} className={actionClassName}>
          {displayActionLabel}
        </button>
      )}
      {showAction && !onAction && (
        <Link href={displayActionHref} className={actionClassName}>
          {displayActionLabel}
        </Link>
      )}
    </div>
  );
}
