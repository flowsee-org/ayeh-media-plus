import { useEffect, useState } from "react";
import api from "@/lib/api";
import { UserPlus, UserCheck, Loader2 } from "lucide-react";

/**
 * Follow a platform user / live host channel.
 * Uses Follow.followed_id (Prisma). scholarId is accepted as the channel user id.
 *
 * @param {{ scholarId: string; scholarName?: string; className?: string; onChange?: (following: boolean) => void }} props
 */
export default function FollowButton({ scholarId, scholarName = "", className = "", onChange = undefined }) {
  const [user, setUser] = useState(null);
  const [following, setFollowing] = useState(false);
  const [followId, setFollowId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);

  useEffect(() => {
    if (!scholarId) return;
    let cancelled = false;
    api.auth.me().then((u) => {
      if (cancelled) return;
      if (!u?.id) { setLoading(false); return; }
      setUser(u);
      if (u.id === scholarId) { setLoading(false); return; }
      api.entities.Follow.filter({ follower_id: u.id, followed_id: scholarId })
        .then((res) => {
          if (cancelled) return;
          const items = res.items || res || [];
          setFollowing(items.length > 0);
          setFollowId(items[0]?.id || null);
        })
        .catch(() => {})
        .finally(() => { if (!cancelled) setLoading(false); });
    }).catch(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [scholarId]);

  const toggle = async () => {
    if (!user || toggling) return;
    setToggling(true);
    try {
      if (following) {
        if (followId) {
          await api.entities.Follow.delete(followId);
        } else {
          await api.entities.Follow.deleteMany({
            follower_id: user.id,
            followed_id: scholarId,
          });
        }
        setFollowing(false);
        setFollowId(null);
        onChange?.(false);
      } else {
        const created = await api.entities.Follow.create({
          follower_id: user.id,
          follower_name: user.full_name || user.email || "کاربر",
          followed_id: scholarId,
          followed_name: scholarName || "استاد",
        });
        setFollowing(true);
        setFollowId(created?.id || null);
        onChange?.(true);
      }
    } catch {
      // Target may not be a User (historical Scholar catalog id) — leave state unchanged
    }
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
