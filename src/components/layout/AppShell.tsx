'use client';

import { useEffect } from 'react';
import { useSidebarStore } from '@/stores/sidebarStore';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { ContentArea } from './ContentArea';
import { MobileMenuOverlay } from './MobileMenuOverlay';
import { cn } from '@/utils/cn';

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const { isCollapsed, setCollapsed } = useSidebarStore();
  const isDesktop = useMediaQuery('(min-width: 1280px)');
  const isTablet = useMediaQuery('(min-width: 768px)');
  const isMobile = !isTablet;

  // Set initial sidebar state based on viewport
  useEffect(() => {
    if (isDesktop) {
      setCollapsed(false);
    } else if (isTablet) {
      setCollapsed(true);
    }
  }, [isDesktop, isTablet, setCollapsed]);

  return (
    <div className="min-h-screen">
      <Header />

      {/* Desktop/Tablet sidebar */}
      {!isMobile && (
        <Sidebar />
      )}

      {/* Mobile overlay */}
      {isMobile && <MobileMenuOverlay />}

      {/* Content area with margin for sidebar */}
      <div
        className={cn(
          'pt-[var(--header-height)] transition-all duration-250 ease-in-out',
          isMobile
            ? 'ml-0'
            : isCollapsed
              ? 'ml-[var(--sidebar-collapsed-width)]'
              : 'ml-[var(--sidebar-width)]'
        )}
      >
        <ContentArea>{children}</ContentArea>
      </div>
    </div>
  );
}
