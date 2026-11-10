'use client';

import { Loader2 } from 'lucide-react';
import Link from 'next/link';

/**
 * Shared profile content section.
 * Wraps tab content with consistent heading, loading, empty, and error states.
 */
export default function ProfileContentSection({
  title,
  icon: Icon,
  loading,
  error,
  empty,
  emptyTitle,
  emptySubtitle,
  emptyActionLabel,
  emptyActionHref,
  children,
  className = '',
}) {
  if (loading) {
    return (
      <div className={`flex flex-col items-center justify-center py-20 ${className}`}>
        <Loader2 className="h-8 w-8 animate-spin text-accent mb-3" />
        <p className="text-muted-foreground">در حال بارگذاری...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`rounded-2xl border border-destructive/30 bg-destructive/[0.03] p-8 text-center ${className}`}>
        <p className="text-sm text-destructive">{error}</p>
        {emptyActionHref && (
          <button
            onClick={() => window.location.assign(emptyActionHref)}
            className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-destructive text-white text-sm font-medium hover:bg-destructive/90 transition-all"
          >
            تلاش مجدد
          </button>
        )}
      </div>
    );
  }

  if (empty) {
    return (
      <div className={`rounded-2xl border border-dashed border-border/60 p-16 text-center ${className}`}>
        {Icon && <Icon className="h-10 w-10 text-muted-foreground/30 mx-auto mb-4" />}
        <h3 className="font-semibold text-foreground mb-2">{emptyTitle || 'محتوایی یافت نشد'}</h3>
        <p className="text-muted-foreground text-sm leading-relaxed max-w-xs mx-auto mb-6">
          {emptySubtitle || 'هنوز محتوایی در این بخش منتشر نشده است.'}
        </p>
        {emptyActionLabel && emptyActionHref && (
          <Link
            href={emptyActionHref}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-accent text-accent-foreground text-sm font-medium hover:shadow-glow transition-all"
          >
            {emptyActionLabel}
          </Link>
        )}
      </div>
    );
  }

  return (
    <div className={className}>
      {title && (
        <div className="flex items-center gap-2 mb-6">
          {Icon && <Icon className="h-5 w-5 text-accent" />}
          <h2 className="font-display font-bold text-lg">{title}</h2>
        </div>
      )}
      {children}
    </div>
  );
}
