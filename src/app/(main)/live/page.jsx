import { Suspense } from 'react';
import RoleGuard from '@/components/RoleGuard';
import GoLive from '@/views/GoLive';
import { PERMISSIONS } from '@/lib/rbac';

export const metadata = {
  title: 'پخش زنده قرآنی — آیه مدیا پلاس',
  description: 'پخش زنده جلسات تلاوت، پاسخ به شبهات و مباحث تفسیری اساتید قرآن کریم',
};

export default function LiveRoute() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-accent/30 border-t-accent rounded-full animate-spin" />
        </div>
      }
    >
      <RoleGuard requiredPermission={PERMISSIONS.LIVE_STREAM}>
        <GoLive />
      </RoleGuard>
    </Suspense>
  );
}
