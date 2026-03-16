"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";

export const usePlayerStore = create(
  persist(
    (set, get) => ({
      // Recent searches
      recentSearches: [],
      addRecentSearch: (riotId, region) => {
        const searches = get().recentSearches;
        const entry = { riotId, region, timestamp: Date.now() };
        const filtered = searches.filter(s => s.riotId !== riotId);
        set({ recentSearches: [entry, ...filtered].slice(0, 8) });
      },
      removeRecentSearch: (riotId) => {
        set({ recentSearches: get().recentSearches.filter(s => s.riotId !== riotId) });
      },
      clearRecentSearches: () => set({ recentSearches: [] }),

      // Region
      region: "na",
      setRegion: (region) => set({ region }),

      // Theme
      theme: "dark",
      toggleTheme: () => set(s => ({ theme: s.theme === "dark" ? "light" : "dark" })),
      setTheme: (theme) => set({ theme }),

      // Current player (for quick access)
      currentPlayer: null,
      setCurrentPlayer: (player) => set({ currentPlayer: player }),
    }),
    {
      name: "trackerx-store",
      partialize: (state) => ({
        recentSearches: state.recentSearches,
        region: state.region,
        theme: state.theme,
      }),
    }
  )
);