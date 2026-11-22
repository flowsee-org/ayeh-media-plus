'use client';

import { Skeleton as ShadcnSkeleton } from '@/components/ui/skeleton';

/**
 * Loading Skeleton Components
 * Consistent skeleton loaders for media-heavy pages.
 * Built on shadcn/ui Skeleton primitive.
 */

export function SkeletonVideoCard({ className = '' }) {
  return (
    <div className={`group relative block rounded border border-border/30 bg-card/50 overflow-hidden transition-all ${className}`}>
      <div className="h-56 lg:h-64 overflow-hidden bg-gradient-to-br from-muted/40 to-muted/60 flex items-center justify-center relative">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-muted/30 to-transparent animate-shimmer" />
        <ShadcnSkeleton className="h-12 w-12 rounded mx-auto animate-pulse" />
        <div className="absolute bottom-3 right-3 inline-flex items-center gap-1 px-2 py-1 rounded bg-black/80 text-white text-[10px] font-bold">
          <ShadcnSkeleton className="h-3 w-3 rounded" />
          <ShadcnSkeleton className="h-3 w-8 rounded" />
        </div>
        <div className="absolute top-3 left-3 inline-flex items-center gap-1 px-2 py-1 rounded bg-quranic-saffron/90 text-quranic-ink text-[11px] font-bold">
          <ShadcnSkeleton className="h-3 w-3 rounded" />
          <ShadcnSkeleton className="h-3 w-10 rounded" />
        </div>
      </div>
      <div className="p-4 flex-1 flex flex-col">
        <ShadcnSkeleton className="h-4 w-3/4 mb-2" />
        <ShadcnSkeleton className="h-3 w-1/2 mb-1" />
        <div className="mt-auto pt-3 border-t border-border/30 flex items-center justify-between font-ui text-[11px]">
          <ShadcnSkeleton className="h-3 w-1/3" />
          <ShadcnSkeleton className="h-3 w-1/3" />
        </div>
      </div>
    </div>
  );
}

export function SkeletonGrid({ count = 4, variant = 'video' }) {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="animate-fade-in-up">
          {variant === 'video' ? <SkeletonVideoCard /> : <SkeletonCard />}
        </div>
      ))}
    </div>
  );
}

export function SkeletonCard({ className = '' }) {
  return (
    <div className={`rounded border border-border/30 bg-card/50 overflow-hidden ${className}`}>
      <div className="h-48 overflow-hidden bg-muted/40 relative">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-muted/30 to-transparent animate-shimmer" />
      </div>
      <div className="p-4">
        <ShadcnSkeleton className="h-4 w-3/4 mb-2" />
        <ShadcnSkeleton className="h-3 w-1/2 mb-2" />
        <div className="flex gap-2">
          <ShadcnSkeleton className="h-3 w-1/3" />
          <ShadcnSkeleton className="h-3 w-1/3" />
        </div>
      </div>
    </div>
  );
}

export function SkeletonList({ count = 5 }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex gap-3 animate-fade-in-up">
          <ShadcnSkeleton className="h-12 w-12 rounded shrink-0" />
          <div className="flex-1 space-y-2">
            <ShadcnSkeleton className="h-3 w-3/4" />
            <ShadcnSkeleton className="h-2.5 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function SkeletonProfileHeader({ className = '' }) {
  return (
    <div className={`rounded border border-border/30 bg-card/50 p-6 sm:p-10 shadow-soft ${className}`}>
      <div className="flex items-center gap-4 mb-6">
        <ShadcnSkeleton className="h-20 w-20 rounded shrink-0" />
        <div className="flex-1 min-w-0">
          <ShadcnSkeleton className="h-6 w-1/2 mb-2" />
          <ShadcnSkeleton className="h-4 w-1/3" />
        </div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="p-3 rounded bg-muted/20">
            <ShadcnSkeleton className="h-3 w-full" />
            <ShadcnSkeleton className="h-2 w-2/3 mt-1" />
          </div>
        ))}
      </div>
    </div>
  );
}

const DefaultSkeletonPage = ({ className = '' }) => (
  <SkeletonPage className={className} />
);

export default DefaultSkeletonPage;

export function SkeletonPage({ className = '' }) {
  return (
    <div className={`animate-fade-in ${className}`}>
      <div className="space-y-8">
        <ShadcnSkeleton className="h-4 w-1/3" />
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-3 w-2/4" />
          ))}
        </div>
        <SkeletonGrid count={6} />
      </div>
    </div>
  );
}
