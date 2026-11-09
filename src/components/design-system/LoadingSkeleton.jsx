'use client';

/**
 * Loading Skeleton Components
 * Consistent skeleton loaders for media-heavy pages.
 */

export function SkeletonVideoCard({ className = '' }) {
  return (
    <div className={`group relative block rounded-2xl border border-border/30 bg-card/50 overflow-hidden transition-all ${className}`}>
      <div className="h-56 lg:h-64 overflow-hidden bg-gradient-to-br from-muted/40 to-muted/60 flex items-center justify-center relative">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-muted/30 to-transparent animate-shimmer" />
        <div className="h-12 w-12 rounded-full bg-muted/40 flex items-center justify-center animate-pulse">
          <div className="h-4 w-4 rounded-full bg-white/40" />
        </div>
        <div className="absolute bottom-3 right-3 inline-flex items-center gap-1 px-2 py-1 rounded-full bg-black/80 text-white text-[10px] font-bold">
          <span className="h-3 w-3 rounded-full bg-white/40 animate-pulse" />
          <span className="h-3 w-8 rounded-full bg-white/30 animate-pulse" />
        </div>
        <div className="absolute top-3 left-3 inline-flex items-center gap-1 px-2 py-1 rounded-full bg-quranic-saffron/90 text-quranic-ink text-[11px] font-bold">
          <span className="h-3 w-3 rounded-full bg-white/30 animate-pulse" />
          <span className="h-3 w-10 rounded-full bg-white/20 animate-pulse" />
        </div>
      </div>
      <div className="p-4 flex-1 flex flex-col">
        <div className="h-4 bg-muted/40 rounded-lg w-3/4 mb-2 animate-pulse" />
        <div className="h-3 bg-muted/40 rounded-lg w-1/2 mb-1 animate-pulse" />
        <div className="mt-auto pt-3 border-t border-border/30 flex items-center justify-between font-ui text-[11px]">
          <div className="h-3 bg-muted/30 rounded w-1/3 animate-pulse" />
          <div className="h-3 bg-muted/30 rounded w-1/3 animate-pulse" />
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
    <div className={`rounded-2xl border border-border/30 bg-card/50 overflow-hidden ${className}`}>
      <div className="h-48 overflow-hidden bg-muted/40 relative">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-muted/30 to-transparent animate-shimmer" />
      </div>
      <div className="p-4">
        <div className="h-4 bg-muted/40 rounded-lg w-3/4 mb-2 animate-pulse" />
        <div className="h-3 bg-muted/40 rounded-lg w-1/2 mb-2 animate-pulse" />
        <div className="flex gap-2">
          <div className="h-3 bg-muted/30 rounded w-1/3 animate-pulse" />
          <div className="h-3 bg-muted/30 rounded w-1/3 animate-pulse" />
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
          <div className="h-12 w-12 rounded-full bg-muted/40 shrink-0 animate-pulse" />
          <div className="flex-1 space-y-2">
            <div className="h-3 bg-muted/40 rounded-lg w-3/4 animate-pulse" />
            <div className="h-2.5 bg-muted/30 rounded-lg w-1/2 animate-pulse" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function SkeletonProfileHeader({ className = '' }) {
  return (
    <div className={`rounded-3xl border border-border/30 bg-card/50 p-6 sm:p-10 shadow-soft ${className}`}>
      <div className="flex items-center gap-4 mb-6">
        <div className="h-20 w-20 rounded-full bg-muted/40 animate-pulse shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="h-6 bg-muted/40 rounded-lg w-1/2 mb-2 animate-pulse" />
          <div className="h-4 bg-muted/30 rounded-lg w-1/3 animate-pulse" />
        </div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="p-3 rounded-xl bg-muted/20">
            <div className="h-3 bg-muted/40 rounded w-full animate-pulse" />
            <div className="h-2 bg-muted/30 rounded w-2/3 mt-1 animate-pulse" />
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
        <div className="h-4 bg-muted/30 rounded-lg w-1/3 animate-pulse" />
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-3 bg-muted/30 rounded-lg animate-pulse" />
          ))}
        </div>
        <SkeletonGrid count={6} />
      </div>
    </div>
  );
}
