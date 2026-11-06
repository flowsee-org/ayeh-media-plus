import { Link } from "react-router-dom";
import { Image } from "@/components/ui/image";
import { Trophy, Users, Clock, Gift } from "lucide-react";
import { COMPETITION_TYPE_LABELS, STATUS_LABELS, STATUS_COLORS } from "./shared";

export default function CompetitionCard({ comp }) {
  const status = comp.status || "active";
  return (
    <Link
      to={`/competitions/${comp.id}`}
      className="group block rounded-2xl border border-accent/15 bg-card/60 overflow-hidden hover:shadow-premium hover:border-accent/30 transition-all duration-300"
    >
      <div className="relative h-32 flex items-center justify-center overflow-hidden">
        {comp.image_url ? (
          <Image src={comp.image_url} className="w-full h-full" fittingType="fill" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-accent/15 to-primary/10" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
        <Trophy className="h-10 w-10 text-white/90 relative z-10 drop-shadow-lg" />
        <span className={`absolute top-3 left-3 text-xs px-2.5 py-1 rounded-full font-medium backdrop-blur-sm ${STATUS_COLORS[status]}`}>
          {STATUS_LABELS[status]}
        </span>
      </div>

      <div className="p-4">
        <div className="text-xs text-accent font-medium mb-1">{COMPETITION_TYPE_LABELS[comp.type] || "مسابقه"}</div>
        <h3 className="font-display font-bold text-lg leading-tight mb-2 group-hover:text-accent transition-colors">{comp.title}</h3>
        <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed mb-3">{comp.description}</p>

        <div className="mb-3 flex items-center gap-2.5 rounded-xl border border-accent/30 bg-gradient-to-l from-accent/20 to-accent/5 p-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-foreground">
            <Gift className="h-4 w-4" />
          </span>
          <div className="min-w-0">
            <p className="text-[11px] text-muted-foreground">جایزه</p>
            <p className="truncate font-display text-sm font-bold text-accent">{comp.prize_title}</p>
          </div>
          {comp.prize_value && (
            <span className="mr-auto shrink-0 rounded-full bg-accent/15 px-2 py-1 text-[11px] font-medium text-accent">
              {comp.prize_value}
            </span>
          )}
        </div>

        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5" /> {(comp.participants_count || 0).toLocaleString("fa-IR")} نفر</span>
          {comp.end_date && <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> تا {comp.end_date}</span>}
        </div>
      </div>
    </Link>
  );
}