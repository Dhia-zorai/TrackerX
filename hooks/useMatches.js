"use client";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

async function fetchMatches({ puuid, region, count }) {
  const res = await fetch(
    "/api/riot/matches?" + new URLSearchParams({ puuid, region, count: String(count) })
  );
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to fetch matches");
  return data;
}

async function fetchMatchDetail({ matchId, region }) {
  const res = await fetch(
    "/api/riot/match?" + new URLSearchParams({ matchId, region })
  );
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to fetch match");
  return data;
}

export function useMatches(puuid, region = "na") {
  const [visibleCount, setVisibleCount] = useState(10);

  // Single fetch — Henrik returns full match objects; Riot returns IDs only
  const matchesQuery = useQuery({
    queryKey: ["matches", puuid, region],
    queryFn: () => fetchMatches({ puuid, region, count: 10 }),
    enabled: Boolean(puuid),
    staleTime: 5 * 60 * 1000,
  });

  const source = matchesQuery.data?.source;

  // Henrik path: full match objects already in data.matches
  const fullMatches = matchesQuery.data?.matches || [];

  // Riot fallback path: only IDs in data.history — fetch details per match
  const riotIds = (matchesQuery.data?.history || []).map(h => h.matchId);
  const visibleRiotIds = riotIds.slice(0, visibleCount);

  const riotDetailQuery = useQuery({
    queryKey: ["matchDetails", visibleRiotIds.join(","), region],
    queryFn: async () => {
      const results = [];
      for (let i = 0; i < visibleRiotIds.length; i += 5) {
        const batch = visibleRiotIds.slice(i, i + 5);
        const settled = await Promise.allSettled(
          batch.map(matchId => fetchMatchDetail({ matchId, region }))
        );
        results.push(...settled.map(r => r.status === "fulfilled" ? r.value : null));
      }
      return results;
    },
    enabled: source === "riot_ids" && visibleRiotIds.length > 0,
  });

  // Determine which matches to expose
  const isHenrik = source === "henrik";
  const visibleMatches = isHenrik
    ? fullMatches.slice(0, visibleCount)
    : (riotDetailQuery.data || []);

  const loadMore = () => setVisibleCount(c => c + 10);
  const hasMore = isHenrik
    ? fullMatches.length > visibleCount
    : riotIds.length > visibleCount;

  const matchListLoading = matchesQuery.isLoading;
  const matchDetailsLoading = !isHenrik && riotDetailQuery.isLoading;

  return {
    matchListLoading,
    matchListError: matchesQuery.error,
    matchDetailsLoading,
    matchDetailsError: riotDetailQuery.error,
    matches: visibleMatches,
    matchIds: isHenrik ? fullMatches.map(m => m.matchId) : riotIds,
    loadMore,
    hasMore,
    refetch: matchesQuery.refetch,
    source,
  };
}
