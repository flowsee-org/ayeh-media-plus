import { useState, useEffect } from "react";
import { Trophy, Flame, Sparkles, Medal, User } from "lucide-react";
import api from "@/lib/api";

const LEAGUE_BADGES = {
  فردوس: {
    bg: "bg-emerald-500/15",
    text: "text-emerald-600 dark:text-emerald-400",
    border: "border-emerald-500/30",
  },
  تسنیم: {
    bg: "bg-amber-500/15",
    text: "text-amber-600 dark:text-amber-400",
    border: "border-amber-500/30",
  },
  کوثر: {
    bg: "bg-teal-500/15",
    text: "text-teal-600 dark:text-teal-400",
    border: "border-teal-500/30",
  },
  نور: {
    bg: "bg-slate-500/15",
    text: "text-slate-600 dark:text-slate-400",
    border: "border-slate-500/30",
  },
};

export default function LeaderboardTable() {
  const [filterType, setFilterType] = useState("xp"); // 'xp' | 'streak'
  const [loading, setLoading] = useState(true);
  const [leaderboard, setLeaderboard] = useState([]);

  useEffect(() => {
    let isMounted = true;
    const fetchLeaderboard = async () => {
      try {
        setLoading(true);
        const res = await api.gamification.getLeaderboard(filterType);
        if (isMounted && res?.leaderboard) {
          setLeaderboard(res.leaderboard);
        }
      } catch (err) {
        console.error("Leaderboard fetch error:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchLeaderboard();
    return () => {
      isMounted = false;
    };
  }, [filterType]);

  const top3 = leaderboard.slice(0, 3);
  const remaining = leaderboard.slice(3);

  return (
    <div className="rounded bg-card/90 border border-emerald-900/30 p-5 sm:p-7 shadow-xl backdrop-blur-md">
      {/* Header & Filter Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border/60">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded bg-gradient-to-br from-amber-600 to-yellow-500 text-white shadow-sm">
              <Trophy className="w-4 h-4" />
            </span>
            <h3 className="text-lg font-bold font-rokh-bold text-foreground">
              تابلوی مسابقه در خیرات (رده‌بندی معنوی)
            </h3>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            «وَفِی ذَٰلِکَ فَلْیَتَنَافَسِ الْمُتَنَافِسُونَ» - رقابت سالم بر سر انس با قرآن و انجام عمل صالح
          </p>
        </div>

        {/* Toggle Filter */}
        <div className="flex items-center gap-1 bg-muted p-1 rounded border border-border shrink-0 self-start sm:self-auto">
          <button
            onClick={() => setFilterType("xp")}
            className={`px-3.5 py-1.5 rounded text-xs font-bold font-rokh-bold transition-all ${
              filterType === "xp"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            امتیاز کل (XP)
          </button>
          <button
            onClick={() => setFilterType("streak")}
            className={`px-3.5 py-1.5 rounded text-xs font-bold font-rokh-bold transition-all ${
              filterType === "streak"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            استریک پیوسته (روزها)
          </button>
        </div>
      </div>

      {loading ? (
        <div className="py-12 text-center text-xs text-muted-foreground animate-pulse">
          در حال بارگذاری تابلوی رده‌بندی...
        </div>
      ) : leaderboard.length === 0 ? (
        <div className="py-12 text-center text-xs text-muted-foreground">
          هنوز رتبه‌ای ثبت نشده است. با تلاوت اولین آیه، صدرنشین جدول شوید!
        </div>
      ) : (
        <>
          {/* Top 3 Podium */}
          {top3.length > 0 && (
            <div className="grid grid-cols-3 gap-2 sm:gap-4 my-6 items-end pt-4">
              {/* 2nd Place */}
              {top3[1] && (
                <div className="flex flex-col items-center p-3 sm:p-4 rounded bg-card border border-slate-400/30 text-center relative shadow-sm">
                  <div className="w-6 h-6 rounded bg-slate-400 text-white font-bold text-xs flex items-center justify-center absolute -top-3 shadow-md">
                    ۲
                  </div>
                  <div className="w-12 h-12 sm:w-14 sm:h-14 rounded bg-slate-200 dark:bg-slate-800 border-2 border-slate-400 flex items-center justify-center overflow-hidden mb-2 mt-1">
                    {top3[1].avatar_url ? (
                      <img src={top3[1].avatar_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-6 h-6 text-slate-500" />
                    )}
                  </div>
                  <span className="text-xs font-bold font-rokh-bold text-foreground truncate max-w-full">
                    {top3[1].name}
                  </span>
                  <span className="text-[10px] text-muted-foreground font-mono mt-0.5">
                    {filterType === "xp" ? `${top3[1].total_xp.toLocaleString()} XP` : `${top3[1].streak_days} روز`}
                  </span>
                </div>
              )}

              {/* 1st Place */}
              {top3[0] && (
                <div className="flex flex-col items-center p-4 sm:p-5 rounded bg-card border-2 border-yellow-500/50 text-center relative shadow-lg shadow-yellow-500/10 -translate-y-2">
                  <div className="w-7 h-7 rounded bg-gradient-to-tr from-yellow-600 to-amber-400 text-white font-bold text-xs flex items-center justify-center absolute -top-3.5 shadow-md">
                    <Medal className="w-4 h-4 fill-white" />
                  </div>
                  <div className="w-14 h-14 sm:w-16 sm:h-16 rounded bg-amber-100 dark:bg-amber-950/40 border-2 border-yellow-500 flex items-center justify-center overflow-hidden mb-2 mt-2 shadow-inner">
                    {top3[0].avatar_url ? (
                      <img src={top3[0].avatar_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-7 h-7 text-yellow-600" />
                    )}
                  </div>
                  <span className="text-xs sm:text-sm font-bold font-rokh-bold text-foreground truncate max-w-full">
                    {top3[0].name}
                  </span>
                  <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400 font-mono mt-0.5">
                    {filterType === "xp" ? `${top3[0].total_xp.toLocaleString()} XP` : `${top3[0].streak_days} روز`}
                  </span>
                </div>
              )}

              {/* 3rd Place */}
              {top3[2] && (
                <div className="flex flex-col items-center p-3 sm:p-4 rounded bg-card border border-amber-700/30 text-center relative shadow-sm">
                  <div className="w-6 h-6 rounded bg-amber-700 text-white font-bold text-xs flex items-center justify-center absolute -top-3 shadow-md">
                    ۳
                  </div>
                  <div className="w-12 h-12 sm:w-14 sm:h-14 rounded bg-amber-900/20 border-2 border-amber-700 flex items-center justify-center overflow-hidden mb-2 mt-1">
                    {top3[2].avatar_url ? (
                      <img src={top3[2].avatar_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-6 h-6 text-amber-700" />
                    )}
                  </div>
                  <span className="text-xs font-bold font-rokh-bold text-foreground truncate max-w-full">
                    {top3[2].name}
                  </span>
                  <span className="text-[10px] text-muted-foreground font-mono mt-0.5">
                    {filterType === "xp" ? `${top3[2].total_xp.toLocaleString()} XP` : `${top3[2].streak_days} روز`}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Leaderboard Table List */}
          <div className="divide-y divide-border/50 border-t border-border/60">
            {remaining.map((item) => {
              const league = LEAGUE_BADGES[item.league] || LEAGUE_BADGES.نور;
              return (
                <div
                  key={item.id}
                  className="flex items-center justify-between py-3 px-2 sm:px-3 hover:bg-muted/40 rounded transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-6 text-center font-mono text-xs font-bold text-muted-foreground">
                      {item.rank}
                    </span>
                    <div className="w-9 h-9 rounded bg-muted border border-border flex items-center justify-center overflow-hidden shrink-0">
                      {item.avatar_url ? (
                        <img src={item.avatar_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <User className="w-4 h-4 text-muted-foreground" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold font-rokh-bold text-foreground">
                          {item.name}
                        </span>
                        <span
                          className={`text-[9px] px-1.5 py-0.2 rounded font-rokh-bold font-bold border ${league.bg} ${league.text} ${league.border}`}
                        >
                          لیگ {item.league}
                        </span>
                      </div>
                      <span className="text-[10px] text-muted-foreground">
                        سطح: {item.spiritual_level}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-left font-mono shrink-0">
                    <div className="flex items-center gap-1 text-xs text-orange-500">
                      <Flame className="w-3.5 h-3.5 fill-orange-500" />
                      <span className="font-bold">{item.streak_days}</span>
                    </div>
                    <div className="flex items-center gap-1 text-xs font-bold text-foreground min-w-[70px] justify-end">
                      <Sparkles className="w-3.5 h-3.5 text-primary" />
                      <span>{item.total_xp.toLocaleString()} XP</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
