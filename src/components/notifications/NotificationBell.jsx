import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { timeAgo } from "@/components/community/shared";
import { Bell, Heart, MessageCircle, CheckCheck, Loader2, Radio } from "lucide-react";

const fa = (n) => (n || 0).toLocaleString("fa-IR");

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const ref = useRef(null);
  const router = useRouter();

  const load = async (uid) => {
    setLoading(true);
    try {
      setItems(await api.entities.Notification.filter({ recipient_id: uid }, "-created_date", 30));
    } catch {}
    setLoading(false);
  };

  useEffect(() => {
    let unsub;
    api.auth.me().then((u) => {
      if (!u?.id) return;
      setUser(u);
      load(u.id);
      try {
        unsub = api.entities.Notification.subscribe(() => load(u.id));
      } catch {}
    }).catch(() => {});
    return () => unsub?.();
  }, []);

  useEffect(() => {
    const h = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  if (!user) return null;

  const unread = items.filter((n) => !n.read).length;

  const openItem = async (n) => {
    setOpen(false);
    if (!n.read) {
      setItems((prev) => prev.map((x) => (x.id === n.id ? { ...x, read: true } : x)));
      try { await api.entities.Notification.update(n.id, { read: true }); } catch {}
    }
    if (n.type === "live" && n.live_session_id) router.push(`/live/${n.live_session_id}`);
    else if (n.post_id) router.push(`/community/${n.post_id}`);
  };

  const markAll = async () => {
    try {
      const unreadItems = items.filter((n) => !n.read);
      await Promise.all(
        unreadItems.map((n) =>
          api.entities.Notification.update(n.id, { read: true })
        )
      );
      setItems((prev) => prev.map((x) => ({ ...x, read: true })));
    } catch {}
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative flex h-10 w-10 items-center justify-center rounded-full text-foreground transition-colors hover:bg-secondary"
        aria-label="اعلان‌ها"
      >
        <Bell className="h-[21px] w-[21px]" strokeWidth={1.8} />
        {unread > 0 && (
          <span className="absolute right-1 top-1 min-w-[16px] h-4 px-1 rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground flex items-center justify-center">
            {fa(unread)}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute top-full mt-2 left-0 w-80 max-w-[85vw] rounded-lg border border-border bg-popover shadow-premium overflow-hidden z-50 animate-scale-in">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border/40 bg-accent/[0.03]">
            <span className="font-display font-bold text-sm">اعلان‌ها</span>
            {unread > 0 && (
              <button onClick={markAll} className="inline-flex items-center gap-1 text-xs text-accent hover:underline">
                <CheckCheck className="h-3.5 w-3.5" /> خواندن همه
              </button>
            )}
          </div>
          <div className="max-h-80 overflow-y-auto">
            {loading && items.length === 0 ? (
              <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-accent" /></div>
            ) : items.length === 0 ? (
              <div className="py-10 text-center">
                <Bell className="h-7 w-7 text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-xs text-muted-foreground">اعلان جدیدی ندارید</p>
              </div>
            ) : (
              items.map((n) => (
                <button
                  key={n.id}
                  onClick={() => openItem(n)}
                  className={`w-full flex items-start gap-3 px-4 py-3 text-right border-b border-border/30 last:border-0 transition-colors hover:bg-accent/[0.04] ${!n.read ? "bg-accent/[0.06]" : ""}`}
                >
                  <span className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${
                    n.type === "live" ? "bg-red-500/15 text-red-500"
                    : n.type === "like" ? "bg-accent/10 text-accent"
                    : "bg-primary/10 text-primary"
                  }`}>
                    {n.type === "live" ? <Radio className="h-3.5 w-3.5" />
                    : n.type === "like" ? <Heart className="h-3.5 w-3.5 fill-current" />
                    : <MessageCircle className="h-3.5 w-3.5" />}
                  </span>
                  <span className="flex-1 min-w-0">
                    <span className="block text-sm leading-relaxed">
                      {n.type === "live" ? (
                        <>
                          <b className="font-medium">{n.actor_name}</b>{" "}
                          پخش زنده‌ای را شروع کرد
                        </>
                      ) : (
                        <>
                          <b className="font-medium">{n.actor_name}</b>{" "}
                          {n.type === "like" ? "پست شما را لایک کرد" : "زیر پست شما نظر گذاشت"}
                        </>
                      )}
                    </span>
                    {n.post_excerpt && (
                      <span className="block text-xs text-muted-foreground truncate mt-0.5">{n.post_excerpt}</span>
                    )}
                    {n.type === "live" && (
                      <span className="inline-flex items-center gap-1 mt-1 text-xs text-red-500 font-medium">
                        <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />
                        اکنون زنده است
                      </span>
                    )}
                    <span className="block text-xs text-muted-foreground/70 mt-1">{timeAgo(n.created_date)}</span>
                  </span>
                  {!n.read && <span className="h-2 w-2 rounded-full bg-accent shrink-0 mt-1.5" />}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}