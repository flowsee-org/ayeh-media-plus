import { Link } from "@/lib/router-compat";
import { ChevronRight } from "lucide-react";

/**
 * @param {{ to?: string; onClick?: () => void; label?: string; className?: string }} props
 */
export default function BackButton({ to = "", onClick = undefined, label = "بازگشت", className = "" }) {
  const cls = `inline-flex items-center gap-1.5 rounded text-sm text-muted-foreground hover:text-accent transition-colors ${className}`;
  const inner = (
    <>
      <ChevronRight className="h-4 w-4" /> {label}
    </>
  );
  if (to) {
    return (
      <Link to={to} className={cls}>
        {inner}
      </Link>
    );
  }
  return (
    <button type="button" onClick={onClick} className={cls}>
      {inner}
    </button>
  );
}