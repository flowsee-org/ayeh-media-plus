import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * @param {{ to?: string; onClick?: () => void; label?: string; className?: string }} props
 */
export default function BackButton({ to = "", onClick = undefined, label = "بازگشت", className = "" }) {
  const inner = (
    <>
      <ChevronRight className="h-4 w-4" /> {label}
    </>
  );
  if (to) {
    return (
      <Button variant="ghost" size="sm" asChild className={className}>
        <Link href={to}>{inner}</Link>
      </Button>
    );
  }
  return (
    <Button variant="ghost" size="sm" onClick={onClick} className={className}>
      {inner}
    </Button>
  );
}
