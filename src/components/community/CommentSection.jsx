import { useState } from "react";
import Link from "next/link";
import api from "@/lib/api";
import { notifyPostOwner } from "@/lib/social";
import { toast } from "react-hot-toast";
import { trackEngagement } from "@/lib/engagement";
import { scopedKey } from "@/lib/storageScope";
import { Avatar, timeAgo } from "./shared";
import { Heart, Trash2, Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

const LIKED_KEY = "tadabbur-liked-comments";

function getLiked() {
  try { return JSON.parse(localStorage.getItem(scopedKey(LIKED_KEY)) || "[]"); } catch { return []; }
}
function setLiked(arr) {
  localStorage.setItem(scopedKey(LIKED_KEY), JSON.stringify(arr));
}

export default function CommentSection({ postId, post, currentUser, comments: initialComments, onCountChange }) {
  const [comments, setComments] = useState(initialComments || []);
  const [text, setText] = useState("");
  const [posting, setPosting] = useState(false);
  const [busy, setBusy] = useState(null);

  const update = (newList) => {
    setComments(newList);
    onCountChange?.(newList.length);
  };

  const submit = async () => {
    if (!text.trim() || !currentUser) return;
    setPosting(true);
    try {
      const c = await api.entities.Comment.create({
        post_id: postId,
        author_id: currentUser.id,
        author_name: currentUser.full_name || currentUser.email,
        content: text.trim(),
      });
      update([c, ...comments]);
      await api.entities.Post.update(postId, { comments_count: comments.length + 1 });
      if (post) notifyPostOwner({ post, actor: currentUser, type: "comment", excerpt: text.trim() });
      setText("");
      trackEngagement("social");
    } catch {}
    setPosting(false);
  };

  const likeComment = async (comment) => {
    if (!currentUser) {
      toast.error("برای پسندیدن نظر، ابتدا وارد حساب کاربری خود شوید");
      return;
    }
    if (busy) return;
    setBusy(comment.id);
    const liked = getLiked();
    const isLiked = liked.includes(comment.id);
    const newCount = isLiked ? Math.max(0, (comment.likes_count || 0) - 1) : (comment.likes_count || 0) + 1;
    const prevList = comments;
    // Optimistic: update immediately, revert if the API call fails
    setLiked(isLiked ? liked.filter((id) => id !== comment.id) : [...liked, comment.id]);
    update(prevList.map((c) => (c.id === comment.id ? { ...c, likes_count: newCount } : c)));
    try {
      await api.entities.Comment.update(comment.id, { likes_count: newCount });
    } catch {
      setLiked(isLiked ? [...liked, comment.id] : liked.filter((id) => id !== comment.id));
      update(prevList);
      toast.error("ثبت لایک ناموفق بود.");
    } finally {
      setBusy(null);
    }
  };

  const deleteComment = async (comment) => {
    if (!currentUser || comment.author_id !== currentUser.id) return;
    if (!window.confirm("آیا از حذف این نظر مطمئن هستید؟")) return;
    try {
      await api.entities.Comment.delete(comment.id);
      update(comments.filter((c) => c.id !== comment.id));
      await api.entities.Post.update(postId, { comments_count: Math.max(0, comments.length - 1) });
      toast.success("نظر با موفقیت حذف شد");
    } catch {
      toast.error("حذف نظر ناموفق بود");
    }
  };

  return (
    <div>
      {currentUser ? (
        <div className="flex items-start gap-3 mb-4 px-4 pt-3">
          <Avatar name={currentUser.full_name || "؟"} size={36} />
          <div className="flex-1 flex gap-2">
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submit()}
              placeholder="نظر خود را بنویسید…"
              className="flex-1 bg-muted/30 rounded border border-accent/15 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent/30 transition-all"
              dir="rtl"
            />
            <Button
              onClick={submit}
              disabled={posting || !text.trim()}
              className="h-10 w-10 rounded bg-gradient-to-br from-accent to-accent/80 text-accent-foreground flex items-center justify-center hover:shadow-glow transition-all disabled:opacity-50 shrink-0"
            >
              {posting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      ) : (
        <div className="mb-4 px-4 pt-3 text-center">
          <p className="text-xs text-muted-foreground">
            برای ثبت نظر و مشارکت در بحث،{" "}
            <Link href="/login" className="text-primary font-bold hover:underline">
              وارد حساب کاربری
            </Link>{" "}
            شوید.
          </p>
        </div>
      )}

      <div className="space-y-3 px-4 pb-4">
        {comments.map((c) => {
          const liked = getLiked().includes(c.id);
          const isOwn = c.author_id === currentUser?.id;
          return (
            <div key={c.id} className="flex items-start gap-3 animate-fade-in">
              <Avatar name={c.author_name} size={32} />
              <div className="flex-1 min-w-0">
                <div className="rounded bg-accent/[0.04] border border-accent/10 px-4 py-2.5">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-sm font-medium text-accent">{c.author_name}</span>
                    <span className="text-xs text-muted-foreground/70">{timeAgo(c.created_date)}</span>
                  </div>
                  <p className="text-sm leading-relaxed text-foreground/90 whitespace-pre-line">{c.content}</p>
                </div>
                <div className="flex items-center gap-4 mt-1 pr-3">
                  <Button
                    onClick={() => likeComment(c)}
                    disabled={busy === c.id}
                    className={`flex items-center gap-1 text-xs transition-colors ${liked ? "text-accent" : "text-muted-foreground hover:text-accent"}`}
                  >
                    <Heart className={`h-3 w-3 ${liked ? "fill-current" : ""}`} />
                    {(c.likes_count || 0).toLocaleString("fa-IR")}
                  </Button>
                  {isOwn && (
                    <Button
                      onClick={() => deleteComment(c)}
                      className="flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive transition-colors"
                    >
                      <Trash2 className="h-3 w-3" />
                      حذف
                    </Button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        {comments.length === 0 && (
          <div className="text-center py-4 text-xs text-muted-foreground">
            هنوز نظری ثبت نشده است. اولین نظر را شما بنویسید!
          </div>
        )}
      </div>
    </div>
  );
}