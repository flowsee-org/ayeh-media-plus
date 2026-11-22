import { useState, useEffect } from "react";
import Link from "next/link";
import { Flame, Trophy, ArrowRight, Brain, CheckCircle2 } from "lucide-react";
import api from "@/lib/api";
import { useAuth } from "@/lib/AuthContext";

export default function GamificationHomeBanner() {
  const { user } = useAuth();
  const [status, setStatus] = useState(null);

  useEffect(() => {
    let isMounted = true;
    api.gamification
      .getStatus()
      .then((res) => {
        if (isMounted) setStatus(res);
      })
      .catch(() => {});

    return () => {
      isMounted = false;
    };
  }, [user]);

  const streakDays = status?.streak_days || user?.streak_days || 0;
  const totalXp = status?.total_xp || user?.total_xp || 0;
  const completedCount = status?.completed_quests_count || 0;
  const levelName = status?.spiritual_level || user?.spiritual_level || "مستمع";

  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-5">
      <div className="relative rounded bg-gradient-to-r from-emerald-950 via-teal-950 to-[#041a14] border border-emerald-600/30 p-5 sm:p-7 shadow-xl overflow-hidden backdrop-blur-md">
        {/* Glow ambient */}
        <div className="absolute top-0 -left-16 w-56 h-56 bg-orange-500/10 rounded blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 -right-16 w-56 h-56 bg-emerald-500/15 rounded blur-3xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="flex items-start sm:items-center gap-4">
            <div className="w-13 h-13 sm:w-16 sm:h-16 rounded bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center text-white shadow-lg shadow-orange-500/30 shrink-0">
              <Flame className="w-7 h-7 sm:w-8 sm:h-8 fill-white animate-pulse" />
            </div>

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold font-rokh-bold text-orange-400 bg-orange-500/10 px-2.5 py-0.5 rounded border border-orange-500/20">
                  {streakDays} روز استریک متوالی
                </span>
                <span className="text-xs font-bold font-rokh-bold text-emerald-300 bg-emerald-500/10 px-2.5 py-0.5 rounded border border-emerald-500/20">
                  سطح {levelName} ({totalXp.toLocaleString()} XP)
                </span>
              </div>

              <h3 className="text-lg sm:text-xl font-bold font-rokh-bold text-white mt-1.5">
                مأموریت‌های سه‌گانه و مسابقه معنوی امروز
              </h3>
              <p className="text-xs text-emerald-100/70 mt-0.5 max-w-xl">
                با استماع آیه روز و پاسخ به کوییز تدبر، شعله استریک خود را روشن نگه داشته و در تابلوی لیگ صعود کنید.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0 self-start md:self-center">
            {/* Mini Progress */}
            <div className="bg-black/30 border border-emerald-500/20 px-3.5 py-2 rounded flex items-center gap-2.5 text-xs text-emerald-200 font-rokh-bold">
              {completedCount === 3 ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              ) : (
                <Brain className="w-4 h-4 text-amber-300" />
              )}
              <span>{completedCount} از ۳ مأموریت</span>
            </div>

            <Link
              href="/achievements"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white text-xs font-bold font-rokh-bold shadow-lg shadow-emerald-950/50 transition-all active:scale-95 border border-emerald-400/30"
            >
              <Trophy className="w-4 h-4 text-amber-300" />
              <span>ورود به چالش‌ها و رده‌بندی</span>
              <ArrowRight className="w-3.5 h-3.5 rotate-180" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
