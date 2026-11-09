import { Suspense } from 'react';
import RoleGuard from '@/components/RoleGuard';
import CreatorDashboard from '@/views/CreatorDashboard';

export const revalidate = 0;

export default function CreatorRoute() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" /></div>}>
      <RoleGuard allowedRoles={['creator', 'moderator', 'admin']}>
        <CreatorDashboard />
      </RoleGuard>
    </Suspense>
  );
}
