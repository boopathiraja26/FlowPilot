import { create } from "zustand";

interface UIState {
  isSidebarCollapsed: boolean;
  isMobileSidebarOpen: boolean;
  hasHydratedSidebarPreference: boolean;
  hydrateSidebarPreference: () => void;
  toggleSidebarCollapsed: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  toggleMobileSidebar: () => void;
  setMobileSidebarOpen: (open: boolean) => void;
  closeMobileSidebar: () => void;
}

const SIDEBAR_COLLAPSED_KEY = "flowpilot_sidebar_collapsed";

function readStoredSidebarCollapsed(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === "1";
  } catch {
    return false;
  }
}

function persistSidebarCollapsed(collapsed: boolean) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(SIDEBAR_COLLAPSED_KEY, collapsed ? "1" : "0");
  } catch {
    // ignore storage failures
  }
}

export const useUIStore = create<UIState>((set) => ({
  isSidebarCollapsed: false,
  isMobileSidebarOpen: false,
  hasHydratedSidebarPreference: false,
  hydrateSidebarPreference: () =>
    set((state) => {
      if (state.hasHydratedSidebarPreference) return state;
      return {
        isSidebarCollapsed: readStoredSidebarCollapsed(),
        hasHydratedSidebarPreference: true,
      };
    }),
  toggleSidebarCollapsed: () =>
    set((state) => {
      const next = !state.isSidebarCollapsed;
      persistSidebarCollapsed(next);
      return { isSidebarCollapsed: next };
    }),
  setSidebarCollapsed: (collapsed) =>
    set(() => {
      persistSidebarCollapsed(collapsed);
      return { isSidebarCollapsed: collapsed };
    }),
  toggleMobileSidebar: () =>
    set((state) => ({ isMobileSidebarOpen: !state.isMobileSidebarOpen })),
  setMobileSidebarOpen: (open) => set({ isMobileSidebarOpen: open }),
  closeMobileSidebar: () => set({ isMobileSidebarOpen: false }),
}));
