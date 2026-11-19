'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';

import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

/**
 * Reusable profile navigation tabs.
 * Only renders tabs that have a meaningful label and href.
 * Active state is derived from the current pathname.
 * Built on shadcn/ui Tabs primitive.
 */
export default function ProfileTabs({ tabs, className = '', onTabChange }) {
  const router = useRouter();
  const pathname = usePathname();
  const [activeId, setActiveId] = useState(() => {
    for (const tab of tabs) {
      const tabPath = tab.href.split('?')[0];
      if (pathname === tabPath || pathname.startsWith(tabPath + '/')) {
        return tab.id;
      }
    }
    return tabs[0]?.id || null;
  });

  const handleTabClick = useCallback(
    (id, href, e) => {
      e.preventDefault();
      setActiveId(id);
      router.push(href);
      if (onTabChange) onTabChange(id);
    },
    [router, onTabChange]
  );

  useEffect(() => {
    let derived = null;
    for (const tab of tabs) {
      const tabPath = tab.href.split('?')[0];
      if (pathname === tabPath || pathname.startsWith(tabPath + '/')) {
        derived = tab.id;
        break;
      }
    }
    if (derived && derived !== activeId) setActiveId(derived);
  }, [pathname, tabs, activeId]);

  if (tabs.length === 0) return null;

  return (
    <Tabs defaultValue={activeId} onValueChange={(value) => {}}>
      <div className={`border-b border-border mb-8 ${className}`}>
        <TabsList className="flex flex-wrap gap-1 md:gap-2 overflow-x-auto pb-2">
          {tabs.map((tab) => {
            const isActive = activeId === tab.id;
            const Icon = tab.icon;
            return (
              <TabsTrigger
                key={tab.id}
                value={tab.id}
                onClick={(e) => handleTabClick(tab.id, tab.href, e)}
                disabled={tab.disabled}
                className={`inline-flex items-center gap-2 px-5 py-2.5 rounded text-sm font-medium transition-colors border ${
                  isActive
                    ? 'bg-quranic-emerald text-white border-quranic-emerald shadow-quranic-glow'
                    : 'text-muted-foreground hover:text-foreground border-transparent hover:bg-muted/50'
                } ${tab.disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {Icon && <Icon className="w-4 h-4" />}
                {tab.label}
                {tab.count !== undefined && (
                  <span className="ml-1 px-1.5 py-0.5 rounded text-[10px] font-bold border border-current opacity-70">
                    {tab.count}
                  </span>
                )}
              </TabsTrigger>
            );
          })}
        </TabsList>
      </div>
    </Tabs>
  );
}
