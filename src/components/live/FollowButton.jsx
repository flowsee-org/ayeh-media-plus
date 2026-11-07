import { useEffect, useState } from "react";
import api from "@/lib/api";
import { UserPlus, UserCheck, Loader2 } from "lucide-react";

/**
 * @param {{ scholarId: string; scholarName?: string; className?: string; onChange?: (following: boolean) => void }} props
 */
export default function FollowButton({ scholarId, scholarName = "", className = "", onChange = undefined }) {
  const [user, setUser] = useState(null);
  const [following, setFollowing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);

  useEffect(() => {
    if (!scholarId) return;
    api.auth.me().then((u) => {
      if (!u?.id) { setLoading(false); return; }
      setUser(u);
      if (u.id === scholarId) { setLoading(false); return; }
      api.entities.Follow.filter({ follower_id: u.id, scholar_id: scholarId })
        .then((res) => setFollowing((res.items || res || []).length > 0))
        .catch(() => {})
        .finally(() => setLoading(false));
    }).catch(() => setLoading(false));
  }, [scholarId]);

  const toggle = async () => {
    if (!user || toggling) return;
    setToggling(true);
    try {
      if (following) {
        await api.entities.Follow.deleteMany({ follower_id: user.id, scholar_id: scholarId });
        setFollowing(false);
        onChange?.(false);
      } else {
        await api.entities.Follow.create({
          follower_id: user.id,
          follower_name: user.full_name || user.email || "کاربر",
          scholar_id: scholarId,
          scholar_name: scholarName || "استاد",
        });
        setFollowing(true);
        onChange?.(true);
      }
    } catch {}
    setToggling(false);
  };

  if (loading) return null;
  if (!user || user.id === scholarId) return null;

  return (
    <button
      onClick={toggle}
      disabled={toggling}
      className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition-all disabled:opacity-50 ${
        following
          ? "bg-secondary text-secondary-foreground border border-border"
          : "bg-primary text-primary-foreground shadow-soft"
      } ${className}`}
    >
      {toggling ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : following ? (
        <UserCheck className="h-3.5 w-3.5" />
      ) : (
        <UserPlus className="h-3.5 w-3.5" />
      )}
      {following ? "دنبال می‌کنید" : "دنبال کردن"}
    </button>
  );
}