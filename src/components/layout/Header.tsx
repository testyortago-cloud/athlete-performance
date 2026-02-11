'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSidebarStore } from '@/stores/sidebarStore';
import { useToastStore } from '@/stores/toastStore';
import { useNotificationStore, type Notification } from '@/stores/notificationStore';
import { Dropdown, DropdownItem, DropdownDivider } from '@/components/ui/Dropdown';
import { NotificationBadge } from '@/components/ui/Badge';
import { cn } from '@/utils/cn';
import { Bell, Menu, Search, LogOut, User, RefreshCw, AlertTriangle, AlertCircle, Info } from 'lucide-react';
import { signOut, useSession } from 'next-auth/react';

function NotificationPanel() {
  const { notifications, markAllRead } = useNotificationStore();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const unreadCount = useNotificationStore((s) => s.unreadCount());

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  function handleOpen() {
    setOpen(!open);
    if (!open) markAllRead();
  }

  const severityIcon = {
    danger: <AlertTriangle className="h-4 w-4 text-danger" />,
    warning: <AlertCircle className="h-4 w-4 text-warning" />,
    info: <Info className="h-4 w-4 text-gray-400" />,
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={handleOpen}
        className="relative rounded-md p-2 text-white/70 hover:text-white transition-colors"
      >
        <Bell className="h-5 w-5" />
        <NotificationBadge count={unreadCount} />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 z-50 w-80 rounded-md border border-border bg-white shadow-lg">
          <div className="border-b border-border px-4 py-3">
            <h3 className="text-sm font-semibold text-black">Notifications</h3>
          </div>
          <div className="max-h-72 overflow-auto">
            {notifications.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-gray-400">
                No notifications
              </p>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  className={cn(
                    'flex items-start gap-3 border-b border-border px-4 py-3 last:border-0',
                    !n.read && 'bg-muted'
                  )}
                >
                  <div className="mt-0.5 shrink-0">
                    {severityIcon[n.severity]}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-black">{n.message}</p>
                    <p className="mt-0.5 text-xs text-gray-400">{n.date}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export function Header() {
  const router = useRouter();
  const { isCollapsed, toggleMobileMenu } = useSidebarStore();
  const { data: session } = useSession();
  const { addToast } = useToastStore();
  const [syncing, setSyncing] = useState(false);

  const initials = session?.user?.name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'AD';

  async function handleSync() {
    setSyncing(true);
    try {
      const res = await fetch('/api/sync', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        const total = Object.values(data.synced as Record<string, number>).reduce(
          (a: number, b: number) => a + b,
          0
        );
        addToast(`Synced ${total} records`, 'success');
      } else {
        addToast(data.error || 'Sync failed', 'error');
      }
    } catch {
      addToast('Sync failed', 'error');
    } finally {
      setSyncing(false);
    }
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-40 flex h-[var(--header-height)] items-center bg-black">
      {/* Logo area */}
      <div
        className={cn(
          'flex h-full items-center justify-center transition-all duration-250 ease-in-out border-r border-white/5',
          isCollapsed
            ? 'w-[var(--sidebar-collapsed-width)]'
            : 'w-[var(--sidebar-width)]'
        )}
      >
        <div className="flex items-center gap-1">
          <span className="text-xl font-bold tracking-tight text-white">DJP</span>
          {!isCollapsed && (
            <span className="text-[10px] font-semibold tracking-[0.2em] text-white/80 self-end mb-0.5 ml-0.5">
              ATHLETE
            </span>
          )}
        </div>
      </div>

      {/* Mobile menu button */}
      <button
        onClick={toggleMobileMenu}
        className="flex h-full items-center px-4 text-white md:hidden"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Right section */}
      <div className="flex flex-1 items-center justify-end gap-2 px-4 md:justify-between">
        {/* Search */}
        <div className="hidden md:block md:max-w-md md:flex-1 md:px-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
            <input
              type="text"
              placeholder="Search athletes..."
              className="w-full rounded-md border border-white/10 bg-white/5 py-1.5 pl-10 pr-4 text-sm text-white placeholder:text-white/40 focus:border-white/20 focus:outline-none"
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Sync button */}
          <button
            onClick={handleSync}
            disabled={syncing}
            className="rounded-md p-2 text-white/70 hover:text-white transition-colors disabled:opacity-50"
            title="Sync data to Supabase"
          >
            <RefreshCw className={cn('h-5 w-5', syncing && 'animate-spin')} />
          </button>

          {/* Notifications */}
          <NotificationPanel />

          {/* User menu */}
          <Dropdown
            align="right"
            trigger={
              <button className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-xs font-semibold text-white hover:bg-white/20 transition-colors">
                {initials}
              </button>
            }
          >
            <div className="px-3 py-2">
              <p className="text-sm font-medium text-black">{session?.user?.name || 'Admin'}</p>
              <p className="text-xs text-gray-500">{session?.user?.email}</p>
            </div>
            <DropdownDivider />
            <DropdownItem onClick={() => router.push('/profile')}>
              <User className="mr-2 h-4 w-4" />
              Profile
            </DropdownItem>
            <DropdownDivider />
            <DropdownItem danger onClick={() => signOut({ callbackUrl: '/login' })}>
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </DropdownItem>
          </Dropdown>
        </div>
      </div>
    </header>
  );
}
