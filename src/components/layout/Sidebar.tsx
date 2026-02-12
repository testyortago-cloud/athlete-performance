'use client';

import { useSidebarStore } from '@/stores/sidebarStore';
import { SidebarNavItem } from './SidebarNavItem';
import { SidebarSubNav } from './SidebarSubNav';
import { cn } from '@/utils/cn';
import {
  LayoutDashboard,
  Users,
  Trophy,
  BookOpen,
  ClipboardList,
  HeartPulse,
  Activity,
  BarChart3,
  Settings,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react';

const mainNavItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/athletes', icon: Users, label: 'Athletes' },
  { href: '/sports', icon: Trophy, label: 'Sports' },
  { href: '/programs', icon: BookOpen, label: 'Programs' },
  { href: '/testing', icon: ClipboardList, label: 'Testing' },
  { href: '/injuries', icon: HeartPulse, label: 'Injuries' },
  { href: '/load-monitoring', icon: Activity, label: 'Load Monitoring' },
];

const analyticsSubNav = [
  { href: '/analytics/comparisons', label: 'Comparisons' },
  { href: '/analytics/risk', label: 'Risk' },
];

export function Sidebar() {
  const { isCollapsed, toggleCollapse, toggleExpandedItem, expandedItems } =
    useSidebarStore();

  const isAnalyticsExpanded = expandedItems.includes('analytics');

  return (
    <aside
      className={cn(
        'fixed left-0 top-[var(--header-height)] z-30 flex h-[calc(100vh-var(--header-height))] flex-col bg-black transition-all duration-250 ease-in-out',
        isCollapsed ? 'w-[var(--sidebar-collapsed-width)]' : 'w-[var(--sidebar-width)]'
      )}
      role="navigation"
      aria-label="Main navigation"
    >
      <nav className="flex-1 overflow-y-auto py-2" aria-label="Primary" data-tour="sidebar-nav">
        {mainNavItems.map((item) => (
          <SidebarNavItem
            key={item.href}
            href={item.href}
            icon={<item.icon className="h-5 w-5" />}
            label={item.label}
          />
        ))}

        <div className="mx-4 my-2 border-t border-[#1A1A1A]" />

        <SidebarNavItem
          icon={<BarChart3 className="h-5 w-5" />}
          label="Analytics"
          hasSubNav
          isExpanded={isAnalyticsExpanded}
          onToggle={() => toggleExpandedItem('analytics')}
        />
        <SidebarSubNav items={analyticsSubNav} isExpanded={isAnalyticsExpanded} />
      </nav>

      <div className="border-t border-[#1A1A1A] py-2">
        <SidebarNavItem
          href="/settings"
          icon={<Settings className="h-5 w-5" />}
          label="Settings"
        />

        <button
          onClick={toggleCollapse}
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className={cn(
            'flex w-full items-center gap-3 px-4 py-2.5 text-sm font-medium text-gray-500 transition-colors hover:text-white focus:outline-none focus:ring-2 focus:ring-white/30 focus:ring-inset',
            isCollapsed && 'justify-center px-0'
          )}
        >
          {isCollapsed ? (
            <ChevronsRight className="h-5 w-5" />
          ) : (
            <>
              <ChevronsLeft className="h-5 w-5" />
              <span>Collapse</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
}
