import { useEffect, useState } from "react";
import Link from "next/link";
import api from "@/lib/api";
import { Trophy, ArrowLeft, Gift } from "lucide-react";

/** Bold prize strip: shows active competitions and their prizes above the feed. */
export default function ActivePrizeStrip() {
  const [comps, setComps] = useState([]);

  useEffect(() => {
    api.entities.Competition.filter({ status: "active" })
      .then((list) => setComps((list || []).slice(0, 3)))
      .catch(() => {});
  }, []);

  if (comps.length === 0) return null;

  return (
    <div className="mb-4 overflow-hidden border-b border-border bg-card sm:rounded sm:border">
      <div className="flex items-center gap-2 px-3.5 py-2.5">
        <Trophy className="h-4 w-4 text-accent" />
        <span className="text-[13px] font-semibold text-foreground">مسابقات فعال — با جایزه</span>
        <Link href="/competitions" className="mr-auto inline-flex items-center gap-1 text-[12px] text-muted-foreground hover:text-accent">
          همه <ArrowLeft className="h-3 w-3" />
        </Link>
      </div>
      <div className="flex snap-x gap-2 overflow-x-auto no-scrollbar px-3.5 pb-3.5">
        {comps.map((c) => (
          <Link
            key={c.id}
            href={`/competitions/${c.id}`}
            className="group w-[78%] shrink-0 snap-start rounded border border-border bg-card p-3 transition-colors hover:border-accent/40 sm:w-[46%]"
          >
            <p className="line-clamp-1 text-xs font-medium text-muted-foreground">{c.title}</p>
            <div className="mt-1.5 flex items-center gap-1.5">
              <Gift className="h-4 w-4 shrink-0 text-accent" />
              <span className="line-clamp-1 font-display text-sm font-bold text-accent">{c.prize_title}</span>
            </div>
            <div className="mt-1.5 flex items-center justify-between text-[11px] text-muted-foreground">
              <span>{(c.participants_count || 0).toLocaleString("fa-IR")} شرکت‌کننده</span>
              <span className="font-medium text-accent group-hover:underline">شرکت می‌کنم</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}