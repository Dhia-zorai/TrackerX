"use client";
import { useQuery } from "@tanstack/react-query";
import { useState, useCallback } from "react";

async function fetchMatchPage({ puuid, region, page }) {
  const res = await fetch(
    "/api/riot/matches?" + new URLSearchParams({ puuid, region, count: "10", page: String(page) })
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
  const [page, setPage] = useState(0);
  const [extraMatches, setExtraMatches] = useState([]);
  const [loadingMore, setLoadingMore] = useState(false);

  // Initial fetch — page 0 only
  const matchesQuery = useQuery({
    queryKey: ["matches", puuid, region],
    queryFn: () => fetchMatchPage({ puuid, region, page: 0 }),
    enabled: Boolean(puuid),
    staleTime: 5 * 60 * 1000,
  });

  const source = matchesQuery.data?.source;

  // Henrik path: full match objects in data.matches
  const baseMatches = matchesQuery.data?.matches || [];

  // Riot fallback path: only IDs in data.history
  const riotIds = (matchesQuery.data?.history || []).map(h => h.matchId);

  const riotDetailQuery = useQuery({
    queryKey: ["matchDetails", riotIds.join(","), region],
    queryFn: async () => {
      const results = [];
      for (let i = 0; i < riotIds.length; i += 5) {
        const batch = riotIds.slice(i, i + 5);
        const settled = await Promise.allSettled(
          batch.map(matchId => fetchMatchDetail({ matchId, region }))
        );
        results.push(...settled.map(r => r.status === "fulfilled" ? r.value : null));
      }
      return results;
    },
    enabled: source === "riot_ids" && riotIds.length > 0,
  });

  const isHenrik = source === "henrik";

  // All matches = base page 0 + any lazily loaded extra pages
  const allMatches = isHenrik
    ? [...baseMatches, ...extraMatches]
    : (riotDetailQuery.data || []);

  // hasMore: true if the last page returned a full 10, meaning there could be more
  const lastPageFull = page === 0
    ? (matchesQuery.data?.hasMore ?? baseMatches.length >= 10)
    : extraMatches.length >= 10 && (extraMatches.length % 10 === 0);

  const hasMore = isHenrik ? lastPageFull : riotIds.length > allMatches.length;

  const loadMore = useCallback(async () => {
    if (!puuid || loadingMore || !hasMore) return;
    const nextPage = page + 1;
    setLoadingMore(true);
    try {
      const data = await fetchMatchPage({ puuid, region, page: nextPage });
      const newMatches = data?.matches || [];
      setExtraMatches(prev => [...prev, ...newMatches]);
      setPage(nextPage);
    } catch (e) {
      console.error("[useMatches] loadMore failed:", e.message);
    } finally {
      setLoadingMore(false);
    }
  }, [puuid, region, page, loadingMore, hasMore]);

  const matchListLoading = matchesQuery.isLoading;
  const matchDetailsLoading = !isHenrik && riotDetailQuery.isLoading;

  return {
    matchListLoading,
    matchListError: matchesQuery.error,
    matchDetailsLoading: matchDetailsLoading || loadingMore,
    matchDetailsError: riotDetailQuery.error,
    matches: allMatches,
    matchIds: isHenrik ? allMatches.map(m => m.matchId) : riotIds,
    loadMore,
    hasMore,
    refetch: () => {
      setExtraMatches([]);
      setPage(0);
      matchesQuery.refetch();
    },
    source,
  };
}
