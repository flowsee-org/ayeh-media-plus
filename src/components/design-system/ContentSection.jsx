'use client';

import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

/**
 * Content Section — Consistent section wrapper
 * Provides: heading, optional description, view-all link, horizontal scrollable content area
 */
export default function ContentSection({
  title,
  subtitle,
  icon: Icon,
  to,
  viewAllLabel = 'مشاهده همه',
  children,
  className = '',
  sectionClassName = '',
  noScrollbar = true,
}) {
  return (
    <section className={`py-12 sm:py-16 lg:py-20 ${sectionClassName}`}>
      <div className="container-quranic">
        {title || subtitle || to ? (
          <div className="flex items-center justify-between mb-8 sm:mb-10 pb-4 border-b border-border/60">
            <div className="flex items-center gap-2.5">
              {Icon && (
                <div className="h-9 w-9 rounded-xl bg-quranic-emerald/10 flex items-center justify-center text-quranic-emerald shrink-0">
                  <Icon className="h-5 w-5" />
                </div>
              )}
              <div>
                <h2 className="font-rokh-bold font-bold text-xl sm:text-2xl text-foreground leading-tight">
                  {title}
                </h2>
                {subtitle && (
                  <p className="font-doran text-xs sm:text-sm text-muted-foreground mt-0.5">
                    {subtitle}
                  </p>
                )}
              </div>
            </div>
            {to && (
              <Link
                href={to}
                className="inline-flex items-center gap-1.5 font-ui text-xs sm:text-sm font-semibold text-quranic-emerald hover:text-quranic-turquoise hover:underline transition-colors"
              >
                {viewAllLabel} <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            )}
          </div>
        ) : null}

        <div className={`flex gap-4 sm:gap-6 overflow-x-auto ${noScrollbar ? 'no-scrollbar' : ''} pb-2 ${className}`}>
          {children}
        </div>
      </div>
    </section>
  );
}

/**
 * Featured Content Section — Larger cards, more emphasis
 */
export function FeaturedContentSection({
  title,
  subtitle,
  icon: Icon,
  to,
  children,
  className = '',
}) {
  return (
    <section className={`py-16 sm:py-20 lg:py-24 ${className}`}>
      <div className="container-quranic">
        {title && (
          <div className="mb-10 sm:mb-14 text-center">
            <h2 className="font-rokh-bold font-black text-3xl sm:text-4xl text-foreground tracking-tight mb-3">
              {title}
            </h2>
            {subtitle && (
              <p className="font-doran text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                {subtitle}
              </p>
            )}
          </div>
        )}
        <div className="grid gap-8 sm:gap-10 lg:gap-12 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {children}
        </div>
        {to && (
          <div className="mt-12 text-center">
            <Link
              href={to}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-quranic-emerald text-white font-rokh-bold font-bold hover:bg-quranic-turquoise transition-all shadow-quranic-glow hover:shadow-[0_0_30px_-6px_hsl(var(--quranic-emerald)_/0.6)]"
            >
              نمایش همه <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
