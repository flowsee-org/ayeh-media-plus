'use client';

import { useEffect, useState } from 'react';
import { User2, BookOpen, FileText, Clock } from 'lucide-react';
import api from '@/lib/api';
import VideoCard from '@/components/ui/video-card';
import ProfileContentSection from '@/components/ui/profile-content-section';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

/**
 * Scholar profile content: educational talks, tafsir, books, and about.
 * Fetches real data from Video entities filtered by scholar_id and the Scholar entity.
 */
export default function ScholarProfile({
  profile,
  activeTab,
  scholarData,
}) {
  const [talks, setTalks] = useState([]);
  const [tafsir, setTafsir] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [talkRes, tafsirRes] = await Promise.all([
          api.entities.Video.filter(
            { scholar_id: profile.id, category: 'talk' },
            { sort: '-created_date', limit: 20 }
          ).catch(() => ({ items: [] })),
          api.entities.Video.filter(
            { scholar_id: profile.id, category: 'tafsir' },
            { sort: '-created_date', limit: 20 }
          ).catch(() => ({ items: [] })),
        ]);
        if (!cancelled) {
          setTalks(talkRes.items || []);
          setTafsir(tafsirRes.items || []);
          setLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message || 'بارگذاری محتوای استاد با خطا مواجه شد.');
          setLoading(false);
        }
      }
    })();
    return () => { cancelled = true; };
  }, [profile?.id]);

  const books = (() => {
    if (!scholarData?.books) return [];
    try {
      return JSON.parse(scholarData.books);
    } catch {
      return scholarData.books ? [scholarData.books] : [];
    }
  })();

  const contentByTab = {
    talks: (
      <ProfileContentSection
        title="گفتارها و درس‌های عمومی"
        icon={User2}
        loading={loading}
        error={error}
        empty={!loading && !error && talks.length === 0}
        emptyTitle="گفتاری وجود ندارد"
        emptySubtitle="این استاد هنوز گفتاری منتشر نکرده است."
        emptyActionLabel="بازگشت به صفحه اصلی"
        emptyActionHref="/"
        className="space-y-4"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {talks.map((v) => (
            <VideoCard key={v.id} item={v} />
          ))}
        </div>
      </ProfileContentSection>
    ),
    tafsir: (
      <ProfileContentSection
        title="تفسیر و محتوای تفسیری"
        icon={BookOpen}
        loading={loading}
        error={error}
        empty={!loading && !error && tafsir.length === 0}
        emptyTitle="تفسیری ثبت نشده"
        emptySubtitle="محتوای تفسیری این استاد در دسترس نیست."
        emptyActionLabel="بازگشت به صفحه اصلی"
        emptyActionHref="/"
        className="space-y-4"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {tafsir.map((v) => (
            <VideoCard key={v.id} item={v} />
          ))}
        </div>
      </ProfileContentSection>
    ),
    effects: (
      <ProfileContentSection
        title="آثار و تألیفات"
        icon={FileText}
        loading={loading}
        error={error}
        empty={!loading && !error && books.length === 0}
        emptyTitle="آثاری ثبت نشده"
        emptySubtitle="کتاب یا تصنیفی از این استاد ثبت نشده است."
        emptyActionLabel="بازگشت به صفحه اصلی"
        emptyActionHref="/"
        className="space-y-4"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {books.map((book, i) => (
            <Card key={i} className="p-4 text-right">
              <CardContent className="pt-0">
                <div className="text-sm font-medium text-foreground truncate">{book}</div>
                <div className="text-xs text-muted-foreground mt-1">تألیف استاد</div>
              </CardContent>
            </Card>
          ))}
        </div>
      </ProfileContentSection>
    ),
    about: (
      <ProfileContentSection
        title="درباره استاد"
        icon={Clock}
        loading={false}
        className="space-y-4"
      >
        <Card className="p-6">
          <CardContent className="pt-0">
            <p className="text-muted-foreground leading-relaxed text-sm">
              {scholarData?.bio || profile.bio || 'این استاد هنوز بیوگرافی خود را وارد نکرده است.'}
            </p>
            {scholarData?.title && (
              <div className="mt-3 text-xs font-medium text-accent">
                {scholarData.title}
              </div>
            )}
            {scholarData?.verified && (
              <Badge variant="quranic" className="mt-3 text-xs font-medium" size="sm">
                تایید شده
              </Badge>
            )}
            {profile.created_date && (
              <div className="mt-4 pt-3 border-t border-border/50 flex items-center gap-2 text-xs text-muted-foreground">
                <Clock className="h-3.5 w-3.5" />
                <span>عضو از {new Date(profile.created_date).toLocaleDateString('fa-IR')}</span>
              </div>
            )}
          </CardContent>
        </Card>
      </ProfileContentSection>
    ),
  };

  return contentByTab[activeTab] || contentByTab.talks;
}
