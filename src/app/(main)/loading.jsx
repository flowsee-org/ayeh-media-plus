import { IslamicStar } from '@/components/IslamicOrnaments';

export default function MainLoading() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-foreground">
      <div className="relative flex items-center justify-center mb-4">
        <div className="w-12 h-12 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
        <div className="absolute inset-0 flex items-center justify-center">
          <IslamicStar size={18} className="text-primary animate-pulse" />
        </div>
      </div>
      <p className="text-xs text-muted-foreground animate-pulse">
        در حال بارگذاری محتوا...
      </p>
    </div>
  );
}
