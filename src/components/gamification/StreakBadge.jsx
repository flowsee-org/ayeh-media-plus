import { useEffect, useState } from "react";
import Link from "next/link";
import { Flame, Sparkles } from "lucide-react";
import api from "@/lib/api";
import { useAuth } from "@/lib/AuthContext";

export default function StreakBadge({ compact = false }) {
  const { user } = useAuth();
  const [data, setData] = useState({
    streak_days: user?.streak_days || 0,
    total_xp: user?.total_xp || 0,
    spiritual_level: user?.spiritual_level || "مستمع",
  });

  useEffect(() => {
    let isMounted = true;
    const fetchStatus = async () => {
      try {
        const res = await api.gamification.getStatus();
        if (isMounted && res) {
          setData({
            streak_days: res.streak_days || 0,
            total_xp: res.total_xp || 0,
            spiritual_level: res.spiritual_level || "مستمع",
          });
        }
      } catch {
        // Fallback gracefully
      }
    };

    fetchStatus();
    return () => {
      isMounted = false;
    };
  }, [user]);

  if (compact) {
    return (
      <Link
        href="/achievements"
        className="group flex items-center gap-1.5 px-2.5 py-1 rounded bg-gradient-to-r from-amber-500/10 via-orange-500/15 to-emerald-500/10 hover:from-amber-500/20 hover:to-emerald-500/20 border border-amber-500/30 transition-all duration-300 text-xs font-rokh-bold shadow-sm"
        title="استریک روزانه و دستاوردهای معنوی"
      >
        <span className="relative flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded bg-orange-400 opacity-75"></span>
          <span className="relative inline-flex rounded h-2.5 w-2.5 bg-orange-500"></span>
        </span>
        <Flame className="w-3.5 h-3.5 text-orange-500 fill-orange-500 animate-pulse group-hover:scale-110 transition-transform" />
        <span className="font-bold text-foreground font-mono text-[11px] pt-0.5">
          {data.streak_days}
        </span>
        <span className="text-[10px] text-amber-600 dark:text-amber-300 hidden sm:inline">
          روز
        </span>
      </Link>
    );
  }

  return (
    <Link
      to="/achievements"
      className="group relative flex items-center gap-3 p-2.5 sm:px-3 sm:py-1.5 rounded bg-card/80 hover:bg-card border border-emerald-700/30 hover:border-emerald-600/50 shadow-sm hover:shadow-md transition-all duration-300 backdrop-blur-md"
    >
      <div className="w-8 h-8 rounded bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center text-white shadow-orange-500/30 shadow-md group-hover:scale-105 transition-transform">
        <Flame className="w-4 h-4 fill-white" />
      </div>

      <div className="flex flex-col text-right">
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-bold font-rokh-bold text-foreground">
            {data.streak_days} روز استریک
          </span>
          <span className="inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.2 rounded bg-primary/10 text-primary border border-primary/20">
            <Sparkles className="w-2.5 h-2.5 text-primary" />
            {data.spiritual_level}
          </span>
        </div>
        <span className="text-[10px] text-muted-foreground font-mono">
          {data.total_xp.toLocaleString()} XP
        </span>
      </div>
    </Link>
  );
}
