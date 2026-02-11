'use client';

import { useState, useRef, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useDashboardFilters } from '@/hooks/useDashboardFilters';
import { X, Filter, ChevronDown } from 'lucide-react';
import { cn } from '@/utils/cn';
import type { Sport, Athlete } from '@/types';

interface FilterBarProps {
  sports: Sport[];
  athletes: Athlete[];
}

const DATE_PRESETS = [
  { label: '7d', value: 'last7' as const },
  { label: '30d', value: 'last30' as const },
  { label: '90d', value: 'last90' as const },
  { label: 'Season', value: 'season' as const },
];

function MultiSelect({
  label,
  options,
  selected,
  onChange,
  searchable = false,
}: {
  label: string;
  options: { id: string; name: string }[];
  selected: string[];
  onChange: (ids: string[]) => void;
  searchable?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setSearch('');
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function toggle(id: string) {
    onChange(
      selected.includes(id) ? selected.filter((s) => s !== id) : [...selected, id]
    );
  }

  const filteredOptions = search
    ? options.filter((opt) => opt.name.toLowerCase().includes(search.toLowerCase()))
    : options;

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={cn(
          'flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm transition-colors',
          selected.length > 0
            ? 'border-black bg-black/5 text-black'
            : 'border-border text-gray-600 hover:border-gray-400'
        )}
      >
        {label}
        {selected.length > 0 && (
          <Badge variant="default" className="ml-1 px-1.5 py-0 text-[10px]">
            {selected.length}
          </Badge>
        )}
        <ChevronDown className="h-3.5 w-3.5" />
      </button>

      {open && (
        <div className="absolute top-full left-0 z-50 mt-1 w-56 rounded-md border border-border bg-white shadow-lg">
          {searchable && (
            <div className="border-b border-border p-2">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search..."
                className="w-full rounded border border-border px-2 py-1 text-sm focus:border-black focus:outline-none"
                autoFocus
              />
            </div>
          )}
          <div className="max-h-60 overflow-auto">
            {filteredOptions.map((opt) => (
              <label
                key={opt.id}
                className="flex cursor-pointer items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50"
              >
                <input
                  type="checkbox"
                  checked={selected.includes(opt.id)}
                  onChange={() => toggle(opt.id)}
                  className="rounded border-gray-300"
                />
                <span className="text-black">{opt.name}</span>
              </label>
            ))}
            {filteredOptions.length === 0 && (
              <p className="px-3 py-2 text-sm text-gray-400">
                {search ? 'No matches' : 'No options'}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export function FilterBar({ sports, athletes }: FilterBarProps) {
  const {
    dateRange,
    sportIds,
    athleteIds,
    activeFilterCount,
    setDateRange,
    setSportIds,
    setAthleteIds,
    clearAllFilters,
  } = useDashboardFilters();

  function handlePreset(preset: 'last7' | 'last30' | 'last90' | 'season') {
    const now = new Date();
    let start: Date;

    switch (preset) {
      case 'last7':
        start = new Date(now.getTime() - 7 * 86400000);
        break;
      case 'last30':
        start = new Date(now.getTime() - 30 * 86400000);
        break;
      case 'last90':
        start = new Date(now.getTime() - 90 * 86400000);
        break;
      case 'season':
        start = new Date(now.getFullYear(), 0, 1);
        break;
    }

    setDateRange({
      start: start.toISOString().split('T')[0],
      end: now.toISOString().split('T')[0],
      preset,
    });
  }

  return (
    <Card padding="sm" className="mb-6">
      <div className="flex flex-wrap items-center gap-3">
        <Filter className="h-4 w-4 text-gray-400" />

        {/* Date presets */}
        <div className="flex items-center gap-1">
          {DATE_PRESETS.map((p) => (
            <button
              key={p.value}
              type="button"
              onClick={() => handlePreset(p.value)}
              className={cn(
                'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                dateRange.preset === p.value
                  ? 'bg-black text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              )}
            >
              {p.label}
            </button>
          ))}
        </div>

        <div className="h-5 w-px bg-border" />

        {/* Sport filter */}
        <MultiSelect
          label="Sport"
          options={sports}
          selected={sportIds}
          onChange={setSportIds}
        />

        {/* Athlete filter */}
        <MultiSelect
          label="Athlete"
          options={athletes.map((a) => ({ id: a.id, name: a.name }))}
          selected={athleteIds}
          onChange={setAthleteIds}
          searchable
        />

        {/* Clear all */}
        {activeFilterCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearAllFilters}
            icon={<X className="h-3.5 w-3.5" />}
          >
            Clear ({activeFilterCount})
          </Button>
        )}
      </div>
    </Card>
  );
}
