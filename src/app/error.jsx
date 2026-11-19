'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { IslamicStar } from '@/components/IslamicOrnaments';
import { RefreshCw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function RootError({ error, reset }) {
  useEffect(() => {
    // Log the error to console or error reporter
    console.error('App Router Caught Error:', error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-background text-foreground">
      <div className="max-w-md w-full text-center space-y-6 bg-card/60 backdrop-blur-md p-8 rounded-2xl border border-border/40 shadow-xl">
        <div className="flex justify-center">
          <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center text-destructive">
            <IslamicStar size={32} />
          </div>
        </div>

        <div className="space-y-2">
          <h2 className="text-xl font-bold font-heading text-foreground">
            خطایی در پردازش رخ داد
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            متأسفانه هنگام بارگذاری اطلاعات مشکلی پیش آمد. لطفاً اتصال اینترنت خود را بررسی کرده و دوباره تلاش کنید.
          </p>
        </div>

        {process.env.NODE_ENV === 'development' && error?.message && (
          <div className="p-3 bg-muted/50 rounded-lg text-xs font-mono text-left text-destructive overflow-auto max-h-32 text-ltr" dir="ltr">
            {error.message}
          </div>
        )}

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Button
            onClick={() => reset()}
            className="w-full sm:w-auto gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <RefreshCw className="w-4 h-4" />
            تلاش مجدد
          </Button>
          <Button
            asChild
            variant="outline"
            className="w-full sm:w-auto gap-2 border-border/60 hover:bg-muted"
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
