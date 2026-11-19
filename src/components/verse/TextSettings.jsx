import { useState } from "react";
import { Type } from "lucide-react";
import { Button } from "@/components/ui/button";
import MushafSettingsModal from "@/components/quran/MushafSettingsModal";

export default function TextSettings({ prefs, onChange }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 rounded border border-accent/30 bg-card/85 hover:bg-secondary px-3.5 py-1.5 text-xs font-bold text-foreground hover:text-accent hover:border-accent/50 shadow-soft transition-all hover:scale-105 active:scale-95"
        aria-label="تنظیمات خط و مصحف"
      >
        <Type className="h-3.5 w-3.5 text-accent" />
        <span>تنظیمات خط و مصحف</span>
      </Button>

      <MushafSettingsModal
        isOpen={open}
        onClose={() => setOpen(false)}
        prefs={prefs}
        onChange={onChange}
      />
    </>
  );
}
