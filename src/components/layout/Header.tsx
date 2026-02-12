'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSidebarStore } from '@/stores/sidebarStore';
import { useToastStore } from '@/stores/toastStore';
import { useNotificationStore, type Notification } from '@/stores/notificationStore';
import { Dropdown, DropdownItem, DropdownDivider } from '@/components/ui/Dropdown';
import { NotificationBadge } from '@/components/ui/Badge';
import { cn } from '@/utils/cn';
import { Bell, Menu, Search, LogOut, User, RefreshCw, AlertTriangle, AlertCircle, Info, X, Check, Trash2 } from 'lucide-react';
import { signOut, useSession } from 'next-auth/react';

function NotificationPanel() {
  const router = useRouter();
  const { notifications, markRead, markAllRead, removeNotification, clearAll } = useNotificationStore();
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

  const severityIcon = {
    danger: <AlertTriangle className="h-4 w-4 text-danger" />,
    warning: <AlertCircle className="h-4 w-4 text-warning" />,
    info: <Info className="h-4 w-4 text-gray-400" />,
  };

  function handleNotificationClick(n: Notification) {
    markRead(n.id);
    if (n.href) {
      router.push(n.href);
      setOpen(false);
    }
  }

  function formatDate(dateStr: string) {
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return d.toLocaleDateString('en-AU', { day: '2-digit', month: 'short' });
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="relative rounded-md p-2 text-white/70 hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-white/30"
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
        aria-expanded={open}
      >
        <Bell className="h-5 w-5" />
        <NotificationBadge count={unreadCount} />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 z-50 w-96 rounded-lg border border-border bg-white shadow-xl">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-black">Notifications</h3>
              {unreadCount > 0 && (
                <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-danger px-1.5 text-[10px] font-bold text-white">
                  {unreadCount}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button
                  onClick={markAllRead}
                  className="rounded p-1 text-gray-400 hover:text-black hover:bg-muted transition-colors"
                  title="Mark all as read"
                >
                  <Check className="h-3.5 w-3.5" />
                </button>
              )}
              {notifications.length > 0 && (
                <button
                  onClick={clearAll}
                  className="rounded p-1 text-gray-400 hover:text-danger hover:bg-muted transition-colors"
                  title="Clear all notifications"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Notification list */}
          <div className="max-h-80 overflow-auto">
            {notifications.length === 0 ? (
              <div className="px-4 py-10 text-center">
                <Bell className="mx-auto h-8 w-8 text-gray-200" />
                <p className="mt-2 text-sm text-gray-400">No notifications</p>
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  className={cn(
                    'group flex items-start gap-3 border-b border-border px-4 py-3 last:border-0 transition-colors',
                    !n.read && 'bg-muted/50',
                    n.href && 'cursor-pointer hover:bg-muted'
                  )}
                  onClick={() => handleNotificationClick(n)}
                >
                  <div className="mt-0.5 shrink-0">
                    {severityIcon[n.severity]}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className={cn('text-sm', !n.read ? 'font-medium text-black' : 'text-gray-700')}>
                      {n.message}
                    </p>
                    <p className="mt-0.5 text-[11px] text-gray-400">{formatDate(n.date)}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {!n.read && (
                      <button
                        onClick={(e) => { e.stopPropagation(); markRead(n.id); }}
                        className="rounded p-0.5 text-gray-400 hover:text-black"
                        title="Mark as read"
                      >
                        <Check className="h-3 w-3" />
                      </button>
                    )}
                    <button
                      onClick={(e) => { e.stopPropagation(); removeNotification(n.id); }}
                      className="rounded p-0.5 text-gray-400 hover:text-danger"
                      title="Dismiss"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="border-t border-border px-4 py-2">
              <button
                onClick={() => { router.push('/settings'); setOpen(false); }}
                className="text-xs text-gray-400 hover:text-black transition-colors"
              >
                Notification Settings
              </button>
            </div>
          )}
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
        className="flex h-full items-center px-4 text-white md:hidden focus:outline-none focus:ring-2 focus:ring-white/30"
        aria-label="Open navigation menu"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Right section */}
      <div className="flex flex-1 items-center justify-end gap-2 px-4 md:justify-between">
        {/* Search trigger (opens command palette) */}
        <div className="hidden md:block md:max-w-md md:flex-1 md:px-4" data-tour="header-search">
          <button
            type="button"
            onClick={() => {
              const event = new KeyboardEvent('keydown', { key: 'k', ctrlKey: true, bubbles: true });
              document.dispatchEvent(event);
            }}
            className="flex w-full items-center gap-3 rounded-md border border-white/10 bg-white/5 py-1.5 pl-3 pr-3 text-sm text-white/40 hover:border-white/20 hover:text-white/60 transition-colors"
          >
            <Search className="h-4 w-4" />
            <span className="flex-1 text-left">Search...</span>
            <kbd className="rounded border border-white/10 bg-white/5 px-1.5 py-0.5 text-[10px] font-medium text-white/30">
              Ctrl+K
            </kbd>
          </button>
        </div>

        <div className="flex items-center gap-3">
          {/* Sync button */}
          <button
            onClick={handleSync}
            disabled={syncing}
            className="rounded-md p-2 text-white/70 hover:text-white transition-colors disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-white/30"
            aria-label={syncing ? 'Syncing data...' : 'Sync data to Supabase'}
          >
            <RefreshCw className={cn('h-5 w-5', syncing && 'animate-spin')} />
          </button>

          {/* Notifications */}
          <NotificationPanel />

          {/* User menu */}
          <Dropdown
            align="right"
            trigger={
              <button
                className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-xs font-semibold text-white hover:bg-white/20 transition-colors focus:outline-none focus:ring-2 focus:ring-white/30"
                aria-label="User menu"
              >
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
