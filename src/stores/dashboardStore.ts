import { create } from 'zustand';

interface DateRange {
  start: string | null;
  end: string | null;
  preset: 'last7' | 'last30' | 'last90' | 'season' | 'custom' | null;
}

interface DashboardState {
  dateRange: DateRange;
  sportIds: string[];
  athleteIds: string[];
  positions: string[];
  crossFilter: {
    source: string | null;
    field: string | null;
    value: string | null;
  };
  setDateRange: (range: DateRange) => void;
  setSportIds: (ids: string[]) => void;
  setAthleteIds: (ids: string[]) => void;
  setPositions: (positions: string[]) => void;
  setCrossFilter: (source: string | null, field: string | null, value: string | null) => void;
  clearCrossFilter: () => void;
  clearAllFilters: () => void;
}

export const useDashboardStore = create<DashboardState>()((set) => ({
  dateRange: { start: null, end: null, preset: null },
  sportIds: [],
  athleteIds: [],
  positions: [],
  crossFilter: { source: null, field: null, value: null },

  setDateRange: (range) => set({ dateRange: range }),
  setSportIds: (ids) => set({ sportIds: ids }),
  setAthleteIds: (ids) => set({ athleteIds: ids }),
  setPositions: (positions) => set({ positions }),
  setCrossFilter: (source, field, value) =>
    set({ crossFilter: { source, field, value } }),
  clearCrossFilter: () =>
    set({ crossFilter: { source: null, field: null, value: null } }),
  clearAllFilters: () =>
    set({
      dateRange: { start: null, end: null, preset: null },
      sportIds: [],
      athleteIds: [],
      positions: [],
      crossFilter: { source: null, field: null, value: null },
    }),
}));
