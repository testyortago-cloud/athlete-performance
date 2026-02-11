'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/utils/cn';
import { useSidebarStore } from '@/stores/sidebarStore';
import { Tooltip } from '@/components/ui/Tooltip';
import { ChevronDown } from 'lucide-react';

interface SidebarNavItemProps {
  href?: string;
  icon: React.ReactNode;
  label: string;
  hasSubNav?: boolean;
  isExpanded?: boolean;
  onToggle?: () => void;
  onClick?: () => void;
}

export function SidebarNavItem({
  href,
  icon,
  label,
  hasSubNav,
  isExpanded,
  onToggle,
  onClick,
}: SidebarNavItemProps) {
  const pathname = usePathname();
  const isCollapsed = useSidebarStore((s) => s.isCollapsed);
  const isActive = href ? pathname === href || pathname.startsWith(href + '/') : false;

  const content = (
    <div
      className={cn(
        'group flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-colors cursor-pointer relative',
        isActive
          ? 'bg-dark text-white'
          : 'text-gray-500 hover:bg-dark hover:text-white',
        isCollapsed && 'justify-center px-0'
      )}
      onClick={hasSubNav ? onToggle : onClick}
    >
      {isActive && (
        <div className="absolute left-0 top-0 h-full w-[3px] bg-white" />
      )}
      <span className={cn('flex-shrink-0', isCollapsed ? 'mx-auto' : '')}>
        {icon}
      </span>
      {!isCollapsed && (
        <>
          <span className="flex-1 truncate">{label}</span>
          {hasSubNav && (
            <ChevronDown
              className={cn(
                'h-4 w-4 transition-transform',
                isExpanded && 'rotate-180'
              )}
            />
          )}
        </>
      )}
    </div>
  );

  if (isCollapsed) {
    return (
      <Tooltip content={label} side="right">
        {href && !hasSubNav ? (
          <Link href={href} className="block w-full">
            {content}
          </Link>
        ) : (
          content
        )}
      </Tooltip>
    );
  }

  if (href && !hasSubNav) {
    return (
      <Link href={href} className="block">
        {content}
      </Link>
    );
  }

  return content;
}
