'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
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
  Search,
  ArrowRight,
} from 'lucide-react';

interface CommandItem {
  id: string;
  label: string;
  description?: string;
  href: string;
  icon: React.ReactNode;
  section: string;
}

const PAGES: CommandItem[] = [
  { id: 'dashboard', label: 'Dashboard', href: '/dashboard', icon: <LayoutDashboard className="h-4 w-4" />, section: 'Pages' },
  { id: 'athletes', label: 'Athletes', href: '/athletes', icon: <Users className="h-4 w-4" />, section: 'Pages' },
  { id: 'sports', label: 'Sports', href: '/sports', icon: <Trophy className="h-4 w-4" />, section: 'Pages' },
  { id: 'programs', label: 'Programs', href: '/programs', icon: <BookOpen className="h-4 w-4" />, section: 'Pages' },
  { id: 'testing', label: 'Testing', href: '/testing', icon: <ClipboardList className="h-4 w-4" />, section: 'Pages' },
  { id: 'injuries', label: 'Injuries', href: '/injuries', icon: <HeartPulse className="h-4 w-4" />, section: 'Pages' },
  { id: 'load-monitoring', label: 'Load Monitoring', href: '/load-monitoring', icon: <Activity className="h-4 w-4" />, section: 'Pages' },
  { id: 'comparisons', label: 'Comparisons', href: '/analytics/comparisons', icon: <BarChart3 className="h-4 w-4" />, section: 'Pages' },
  { id: 'risk', label: 'Risk Analysis', href: '/analytics/risk', icon: <BarChart3 className="h-4 w-4" />, section: 'Pages' },
  { id: 'settings', label: 'Settings', href: '/settings', icon: <Settings className="h-4 w-4" />, section: 'Pages' },
];

export function CommandPalette() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [athletes, setAthletes] = useState<CommandItem[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Fetch athletes for search
  useEffect(() => {
    if (!open) return;
    fetch('/api/athletes-search')
      .then((r) => r.ok ? r.json() : [])
      .then((data: { id: string; name: string; sportName?: string }[]) => {
        setAthletes(
          data.map((a) => ({
            id: `athlete-${a.id}`,
            label: a.name,
            description: a.sportName || '',
            href: `/athletes/${a.id}`,
            icon: <Users className="h-4 w-4" />,
            section: 'Athletes',
          }))
        );
      })
      .catch(() => {});
  }, [open]);

  const allItems = useMemo(() => [...PAGES, ...athletes], [athletes]);

  const filtered = useMemo(() => {
    if (!query.trim()) return PAGES;
    const q = query.toLowerCase();
    return allItems.filter(
      (item) =>
        item.label.toLowerCase().includes(q) ||
        (item.description && item.description.toLowerCase().includes(q))
    );
  }, [query, allItems]);

  const groupedItems = useMemo(() => {
    const groups: Record<string, CommandItem[]> = {};
    for (const item of filtered) {
      if (!groups[item.section]) groups[item.section] = [];
      groups[item.section].push(item);
    }
    return groups;
  }, [filtered]);

  // Reset selection when query changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // Keyboard shortcut to open
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setOpen(true);
      }
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Focus input when opened
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 0);
    } else {
      setQuery('');
      setSelectedIndex(0);
    }
  }, [open]);

  const navigate = useCallback(
    (href: string) => {
      setOpen(false);
      router.push(href);
    },
    [router]
  );

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => Math.min(prev + 1, filtered.length - 1));
      scrollToIndex(selectedIndex + 1);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => Math.max(prev - 1, 0));
      scrollToIndex(selectedIndex - 1);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filtered[selectedIndex]) {
        navigate(filtered[selectedIndex].href);
      }
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  }

  function scrollToIndex(index: number) {
    const el = listRef.current?.querySelector(`[data-index="${index}"]`);
    el?.scrollIntoView({ block: 'nearest' });
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center pt-[15vh]">
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        onClick={() => setOpen(false)}
      />
      <div className="relative z-[61] w-full max-w-lg rounded-xl border border-border bg-white shadow-2xl">
        {/* Search input */}
        <div className="flex items-center gap-3 border-b border-border px-4 py-3">
          <Search className="h-5 w-5 shrink-0 text-gray-400" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search pages, athletes..."
            className="flex-1 bg-transparent text-sm text-black placeholder:text-gray-400 focus:outline-none"
          />
          <kbd className="hidden sm:inline-flex h-5 items-center rounded border border-border bg-muted px-1.5 text-[10px] font-medium text-gray-500">
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div ref={listRef} className="max-h-72 overflow-auto p-2">
          {filtered.length === 0 ? (
            <p className="px-3 py-6 text-center text-sm text-gray-400">
              No results found
            </p>
          ) : (
            Object.entries(groupedItems).map(([section, items]) => (
              <div key={section}>
                <p className="px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-gray-400">
                  {section}
                </p>
                {items.map((item) => {
                  const globalIndex = filtered.indexOf(item);
                  return (
                    <button
                      key={item.id}
                      data-index={globalIndex}
                      onClick={() => navigate(item.href)}
                      onMouseEnter={() => setSelectedIndex(globalIndex)}
                      className={cn(
                        'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors',
                        globalIndex === selectedIndex
                          ? 'bg-black text-white'
                          : 'text-black hover:bg-muted'
                      )}
                    >
                      <span className={cn(
                        'shrink-0',
                        globalIndex === selectedIndex ? 'text-white' : 'text-gray-400'
                      )}>
                        {item.icon}
                      </span>
                      <span className="flex-1 text-left">
                        <span className="font-medium">{item.label}</span>
                        {item.description && (
                          <span className={cn(
                            'ml-2 text-xs',
                            globalIndex === selectedIndex ? 'text-white/60' : 'text-gray-400'
                          )}>
                            {item.description}
                          </span>
                        )}
                      </span>
                      {globalIndex === selectedIndex && (
                        <ArrowRight className="h-3.5 w-3.5 shrink-0 text-white/60" />
                      )}
                    </button>
                  );
                })}
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center gap-4 border-t border-border px-4 py-2">
          <div className="flex items-center gap-1 text-[10px] text-gray-400">
            <kbd className="rounded border border-border bg-muted px-1 py-0.5 text-[10px]">↑↓</kbd>
            Navigate
          </div>
          <div className="flex items-center gap-1 text-[10px] text-gray-400">
            <kbd className="rounded border border-border bg-muted px-1 py-0.5 text-[10px]">↵</kbd>
            Open
          </div>
        </div>
      </div>
    </div>
  );
}
