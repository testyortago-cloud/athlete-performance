'use client';

import { useEffect, useRef } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { useDashboardStore } from '@/stores/dashboardStore';

export function useDashboardFilters() {
  const {
    dateRange,
    sportIds,
    athleteIds,
    positions,
    crossFilter,
    setDateRange,
    setSportIds,
    setAthleteIds,
    setPositions,
    setCrossFilter,
    clearCrossFilter,
    clearAllFilters,
  } = useDashboardStore();

  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const initialized = useRef(false);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Read filters from URL on mount
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    const preset = searchParams.get('preset');
    const sports = searchParams.get('sports');
    const athletes = searchParams.get('athletes');

    if (preset && ['last7', 'last30', 'last90', 'season'].includes(preset)) {
      const now = new Date();
      let start: Date;
      switch (preset) {
        case 'last7': start = new Date(now.getTime() - 7 * 86400000); break;
        case 'last30': start = new Date(now.getTime() - 30 * 86400000); break;
        case 'last90': start = new Date(now.getTime() - 90 * 86400000); break;
        case 'season': start = new Date(now.getFullYear(), 0, 1); break;
        default: start = now;
      }
      setDateRange({
        start: start.toISOString().split('T')[0],
        end: now.toISOString().split('T')[0],
        preset: preset as 'last7' | 'last30' | 'last90' | 'season',
      });
    }

    if (sports) setSportIds(sports.split(','));
    if (athletes) setAthleteIds(athletes.split(','));
  }, [searchParams, setDateRange, setSportIds, setAthleteIds]);

  // Debounced write to URL on change
  useEffect(() => {
    if (!initialized.current) return;

    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    debounceTimer.current = setTimeout(() => {
      const params = new URLSearchParams();
      if (dateRange.preset) params.set('preset', dateRange.preset);
      if (sportIds.length > 0) params.set('sports', sportIds.join(','));
      if (athleteIds.length > 0) params.set('athletes', athleteIds.join(','));

      const queryString = params.toString();
      const newUrl = queryString ? `${pathname}?${queryString}` : pathname;

      router.replace(newUrl, { scroll: false });
    }, 300);

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [dateRange.preset, sportIds, athleteIds, pathname, router]);

  const activeFilterCount =
    (dateRange.preset ? 1 : 0) +
    sportIds.length +
    athleteIds.length +
    positions.length;

  return {
    dateRange,
    sportIds,
    athleteIds,
    positions,
    crossFilter,
    activeFilterCount,
    setDateRange,
    setSportIds,
    setAthleteIds,
    setPositions,
    setCrossFilter,
    clearCrossFilter,
    clearAllFilters,
  };
}
