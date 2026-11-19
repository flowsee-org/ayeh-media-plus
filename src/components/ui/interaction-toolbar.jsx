'use client';

import React, { useState } from 'react';
import { ThumbsUp, ThumbsDown, Bookmark, Share2, MessageCircle } from 'lucide-react';
import { fa } from '@/lib/utils';
import { useAuth } from '@/lib/AuthContext';
import { toast } from 'sonner';
import api from '@/lib/api';

import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

/**
 * Aparat-style interaction bar under the video title
 * Built on shadcn/ui Button + Tooltip primitives.
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

  const InteractionBtn = ({ active, Icon, label, onClick }) => (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant={active ? 'primary' : 'outline'}
          size="sm"
          onClick={onClick}
          className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold border transition-colors ${active ? 'border-primary' : 'border-transparent'}`}
        >
          <Icon className={`h-4 w-4 ${active ? 'fill-current' : ''}`} />
          {label}
        </Button>
      </TooltipTrigger>
      <TooltipContent side="top">{label}</TooltipContent>
    </Tooltip>
  );

  return (
    <TooltipProvider>
      <div className={`flex flex-wrap items-center gap-2 ${className}`}>
        <InteractionBtn
          active={liked}
          Icon={ThumbsUp}
          label={fa(likes)}
          onClick={handleLike}
        />
        <Button
          size="sm"
          variant="outline"
          disabled
          className="px-3 py-2 text-xs font-bold border-transparent"
        >
          <ThumbsDown className="h-4 w-4" />
        </Button>
        <InteractionBtn
          active={bookmarked}
          Icon={Bookmark}
          label="ذخیره"
          onClick={handleBookmark}
        />
        <InteractionBtn
          active={false}
          Icon={Share2}
          label="اشتراک"
          onClick={handleShare}
        />
        <span className="px-3 py-2 text-xs font-bold text-muted-foreground">
          <MessageCircle className="h-4 w-4" />
          {fa(commentsCount)}
        </span>
      </div>
    </TooltipProvider>
  );
}
