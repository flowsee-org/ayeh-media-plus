'use client';

import { useEffect, useState } from 'react';
import { Image } from '@/components/ui/image';
import { User2, ShieldCheck, Loader2 } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import api from '@/lib/api';
import { useToast } from '@/components/ui/use-toast';
import { fa } from '@/lib/utils';

/**
 * Aparat-style channel header
 */
export default function ProfileHeader({
  profileId,
  _profileType = 'creator',
  coverImage,
  profileImage,
  name,
  bio,
  verified = false,
  followerCount = 0,
  contentCount = 0,
  following = false,
  roleSpecific = null,
  isOwnProfile = false,
  className = '',
}) {
  const { user: authUser, openAuthModal } = useAuth();
  const { toast } = useToast();
  const [isFollowing, setIsFollowing] = useState(following);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setIsFollowing(following);
  }, [following]);

  const handleFollow = async () => {
    if (!authUser) {
      openAuthModal?.();
      return;
    }
    if (isLoading || !authUser?.id) return;
    setIsLoading(true);
    try {
      if (isFollowing) {
        await api.entities.Follow.deleteMany({
          follower_id: authUser.id,
          followed_id: profileId,
        });
        setIsFollowing(false);
        toast({ title: 'لغو دنبال‌کردن', description: 'دیگر این کانال را دنبال نمی‌کنید.' });
      } else {
        await api.entities.Follow.create({
          follower_id: authUser.id,
          follower_name: authUser.full_name || authUser.email || 'کاربر',
          followed_id: profileId,
          followed_name: name,
        });
        setIsFollowing(true);
        toast({ title: 'دنبال شد', description: 'این کانال را دنبال می‌کنید.' });
      }
    } catch {
      toast({
        variant: 'destructive',
        title: 'خطا',
        description: 'امکان انجام عملیات وجود ندارد.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`relative w-full overflow-hidden rounded-2xl border border-border bg-card ${className}`}>
      <div className="h-36 sm:h-44 md:h-52 w-full bg-gradient-to-br from-primary/25 via-accent/15 to-muted relative overflow-hidden">
        {coverImage ? (
          <Image src={coverImage} alt="" className="w-full h-full object-cover" />
        ) : null}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
      </div>

      <div className="px-4 sm:px-6 pb-5">
        <div className="flex flex-col sm:flex-row sm:items-end gap-4 -mt-10 sm:-mt-12">
          <div className="relative shrink-0">
            <div className="h-24 w-24 sm:h-28 sm:w-28 rounded-full border-4 border-card shadow-md overflow-hidden bg-muted">
              {profileImage ? (
                <Image src={profileImage} alt={name || ''} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-primary/10 text-primary">
                  <User2 className="h-10 w-10" />
                </div>
              )}
            </div>
            {verified && (
              <div className="absolute bottom-1 end-1 h-7 w-7 rounded-full bg-primary text-primary-foreground border-2 border-card flex items-center justify-center">
                <ShieldCheck className="h-4 w-4" />
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0 pt-2 sm:pb-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight">{name}</h1>
              {verified && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[11px] font-bold">
                  <ShieldCheck className="h-3 w-3" /> تایید شده
                </span>
              )}
            </div>
            {bio && (
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed max-w-2xl line-clamp-3">
                {bio}
              </p>
            )}
          </div>

          {!isOwnProfile && (
            <button
              onClick={handleFollow}
              disabled={isLoading}
              className={`shrink-0 inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all disabled:opacity-50 ${
                isFollowing
                  ? 'bg-muted text-foreground border border-border hover:bg-muted/80'
                  : 'bg-primary text-primary-foreground hover:opacity-90'
              }`}
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : isFollowing ? 'دنبال می‌کنید' : 'دنبال کردن'}
            </button>
          )}
        </div>

        <div className="mt-5 flex flex-wrap gap-5 text-sm border-t border-border pt-4">
          <div>
            <span className="font-bold text-foreground tabular-nums">{fa(followerCount)}</span>
            <span className="text-muted-foreground ms-1.5">دنبال‌کننده</span>
          </div>
          <div>
            <span className="font-bold text-foreground tabular-nums">{fa(contentCount)}</span>
            <span className="text-muted-foreground ms-1.5">ویدیو</span>
          </div>
        </div>

        {roleSpecific && (
          <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3 pt-4 border-t border-border">
            {roleSpecific}
          </div>
        )}
      </div>
    </div>
  );
}
