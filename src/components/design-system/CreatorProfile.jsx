'use client';

import { useEffect, useState } from 'react';
import { Video, FolderHeart, BookOpen, Clock } from 'lucide-react';
import api from '@/lib/api';
import VideoCard from './VideoCard';
import CollectionCard from './CollectionCard';
import ProfileContentSection from './ProfileContentSection';

/**
 * Creator profile content: published videos, collections, and about info.
 * Fetches real data from the User, Video, and Collection entities.
 */
export default function CreatorProfile({
  profile,
  activeTab,
}) {
  const [videos, setVideos] = useState([]);
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [vidRes, colRes] = await Promise.all([
          api.entities.Video.filter(
            { reciter_id: profile.id },
            { sort: '-created_date', limit: 20 }
          ).catch(() => ({ items: [] })),
          api.entities.Collection.filter(
            { user_id: profile.id, is_public: true },
            { sort: '-created_date', limit: 20 }
          ).catch(() => ({ items: [] })),
        ]);
        if (!cancelled) {
          setVideos(vidRes.items || []);
          setCollections(colRes.items || []);
          setLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message || 'بارگذاری محتوا با خطا مواجه شد.');
          setLoading(false);
        }
      }
    })();
    return () => { cancelled = true; };
  }, [profile?.id]);

  const contentByTab = {
    videos: (
      <ProfileContentSection
        title="محتوا منتشر شده"
        icon={Video}
        loading={loading}
        error={error}
        empty={!loading && !error && videos.length === 0}
        emptyTitle="محتوایی منتشر نشده"
        emptySubtitle="این تولیدکننده هنوز محتوایی منتشر نکرده است."
        emptyActionLabel="بازگشت به صفحه اصلی"
        emptyActionHref="/"
        className="space-y-4"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {videos.map((v) => (
            <VideoCard key={v.id} item={v} />
          ))}
        </div>
      </ProfileContentSection>
    ),
    collections: (
      <ProfileContentSection
        title="مجموعه‌ها و پلس‌لیست‌ها"
        icon={FolderHeart}
        loading={loading}
        error={error}
        empty={!loading && !error && collections.length === 0}
        emptyTitle="مجموعه‌ای وجود ندارد"
        emptySubtitle="این تولیدکننده هنوز مجموعه‌ای ایجاد نکرده است."
        emptyActionLabel="بازگشت به صفحه اصلی"
        emptyActionHref="/"
        className="space-y-4"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {collections.map((c) => (
            <CollectionCard key={c.id} collection={c} />
          ))}
        </div>
      </ProfileContentSection>
    ),
    about: (
      <ProfileContentSection
        title="درباره تولیدکننده"
        icon={BookOpen}
        loading={false}
        className="space-y-4"
      >
        <div className="rounded-2xl border border-border/50 bg-card p-6">
          <p className="text-muted-foreground leading-relaxed text-sm">
            {profile.bio || 'این تولیدکننده هنوز بیوگرافی خود را وارد نکرده است.'}
          </p>
          {profile.created_date && (
            <div className="mt-4 pt-3 border-t border-border/50 flex items-center gap-2 text-xs text-muted-foreground">
              <Clock className="h-3.5 w-3.5" />
              <span>عضو از {new Date(profile.created_date).toLocaleDateString('fa-IR')}</span>
            </div>
          )}
        </div>
      </ProfileContentSection>
    ),
  };

  return contentByTab[activeTab] || contentByTab.videos;
}
