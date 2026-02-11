'use client';

import { useEffect } from 'react';
import { useSidebarStore } from '@/stores/sidebarStore';
import { Sidebar } from './Sidebar';
import { X } from 'lucide-react';

export function MobileMenuOverlay() {
  const { isMobileOpen, closeMobileMenu } = useSidebarStore();

  useEffect(() => {
    function handleEscape(e: KeyboardEvent) {
      if (e.key === 'Escape') closeMobileMenu();
    }
    if (isMobileOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isMobileOpen, closeMobileMenu]);

  if (!isMobileOpen) return null;

  return (
    <div className="fixed inset-0 z-40 md:hidden">
      <div className="fixed inset-0 bg-black/50" onClick={closeMobileMenu} />
      <div className="fixed left-0 top-[var(--header-height)] z-50 h-[calc(100vh-var(--header-height))] w-[260px]">
        <button
          onClick={closeMobileMenu}
          className="absolute right-2 top-2 z-50 rounded-md p-1 text-gray-500 hover:text-white"
        >
          <X className="h-5 w-5" />
        </button>
        <Sidebar />
      </div>
    </div>
  );
}
