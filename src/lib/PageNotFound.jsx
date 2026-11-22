'use client';

import { usePathname, useRouter } from 'next/navigation';
import api from "@/lib/api";
import { useQuery } from '@tanstack/react-query';
import { IslamicStar } from '@/components/IslamicOrnaments';
import { Home as HomeIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function PageNotFound({}) {
    const pathname = usePathname();
    const router = useRouter();
    const pageName = pathname ? pathname.substring(1) : '';

    const { data: authData, isFetched } = useQuery({
        queryKey: ['user'],
        queryFn: async () => {
            try {
                const user = await api.auth.me();
                return { user, isAuthenticated: true };
            } catch (error) {
                return { user: null, isAuthenticated: false };
            }
        }
    });

    return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-background">
            <div className="max-w-md w-full">
                <div className="text-center space-y-6">
                    <div className="flex justify-center mb-4">
                        <IslamicStar size={48} className="text-accent/30" />
                    </div>
                    <div className="space-y-2">
                        <h1 className="text-7xl font-light text-muted-foreground/40" dir="ltr">۴۰۴</h1>
                        <div className="h-0.5 w-16 bg-accent/20 mx-auto"></div>
                    </div>

                    <div className="space-y-3">
                        <h2 className="text-2xl font-medium text-foreground">
                            صفحه یافت نشد
                        </h2>
                        <p className="text-muted-foreground leading-relaxed">
                            صفحه «{pageName}» در این برنامه یافت نشد.
                        </p>
                    </div>

                    {isFetched && authData.isAuthenticated && authData.user?.role === 'admin' && (
                        <div className="mt-8 p-4 bg-accent/5 rounded border border-accent/20">
                            <div className="flex items-start gap-3">
                                <div className="shrink-0 w-5 h-5 rounded bg-accent/10 flex items-center justify-center mt-0.5">
                                    <div className="w-2 h-2 rounded bg-accent"></div>
                                </div>
                                <div className="text-right space-y-1">
                                    <p className="text-sm font-medium text-foreground">یادداشت مدیر</p>
                                    <p className="text-sm text-muted-foreground leading-relaxed">
                                        ممکن است این صفحه هنوز پیاده‌سازی نشده باشد. از دستیار بخواهید آن را ایجاد کند.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="pt-6">
                        <Button
                            onClick={() => router.push('/')}
                            className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-primary-foreground bg-primary rounded hover:shadow-glow transition-all duration-300"
                        >
                            <HomeIcon className="w-4 h-4" />
                            بازگشت به خانه
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    )
}