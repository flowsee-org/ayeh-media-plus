import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2, BookOpen, ScrollText, MessageCircle, Users, FolderHeart, Compass, Trophy } from "lucide-react";

const fa = (n) => (n || 0).toLocaleString("fa-IR");

/* Carries literal tailwind class sets for each stat card */
const CARDS = [
  { id: "verses", label: "آیات", entity: "Verse", icon: BookOpen, color: "text-emerald-700 bg-emerald-500/10 ring-emerald-500/10" },
  { id: "tafsir", label: "تفاسیر ثبت‌شده", entity: "Verse", tafsir: true, icon: ScrollText, color: "text-amber-700 bg-amber-500/10 ring-amber-500/10" },
  { id: "posts", label: "پست‌های اجتماعی", entity: "Post", icon: MessageCircle, color: "text-rose-700 bg-rose-500/10 ring-rose-500/10" },
  { id: "scholars", label: "علما", entity: "Scholar", icon: Users, color: "text-sky-700 bg-sky-500/10 ring-sky-500/10" },
  { id: "collections", label: "مجموعه‌ها", entity: "Collection", icon: FolderHeart, color: "text-violet-700 bg-violet-500/10 ring-violet-500/10" },
  { id: "topics", label: "موضوعات", entity: "Topic", icon: Compass, color: "text-teal-700 bg-teal-500/10 ring-teal-500/10" },
  { id: null, label: "مسابقات", entity: "Competition", icon: Trophy, color: "text-yellow-700 bg-yellow-500/10 ring-yellow-500/10" },
];

export default function Dashboard({ onNavigate }) {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    const entities = [...new Set(CARDS.map((c) => c.entity))];
    Promise.all(
      entities.map((e) =>
        base44.entities[e].list("-created_date", 200).catch(() => [])
      )
    ).then((results) => {
      const byEntity = {};
      entities.forEach((e, i) => { byEntity[e] = results[i]; });
      setStats(byEntity);
    });
  }, []);

  const countFor = (c) => {
    const rows = stats?.[c.entity] || [];
    if (c.tafsir) return rows.filter((v) => v.tadabbur || v.classical_tafsir || v.modern_tafsir).length;
    return rows.length;
  };

  return (
    <div>
      {/* Welcome banner */}
      <div className="relative overflow-hidden rounded-3xl border border-accent/15 bg-gradient-to-br from-card via-card/70 to-accent/[0.08] p-6 sm:p-8 mb-6 shadow-soft">
        <div className="absolute -top-12 -left-12 h-40 w-40 rounded-full bg-accent/10 blur-3xl pointer-events-none" />
        <div className="relative flex items-start justify-between gap-4">
          <div>
            <h3 className="font-display font-extrabold text-xl sm:text-2xl">خوش آمدید 👋</h3>
            <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed max-w-md">
              از اینجا می‌توانید آیات، تفاسیر، پست‌های اجتماعی و مجموعه‌ها را مدیریت کنید — همه‌چیز بلافاصله در سایت منتشر می‌شود.
            </p>
          </div>
        </div>
      </div>

      {/* Stats cards */}
      {!stats ? (
        <div className="flex justify-center py-16"><Loader2 className="h-7 w-7 animate-spin text-accent" /></div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {CARDS.map((c) => {
            const Icon = c.icon;
            const clickable = !!c.id;
            return (
              <button
                key={c.label}
                onClick={clickable ? () => onNavigate(c.id) : undefined}
                className={`group text-right rounded-2xl border border-border/40 bg-card/50 p-4 sm:p-5 transition-all ${clickable ? "hover:border-accent/30 hover:shadow-premium cursor-pointer" : "cursor-default"}`}
              >
                <div className={`h-10 w-10 rounded-xl flex items-center justify-center ring-1 mb-3 ${c.color}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div className="font-display font-extrabold text-2xl">{fa(countFor(c))}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{c.label}</div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}