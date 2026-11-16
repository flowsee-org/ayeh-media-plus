import Link from "next/link";
import { useNavigate } from "@/lib/router-compat";
import { Image } from "@/components/ui/image";
import { Trophy, Clock, Users, Gift } from "lucide-react";
import {
  COMPETITION_TYPE_LABELS,
  STATUS_LABELS,
  STATUS_COLORS,
} from "./shared";

const fa = (n) => (n || 0).toLocaleString("fa-IR");

/**
 * Competition Card — aligned with the design system (CollectionCard / ScholarCard pattern).
 * Clean, minimal chrome; consistent spacing; responsive across screen sizes.
 */
export default function CompetitionCard({ comp, className = "" }) {
  const navigate = useNavigate();
  const status = comp.status || "active";
  const id = comp.id || "";
  const href = `/competitions/${id}`;

  const typeLabel = COMPETITION_TYPE_LABELS[comp.type] || "مسابقه";
  const statusLabel = STATUS_LABELS[status] || "فعال";
  const statusColor = STATUS_COLORS[status] || "text-primary bg-primary/10";

  return (
    <Link
      href={href}
      onClick={(e) => {
        e.preventDefault();
        navigate(href);
      }}
      className={`group block rounded-2xl border border-border/60 bg-card overflow-hidden transition-all duration-300 hover:border-primary/50 hover:shadow-xl hover:-translate-y-0.5 ${className}`}
    >
      {/* Image / hero area */}
      <div className="relative h-48 sm:h-56 overflow-hidden bg-gradient-to-br from-accent/15 to-primary/10">
        {comp.image_url ? (
          <Image
            src={comp.image_url}
            alt={comp.title}
            className="w-full h-full object-cover opacity-95 group-hover:opacity-100 group-hover:scale-105 transition-all duration-700"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Trophy className="h-12 w-12 text-accent/20 shrink-0" />
          </div>
        )}
        {/* Status badge — top right */}
        <span
          className={`absolute top-3 left-3 z-10 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium font-ui backdrop-blur-sm ${statusColor}`}
        >
          {statusLabel}
        </span>
      </div>

      <div className="p-4 sm:p-5 flex-1 flex flex-col">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-bold tracking-wider text-accent font-ui uppercase">
            {typeLabel}
          </span>
        </div>
        <h3
          className="font-rokh-bold font-bold text-base sm:text-lg leading-snug line-clamp-2 text-foreground group-hover:text-primary transition-colors mb-3"
        >
          {comp.title}
        </h3>
        {comp.description && (
          <p className="text-xs sm:text-sm text-muted-foreground/80 line-clamp-2 leading-relaxed mb-4">
            {comp.description}
          </p>
        )}

        {/* Prize row */}
        <div className="mt-auto pt-3 border-t border-border/60 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Gift className="h-3.5 w-3.5 text-accent shrink-0" />
            <span className="text-xs font-bold font-ui text-foreground">
              {comp.prize_title || "جایزه"}
            </span>
          </div>
          <div className="flex items-center gap-1 text-[10px] text-muted-foreground font-ui">
            <Users className="h-3 w-3 shrink-0" />
            <span>{fa(comp.participants_count || 0)} نفر</span>
          </div>
        </div>

        {/* Bottom meta: deadline + CTA */}
        <div className="mt-4 flex items-center justify-between gap-2">
          {comp.end_date && (
            <span className="flex items-center gap-1 text-[10px] text-muted-foreground font-ui">
              <Clock className="h-3 w-3 shrink-0" />
              <span>مهلت تا {comp.end_date}</span>
            </span>
          )}
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full border border-primary/20 text-primary text-xs font-bold font-ui hover:bg-primary/5 transition-colors">
            شرکت کنید
          </span>
        </div>
      </div>
    </Link>
  );
}
