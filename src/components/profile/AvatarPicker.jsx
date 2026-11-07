import { useState } from "react";
import api from "@/lib/api";
import CharacterAvatar from "@/components/CharacterAvatar";
import { toast } from "react-hot-toast";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Loader2, Check } from "lucide-react";
import { PRESETS, serializeAvatar, characterInfo } from "@/lib/avatars";

/**
 * Character picker. Users choose one of the platform's predefined Quranic
 * characters — there is no photo upload and no custom avatar building.
 */
export default function AvatarPicker({ open, onOpenChange, currentConfig, onSaved }) {
  const current = characterInfo(currentConfig);
  const [presetId, setPresetId] = useState(current?.id || null);
  const [saving, setSaving] = useState(false);

  const selected = PRESETS.find((p) => p.id === presetId);

  const save = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      const avatar_config = serializeAvatar(selected.id, selected.cfg);
      await api.auth.updateMe({ avatar_config });
      onSaved(avatar_config);
      toast.success(`شخصیت «${selected.name}» انتخاب شد`);
      onOpenChange(false);
    } catch {
      toast.error("ذخیره‌سازی ناموفق بود");
    }
    setSaving(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg bg-card border-border/50 rounded-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display">شخصیت قرآنی شما</DialogTitle>
        </DialogHeader>

        <p className="text-xs text-muted-foreground leading-relaxed -mt-1">
          به‌جای عکس شخصی، یکی از شخصیت‌های قرآنی از پیش تعریف‌شده را به‌عنوان چهره‌ی خود انتخاب کنید.
        </p>

        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5 mt-2">
          {PRESETS.map((p) => {
            const active = presetId === p.id;
            return (
              <button
                key={p.id}
                onClick={() => setPresetId(p.id)}
                className={`relative flex flex-col items-center gap-1.5 rounded-2xl p-2.5 border transition-all ${
                  active
                    ? "border-accent bg-accent/10 shadow-glow"
                    : "border-border/40 hover:border-accent/30"
                }`}
              >
                <CharacterAvatar config={p.cfg} size={54} />
                <span className="text-xs font-medium leading-tight">{p.name}</span>
                <span className="text-xs text-muted-foreground leading-tight">{p.epithet}</span>
                {active && (
                  <span className="absolute top-1.5 left-1.5 h-4 w-4 rounded-full bg-accent text-accent-foreground flex items-center justify-center">
                    <Check className="h-2.5 w-2.5" />
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div className="flex items-center justify-between mt-4 gap-3">
          <p className="text-xs text-muted-foreground">
            بارگذاری تصویر چهره مجاز نیست
          </p>
          <button
            onClick={save}
            disabled={saving || !selected}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-accent text-accent-foreground text-sm font-medium hover:shadow-glow transition-all disabled:opacity-50"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            انتخاب شخصیت
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}