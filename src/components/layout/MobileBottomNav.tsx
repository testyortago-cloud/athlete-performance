'use client';

import { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/utils/cn';
import {
  LayoutDashboard,
  Users,
  ClipboardList,
  Activity,
  MoreHorizontal,
  Trophy,
  BookOpen,
  HeartPulse,
  BarChart3,
  Settings,
  X,
} from 'lucide-react';

const PRIMARY_TABS = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/athletes', icon: Users, label: 'Athletes' },
  { href: '/testing', icon: ClipboardList, label: 'Testing' },
  { href: '/load-monitoring', icon: Activity, label: 'Load' },
];

const MORE_ITEMS = [
  { href: '/sports', icon: Trophy, label: 'Sports' },
  { href: '/programs', icon: BookOpen, label: 'Programs' },
  { href: '/injuries', icon: HeartPulse, label: 'Injuries' },
  { href: '/analytics/comparisons', icon: BarChart3, label: 'Comparisons' },
  { href: '/analytics/risk', icon: BarChart3, label: 'Risk' },
  { href: '/settings', icon: Settings, label: 'Settings' },
];

export function MobileBottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [showMore, setShowMore] = useState(false);

  function isActive(href: string) {
    if (href === '/dashboard') return pathname === '/dashboard';
    return pathname.startsWith(href);
  }

  const moreActive = MORE_ITEMS.some((item) => isActive(item.href));

  return (
    <>
      {/* More menu overlay */}
      {showMore && (
        <div className="fixed inset-0 z-[45] md:hidden">
          <div className="fixed inset-0 bg-black/30" onClick={() => setShowMore(false)} />
          <div className="fixed bottom-16 left-2 right-2 z-[46] rounded-xl border border-border bg-white p-2 shadow-xl">
            <div className="mb-2 flex items-center justify-between px-2 py-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">More</span>
              <button
                onClick={() => setShowMore(false)}
                className="rounded-md p-1 text-gray-400 hover:text-black"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="grid grid-cols-3 gap-1">
              {MORE_ITEMS.map((item) => (
                <button
                  key={item.href}
                  onClick={() => {
                    router.push(item.href);
                    setShowMore(false);
                  }}
                  className={cn(
                    'flex flex-col items-center gap-1 rounded-lg px-2 py-3 text-xs font-medium transition-colors',
                    isActive(item.href)
                      ? 'bg-black text-white'
                      : 'text-gray-600 hover:bg-muted'
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Bottom nav bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-white md:hidden safe-area-bottom">
        <div className="flex items-stretch">
          {PRIMARY_TABS.map((tab) => (
            <button
              key={tab.href}
              onClick={() => router.push(tab.href)}
              className={cn(
                'flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] font-medium transition-colors',
                isActive(tab.href) ? 'text-black' : 'text-gray-400'
              )}
            >
              <tab.icon className={cn('h-5 w-5', isActive(tab.href) && 'stroke-[2.5]')} />
              {tab.label}
            </button>
          ))}
          <button
            onClick={() => setShowMore(!showMore)}
            className={cn(
              'flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] font-medium transition-colors',
              moreActive || showMore ? 'text-black' : 'text-gray-400'
            )}
          >
            <MoreHorizontal className={cn('h-5 w-5', (moreActive || showMore) && 'stroke-[2.5]')} />
            More
          </button>
        </div>
      </nav>
    </>
  );
}
