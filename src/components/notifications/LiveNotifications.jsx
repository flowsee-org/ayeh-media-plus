import { useEffect, useRef } from "react";
import { useNavigate } from "@/lib/router-compat";
import api from "@/lib/api";
import { toast } from "react-hot-toast";
import { Heart, MessageCircle, Radio, Sparkles } from "lucide-react";

/* Global live-notification listener:
   1. Real-time scholar live broadcast announcements via Socket.io
   2. Real-time social notifications (likes, comments, mentions)
   3. Entity Notification subscriptions for persistent notifications */
export default function LiveNotifications() {
  const navigate = useNavigate();
  const uidRef = useRef(null);
  const seenRef = useRef(new Set());

  useEffect(() => {
    let unsubDb;
    let unsubLiveStarted;
    let unsubSocial;

    api.auth
      .me()
      .then((u) => {
        if (!u?.id) return;
        uidRef.current = u.id;

        // 1. Listen for new persistent Notification records in DB
        try {
          unsubDb = api.entities.Notification.subscribe((event) => {
            if (event.type !== "create") return;
            const n = event.data || {};
            if (n.recipient_id !== uidRef.current || seenRef.current.has(n.id)) return;
            seenRef.current.add(n.id);

            const isLike = n.type === "like";
            const isLive = n.type === "live";

            toast.custom(
              (t) => (
                <button
                  onClick={() => {
                    toast.dismiss(t.id);
                    if (isLive && n.live_session_id) {
                      navigate(`/live/${n.live_session_id}`);
                    } else if (n.post_id) {
                      navigate(`/community/${n.post_id}`);
                    }
                  }}
                  className={`flex items-start gap-3 w-full max-w-sm mx-auto rounded border border-accent/40 bg-card/95 backdrop-blur-md shadow-premium px-4 py-3 text-right transition-all duration-300 hover:border-accent ${
                    t.visible ? "animate-fade-in-up" : "opacity-0"
                  }`}
                >
                  <span
                    className={`h-9 w-9 rounded flex items-center justify-center shrink-0 ${
                      isLive
                        ? "bg-red-500/15 text-red-600 dark:text-red-400 border border-red-500/30"
                        : isLike
                        ? "bg-accent/15 text-accent border border-accent/30"
                        : "bg-primary/15 text-primary border border-primary/30"
                    }`}
                  >
                    {isLive ? (
                      <Radio className="h-4 w-4 animate-pulse" />
                    ) : isLike ? (
                      <Heart className="h-4 w-4 fill-current" />
                    ) : (
                      <MessageCircle className="h-4 w-4" />
                    )}
                  </span>
                  <span className="flex-1 min-w-0">
                    <span className="block text-sm leading-relaxed">
                      <b className="font-medium text-foreground">{n.actor_name}</b>{" "}
                      {isLive
                        ? "پخش زنده تفسیری جدیدی را آغاز کرد"
                        : isLike
                        ? "پست شما را لایک کرد"
                        : "زیر پست شما نظر گذاشت"}
                    </span>
                    {n.post_excerpt && (
                      <span className="block text-xs text-muted-foreground truncate mt-0.5">
                        {n.post_excerpt}
                      </span>
                    )}
                    <span className="block text-xs text-accent font-semibold mt-1">
                      {isLive ? "کلیک برای ورود به پخش زنده ←" : "برای مشاهده و پاسخ فشار دهید"}
                    </span>
                  </span>
                  <span
                    className={`h-2.5 w-2.5 rounded shrink-0 mt-1.5 ${
                      isLive ? "bg-red-500 animate-ping" : "bg-accent animate-pulse-soft"
                    }`}
                  />
                </button>
              ),
              { duration: isLive ? 8000 : 5000, position: "top-center" }
            );
          });
        } catch {}
      })
      .catch(() => {});

    // 2. Real-time direct Socket.io announcement for Live Broadcasts
    try {
      unsubLiveStarted = api.socket.on("scholar:live_started", (session) => {
        if (!session?.id) return;
        const key = `live_${session.id}`;
        if (seenRef.current.has(key)) return;
        seenRef.current.add(key);

        toast.custom(
          (t) => (
            <div
              className={`relative overflow-hidden w-full max-w-md mx-auto rounded border-2 border-red-500/40 bg-card/95 backdrop-blur-md shadow-2xl p-4 text-right transition-all duration-300 ${
                t.visible ? "animate-fade-in-up" : "opacity-0"
              }`}
            >
              <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-red-600 via-accent to-red-600" />
              <div className="flex items-start gap-3">
                <span className="h-10 w-10 rounded bg-red-500/15 border border-red-500/30 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0">
                  <Radio className="h-5 w-5 animate-pulse" />
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-red-500 text-white text-[10px] font-bold">
                      <span className="h-1.5 w-1.5 rounded bg-white animate-ping" />
                      پخش زنده
                    </span>
                    <span className="text-xs font-bold text-accent">
                      {session.scholar_name || "استاد محترم"}
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-foreground truncate">
                    {session.title || "جلسه تفسیری زنده"}
                  </h4>
                  <div className="mt-3 flex items-center gap-2">
                    <button
                      onClick={() => {
                        toast.dismiss(t.id);
                        navigate(`/live/${session.id}`);
                      }}
                      className="px-3.5 py-1.5 rounded bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-all shadow-md hover:shadow-red-500/20 flex items-center gap-1.5"
                    >
                      <Sparkles className="h-3.5 w-3.5 text-accent" />
                      ورود به جلسه
                    </button>
                    <button
                      onClick={() => toast.dismiss(t.id)}
                      className="px-2.5 py-1.5 rounded text-xs text-muted-foreground hover:bg-secondary transition-colors"
                    >
                      بعداً
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ),
          { duration: 10000, position: "top-center" }
        );
      });
    } catch {}

    // 3. Real-time direct Socket.io push for social notifications
    try {
      unsubSocial = api.socket.on("social:notification", (data) => {
        if (!data || data.recipient_id !== uidRef.current) return;
        const key = `social_${data.id || Date.now()}`;
        if (seenRef.current.has(key)) return;
        seenRef.current.add(key);

        const isLike = data.type === "like";
        toast.custom(
          (t) => (
            <button
              onClick={() => {
                toast.dismiss(t.id);
                if (data.post_id) navigate(`/community/${data.post_id}`);
              }}
              className={`flex items-start gap-3 w-full max-w-sm mx-auto rounded border border-accent/40 bg-card/95 backdrop-blur-md shadow-premium px-4 py-3 text-right transition-all duration-300 ${
                t.visible ? "animate-fade-in-up" : "opacity-0"
              }`}
            >
              <span
                className={`h-9 w-9 rounded flex items-center justify-center shrink-0 ${
                  isLike ? "bg-accent/15 text-accent border border-accent/30" : "bg-primary/15 text-primary border border-primary/30"
                }`}
              >
                {isLike ? <Heart className="h-4 w-4 fill-current" /> : <MessageCircle className="h-4 w-4" />}
              </span>
              <span className="flex-1 min-w-0">
                <span className="block text-sm leading-relaxed">
                  <b className="font-medium text-foreground">{data.actor_name}</b>{" "}
                  {isLike ? "پست شما را پسندید" : "دیدگاه جدیدی برای شما ثبت کرد"}
                </span>
                {data.post_excerpt && (
                  <span className="block text-xs text-muted-foreground truncate mt-0.5">{data.post_excerpt}</span>
                )}
              </span>
            </button>
          ),
          { duration: 5000, position: "top-center" }
        );
      });
    } catch {}

    return () => {
      unsubDb?.();
      unsubLiveStarted?.();
      unsubSocial?.();
    };
  }, [navigate]);

  return null;
}
