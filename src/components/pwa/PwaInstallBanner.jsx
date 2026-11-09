'use client';

import { useEffect, useState } from "react";
import { Download, WifiOff, X, Sparkles } from "lucide-react";
import { usePwa } from "@/lib/pwa";
import { toast } from "react-hot-toast";

export default function PwaInstallBanner() {
  const [mounted, setMounted] = useState(false);
  const { canInstall, isStandalone, isOffline, promptInstall } = usePwa();
  const [dismissed, setDismissed] = useState(false);
  const [installing, setInstalling] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const handleInstall = async () => {
    setInstalling(true);
    const accepted = await promptInstall();
    if (accepted) {
      toast.success("آیه پلاس با موفقیت روی دستگاه شما نصب شد 🎉");
    }
    setInstalling(false);
  };

  return (
    <>
      {/* 1. Offline Toast Banner */}
      {isOffline && (
        <div
          dir="rtl"
          className="fixed bottom-20 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-md z-50 p-3.5 rounded-2xl bg-amber-950/90 border border-amber-500/40 text-amber-200 shadow-2xl backdrop-blur-md flex items-center justify-between gap-3 text-xs animate-in fade-in slide-in-from-bottom-2"
        >
          <div className="flex items-center gap-2.5">
            <WifiOff className="w-4 h-4 text-amber-400 shrink-0" />
            <span>اتصال به اینترنت برقرار نیست. صفحات و تلاوت‌های ذخیره‌شده به‌صورت آفلاین در دسترس هستند.</span>
          </div>
        </div>
      )}

      {/* 2. PWA Install Floating Banner */}
      {canInstall && !isStandalone && !dismissed && (
        <div
          dir="rtl"
          className="fixed bottom-20 left-4 right-4 sm:left-6 sm:right-auto sm:max-w-sm z-40 p-4 rounded-3xl bg-card/95 border border-primary/30 text-foreground shadow-2xl backdrop-blur-md flex items-center justify-between gap-3 animate-in fade-in slide-in-from-bottom-3"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-700 to-teal-950 text-white flex items-center justify-center shrink-0 shadow-emerald-glow border border-amber-400/30">
              <Sparkles className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <div className="text-xs font-bold font-rokh-bold text-foreground">
                نصب اپلیکیشن آیه پلاس
              </div>
              <div className="text-[11px] text-muted-foreground mt-0.5">
                دسترسی سریع و آفلاین بدون نیاز به مرورگر
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={handleInstall}
              disabled={installing}
              className="px-3.5 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90 transition-all active:scale-95 flex items-center gap-1 shadow-sm"
            >
              <Download className="w-3.5 h-3.5" />
              <span>نصب</span>
            </button>
            <button
              onClick={() => setDismissed(true)}
              className="w-7 h-7 rounded-lg hover:bg-muted/60 flex items-center justify-center text-muted-foreground"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
