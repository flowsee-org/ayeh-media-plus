import { Suspense } from 'react';
import RoleGuard from '@/components/RoleGuard';
import ModerationDashboard from '@/views/ModerationDashboard';

export const revalidate = 0;

export default function ModerationRoute() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" /></div>}>
      <RoleGuard allowedRoles={['moderator', 'admin']}>
        <ModerationDashboard />
      </RoleGuard>
    </Suspense>
  );
}
