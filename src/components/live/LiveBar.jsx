import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";

/**
 * Live bar: shows ONLY live sessions from scholars the user follows
 * (or their own broadcast). Followers-only visibility is enforced here
 * and again on the live page itself.
 */
export default function LiveBar() {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState([]);

  const load = async () => {
    const me = await base44.auth.me().catch(() => null);
    if (!me?.id) {
      setSessions([]);
      return;
    }
    const [followRes, liveRes] = await Promise.all([
      base44.entities.Follow.filter({ follower_id: me.id }, { limit: 200 }).catch(() => ({ items: [] })),
      base44.entities.LiveSession.filter({ status: "live" }, { sort: "-created_date", limit: 30 })
        .catch(() => ({ items: [] })),
    ]);
    const followed = new Set((followRes.items || []).map((f) => f.scholar_id));
    setSessions(
      (liveRes.items || []).filter(
        (s) => followed.has(s.scholar_id) || s.scholar_id === me.id
      )
    );
  };

  useEffect(() => {
    load();
    const id = setInterval(load, 30000);
    const unsub = base44.entities.LiveSession.subscribe((event) => {
      if (event.type === "create") load();
      if (event.type === "update" && event.data?.status === "ended") load();
    });
    return () => { clearInterval(id); unsub(); };
  }, []);

  if (sessions.length === 0) return null;

  return (
    <div className="sticky top-[112px] z-20 px-2">
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1.5">
        {sessions.map((s) => (
          <button
            key={s.id}
            onClick={() => navigate(`/live/${s.id}`)}
            className="shrink-0 flex items-center gap-2 rounded-full border border-red-500/30 bg-red-500/10 px-3 py-1.5 hover:bg-red-500/15 transition-colors"
          >
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full rounded-full bg-red-500 animate-ping opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
            </span>
            <span className="text-xs font-medium text-red-600">{s.scholar_name}</span>
            <span className="text-xs text-muted-foreground hidden sm:inline">— {s.title}</span>
          </button>
        ))}
      </div>
    </div>
  );
}