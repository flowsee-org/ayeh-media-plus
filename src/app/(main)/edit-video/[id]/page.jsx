import { Suspense } from 'react';
import RoleGuard from '@/components/RoleGuard';
import EditVideoPage from '@/views/EditVideo';

export const revalidate = 0;

export default function EditVideoRoute({ params }) {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="w-8 h-8 border-4 border-accent/30 border-t-accent rounded-full animate-spin" />
      </div>
    }>
      <RoleGuard allowedRoles={['user', 'creator', 'moderator', 'admin']}>
        <EditVideoPage videoId={params.id} />
      </RoleGuard>
    </Suspense>
  );
}
