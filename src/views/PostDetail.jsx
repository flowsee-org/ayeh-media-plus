'use client';
import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "@/lib/router-compat";
import api from "@/lib/api";
import { useAuth } from "@/lib/AuthContext";
import { toast } from "react-hot-toast";
import { recordEngagement } from "@/lib/personalization";
import { trackSessionSignal } from "@/lib/exploreEngine";
import { togglePostLike } from "@/lib/social";
import PostCard from "@/components/community/PostCard";
import CommentSection from "@/components/community/CommentSection";
import { ChevronRight, Loader2, MessageCircle, BookOpen } from "lucide-react";
import BackButton from "@/components/BackButton";

export default function PostDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user: authUser, openAuthModal } = useAuth();
  const [localUser, setLocalUser] = useState(null);
  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [commentCount, setCommentCount] = useState(0);

  const user = authUser || localUser;

  useEffect(() => {
    if (!authUser) {
      api.auth.me().then(setLocalUser).catch(() => {});
    }
    Promise.all([
      api.entities.Post.get(id).catch(() => null),
      api.entities.Comment.filter({ post_id: id }, "-created_date", 100).catch(() => []),
    ]).then(([p, c]) => {
      setPost(p);
      setComments(c);
      setCommentCount(c.length);
      setLoading(false);
    });
  }, [id, authUser]);

  /* Dwell-time tracking — feeds the personalized Explore ordering */
  useEffect(() => {
    if (!post?.id) return;
    const start = Date.now();
    return () => {
      const secs = (Date.now() - start) / 1000;
      if (secs >= 8) {
        const tags = post.tags?.length ? post.tags : [post.type].filter(Boolean);
        const weight = Math.min(Math.round(secs / 10), 5);
        recordEngagement(tags, weight);
        trackSessionSignal({ type: "dwell", tags, author: post.author_name, postType: post.type, weight });
      }
    };
  }, [post?.id]);

  const handleLike = async () => {
    if (!user) {
      openAuthModal((loggedIn) => {
        setLocalUser(loggedIn);
      });
      return;
    }
    if (!post) return;
    const updated = await togglePostLike(post, user);
    setPost({ ...post, ...updated });
    const tags = post.tags?.length ? post.tags : [post.type].filter(Boolean);
    trackSessionSignal({ type: "like", tags, author: post.author_name, postType: post.type, weight: 3 });
  };

  const handleDelete = async () => {
    if (!user || !post || post.author_id !== user.id) return;
    if (!window.confirm("آیا از حذف این پست مطمئن هستید؟")) return;
    try {
      await api.entities.Post.delete(post.id);
      toast.success("پست با موفقیت حذف شد");
      navigate("/community");
    } catch {
      toast.error("خطا در حذف پست");
    }
  };

  if (loading) return <div className="flex justify-center py-32"><Loader2 className="h-10 w-10 animate-spin text-accent" /></div>;
  if (!post) return (
    <div className="mx-auto max-w-md py-24 text-center">
      <BookOpen className="h-8 w-8 text-muted-foreground/30 mx-auto mb-3" />
      <p className="text-sm text-muted-foreground mb-4">پست یافت نشد.</p>
      <Link to="/community" className="inline-flex items-center gap-1.5 text-sm text-accent hover:underline">
        <ChevronRight className="h-4 w-4" /> بازگشت به جامعه
      </Link>
    </div>
  );

  return (
    <div className="mx-auto max-w-2xl px-4 sm:px-6 py-8 animate-fade-in">
      <BackButton to="/community" label="بازگشت به جامعه" className="mb-6" />

      <PostCard post={post} currentUser={user} onLike={handleLike} onDelete={handleDelete} />

      <div className="mt-8 rounded-2xl border border-accent/15 bg-card/60 overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-accent/10 bg-accent/[0.02]">
          <MessageCircle className="h-5 w-5 text-accent" />
          <h2 className="font-display font-bold text-lg">
            نظرات ({commentCount.toLocaleString("fa-IR")})
          </h2>
        </div>
        <CommentSection
          postId={post.id}
          post={post}
          currentUser={user}
          comments={comments}
          onCountChange={setCommentCount}
        />
      </div>
    </div>
  );
}