import CharacterAvatar from "@/components/CharacterAvatar";
import { parseAvatar } from "@/lib/avatars";

export function timeAgo(dateStr) {
  if (!dateStr) return "";
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (days > 0) return `${days.toLocaleString("fa-IR")} روز پیش`;
  if (hours > 0) return `${hours.toLocaleString("fa-IR")} ساعت پیش`;
  if (minutes > 0) return `${minutes.toLocaleString("fa-IR")} دقیقه پیش`;
  return "همین الان";
}

/**
 * @param {{ name?: string; size?: number; className?: string; avatar?: string | null }} props
 */
export function Avatar({ name = "؟", size = 40, className = "", avatar = null }) {
  const initial = (name || "؟").trim()[0] || "؟";
  if (parseAvatar(avatar)) {
    return <CharacterAvatar config={avatar} size={size} className={className} />;
  }
  return (
    <div
      className={`rounded bg-gradient-to-br from-accent/25 to-accent/5 border border-accent/20 flex items-center justify-center font-bold text-accent shrink-0 ${className}`}
      style={{ width: size, height: size, fontSize: size * 0.38 }}
    >
      {initial}
    </div>
  );
}

export const POST_TYPE_LABELS = {
  reflection: "تدبّر",
  verse_share: "آیه",
  image: "تصویر",
  video: "ویدیو",
  question: "پرسش",
};

export const COMPETITION_TYPE_LABELS = {
  recitation: "قرائت",
  memorization: "حفظ",
  tafsir: "تفسیر",
  quiz: "مسابقه",
  essay: "مقاله",
};

export const STATUS_LABELS = {
  upcoming: "به‌زودی",
  active: "در حال برگزاری",
  voting: "رأی‌گیری",
  completed: "پایان‌یافته",
};

export const STATUS_COLORS = {
  upcoming: "text-accent bg-accent/10",
  active: "text-primary bg-primary/10",
  voting: "text-accent bg-accent/15",
  completed: "text-muted-foreground bg-muted/50",
};