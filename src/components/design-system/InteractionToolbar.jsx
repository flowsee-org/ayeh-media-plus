'use client';

import { useState } from 'react';
import { ThumbsUp, ThumbsDown, Bookmark, Share2, MessageCircle, MoreHorizontal } from 'lucide-react';
import { fa } from '@/lib/utils';
import { useAuth } from '@/lib/AuthContext';
import { toast } from 'sonner';
import api from '@/lib/api';

/**
 * Interaction Toolbar — Like, Comment, Save, Share, More
 * Connects to existing backend functionality (likes, bookmarks, comments, shares)
 */
export default function InteractionToolbar({
  videoId,
  initialLiked = false,
  initialBookmarked = false,
  likesCount = 0,
  commentsCount = 0,
  className = '',
}) {
  const { user: authUser, openAuthModal } = useAuth();
  const [liked, setLiked] = useState(initialLiked);
  const [bookmarked, setBookmarked] = useState(initialBookmarked);
  const [likes, setLikes] = useState(likesCount);
  const [comments, setComments] = useState(commentsCount);

  const handleLike = async () => {
    if (!authUser) { openAuthModal(); return; }
    try {
      if (liked) {
        const existing = await api.entities.Like.filter({ user_id: authUser.id, video_id }).catch(() => []);
        if (existing[0]) await api.entities.Like.delete(existing[0].id);
        setLiked(false);
        setLikes(Math.max(0, likes - 1));
      } else {
        await api.entities.Like.create({ user_id: authUser.id, video_id, type: 'like' });
        setLiked(true);
        setLikes(likes + 1);
      }
    } catch {
      toast.error('خطا در ثبت لایک');
    }
  };

  const handleBookmark = async () => {
    if (!authUser) { openAuthModal(); return; }
    try {
      if (bookmarked) {
        const existing = await api.entities.Bookmark.filter({ user_id: authUser.id, video_id }).catch(() => []);
        if (existing[0]) await api.entities.Bookmark.delete(existing[0].id);
        setBookmarked(false);
      } else {
        await api.entities.Bookmark.create({ user_id: authUser.id, video_id });
        setBookmarked(true);
      }
    } catch {
      toast.error('خطا در ذخیره');
    }
  };

  const handleShare = () => {
    if (typeof navigator.share === 'function') {
      navigator.share({ title: 'آیه مدیا پلاس', url: window.location.href }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href).then(() => {
        toast.success('لینک کپی شد');
      });
    }
  };

  return (
    <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-border bg-card p-4 sm:p-6 shadow-soft ${className}`}>
      {/* Left: Like/Dislike */}
      <div className="flex items-center gap-4">
        <button
          onClick={handleLike}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold transition-all ${
            liked
              ? 'bg-quranic-emerald text-white shadow-quranic-glow'
              : 'bg-transparent text-foreground border border-border hover:bg-muted/50'
          }`}
        >
          <ThumbsUp className={`h-4 w-4 ${liked ? 'fill-current' : ''}`} />
          <span>{fa(likes)}</span>
        </button>
        <button
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-transparent text-foreground border border-border hover:bg-muted/50 transition-colors"
        >
          <ThumbsDown className="h-4 w-4" />
          <span>{fa(0)}</span>
        </button>
      </div>

      {/* Right: Save, Share, Comments, More */}
      <div className="flex items-center gap-4">
        <button
          onClick={handleBookmark}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold transition-all ${
            bookmarked
              ? 'bg-quranic-emerald text-white shadow-quranic-glow'
              : 'bg-transparent text-foreground border border-border hover:bg-muted/50'
          }`}
        >
          <Bookmark className={`h-4 w-4 ${bookmarked ? 'fill-current' : ''}`} />
          <span>ذخیره</span>
        </button>
        <button
          onClick={handleShare}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-transparent text-foreground border border-border hover:bg-muted/50 transition-colors"
        >
          <Share2 className="h-4 w-4" />
        </button>
        <button
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-transparent text-foreground border border-border hover:bg-muted/50 transition-colors"
        >
          <MessageCircle className="h-4 w-4" />
          <span>{fa(comments)}</span>
        </button>
        <button
          className="p-2.5 rounded-xl bg-transparent text-foreground/60 hover:bg-muted/50 hover:text-foreground transition-colors"
          aria-label="فعالیت‌های بیشتر"
        >
          <MoreHorizontal className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
