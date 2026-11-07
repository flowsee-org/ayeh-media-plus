import api from "@/lib/api";
import { recordEngagement } from "@/lib/personalization";

/* Fallback topic: posts without tags are scored by their type */
const tagsOf = (p) => ((p?.tags || []).length ? p.tags : [p.type].filter(Boolean));

/* Toggle like on a post: updates counts, records personalization signal,
   and notifies the post owner (unless it's your own post). */
export async function togglePostLike(post, user) {
  if (!user?.id || !post?.id) return { liked_by: post?.liked_by || [], likes_count: post?.likes_count || 0 };
  const likedBy = post.liked_by || [];
  const isLiked = likedBy.includes(user.id);
  const liked_by = isLiked ? likedBy.filter((id) => id !== user.id) : [...likedBy, user.id];
  const likes_count = liked_by.length;
  await api.entities.Post.update(post.id, { liked_by, likes_count });
  if (!isLiked) {
    recordEngagement(tagsOf(post), 3);
    notifyPostOwner({ post, actor: user, type: "like" });
  }
  return { liked_by, likes_count };
}

/* Create a notification for the owner of a post (like / comment) */
export async function notifyPostOwner({ post, actor, type, excerpt }) {
  if (!post?.author_id || !actor || post.author_id === actor.id) return;
  try {
    await api.entities.Notification.create({
      recipient_id: post.author_id,
      actor_id: actor.id,
      actor_name: actor.full_name || actor.email,
      type,
      post_id: post.id,
      post_excerpt: (excerpt || post.content || post.title || "").slice(0, 90),
      read: false,
    });
  } catch {}
}