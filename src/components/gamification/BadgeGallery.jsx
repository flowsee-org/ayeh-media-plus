import {
  Award,
  Flame,
  Brain,
  Sparkles,
  HeartHandshake,
  Crown,
  Footprints,
  Lock,
  Check,
} from "lucide-react";

const ICON_MAP = {
  Footprints,
  Flame,
  Award,
  Brain,
  Sparkles,
  HeartHandshake,
  Crown,
};

const TIER_STYLES = {
  bronze: {
    border: "border-amber-700/40",
    bg: "bg-amber-900/10",
    badgeBg: "from-amber-700 to-amber-900",
    glow: "shadow-amber-900/20",
    label: "برنزی",
    textColor: "text-amber-600 dark:text-amber-400",
  },
  silver: {
    border: "border-slate-400/40",
    bg: "bg-slate-400/10",
    badgeBg: "from-slate-400 to-slate-600",
    glow: "shadow-slate-500/20",
    label: "نقره‌ای",
    textColor: "text-slate-600 dark:text-slate-300",
  },
  gold: {
    border: "border-yellow-500/40",
    bg: "bg-yellow-500/10",
    badgeBg: "from-yellow-500 to-amber-600",
    glow: "shadow-yellow-500/30",
    label: "طلایی",
    textColor: "text-yellow-600 dark:text-yellow-400",
  },
  diamond: {
    border: "border-emerald-500/50",
    bg: "bg-emerald-500/10",
    badgeBg: "from-emerald-500 to-teal-800",
    glow: "shadow-emerald-500/40",
    label: "یاقوت سبز",
    textColor: "text-emerald-600 dark:text-emerald-400",
  },
};

export default function BadgeGallery({ badges = [] }) {
  const unlockedCount = badges.filter((b) => b.unlocked).length;

  return (
    <div className="rounded bg-card/90 border border-emerald-900/30 p-5 sm:p-7 shadow-xl backdrop-blur-md">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-border/60">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded bg-gradient-to-br from-yellow-500 to-amber-700 text-white shadow-sm">
              <Award className="w-4 h-4" />
            </span>
            <h3 className="text-lg font-bold font-rokh-bold text-foreground">
              گالری نشان‌ها و افتخارات معنوی
            </h3>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            با استمرار در تلاوت، تدبر و مشارکت در جامعه قرآنی، نشان‌های افتخار را آزاد کنید.
          </p>
        </div>

        <div className="text-xs font-bold font-rokh-bold text-primary bg-primary/10 px-3 py-1.5 rounded border border-primary/20 shrink-0 self-start sm:self-auto">
          {unlockedCount} از {badges.length} نشان آزاد شده
        </div>
      </div>

      {/* Grid of Badges */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
        {badges.map((badge) => {
          const IconComp = ICON_MAP[badge.badge_icon] || Award;
          const tier = TIER_STYLES[badge.tier] || TIER_STYLES.bronze;
          const isUnlocked = badge.unlocked;

          return (
            <div
              key={badge.badge_id}
              className={`relative rounded p-4 border transition-all duration-300 flex flex-col justify-between ${
                isUnlocked
                  ? `${tier.border} ${tier.bg} shadow-md ${tier.glow} hover:-translate-y-1`
                  : "border-border/60 bg-muted/20 opacity-60 grayscale hover:grayscale-0"
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded font-rokh-bold font-bold border ${tier.textColor} ${tier.border} bg-background/60`}
                  >
                    سطح {tier.label}
                  </span>

                  {isUnlocked ? (
                    <span className="flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-bold font-rokh-bold">
                      <Check className="w-3.5 h-3.5" />
                      آزاد شده
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                      <Lock className="w-3.5 h-3.5" />
                      قفل
                    </span>
                  )}
                </div>

                {/* Badge Icon Medallion */}
                <div className="flex justify-center my-2">
                  <div
                    className={`w-14 h-14 rounded flex items-center justify-center text-white shadow-lg transition-transform ${
                      isUnlocked
                        ? `bg-gradient-to-br ${tier.badgeBg} ${tier.glow} scale-100 hover:scale-105`
                        : "bg-muted-foreground/30 text-muted-foreground scale-95"
                    }`}
                  >
                    <IconComp className="w-7 h-7" />
                  </div>
                </div>

                <div className="text-center mt-3">
                  <h4 className="text-sm font-bold font-rokh-bold text-foreground">
                    {badge.badge_name}
                  </h4>
                  <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">
                    {badge.description}
                  </p>
                </div>
              </div>

              {isUnlocked && badge.unlocked_at && (
                <div className="mt-3 pt-2 border-t border-border/40 text-[10px] text-muted-foreground text-center font-mono">
                  تاریخ دریافت: {new Date(badge.unlocked_at).toLocaleDateString("fa-IR")}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
