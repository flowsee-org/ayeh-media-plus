'use client';

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  getWatchHistory, getWatchCount, getTotalWatchTime, removeWatchEntry,
  clearWatchHistory,
} from "@/lib/watchHistory";
import { fa } from "@/lib/utils";
import {
  Clock, Trash2, Play, BookOpen, Loader2, AlertCircle, Video as VideoIcon,
} from "lucide-react";
import { toast } from "react-hot-toast";

/**
 * Ayeh Media Plus — Watch History Page
 * Shows the user's video watch history with timestamps and completion.
 */
export default function WatchHistoryPage() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const h = getWatchHistory();
    setHistory(h);
    setLoading(false);
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
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-12 text-center">
        <AlertCircle className="h-16 w-16 text-muted-foreground/30 mx-auto mb-6" />
        <h2 className="font-rokh-bold font-bold text-2xl text-foreground mb-4">
          تاریخچه تماشایی خالی است
        </h2>
        <p className="text-muted-foreground mb-8">
          ویدیوهایی که تماشای می‌کنید اینجا نمایش داده می‌شوند.
        </p>
        <Link
          to="/explore"
          className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-quranic-emerald text-white font-rokh-bold font-bold hover:bg-quranic-turquoise transition-all shadow-quranic-glow"
        >
          <BookOpen className="h-5 w-5" />
          <span>کاوش محتوا</span>
        </Link>
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
    <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-8 sm:py-12 animate-fade-in font-doran">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="font-rokh-bold font-bold text-2xl sm:text-3xl text-foreground">تاریخچه تماشا</h1>
          <p className="text-muted-foreground mt-1">
            ویدیوهای تماشای شده شما
          </p>
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
        <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
          <div className="text-xs text-muted-foreground font-ui mb-1">ویدیوهای تماشای شده</div>
          <div className="text-2xl font-rokh-bold font-bold text-foreground">{watchCount}</div>
        </div>
        <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
          <div className="text-xs text-muted-foreground font-ui mb-1">زمان کل تماشا</div>
          <div className="text-2xl font-rokh-bold font-bold text-foreground">{formatDuration(totalWatchTime)}</div>
        </div>
        <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
          <div className="text-xs text-muted-foreground font-ui mb-1">تاریخچه فعلی</div>
          <div className="text-2xl font-rokh-bold font-bold text-foreground">{history.length}</div>
        </div>
      </div>

      {/* History list */}
      <div className="rounded-2xl border border-border bg-card shadow-soft overflow-hidden">
        <div className="px-6 py-4 border-b border-border/50 flex items-center justify-between">
          <h3 className="font-rokh-bold font-bold text-lg text-foreground">تاریخچه تماشا</h3>
          <button
            onClick={handleClear}
            className="text-xs text-destructive hover:underline font-medium"
          >
            پاک کردن همه
          </button>
        </div>
        <div className="divide-y divide-border/50">
          {history.map((entry) => (
            <div key={entry.video_id} className="px-6 py-5 flex items-center justify-between group hover:bg-muted/20 transition-colors">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-xl bg-muted overflow-hidden flex-shrink-0">
                  {entry.thumbnail_url ? (
                    <img src={entry.thumbnail_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground/60">
                      <VideoIcon className="h-6 w-6" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <Link
                    to={`/watch/${entry.video_id}`}
                    className="font-medium text-foreground truncate block hover:text-primary transition-colors"
                  >
                    {entry.title || "ویدیو بدون عنوان"}
                  </Link>
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
                <Play className="h-4 w-4 text-primary/60 hover:text-primary transition-colors" />
                <button
                  onClick={() => handleRemove(entry.video_id)}
                  className="p-2 text-muted-foreground hover:text-red-600 transition-colors"
                  title="حذف از تاریخچه"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
