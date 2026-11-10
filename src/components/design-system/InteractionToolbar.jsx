'use client';

import { useState } from 'react';
import { ThumbsUp, ThumbsDown, Bookmark, Share2, MessageCircle } from 'lucide-react';
import { fa } from '@/lib/utils';
import { useAuth } from '@/lib/AuthContext';
import { toast } from 'sonner';
import api from '@/lib/api';

/**
 * Aparat-style interaction bar under the video title
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

  const handleLike = async () => {
    if (!authUser) { openAuthModal(); return; }
    try {
      if (liked) {
        const existing = await api.entities.Like.filter({ user_id: authUser.id, video_id: videoId }).catch(() => []);
        if (existing[0]) await api.entities.Like.delete(existing[0].id);
        setLiked(false);
        setLikes(Math.max(0, likes - 1));
      } else {
        await api.entities.Like.create({ user_id: authUser.id, video_id: videoId, type: 'like' });
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
        const existing = await api.entities.Bookmark.filter({ user_id: authUser.id, video_id: videoId }).catch(() => []);
        if (existing[0]) await api.entities.Bookmark.delete(existing[0].id);
        setBookmarked(false);
      } else {
        await api.entities.Bookmark.create({ user_id: authUser.id, video_id: videoId });
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

  const btnBase = 'inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-bold border transition-colors';

  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`}>
      <button
        onClick={handleLike}
        className={`${btnBase} ${
          liked
            ? 'bg-primary text-primary-foreground border-primary'
            : 'bg-muted/60 text-foreground border-transparent hover:bg-muted'
        }`}
      >
        <ThumbsUp className={`h-4 w-4 ${liked ? 'fill-current' : ''}`} />
        {fa(likes)}
      </button>
      <button className={`${btnBase} bg-muted/60 text-foreground border-transparent hover:bg-muted`}>
        <ThumbsDown className="h-4 w-4" />
      </button>
      <button
        onClick={handleBookmark}
        className={`${btnBase} ${
          bookmarked
            ? 'bg-primary text-primary-foreground border-primary'
            : 'bg-muted/60 text-foreground border-transparent hover:bg-muted'
        }`}
      >
        <Bookmark className={`h-4 w-4 ${bookmarked ? 'fill-current' : ''}`} />
        ذخیره
      </button>
      <button
        onClick={handleShare}
        className={`${btnBase} bg-muted/60 text-foreground border-transparent hover:bg-muted`}
      >
        <Share2 className="h-4 w-4" />
        اشتراک
      </button>
      <span className={`${btnBase} bg-muted/60 text-foreground border-transparent`}>
        <MessageCircle className="h-4 w-4" />
        {fa(commentsCount)}
      </span>
    </div>
  );
}
