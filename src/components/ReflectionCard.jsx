import { useState } from "react";
import { ChevronDown, Quote } from "lucide-react";

const TYPE_STYLES = {
  Meaning: "primary",
  Reflection: "accent",
  Psychology: "violet",
  Philosophy: "indigo",
  Ethics: "amber",
  Science: "sky",
  "Social Lessons": "rose",
  "Family Lessons": "pink",
  "Personal Development": "cyan",
  Leadership: "orange",
  Faith: "primary",
  "Spiritual Growth": "purple",
  Warnings: "red",
  Promises: "blue",
  Hope: "lime",
  Patience: "green",
  Gratitude: "yellow",
  Repentance: "fuchsia",
  Justice: "slate",
  Mercy: "teal",
};

const BADGE_CLASSES = {
  primary: "bg-primary/10 text-primary ring-primary/20",
  accent: "bg-accent/10 text-accent ring-accent/20",
  violet: "bg-violet-500/10 text-violet-700 dark:text-violet-300 ring-violet-500/20",
  indigo: "bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 ring-indigo-500/20",
  amber: "bg-amber-500/10 text-amber-700 dark:text-amber-300 ring-amber-500/20",
  sky: "bg-sky-500/10 text-sky-700 dark:text-sky-300 ring-sky-500/20",
  rose: "bg-rose-500/10 text-rose-700 dark:text-rose-300 ring-rose-500/20",
  pink: "bg-pink-500/10 text-pink-700 dark:text-pink-300 ring-pink-500/20",
  cyan: "bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 ring-cyan-500/20",
  orange: "bg-orange-500/10 text-orange-700 dark:text-orange-300 ring-orange-500/20",
  purple: "bg-purple-500/10 text-purple-700 dark:text-purple-300 ring-purple-500/20",
  red: "bg-red-500/10 text-red-700 dark:text-red-300 ring-red-500/20",
  blue: "bg-blue-500/10 text-blue-700 dark:text-blue-300 ring-blue-500/20",
  lime: "bg-lime-500/10 text-lime-700 dark:text-lime-300 ring-lime-500/20",
  green: "bg-green-500/10 text-green-700 dark:text-green-300 ring-green-500/20",
  yellow: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-300 ring-yellow-500/20",
  fuchsia: "bg-fuchsia-500/10 text-fuchsia-700 dark:text-fuchsia-300 ring-fuchsia-500/20",
  slate: "bg-slate-500/10 text-slate-700 dark:text-slate-300 ring-slate-500/20",
  teal: "bg-teal-500/10 text-teal-700 dark:text-teal-300 ring-teal-500/20",
};

export default function ReflectionCard({ reflection, scholarName }) {
  const [open, setOpen] = useState(false);
  const color = TYPE_STYLES[reflection.type] || "primary";
  const badge = BADGE_CLASSES[color] || BADGE_CLASSES.primary;

  return (
    <div className="group relative rounded border border-border/40 bg-card/50 overflow-hidden transition-all duration-300 hover:border-border/60 hover:shadow-soft">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-start gap-4 p-5 text-right"
      >
        <div className={`shrink-0 mt-0.5 h-10 w-10 rounded ring-1 ${badge} flex items-center justify-center transition-transform group-hover:scale-105`}>
          <Quote className="h-4 w-4" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-2">
            <span className={`text-xs uppercase tracking-[0.12em] font-medium px-2.5 py-0.5 rounded ring-1 ${badge}`}>
              {reflection.type}
            </span>
            {scholarName && (
              <span className="text-xs text-muted-foreground">— {scholarName}</span>
            )}
          </div>
          <h4 className="font-display font-semibold text-[15px] leading-snug">
            {reflection.title}
          </h4>
        </div>
        <ChevronDown
          className={`shrink-0 h-5 w-5 text-muted-foreground transition-transform duration-300 ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && (
        <div className="px-5 pb-5 animate-fade-in">
          <div className="pr-14 text-sm leading-[1.8] text-muted-foreground whitespace-pre-line">
            {reflection.content}
          </div>
        </div>
      )}
    </div>
  );
}