import { useRef, useState } from "react";
import { Loader2 } from "lucide-react";

/* Pull-to-refresh wrapper: on touch devices, dragging down at the top of the
   page shows a refresh indicator; releasing past the threshold reloads data. */
export default function PullToRefresh({ onRefresh, children }) {
  const [pull, setPull] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const startY = useRef(null);

  const onTouchStart = (e) => {
    if (refreshing) return;
    startY.current = window.scrollY === 0 ? e.touches[0].clientY : null;
  };

  const onTouchMove = (e) => {
    if (startY.current === null || refreshing) return;
    const dist = e.touches[0].clientY - startY.current;
    setPull(dist > 0 && window.scrollY <= 0 ? Math.min(dist * 0.5, 90) : 0);
  };

  const onTouchEnd = async () => {
    startY.current = null;
    if (pull >= 55) {
      setRefreshing(true);
      setPull(48);
      try {
        await onRefresh?.();
      } catch {}
      setRefreshing(false);
    }
    setPull(0);
  };

  const height = refreshing ? 48 : pull;

  return (
    <div onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}>
      <div className="flex items-center justify-center overflow-hidden transition-[height] duration-200" style={{ height }}>
        {(refreshing || pull > 10) && (
          <div
            className="h-9 w-9 rounded border border-accent/20 bg-card shadow-soft flex items-center justify-center"
            style={{ transform: `rotate(${pull * 3}deg)`, opacity: refreshing ? 1 : Math.min(pull / 55, 1) }}
          >
            <Loader2 className={`h-4 w-4 text-accent ${refreshing ? "animate-spin" : ""}`} />
          </div>
        )}
      </div>
      {children}
    </div>
  );
}