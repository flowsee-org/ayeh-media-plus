import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Suspense } from 'react';
import api from '@/lib/api';
import ProfilePage from '@/components/design-system/ProfilePage';

/**
 * Public profile route.
 *
 * Server Component: generates metadata and validates the profile exists
 * before delegating to the client-side ProfilePage for interactivity.
 *
 * Route: /profile/[id]
 */
export async function generateMetadata({ params }) {
  const { id } = await params;

  try {
    const base = process.env.NEXT_PUBLIC_API_BASE || '';
    const res = await fetch(`${base}/api/entities/User/${encodeURIComponent(id)}`, {
      cache: 'no-store',
    });
    if (res.ok) {
      const user = await res.json();
      const title = user.full_name || 'کاربر آیه';
      const description = user.bio
        ? user.bio.slice(0, 160)
        : `پروفایل ${user.is_scholar ? 'استاد/قاری' : 'محتواساز'} در آیه پلاس`;

      return {
        title,
        description,
        alternates: {
          canonical: `/profile/${id}`,
        },
        openGraph: {
          title,
          description,
          type: 'profile',
          url: `/profile/${id}`,
          images: user.avatar_url ? [{ url: user.avatar_url }] : undefined,
          profile: {
            firstName: user.full_name,
            username: user.id,
          },
        },
      };
    }
  } catch {
    // Fallback metadata if API is unavailable
  }

  return {
    title: 'پروفایل | آیه پلاس',
    description: 'پروفایل کاربر در آیه پلاس',
  };
}

export default async function ProfileRoute({ params }) {
  const { id } = await params;

  // Validate profile exists on the server before rendering → 404 for missing
  try {
    const base = process.env.NEXT_PUBLIC_API_BASE || '';
    const res = await fetch(`${base}/api/entities/User/${encodeURIComponent(id)}`, {
      cache: 'no-store',
    });
    if (!res.ok) {
      notFound();
    }
    await res.json();
  } catch {
    notFound();
  }

  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="w-8 h-8 border-4 border-accent/30 border-t-accent rounded-full animate-spin" />
      </div>
    }>
      <ProfilePage params={params} />
    </Suspense>
  );
}
