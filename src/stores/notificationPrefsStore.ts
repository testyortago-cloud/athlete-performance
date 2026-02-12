import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface NotificationPrefs {
  highRiskAlerts: boolean;
  loadSpikeAlerts: boolean;
  injuryUpdates: boolean;
  weeklyDigest: boolean;
}

const DEFAULT_PREFS: NotificationPrefs = {
  highRiskAlerts: true,
  loadSpikeAlerts: true,
  injuryUpdates: false,
  weeklyDigest: false,
};

interface NotificationPrefsState extends NotificationPrefs {
  toggle: (key: keyof NotificationPrefs) => void;
  resetAll: () => void;
}

export const useNotificationPrefsStore = create<NotificationPrefsState>()(
  persist(
    (set) => ({
      ...DEFAULT_PREFS,
      toggle: (key) => set((state) => ({ [key]: !state[key] })),
      resetAll: () => set(DEFAULT_PREFS),
    }),
    { name: 'djp-notification-prefs' },
  ),
);

export { DEFAULT_PREFS as DEFAULT_NOTIFICATION_PREFS };
