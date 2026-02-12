import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type NotificationType = 'risk' | 'load-spike' | 'injury' | 'info';

export interface Notification {
  id: string;
  message: string;
  severity: 'warning' | 'danger' | 'info';
  type: NotificationType;
  date: string;
  read: boolean;
  athleteName?: string;
  href?: string;
}

interface NotificationState {
  notifications: Notification[];
  setNotifications: (notifications: Notification[]) => void;
  addNotification: (notification: Notification) => void;
  markRead: (id: string) => void;
  markAllRead: () => void;
  removeNotification: (id: string) => void;
  clearAll: () => void;
  unreadCount: () => number;
}

export const useNotificationStore = create<NotificationState>()(
  persist(
    (set, get) => ({
      notifications: [],
      setNotifications: (notifications) => set({ notifications }),
      addNotification: (notification) =>
        set((state) => {
          // Avoid duplicates by id
          if (state.notifications.some((n) => n.id === notification.id)) return state;
          return { notifications: [notification, ...state.notifications].slice(0, 50) };
        }),
      markRead: (id) =>
        set((state) => ({
          notifications: state.notifications.map((n) =>
            n.id === id ? { ...n, read: true } : n
          ),
        })),
      markAllRead: () =>
        set((state) => ({
          notifications: state.notifications.map((n) => ({ ...n, read: true })),
        })),
      removeNotification: (id) =>
        set((state) => ({
          notifications: state.notifications.filter((n) => n.id !== id),
        })),
      clearAll: () => set({ notifications: [] }),
      unreadCount: () => get().notifications.filter((n) => !n.read).length,
    }),
    { name: 'djp-notifications' },
  ),
);
