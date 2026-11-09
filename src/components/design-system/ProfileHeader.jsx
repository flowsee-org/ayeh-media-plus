'use client';

import { useEffect, useState } from 'react';
import { Image } from '@/components/ui/image';
import { User2, Play, ShieldCheck } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import api from '@/lib/api';
import { useToast } from '@/components/ui/use-toast';

/**
 * Reusable profile header for creators, qaris, and scholars.
 * Supports: profile image, cover image, name, bio, verification badge,
 * follow/unfollow, follower count, content count, and role-specific fields.
 *
 * Follow/unfollow uses the existing Follow entity (follower_id / followed_id).
 */
export default function ProfileHeader({
  profileId,
  _profileType = 'creator', // 'creator' | 'qari' | 'scholar'
  coverImage,
  profileImage,
  name,
  bio,
  verified = false,
  followerCount = 0,
  contentCount = 0,
  following = false,
  roleSpecific = null, // React node for qari/scholar specific fields
  isOwnProfile = false,
  className = '',
}) {
  const { user: authUser } = useAuth();
  const { toast } = useToast();
  const [isFollowing, setIsFollowing] = useState(following);
  const [isLoading, setIsLoading] = useState(false);
  const isLoggedIn = !!authUser;

  // Sync initial following state from prop
  useEffect(() => {
    setIsFollowing(following);
  }, [following]);

  const handleFollow = async () => {
    if (!isLoggedIn) {
      // Dispatch a login event via custom event for components upstream to handle
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('require-login'));
      }
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
        toast({
          title: 'لغو پیگیری',
          description: 'پیوند از این کاربر لغو شد.',
        });
      } else {
        await api.entities.Follow.create({
          follower_id: authUser.id,
          follower_name: authUser.full_name || authUser.email || 'کاربر',
          followed_id: profileId,
          followed_name: name,
        });
        setIsFollowing(true);
        toast({
          title: 'پیگیری شد',
          description: 'از این کاربر پیگیری شد.',
        });
      }
    } catch {
      toast({
        variant: 'destructive',
        title: 'خطا',
        description: 'امکان انجام عملیات وجود ندارد. دوباره تلاش کنید.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`relative w-full ${className}`}>
      {/* Cover image */}
      {coverImage && (
        <div className="h-48 w-full bg-border/50 border-b border-border relative overflow-hidden">
          <Image
            src={coverImage}
            alt="تصویر covering"
            className="w-full h-48 object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        </div>
      )}

      <div className="mt-[-40px] md:mt-[-60px] relative z-10">
        {/* Profile image */}
        <div className="flex justify-center md:justify-end pr-6 md:pr-0">
          <div className="relative z-10">
            <div className="w-40 h-40 md:w-48 md:h-48 rounded-full border-4 border-background shadow-lg overflow-hidden bg-border">
              {profileImage ? (
                <Image
                  src={profileImage}
                  alt={`${name} پروفایل`}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="flex items-center justify-center bg-muted">
                  <User2 className="w-16 h-16 text-muted-foreground/40" />
                </div>
              )}
            </div>
            {verified && (
              <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-accent rounded-full border-2 border-background flex items-center justify-center text-accent-foreground shadow-sm">
                <ShieldCheck className="w-5 h-5" />
              </div>
            )}
          </div>
        </div>

        <div className="px-4 pt-12 pb-6 md:px-8 text-right">
          <div className="flex flex-col items-end gap-2 md:flex-row md:items-start md:justify-between">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl md:text-3xl font-semibold text-foreground tracking-tight">{name}</h1>
              {verified && (
                <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-accent text-accent-foreground text-xs font-medium">
                  <ShieldCheck className="w-3 h-3" /> تایید شده
                </span>
              )}
            </div>

            {!isOwnProfile && (
              <button
                onClick={handleFollow}
                disabled={isLoading}
                className={`px-6 py-2.5 rounded-full font-medium text-sm transition-all disabled:opacity-50 ${
                  isFollowing
                    ? 'bg-muted text-muted-foreground hover:bg-muted/80 border border-border'
                    : 'bg-quranic-emerald text-white hover:bg-quranic-emerald/90 shadow-quranic-glow'
                } ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
              >
                {isLoading ? (
                  <Play className="w-4 h-4 animate-spin" />
                ) : isFollowing ? (
                  <>
                    <span className="mr-1"> پیگیری شده</span>
                  </>
                ) : (
                  <>
                    <User2 className="w-4 h-4 mr-1" /> پیگیری
                  </>
                )}
              </button>
            )}
          </div>

          <p className="mt-3 md:mt-4 text-muted-foreground leading-relaxed max-w-2xl md:max-w-3xl text-sm md:text-base">
            {bio}
          </p>

          {/* Stats row */}
          <div className="mt-6 md:mt-8 flex flex-wrap justify-end gap-6 text-sm text-muted-foreground border-t border-border/50 pt-4">
            <div className="flex flex-col items-end gap-1">
              <span className="font-semibold text-foreground">{followerCount}</span>
              <span className="text-xs"> فالوور</span>
            </div>
            <div className="flex flex-col items-end gap-1">
              <span className="font-semibold text-foreground">{contentCount}</span>
              <span className="text-xs">محتوای منتشر شده</span>
            </div>
          </div>

          {/* Role-specific fields */}
          {roleSpecific && (
            <div className="mt-6 md:mt-8 grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-border/50">
              {roleSpecific}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
