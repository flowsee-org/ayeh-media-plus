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
    <section className={`py-2 ${sectionClassName}`}>
      <div>
        {title || subtitle || to ? (
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              {Icon && (
                <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                  <Icon className="h-4 w-4" />
                </div>
              )}
              <div>
                <h2 className="font-rokh-bold font-bold text-lg sm:text-xl text-foreground leading-tight">
                  {title}
                </h2>
                {subtitle && (
                  <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                    {subtitle}
                  </p>
                )}
              </div>
            </div>
            {to && (
              <Link
                href={to}
                className="inline-flex items-center gap-1 text-xs sm:text-sm font-semibold text-primary hover:underline"
              >
                {viewAllLabel} <ChevronRight className="h-3.5 w-3.5 rotate-180" />
              </Link>
            )}
          </div>
        ) : null}

        <div className={`flex gap-4 overflow-x-auto ${noScrollbar ? 'no-scrollbar' : ''} pb-2 ${className}`}>
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
