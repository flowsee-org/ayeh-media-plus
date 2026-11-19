import { X, Library } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";

export const inputCls =
  "w-full px-3 py-2.5 rounded border border-accent/15 bg-card/50 text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent/30 transition-all";

export function Field({ label, children }) {
  return (
    <div className="space-y-1">
      <Label className="text-xs text-muted-foreground font-ui">{label}</Label>
      {children}
    </div>
  );
}

export function EmptyState({ text }) {
  return (
    <div className="rounded border border-dashed border-border/60 p-12 text-center">
      <Library className="h-8 w-8 text-muted-foreground/30 mx-auto mb-3" />
      <p className="text-sm text-muted-foreground">{text}</p>
    </div>
  );
}

export function Modal({ onClose, title, children }) {
  return (
    <Dialog open={onClose !== null} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-w-2xl p-0 sm:p-8 shadow-premium space-y-6">
        <DialogHeader>
          <DialogTitle className="font-display font-bold text-xl">{title}</DialogTitle>
          <DialogDescription />
        </DialogHeader>
        <DialogClose>
          <X className="h-4 w-4" />
        </DialogClose>
        <div className="space-y-3 p-6">{children}</div>
      </DialogContent>
    </Dialog>
  );
}
