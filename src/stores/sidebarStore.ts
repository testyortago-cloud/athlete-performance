import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SidebarState {
  isCollapsed: boolean;
  isMobileOpen: boolean;
  expandedItems: string[];
  toggleCollapse: () => void;
  setCollapsed: (collapsed: boolean) => void;
  toggleMobileMenu: () => void;
  closeMobileMenu: () => void;
  toggleExpandedItem: (item: string) => void;
  isItemExpanded: (item: string) => boolean;
}

export const useSidebarStore = create<SidebarState>()(
  persist(
    (set, get) => ({
      isCollapsed: false,
      isMobileOpen: false,
      expandedItems: [],

      toggleCollapse: () => set((state) => ({ isCollapsed: !state.isCollapsed })),

      setCollapsed: (collapsed: boolean) => set({ isCollapsed: collapsed }),

      toggleMobileMenu: () => set((state) => ({ isMobileOpen: !state.isMobileOpen })),

      closeMobileMenu: () => set({ isMobileOpen: false }),

      toggleExpandedItem: (item: string) =>
        set((state) => ({
          expandedItems: state.expandedItems.includes(item)
            ? state.expandedItems.filter((i) => i !== item)
            : [...state.expandedItems, item],
        })),

      isItemExpanded: (item: string) => get().expandedItems.includes(item),
    }),
    {
      name: 'djp-sidebar',
      partialize: (state) => ({
        isCollapsed: state.isCollapsed,
        expandedItems: state.expandedItems,
      }),
    }
  )
);
