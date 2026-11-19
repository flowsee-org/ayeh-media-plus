import Link from "next/link";
import { Trophy, Gift, ArrowLeft, Clock } from "lucide-react";

/** Big highlighted prize block for the leading active competition. */
export default function FeaturedPrize({ comp }) {
  if (!comp) return null;
  return (
    <Link
      href={`/competitions/${comp.id}`}
      className="group relative mb-6 block overflow-hidden rounded border border-accent/30 bg-gradient-to-br from-primary via-primary to-[#062017] p-5 text-primary-foreground shadow-premium sm:p-7"
    >
      <div className="absolute -left-10 -top-10 h-40 w-40 rounded bg-accent/20 blur-3xl" />
      <div className="relative flex items-start gap-4">
        <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded bg-accent/20 text-accent ring-1 ring-accent/40">
          <Trophy className="h-7 w-7" />
        </span>
        <div className="min-w-0 flex-1">
          <span className="text-[11px] font-bold tracking-wide text-accent">مسابقه ویژه — همین حالا شرکت کن</span>
          <h2 className="mt-1 font-display text-xl font-extrabold leading-snug">{comp.title}</h2>
          <div className="mt-3 inline-flex max-w-full items-center gap-2 rounded bg-accent px-4 py-1.5 text-accent-foreground">
            <Gift className="h-4 w-4 shrink-0" />
            <span className="truncate text-sm font-bold">{comp.prize_title}</span>
            {comp.prize_value && <span className="shrink-0 text-xs opacity-80">· {comp.prize_value}</span>}
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-primary-foreground/80">
            {comp.end_date && (
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" /> مهلت تا {comp.end_date}
              </span>
            )}
            <span>{(comp.participants_count || 0).toLocaleString("fa-IR")} شرکت‌کننده</span>
            <span className="inline-flex items-center gap-1 font-semibold text-accent group-hover:underline">
              شرکت در مسابقه <ArrowLeft className="h-3.5 w-3.5" />
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}