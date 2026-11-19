'use client';

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  fetchWatchHistory, getWatchCount, getTotalWatchTime, removeWatchEntry,
  clearWatchHistory,
} from "@/lib/watchHistory";
import { fa } from "@/lib/utils";
import EmptyState from "@/components/ui/empty-state";
import {
  Clock, Trash2, Play, Loader2, Video as VideoIcon,
} from "lucide-react";
import { toast } from "react-hot-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

/**
 * Ayeh Media Plus — Watch History Page
 * Shows the user's video watch history with timestamps and completion.
 * Built on shadcn/ui Card + Button + Badge primitives.
 */
export default function WatchHistoryPage() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const h = await fetchWatchHistory();
      if (!cancelled) {
        setHistory(h);
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleRemove = (videoId) => {
    removeWatchEntry(videoId);
    setHistory(prev => prev.filter(h => h.video_id !== videoId));
    toast.success("از تاریخچه حذف شد.");
  };

  const handleClear = () => {
    if (!confirm("آیا از پاکسازی تمام تاریخچه تماشای خود اطمینان دارید؟")) return;
    clearWatchHistory();
    setHistory([]);
    toast.success("تاریخچه تماشای شما پاک شد.");
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="h-10 w-10 animate-spin text-accent mb-4" />
        <p className="text-muted-foreground font-doran">در حال بارگذاری تاریخچه...</p>
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="page-shell-narrow py-6">
        <EmptyState type="history" />
      </div>
    );
  }

  const totalWatchTime = getTotalWatchTime();
  const watchCount = getWatchCount();

  const formatDuration = (seconds) => {
    if (!seconds) return "0:00";
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div className="page-shell animate-fade-in font-doran">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-rokh-bold font-bold text-2xl sm:text-3xl text-foreground">تاریخچه تماشا</h1>
          <p className="text-muted-foreground mt-1.5 text-sm font-editorial">
            ویدیوهای تماشا‌شده شما
          </p>
        </div>
        <Button variant="destructive" size="sm" onClick={handleClear}>
          پاک کردن همه
        </Button>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardContent>
            <CardTitle className="text-xs text-muted-foreground font-ui mb-1">ویدیوهای تماشای شده</CardTitle>
            <div className="text-2xl font-rokh-bold font-bold text-foreground">{watchCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <CardTitle className="text-xs text-muted-foreground font-ui mb-1">زمان کل تماشا</CardTitle>
            <div className="text-2xl font-rokh-bold font-bold text-foreground">{formatDuration(totalWatchTime)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <CardTitle className="text-xs text-muted-foreground font-ui mb-1">تاریخچه فعلی</CardTitle>
            <div className="text-2xl font-rokh-bold font-bold text-foreground">{history.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* History list */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>تاریخچه تماشا</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-border/50">
            {history.map((entry) => (
              <div key={entry.video_id} className="px-6 py-5 flex items-center justify-between group hover:bg-muted/20 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded bg-muted overflow-hidden flex-shrink-0">
                    {entry.thumbnail_url ? (
                      <img src={entry.thumbnail_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground/60">
                        <VideoIcon className="h-6 w-6" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    {entry.video_available === false ? (
                      <span className="font-medium text-muted-foreground truncate block">
                        {entry.title || "ویدیو حذف‌شده"}
                        <span className="ms-2 text-xs font-normal">(دیگر در دسترس نیست)</span>
                      </span>
                    ) : (
                      <Link
                        href={`/watch/${entry.video_id}`}
                        className="font-medium text-foreground truncate block hover:text-primary transition-colors"
                      >
                        {entry.title || "ویدیو بدون عنوان"}
                      </Link>
                    )}
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                      <span>{fa(entry.watch_count || 1)} بار تماشا</span>
                      <span>•</span>
                      <span>{entry.completion_percentage}% تکمیل</span>
                      <span>•</span>
                      <span className="font-mono">{new Date(entry.watched_at).toLocaleString('fa-IR')}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {entry.video_available !== false && (
                    <Play className="h-4 w-4 text-primary/60 hover:text-primary transition-colors" />
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemove(entry.video_id)}
                    className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/5"
                    title="حذف از تاریخچه"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
