'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { IslamicStar } from '@/components/IslamicOrnaments';
import { RefreshCw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function MainError({ error, reset }) {
  useEffect(() => {
    console.error('Main Layout Route Error:', error);
  }, [error]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center space-y-5 bg-card/70 backdrop-blur-md p-6 sm:p-8 rounded-2xl border border-border/40 shadow-lg">
        <div className="flex justify-center">
          <div className="w-14 h-14 rounded-full bg-destructive/10 flex items-center justify-center text-destructive">
            <IslamicStar size={28} />
          </div>
        </div>

        <div className="space-y-1.5">
          <h2 className="text-lg font-bold font-heading text-foreground">
            بارگذاری این بخش با مشکل مواجه شد
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
            لطفاً مجدداً امتحان فرمایید یا به صفحه نخست بازگردید.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Button
            onClick={() => reset()}
            size="sm"
            className="w-full sm:w-auto gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <RefreshCw className="w-4 h-4" />
            تلاش دوباره
          </Button>
          <Button
            asChild
            variant="outline"
            size="sm"
            className="w-full sm:w-auto gap-2"
          >
            <Link href="/">
              <Home className="w-4 h-4" />
              صفحه اصلی
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
