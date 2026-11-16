import { useEffect, useState } from "react";
import api from "@/lib/api";
import { Trophy, Crown, Flame } from "lucide-react";
import { Avatar } from "./shared";

const fa = (n) => (n || 0).toLocaleString("fa-IR");

/* Medal styling for the top 3 ranks */
const RANKS = [
  { ring: "border-amber-400/50 bg-amber-50/60", chip: "bg-gradient-to-br from-amber-300 to-amber-500 text-amber-900", glow: "shadow-[0_0_24px_-6px_rgba(251,191,36,0.45)]" },
  { ring: "border-slate-300/70 bg-slate-50/60", chip: "bg-gradient-to-br from-slate-200 to-slate-400 text-slate-700" },
  { ring: "border-orange-400/40 bg-orange-50/50", chip: "bg-gradient-to-br from-orange-300 to-orange-500 text-orange-900" },
];

export default function Leaderboard() {
  const [rows, setRows] = useState(null);

  useEffect(() => {
    api.entities.CompetitionEntry.list("-votes_count", 300)
      .then((entries) => {
        const map = {};
        entries.forEach((e) => {
          const key = e.author_id || e.author_name;
          if (!map[key]) map[key] = { id: key, name: e.author_name, votes: 0, entries: 0, wins: 0 };
          map[key].votes += e.votes_count || 0;
          map[key].entries += 1;
          if (e.is_winner) map[key].wins += 1;
        });
        setRows(Object.values(map).sort((a, b) => b.votes - a.votes).slice(0, 10));
      })
      .catch(() => setRows([]));
  }, []);

  if (!rows) {
    return (
      <div className="flex justify-center py-10 mb-8">
        <div className="h-6 w-6 rounded border-2 border-accent/20 border-t-accent animate-spin" />
      </div>
    );
  }
  if (rows.length === 0) return null;

  return (
    <section className="relative rounded border border-accent/20 bg-gradient-to-br from-card via-card/80 to-accent/[0.06] p-5 sm:p-8 mb-10 shadow-premium overflow-hidden">
      {/* Decorative glows */}
      <div className="absolute -top-16 -left-16 h-48 w-48 rounded bg-amber-400/10 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-16 -right-16 h-48 w-48 rounded bg-accent/10 blur-3xl pointer-events-none" />

      <div className="relative">
        <div className="flex items-center gap-3 mb-6">
          <div className="h-11 w-11 rounded bg-gradient-to-br from-amber-400/20 to-accent/10 text-amber-500 flex items-center justify-center ring-1 ring-amber-400/20 shrink-0">
            <Trophy className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <h2 className="font-display font-extrabold text-xl sm:text-2xl">جدول قهرمانان</h2>
            <p className="text-xs text-muted-foreground mt-0.5">برترین شرکت‌کنندگان بر اساس آرای کاربران</p>
          </div>
          <Flame className="h-5 w-5 text-accent/40 mr-auto hidden sm:block" />
        </div>

        <div className="space-y-2.5">
          {rows.map((r, i) => {
            const rank = RANKS[i];
            return (
              <div
                key={r.id}
                className={`flex items-center gap-3 rounded border p-3 sm:p-3.5 transition-colors ${rank ? `${rank.ring} ${rank.glow}` : "border-border/40 bg-card/40"}`}
              >
                <span className={`h-8 w-8 shrink-0 rounded flex items-center justify-center text-sm font-extrabold font-rokh-bold ${rank ? rank.chip : "bg-muted/60 text-muted-foreground"}`}>
                  {(i + 1).toLocaleString("fa-IR")}
                </span>
                <Avatar name={r.name} size={36} />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold font-doran flex items-center gap-1.5 truncate">
                    {r.name}
                    {r.wins > 0 && <Crown className="h-3.5 w-3.5 text-amber-500 shrink-0" />}
                  </div>
                  <div className="text-xs text-muted-foreground font-doran">{fa(r.entries)} اثر ثبت‌شده</div>
                </div>
                <div className="text-left shrink-0">
                  <div className="font-display font-extrabold text-accent">{fa(r.votes)}</div>
                  <div className="text-xs text-muted-foreground">رأی</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}