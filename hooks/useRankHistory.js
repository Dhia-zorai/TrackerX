"use client";
import { useMemo } from "react";

// Since the Riot API does not expose rank/RR for arbitrary players,
// this hook generates rank history from ACS trend in match data.
// Replace with RSO-authenticated rank endpoint when available.
export function useRankHistory(matchStats) {
  const data = useMemo(() => {
    if (!matchStats || matchStats.length === 0) return [];
    return [...matchStats]
      .reverse()
      .map((s, i) => ({
        game: i + 1,
        acs: s ? s.acs : 0,
        kd: s ? s.kd : 0,
        won: s ? s.won : false,
      }));
  }, [matchStats]);

  return { data };
}