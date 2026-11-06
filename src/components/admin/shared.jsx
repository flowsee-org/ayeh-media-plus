import { X, Library } from "lucide-react";

export const inputCls =
  "w-full px-3 py-2.5 rounded-xl border border-accent/15 bg-card/50 text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent/30 transition-all";

export function Field({ label, children }) {
  return (
    <label className="block">
      <span className="text-xs text-muted-foreground mb-1 block">{label}</span>
      {children}
    </label>
  );
}

export function EmptyState({ text }) {
  return (
    <div className="rounded-2xl border border-dashed border-border/60 p-12 text-center">
      <Library className="h-8 w-8 text-muted-foreground/30 mx-auto mb-3" />
      <p className="text-sm text-muted-foreground">{text}</p>
    </div>
  );
}

export function Modal({ onClose, title, children }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
      <div className="bg-card rounded-3xl border border-border/40 w-full max-w-2xl max-h-[85vh] overflow-y-auto p-6 shadow-premium animate-scale-in" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-display font-bold text-xl">{title}</h3>
          <button onClick={onClose} className="h-9 w-9 rounded-xl hover:bg-muted/50 flex items-center justify-center transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="space-y-3">{children}</div>
      </div>
    </div>
  );
}