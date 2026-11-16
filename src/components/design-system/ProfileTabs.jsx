'use client';

import { useState, useCallback, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';


/**
 * Reusable profile navigation tabs.
 * Only renders tabs that have a meaningful label and href.
 * Active state is derived from the current pathname.
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
    <div className={`border-b border-border mb-8 ${className}`}>
      <div className="flex flex-wrap gap-1 md:gap-2 overflow-x-auto pb-2 scrollbar-hide -ms-overflow-style:auto">
        {tabs.map((tab) => {
          const isActive = activeId === tab.id;
          const Icon = tab.icon;
          return (
            <Link
              key={tab.id}
              href={tab.href}
              onClick={(e) => handleTabClick(tab.id, tab.href, e)}
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
            </Link>
          );
        })}
      </div>
    </div>
  );
}
