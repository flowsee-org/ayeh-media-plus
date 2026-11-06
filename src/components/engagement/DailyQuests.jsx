import { useEffect, useState } from "react";
import { Flame, Star, BookOpen, Headphones, Bookmark, MessageCircle, PenLine, Gift, CheckCircle2, Sparkles } from "lucide-react";
import confetti from "canvas-confetti";
import { getEngagementSnapshot, claimDailyBonus, ENGAGEMENT_EVENT } from "@/lib/engagement";

const fa = (n) => (n || 0).toLocaleString("fa-IR");
const BONUS = 50;
const ICONS = {
  read_verses: BookOpen,
  listen_audio: Headphones,
  bookmark_verse: Bookmark,
  social: MessageCircle,
  note: PenLine,
};

export default function DailyQuests() {
  const [snap, setSnap] = useState(getEngagementSnapshot);

  useEffect(() => {
    const refresh = () => setSnap(getEngagementSnapshot());
    window.addEventListener(ENGAGEMENT_EVENT, refresh);
    return () => window.removeEventListener(ENGAGEMENT_EVENT, refresh);
  }, []);

  const claim = () => {
    claimDailyBonus();
    confetti({ particleCount: 130, spread: 90, origin: { y: 0.7 }, colors: ["#c5a059", "#0B6E4F", "#f4e8d0"] });
    setSnap(getEngagementSnapshot());
  };

  return (
    <div className="relative overflow-hidden rounded-2xl border border-accent/15 bg-card/60 backdrop-blur-sm p-5 sm:p-7 shadow-premium">
      <div className="absolute -top-16 -left-16 h-44 w-44 rounded-full bg-accent/8 blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="relative flex flex-wrap items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-2.5">
          <div className="h-10 w-10 rounded-xl bg-accent/10 text-accent flex items-center justify-center ring-1 ring-accent/15">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-display font-bold text-lg sm:text-xl">مأموریت‌های امروز</h2>
            <p className="text-xs text-muted-foreground mt-0.5">با قرآن درگیر شوید، امتیاز بگیرید و استریک خود را حفظ کنید</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-2 rounded-full border border-accent/20 bg-accent/8 text-accent">
            <Flame className="h-4 w-4" />
            <span className="text-sm font-bold">{fa(snap.streak)}</span>
            <span className="text-xs text-accent/70">روز پیاپی</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-2 rounded-full border border-primary/15 bg-primary/8 text-primary">
            <Star className="h-4 w-4" />
            <span className="text-sm font-bold">{fa(snap.xp)}</span>
            <span className="text-xs text-primary/70">امتیاز · {snap.level.name}</span>
          </div>
        </div>
      </div>

      {/* Quests */}
      <div className="relative grid sm:grid-cols-3 gap-3">
        {snap.quests.map((q) => {
          const Icon = ICONS[q.id] || Sparkles;
          const pct = (q.progress / q.target) * 100;
          return (
            <div
              key={q.id}
              className={`rounded-xl border p-4 transition-all ${q.done ? "border-primary/25 bg-primary/[0.04]" : "border-border/40 bg-card/40"}`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className={`h-9 w-9 rounded-lg flex items-center justify-center ${q.done ? "bg-primary/15 text-primary" : "bg-accent/10 text-accent"}`}>
                  {q.done ? <CheckCircle2 className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
                </div>
                <span className="text-xs font-medium text-muted-foreground">+{fa(q.xp)} امتیاز</span>
              </div>
              <div className="text-sm font-medium mb-2">{q.label}</div>
              <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${q.done ? "bg-primary" : "bg-accent"}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
              <div className="text-xs text-muted-foreground mt-1.5">
                {fa(q.progress)} از {fa(q.target)}
              </div>
            </div>
          );
        })}
      </div>

      {/* Bonus claim */}
      {snap.allDone && !snap.bonusClaimed && (
        <button
          onClick={claim}
          className="relative mt-4 w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-l from-accent to-accent/80 text-accent-foreground py-3 text-sm font-bold hover:shadow-glow transition-all animate-fade-in"
        >
          <Gift className="h-4 w-4" />
          همه مأموریت‌ها انجام شد! جایزه امروز را دریافت کنید (+{fa(BONUS)} امتیاز)
        </button>
      )}
      {snap.bonusClaimed && (
        <div className="relative mt-4 flex items-center justify-center gap-2 rounded-xl border border-primary/20 bg-primary/[0.06] py-3 text-sm text-primary font-medium">
          <CheckCircle2 className="h-4 w-4" />
          جایزه امروز دریافت شد — فردا مأموریت‌های تازه در انتظار شماست
        </div>
      )}
    </div>
  );
}