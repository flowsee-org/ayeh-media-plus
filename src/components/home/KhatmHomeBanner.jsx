import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Sparkles, ArrowLeft, HeartHandshake } from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function KhatmHomeBanner() {
  const [featuredKhatm, setFeaturedKhatm] = useState(null);
  const [completedCount, setCompletedCount] = useState(0);

  useEffect(() => {
    async function loadFeatured() {
      try {
        const sessions = await base44.entities.KhatmSession.list("-created_date", 1);
        const item = Array.isArray(sessions) ? sessions[0] : sessions?.items?.[0];
        if (item) {
          setFeaturedKhatm(item);
          const parts = await base44.entities.KhatmPart.filter({ session_id: item.id });
          const items = Array.isArray(parts) ? parts : parts.items || [];
          setCompletedCount(items.filter((p) => p.status === "completed").length);
        }
      } catch {
        // Ignore fallback
      }
    }
    loadFeatured();
  }, []);

  if (!featuredKhatm) return null;

  const totalParts = featuredKhatm.total_parts || 30;
  const progressPercent = Math.round((completedCount / totalParts) * 100);

  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4 sm:py-6" dir="rtl">
      <div className="relative overflow-hidden rounded-3xl border border-amber-400/30 p-6 sm:p-8 shadow-xl bg-card">
        {/* Authentic Persian Carpet & Stained Glass Ambient Backdrop */}
        <div className="absolute inset-0 z-0 pointer-events-none">
          <img
            src="/images/art/nasir_carpet_window.jpg"
            alt=""
            className="w-full h-full object-cover filter brightness-[0.35] dark:brightness-[0.2] contrast-[1.15]"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/90 to-background/70 backdrop-blur-xs" />
        </div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-accent/20 text-accent border border-accent/30">
                <Sparkles className="w-3.5 h-3.5" />
                <span>محفل ختم قرآن دسته‌جمعی</span>
              </span>
              {featuredKhatm.intention && (
                <span className="text-xs text-amber-700 dark:text-amber-400 font-medium">
                  نیت: {featuredKhatm.intention}
                </span>
              )}
            </div>

            <h3 className="text-xl sm:text-2xl font-bold font-kalameh text-foreground">
              {featuredKhatm.title}
            </h3>

            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              با انتخاب و تلاوت یک یا چند سهم، در این ثواب جاریه با همراهان آیه پلاس شریک شوید و نیت خود را در دیوار دعا ثبت کنید.
            </p>

            {/* Quick progress */}
            <div className="max-w-md space-y-1.5 pt-1">
              <div className="flex items-center justify-between text-xs font-medium">
                <span className="text-muted-foreground">
                  پیشرفت: {completedCount.toLocaleString("fa-IR")} از {totalParts.toLocaleString("fa-IR")} سهم قرائت شده
                </span>
                <span className="text-accent font-bold">{progressPercent.toLocaleString("fa-IR")}٪</span>
              </div>
              <div className="w-full h-2 rounded-full bg-muted/60 overflow-hidden">
                <div
                  className="bg-accent h-full transition-all duration-500 rounded-full"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row md:flex-col items-stretch sm:items-center md:items-end gap-3 shrink-0">
            {featuredKhatm.salawat_count > 0 && (
              <div className="inline-flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400 font-medium bg-amber-500/10 px-3 py-1.5 rounded-xl border border-amber-500/20">
                <HeartHandshake className="w-4 h-4" />
                <span>{featuredKhatm.salawat_count.toLocaleString("fa-IR")} صلوات ثبت شده</span>
              </div>
            )}
            <Link
              to={`/khatm/${featuredKhatm.id}`}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-accent text-accent-foreground font-semibold text-sm shadow-md hover:bg-accent/90 transition-all active:scale-95"
            >
              <span>رزرو و شروع تلاوت سهم</span>
              <ArrowLeft className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
