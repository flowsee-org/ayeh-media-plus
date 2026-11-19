'use client';

import { Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { Card, CardContent, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

/**
 * Shared profile content section.
 * Wraps tab content with consistent heading, loading, empty, and error states.
 * Built on shadcn/ui primitives (Card, Button, Badge, Skeleton) with Quranic design tokens.
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
  const router = useRouter();

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="flex flex-col items-center justify-center py-20 text-center">
          <div className="flex items-center justify-center h-8 w-8 animate-spin text-accent mb-3">
            <Loader2 className="h-8 w-8" />
          </div>
          <p className="text-muted-foreground text-sm">در حال بارگذاری...</p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardContent className="p-8 text-center">
          <p className="text-sm text-destructive">{error}</p>
          {emptyActionHref && (
            <Button
              onClick={() => router.push(emptyActionHref)}
              variant="destructive"
              className="mt-4"
            >
              تلاش مجدد
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  if (empty) {
    return (
      <Card className={className}>
        <CardContent className="p-16 text-center">
          {Icon && <Icon className="h-10 w-10 text-muted-foreground/30 mx-auto mb-4" />}
          <CardTitle className="mb-2">{emptyTitle || 'محتوایی یافت نشد'}</CardTitle>
          <CardDescription className="mx-auto mb-6 max-w-xs">
            {emptySubtitle || 'هنوز محتوایی در این بخش منتشر نشده است.'}
          </CardDescription>
          {emptyActionLabel && emptyActionHref && (
            <Link href={emptyActionHref}>
              <Button variant="accent" className="w-auto">
                {emptyActionLabel}
              </Button>
            </Link>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={className}>
      {title && (
        <div className="flex items-center gap-2 mb-6">
          {Icon && <Icon className="h-5 w-5 text-accent" />}
          <h2 className="font-display font-bold text-lg">{title}</h2>
          <Badge variant="quranic" className="ml-2 text-xs">
            فعال
          </Badge>
        </div>
      )}
      {children}
    </div>
  );
}
