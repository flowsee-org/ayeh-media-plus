import { Link } from "@/lib/router-compat";
import { Compass, ChevronLeft } from "lucide-react";

/** دعوت به بخش «آیه‌ی راه» بالای فید. */
export default function CompanionBanner() {
  return (
    <Link
      to="/guide"
      className="mx-3.5 mb-4 flex items-center gap-3 rounded-lg border border-border bg-card p-3.5 transition-colors hover:border-accent/40 sm:mx-0"
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent/10 text-accent">
        <Compass className="h-5 w-5" strokeWidth={1.8} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[14px] font-semibold text-foreground">
          مشکلی داری؟ آیه‌اش را پیدا کن
        </span>
        <span className="block text-[12.5px] text-muted-foreground">
          سختی‌ات را بنویس، قرآن پاسخ می‌دهد
        </span>
      </span>
      <ChevronLeft className="h-4 w-4 shrink-0 text-muted-foreground" />
    </Link>
  );
}