import { create } from "zustand";
import { persist } from "zustand/middleware";

interface UIState {
  sidebarCollapsed: boolean;
  liveFeedActive: boolean;
  selectedSourceId: string | null;
  searchQuery: string;
  // Actions
  toggleSidebar: () => void;
  setSidebarCollapsed: (v: boolean) => void;
  toggleLiveFeed: () => void;
  setLiveFeedActive: (v: boolean) => void;
  setSelectedSourceId: (id: string | null) => void;
  setSearchQuery: (q: string) => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      sidebarCollapsed: false,
      liveFeedActive: true,
      selectedSourceId: null,
      searchQuery: "",
      toggleSidebar: () =>
        set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
      setSidebarCollapsed: (v) => set({ sidebarCollapsed: v }),
      toggleLiveFeed: () => set((s) => ({ liveFeedActive: !s.liveFeedActive })),
      setLiveFeedActive: (v) => set({ liveFeedActive: v }),
      setSelectedSourceId: (id) => set({ selectedSourceId: id }),
      setSearchQuery: (q) => set({ searchQuery: q }),
    }),
    {
      name: "ulpf-ui-state",
      partialize: (s) => ({
        sidebarCollapsed: s.sidebarCollapsed,
        liveFeedActive: s.liveFeedActive,
      }),
    }
  )
);
