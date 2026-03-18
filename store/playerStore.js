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

      // Region (defaults to na, but client will override based on timezone, then language)
      region: "na",
      setRegion: (region) => set({ region }),
      initializeRegion: () => {
        // Only runs on client side
        if (typeof window === "undefined") return;

        // Priority 1: Timezone detection (most reliable for English speakers outside NA)
        try {
          const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
          
          // EU timezones (includes North Africa which uses EU servers)
          const euTzs = [
            "Europe/London", "Europe/Dublin", "Europe/Lisbon", "Europe/Paris", "Europe/Berlin", "Europe/Amsterdam", 
            "Europe/Brussels", "Europe/Vienna", "Europe/Prague", "Europe/Warsaw", "Europe/Budapest", "Europe/Bucharest", 
            "Europe/Sofia", "Europe/Athens", "Europe/Helsinki", "Europe/Stockholm", "Europe/Copenhagen", "Europe/Madrid", 
            "Europe/Rome", "Europe/Zurich", "Europe/Istanbul", "Europe/Moscow", "Europe/Kiev", "Europe/Minsk", 
            "Europe/Riga", "Europe/Tallinn", "Europe/Vilnius", "Europe/Chisinau", "Europe/Malta", "Africa/Tunis", 
            "Africa/Cairo", "Africa/Johannesburg", "Africa/Lagos", "Africa/Casablanca", "Africa/Nairobi"
          ];

          // Asia-Pacific timezones
          const apTzs = [
            "Asia/Shanghai", "Asia/Hong_Kong", "Asia/Singapore", "Asia/Bangkok", "Asia/Jakarta", "Asia/Manila",
            "Asia/Kolkata", "Asia/Karachi", "Asia/Kabul", "Asia/Dubai", "Asia/Baghdad", "Asia/Tehran",
            "Australia/Sydney", "Australia/Melbourne", "Australia/Brisbane", "Australia/Perth", "Australia/Darwin",
            "Pacific/Auckland", "Pacific/Fiji", "Pacific/Tongatapu"
          ];

          // Korea
          const krTzs = ["Asia/Seoul"];

          if (euTzs.includes(tz)) {
            set({ region: "eu" });
            return;
          }
          if (krTzs.includes(tz)) {
            set({ region: "kr" });
            return;
          }
          if (apTzs.includes(tz)) {
            set({ region: "ap" });
            return;
          }
        } catch (e) {
          // Timezone detection failed, fall back to language
        }

        // Priority 2: Browser language fallback
        const lang = navigator.language || navigator.languages?.[0] || "en-US";
        const euLangs = ["de", "fr", "it", "es", "pt", "nl", "pl", "ru", "tr", "uk", "sv", "da", "fi", "no", "cs", "hu", "ro", "el", "sk"];
        const langCode = lang.split("-")[0].toLowerCase();
        if (euLangs.includes(langCode)) {
          set({ region: "eu" });
          return;
        }

        // Default: NA (implicit, already set in initial state)
      },

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