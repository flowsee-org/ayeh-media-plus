'use client';

import { useEffect, useState } from 'react';
import { Play, BookOpen, Users, Mic, Clock } from 'lucide-react';
import { Link } from '@/lib/router-compat';
import api from '@/lib/api';
import VideoCard from './VideoCard';
import ProfileContentSection from './ProfileContentSection';

/**
 * Qari (Quran reciter) profile content.
 * Gives Quranic recitations visual priority.
 * Fetches real data from Video entities filtered by reciter_id.
 */
export default function QariProfile({
  profile,
  activeTab,
}) {
  const [recitations, setRecitations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await api.entities.Video.filter(
          { reciter_id: profile.id },
          { sort: '-created_date', limit: 30 }
        ).catch(() => ({ items: [] }));
        if (!cancelled) {
          setRecitations(res.items || []);
          setLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message || 'بارگذاری تلاوت‌ها با خطا مواجه شد.');
          setLoading(false);
        }
      }
    })();
    return () => { cancelled = true; };
  }, [profile?.id]);

  const contentByTab = {
    recitations: (
      <ProfileContentSection
        title="تلاوت‌های قرآنی"
        icon={Play}
        loading={loading}
        error={error}
        empty={!loading && !error && recitations.length === 0}
        emptyTitle="تلاوتی وجود ندارد"
        emptySubtitle="این قاری هنوز تلاوتی ثبت نکرده است."
        emptyActionLabel="بازگشت به صفحه اصلی"
        emptyActionHref="/"
        className="space-y-4"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {recitations.map((v) => (
            <VideoCard key={v.id} item={v} />
          ))}
        </div>
      </ProfileContentSection>
    ),
    surahs: (
      <ProfileContentSection
        title="سوره‌های تلاوت‌شده"
        icon={BookOpen}
        loading={loading}
        error={error}
        empty={!loading && !error && recitations.length === 0}
        emptyTitle="سوره‌ای ثبت نشده"
        emptySubtitle="لیست سوره‌های تلاوت‌شده این قاری در دسترس نیست."
        emptyActionLabel="بازگشت به صفحه اصلی"
        emptyActionHref="/"
        className="space-y-4"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {[...new Set(recitations.map((v) => v.verse_key).filter(Boolean))].map((key) => (
            <Link
              key={key}
              to={`/verse/${key.replace(':', '/')}`}
              className="group block p-3 rounded border border-accent/10 bg-accent/[0.02] hover:border-accent/30 hover:bg-accent/5 transition-all text-right"
            >
              <div className="text-xs font-mono text-accent/60 mb-1">{key}</div>
              <div className="text-xs text-muted-foreground line-clamp-1">
                تلاوت‌های مرتبط با {key}
              </div>
            </Link>
          ))}
        </div>
      </ProfileContentSection>
    ),
    gatherings: (
      <ProfileContentSection
        title="محافل و gatherings"
        icon={Users}
        loading={loading}
        error={error}
        empty={!loading && !error && recitations.length === 0}
        emptyTitle="محرفی ثبت نشده"
        emptySubtitle="شرکت در محفل قرآنی ثبت نشده است."
        emptyActionLabel="بازگشت به صفحه اصلی"
        emptyActionHref="/"
        className="space-y-4"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {recitations
            .filter((v) => v.category === 'gathering')
            .map((v) => (
              <VideoCard key={v.id} item={v} />
            ))}
        </div>
      </ProfileContentSection>
    ),
    about: (
      <ProfileContentSection
        title="درباره قاری"
        icon={Mic}
        loading={false}
        className="space-y-4"
      >
        <div className="rounded border border-border/50 bg-card p-6">
          <p className="text-muted-foreground leading-relaxed text-sm">
            {profile.bio || 'این قاری هنوز بیوگرافی خود را وارد نکرده است.'}
          </p>
          <div className="mt-4 pt-3 border-t border-border/50 flex items-center gap-2 text-xs text-muted-foreground">
            <Clock className="h-3.5 w-3.5" />
            <span>عضو از {new Date(profile.created_date).toLocaleDateString('fa-IR')}</span>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <span className="px-3 py-1 rounded bg-accent/10 text-accent text-xs font-medium border border-accent/20">
              تلاوت قرآنی
            </span>
          </div>
        </div>
      </ProfileContentSection>
    ),
  };

  return contentByTab[activeTab] || contentByTab.recitations;
}