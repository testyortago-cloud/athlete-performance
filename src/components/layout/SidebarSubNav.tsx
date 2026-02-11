'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/utils/cn';
import { useSidebarStore } from '@/stores/sidebarStore';

interface SubNavItem {
  href: string;
  label: string;
}

interface SidebarSubNavProps {
  items: SubNavItem[];
  isExpanded: boolean;
}

export function SidebarSubNav({ items, isExpanded }: SidebarSubNavProps) {
  const pathname = usePathname();
  const isCollapsed = useSidebarStore((s) => s.isCollapsed);

  if (isCollapsed) {
    // Flyout menu when sidebar is collapsed — handled by parent Tooltip/Dropdown
    return null;
  }

  if (!isExpanded) return null;

  return (
    <div className="overflow-hidden">
      {items.map((item) => {
        const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'block py-2 pl-12 pr-4 text-sm transition-colors',
              isActive
                ? 'text-white bg-dark'
                : 'text-gray-500 hover:text-white hover:bg-dark'
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </div>
  );
}
