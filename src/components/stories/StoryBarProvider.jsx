import { useEffect, useState, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import StoryBar from "@/components/stories/StoryBar";
import StoryViewer from "@/components/stories/StoryViewer";

const DAY = 86400000;

export default function StoryBarProvider() {
  const { user: authUser } = useAuth();
  const [localUser, setLocalUser] = useState(null);
  const [stories, setStories] = useState([]);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerIndex, setViewerIndex] = useState(0);

  const user = authUser || localUser;

  const load = useCallback(async () => {
    const [me, all] = await Promise.all([
      !authUser ? base44.auth.me().catch(() => null) : Promise.resolve(authUser),
      base44.entities.Story.filter(
        { created_date: { $gt: new Date(Date.now() - DAY).toISOString() } },
        { sort: "-created_date", limit: 100 }
      ).catch(() => ({ items: [] })),
    ]);
    if (me && !authUser) setLocalUser(me);
    setStories(Array.isArray(all) ? all : (all?.items || []));
  }, [authUser]);

  useEffect(() => {
    load();
    // Refresh every 60s to pick up new stories and expire old ones
    const id = setInterval(load, 60000);
    return () => clearInterval(id);
  }, [load]);

  // Group stories by author
  const groups = (() => {
    const map = new Map();
    (stories || []).forEach((s) => {
      if (!map.has(s.author_id)) map.set(s.author_id, []);
      map.get(s.author_id).push(s);
    });
    return [...map.entries()].map(([authorId, items]) => ({
      authorId,
      authorName: items[0].author_name,
      authorAvatar: items[0].author_avatar || "",
      stories: items.sort((a, b) => new Date(a.created_date) - new Date(b.created_date)),
      allViewed: user ? items.every((s) => (s.viewed_by || []).includes(user.id)) : false,
    }));
  })();

  const openViewer = (index) => {
    setViewerIndex(index);
    setViewerOpen(true);
  };

  const handleView = async (storyId) => {
    if (!user) return;
    // Optimistic local update
    setStories((prev) =>
      prev.map((s) =>
        s.id === storyId && !(s.viewed_by || []).includes(user.id)
          ? { ...s, viewed_by: [...(s.viewed_by || []), user.id] }
          : s
      )
    );
    // Server-side: add user to viewed_by (fire and forget)
    base44.entities.Story.update(storyId, {
      viewed_by: [...(stories.find((s) => s.id === storyId)?.viewed_by || []), user.id],
    }).catch(() => {});
  };

  return (
    <>
      <StoryBar groups={groups} user={user} onOpen={openViewer} onRefresh={load} />
      {viewerOpen && (
        <StoryViewer
          groups={groups}
          startIndex={viewerIndex}
          user={user}
          onClose={() => setViewerOpen(false)}
          onView={handleView}
        />
      )}
    </>
  );
}