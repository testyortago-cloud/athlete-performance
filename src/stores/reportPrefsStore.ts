import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ReportFrequency = 'daily' | 'weekly' | 'monthly';

export type ReportSection = 'kpis' | 'riskAlerts' | 'injuries' | 'loadTrends' | 'topPerformers';

export const REPORT_SECTION_LABELS: Record<ReportSection, string> = {
  kpis: 'Key Performance Indicators',
  riskAlerts: 'Risk Alerts & Warnings',
  injuries: 'Active Injuries Summary',
  loadTrends: 'Training Load Trends',
  topPerformers: 'Top Performers',
};

const ALL_SECTIONS: ReportSection[] = Object.keys(REPORT_SECTION_LABELS) as ReportSection[];

interface ReportPrefsState {
  enabled: boolean;
  frequency: ReportFrequency;
  recipients: string[];
  sections: ReportSection[];
  setEnabled: (enabled: boolean) => void;
  setFrequency: (frequency: ReportFrequency) => void;
  addRecipient: (email: string) => void;
  removeRecipient: (email: string) => void;
  toggleSection: (section: ReportSection) => void;
  resetAll: () => void;
}

export const useReportPrefsStore = create<ReportPrefsState>()(
  persist(
    (set) => ({
      enabled: false,
      frequency: 'weekly',
      recipients: [],
      sections: [...ALL_SECTIONS],
      setEnabled: (enabled) => set({ enabled }),
      setFrequency: (frequency) => set({ frequency }),
      addRecipient: (email) =>
        set((state) => ({
          recipients: state.recipients.includes(email)
            ? state.recipients
            : [...state.recipients, email],
        })),
      removeRecipient: (email) =>
        set((state) => ({
          recipients: state.recipients.filter((r) => r !== email),
        })),
      toggleSection: (section) =>
        set((state) => ({
          sections: state.sections.includes(section)
            ? state.sections.filter((s) => s !== section)
            : [...state.sections, section],
        })),
      resetAll: () =>
        set({
          enabled: false,
          frequency: 'weekly',
          recipients: [],
          sections: [...ALL_SECTIONS],
        }),
    }),
    { name: 'djp-report-prefs' },
  ),
);

export { ALL_SECTIONS };
