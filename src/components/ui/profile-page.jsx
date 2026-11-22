'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { User2, Play, BookOpen, Users, Loader2, AlertCircle } from 'lucide-react';
import api from '@/lib/api';
import { useAuth } from '@/lib/AuthContext';
import { usePathname, useSearchParams } from 'next/navigation';
import ProfileHeader from '@/components/ui/profile-header';
import ProfileTabs from '@/components/ui/profile-tabs';
import CreatorProfile from '@/components/ui/creator-profile';
import QariProfile from '@/components/ui/qari-profile';
import ScholarProfile from '@/components/ui/scholar-profile';

/**
 * Shared profile page composition for creators, qaris, and scholars.
 *
 * Route: /profile/[id]
 *
 * Fetches the target user and their associated content, then renders
 * the appropriate role-specific profile experience.
 */
export default function ProfilePage({ params }) {
  const { id } = params;
  const pathname = usePathname();
  const { user: authUser } = useAuth();

  const [profile, setProfile] = useState(null);
  const [scholarData, setScholarData] = useState(null);
  const [profileType, setProfileType] = useState('creator');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || null);
  const [followerCount, setFollowerCount] = useState(0);
  const [contentCount, setContentCount] = useState(0);
  const [isFollowing, setIsFollowing] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [u, followRes] = await Promise.all([
          api.entities.User.get(id).catch(() => null),
          api.entities.Follow.filter({ followed_id: id }).catch(() => ({ items: [] })),
        ]);

        if (!cancelled) {
          if (!u) {
            setError('پروفایل مورد نظر یافت نشد.');
            setLoading(false);
            return;
          }

          setProfile(u);
          setFollowerCount(followRes.items?.length || 0);

          // Count content: videos where user is reciter + collections
          const [vidRes, colRes] = await Promise.all([
            api.entities.Video.filter({ reciter_id: u.id }).catch(() => ({ items: [] })),
            api.entities.Collection.filter({ user_id: u.id }).catch(() => ({ items: [] })),
          ]);
          const videoCount = (vidRes.items || []).length;
          const collectionCount = (colRes.items || []).length;
          setContentCount(videoCount + collectionCount);

          // Determine profile type
          let type = 'creator';
          if (u.is_scholar) type = 'scholar';
          else if ((vidRes.items || []).some((v) => v.reciter_id === u.id)) {
            type = 'qari';
          }
          setProfileType(type);

          // Check if current user follows this profile
          if (authUser?.id && authUser.id !== u.id) {
            const f = await api.entities.Follow
              .filter({ follower_id: authUser.id, followed_id: u.id })
              .catch(() => ({ items: [] }));
            setIsFollowing((f.items || []).length > 0);
          }

          // Fetch scholar data if applicable
          if (type === 'scholar') {
            // Scholar is a separate entity; try to find by name match
            const scholarRes = await api.entities.Scholar
              .filter({ name: u.full_name || u.name }, { limit: 1 })
              .catch(() => ({ items: [] }));
            setScholarData((scholarRes.items || [])[0] || null);
          }

          setLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message || 'خطا در بارگذاری پروفایل.');
          setLoading(false);
        }
      }
    })();
    return () => { cancelled = true; };
  }, [id, authUser?.id]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-accent mb-3" />
        <p className="text-muted-foreground">در حال بارگذاری پروفایل...</p>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <AlertCircle className="h-10 w-10 text-muted-foreground/40 mb-3" />
        <h2 className="font-semibold text-foreground">{error || 'پروفایل یافت نشد'}</h2>
        <Link
          href="/"
          className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 rounded bg-accent text-accent-foreground text-sm font-medium hover:shadow-glow transition-all"
        >
          بازگشت به صفحه اصلی
        </Link>
      </div>
    );
  }

  const isOwn = authUser?.id === profile.id;

  // Build tabs based on profile type
  let tabs = [];
  let ProfileComponent = CreatorProfile;
  let profileProps = { profile, tabs, activeTab };

  if (profileType === 'qari') {
    tabs = [
      { id: 'recitations', label: 'تلاوت‌ها', href: `${pathname}?tab=recitations`, icon: Play },
      { id: 'surahs', label: 'سوره‌ها', href: `${pathname}?tab=surahs`, icon: BookOpen },
      { id: 'gatherings', label: 'محافل', href: `${pathname}?tab=gatherings`, icon: Users },
      { id: 'about', label: 'درباره', href: `${pathname}?tab=about`, icon: User2 },
    ];
    ProfileComponent = QariProfile;
  } else if (profileType === 'scholar') {
    tabs = [
      { id: 'talks', label: 'گفتارها', href: `${pathname}?tab=talks`, icon: User2 },
      { id: 'tafsir', label: 'تفسیرها', href: `${pathname}?tab=tafsir`, icon: BookOpen },
      { id: 'effects', label: 'آثار', href: `${pathname}?tab=effects`, icon: Play },
      { id: 'about', label: 'درباره', href: `${pathname}?tab=about`, icon: User2 },
    ];
    ProfileComponent = ScholarProfile;
    profileProps = { profile, tabs, activeTab, scholarData };
  } else {
    tabs = [
      { id: 'videos', label: 'محتوا', href: `${pathname}?tab=videos`, icon: Play },
      { id: 'collections', label: 'مجموعه‌ها', href: `${pathname}?tab=collections`, icon: BookOpen },
      { id: 'about', label: 'درباره', href: `${pathname}?tab=about`, icon: User2 },
    ];
    ProfileComponent = CreatorProfile;
  }

  return (
    <div className="min-h-screen bg-background">
      <ProfileHeader
        profileId={profile.id}
        profileType={profileType}
        coverImage={null}
        profileImage={profile.avatar_url || undefined}
        name={profile.full_name || 'کاربر نامشخص'}
        bio={profile.bio || undefined}
        verified={profileType === 'scholar' ? scholarData?.verified : false}
        followerCount={followerCount}
        contentCount={contentCount}
        following={isFollowing}
        isOwnProfile={isOwn}
        roleSpecific={profileType === 'qari' ? (
          <div className="flex flex-wrap gap-3">
            <span className="px-3 py-1 rounded bg-accent/10 text-accent text-xs font-medium border border-accent/20">
              قاری قرآنی
            </span>
            <span className="px-3 py-1 rounded bg-accent/10 text-accent text-xs font-medium border border-accent/20">
              تلاوت
            </span>
          </div>
        ) : profileType === 'scholar' ? (
          <div className="flex flex-wrap gap-3">
            <span className="px-3 py-1 rounded bg-accent/10 text-accent text-xs font-medium border border-accent/20">
              استاد تفسیر
            </span>
            <span className="px-3 py-1 rounded bg-accent/10 text-accent text-xs font-medium border border-accent/20">
              گفتار
            </span>
          </div>
        ) : (
          <div className="flex flex-wrap gap-3">
            <span className="px-3 py-1 rounded bg-accent/10 text-accent text-xs font-medium border border-accent/20">
              تولیدکننده محتوا
            </span>
          </div>
        )}
      />

      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-8">
        <ProfileTabs tabs={tabs} onTabChange={setActiveTab} />

        <ProfileComponent {...profileProps} />
      </div>
    </div>
  );
}
