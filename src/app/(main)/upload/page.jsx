import { Suspense } from 'react';
import RoleGuard from '@/components/RoleGuard';
import SubmissionWizard from '@/components/video/SubmissionWizard';

export const revalidate = 0;

export default function UploadRoute() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" /></div>}>
      <RoleGuard allowedRoles={['user', 'creator', 'moderator', 'admin']}>
        <SubmissionWizard />
      </RoleGuard>
    </Suspense>
  );
}
