import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type WidgetKey =
  | 'welcome'
  | 'kpis'
  | 'injuryByRegion'
  | 'injuryByType'
  | 'loadTrend'
  | 'riskOverview'
  | 'alerts';

export const WIDGET_LABELS: Record<WidgetKey, string> = {
  welcome: 'Welcome Banner',
  kpis: 'KPI Cards',
  injuryByRegion: 'Injuries by Body Region',
  injuryByType: 'Injuries by Type',
  loadTrend: 'Team Load Trend',
  riskOverview: 'Risk Overview (ACWR)',
  alerts: 'Alerts Panel',
};

const ALL_WIDGETS: WidgetKey[] = Object.keys(WIDGET_LABELS) as WidgetKey[];

interface WidgetState {
  hidden: WidgetKey[];
  isVisible: (key: WidgetKey) => boolean;
  toggle: (key: WidgetKey) => void;
  resetAll: () => void;
}

export const useWidgetStore = create<WidgetState>()(
  persist(
    (set, get) => ({
      hidden: [],
      isVisible: (key) => !get().hidden.includes(key),
      toggle: (key) =>
        set((state) => ({
          hidden: state.hidden.includes(key)
            ? state.hidden.filter((k) => k !== key)
            : [...state.hidden, key],
        })),
      resetAll: () => set({ hidden: [] }),
    }),
    { name: 'djp-dashboard-widgets' },
  ),
);

export { ALL_WIDGETS };
