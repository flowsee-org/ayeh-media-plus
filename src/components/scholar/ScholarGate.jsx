import { Link } from "@/lib/router-compat";
import { Lock, Loader2 } from "lucide-react";
import { useScholar } from "@/lib/scholarAccess";

/**
 * Gates tadabbur authoring/reading behind scholar access.
 * Everyone else sees a calm locked state instead of the section.
 */
export default function ScholarGate({ children, compact = false }) {
  const { isScholar, loading } = useScholar();

  if (loading) {
    return (
      <div className="flex justify-center py-10">
        <Loader2 className="h-6 w-6 animate-spin text-accent" />
      </div>
    );
  }

  if (isScholar) return children;

  if (compact) {
    return (
      <div className="flex items-center gap-2 rounded border border-accent/15 bg-accent/[0.04] px-4 py-3 text-xs text-muted-foreground">
        <Lock className="h-4 w-4 text-accent shrink-0" />
        بخش تدبّر ویژه اساتید و علماست.
      </div>
    );
  }

  return (
    <div className="rounded border border-dashed border-accent/25 bg-accent/[0.03] p-8 text-center">
      <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded bg-accent/10 text-accent">
        <Lock className="h-5 w-5" />
      </div>
      <p className="text-sm font-medium text-foreground/90 mb-1">بخش تدبّر قفل است</p>
      <p className="mx-auto max-w-sm text-xs leading-relaxed text-muted-foreground mb-4">
        تدبّر آیات فقط توسط اساتید و علما ارائه می‌شود. برای مطالعه تدبّرهای تأییدشده، پروفایل اساتید را دنبال کنید.
      </p>
      <Link
        to="/scholars"
        className="inline-flex items-center gap-1.5 rounded border border-accent/25 px-4 py-2 text-xs font-medium text-accent hover:bg-accent/10 transition-colors"
      >
        مشاهده اساتید
      </Link>
    </div>
  );
}