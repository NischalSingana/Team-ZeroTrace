import { create } from "zustand";
import { persist } from "zustand/middleware";

interface UIState {
  sidebarCollapsed: boolean;
  liveFeedActive: boolean;
  selectedSourceId: string | null;
  searchQuery: string;
  _hasHydrated: boolean;
  // Actions
  toggleSidebar: () => void;
  setSidebarCollapsed: (v: boolean) => void;
  toggleLiveFeed: () => void;
  setLiveFeedActive: (v: boolean) => void;
  setSelectedSourceId: (id: string | null) => void;
  setSearchQuery: (q: string) => void;
  setHasHydrated: (state: boolean) => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      sidebarCollapsed: false,
      liveFeedActive: false,
      selectedSourceId: null,
      searchQuery: "",
      _hasHydrated: false,
      toggleSidebar: () =>
        set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
      setSidebarCollapsed: (v) => set({ sidebarCollapsed: v }),
      toggleLiveFeed: () => set((s) => ({ liveFeedActive: !s.liveFeedActive })),
      setLiveFeedActive: (v) => set({ liveFeedActive: v }),
      setSelectedSourceId: (id) => set({ selectedSourceId: id }),
      setSearchQuery: (q) => set({ searchQuery: q }),
      setHasHydrated: (state) => set({ _hasHydrated: state }),
    }),
    {
      name: "ulpf-ui-state",
      partialize: (s) => ({
        sidebarCollapsed: s.sidebarCollapsed,
        liveFeedActive: s.liveFeedActive,
      }),
      skipHydration: true,
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
