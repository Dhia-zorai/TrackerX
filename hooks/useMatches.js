"use client";
import { useQuery } from "@tanstack/react-query";
import { useState, useCallback } from "react";

async function fetchMatchPage({ puuid, region, page, name, tag }) {
  const params = { puuid, region, count: "10", page: String(page) };
  // name+tag required for page > 0 (lifetime endpoint)
  if (page > 0 && name && tag) {
    params.name = name;
    params.tag = tag;
  }
  const res = await fetch(
    "/api/riot/matches?" + new URLSearchParams(params)
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

export function useMatches(puuid, region = "na", name = "", tag = "") {
  const [page, setPage] = useState(0);
  const [extraMatches, setExtraMatches] = useState([]);
  const [loadingMore, setLoadingMore] = useState(false);
  // Track hasMore explicitly from API responses — avoids stale-closure inference bugs
  const [hasMoreState, setHasMoreState] = useState(true);

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

  // For page 0, derive hasMore from the API's own hasMore field.
  // For subsequent pages, hasMoreState is set explicitly after each loadMore response.
  const hasMore = isHenrik
    ? (page === 0 ? (matchesQuery.data?.hasMore ?? baseMatches.length >= 10) : hasMoreState)
    : riotIds.length > allMatches.length;

  const loadMore = useCallback(async () => {
    if (!puuid || loadingMore) return;
    const nextPage = page + 1;
    setLoadingMore(true);
    try {
      const data = await fetchMatchPage({ puuid, region, page: nextPage, name, tag });
      const newMatches = data?.matches || [];
      console.log(`[useMatches] loadMore page=${nextPage} got ${newMatches.length} matches`);
      setExtraMatches(prev => {
        const existingIds = new Set([
          ...baseMatches.map(m => m.matchId),
          ...prev.map(m => m.matchId),
        ]);
        const deduped = newMatches.filter(m => m.matchId && !existingIds.has(m.matchId));
        console.log(`[useMatches] deduped=${deduped.length} (from ${newMatches.length} new, ${existingIds.size} existing)`);
        return [...prev, ...deduped];
      });
      // Set hasMore directly from what the API told us
      setHasMoreState(data?.hasMore ?? newMatches.length >= 10);
      setPage(nextPage);
    } catch (e) {
      console.error("[useMatches] loadMore failed:", e.message);
    } finally {
      setLoadingMore(false);
    }
  }, [puuid, region, page, loadingMore, baseMatches, name, tag]);

  const matchListLoading = matchesQuery.isLoading;
  const matchDetailsLoading = !isHenrik && riotDetailQuery.isLoading;

  return {
    matchListLoading,
    matchListError: matchesQuery.error,
    // loadingMore is intentionally NOT included here — it must not trigger
    // the full-page loading state which would hide existing match cards
    matchDetailsLoading,
    matchDetailsError: riotDetailQuery.error,
    matches: allMatches,
    matchIds: isHenrik ? allMatches.map(m => m.matchId) : riotIds,
    loadMore,
    hasMore,
    loadingMore,
    refetch: () => {
      setExtraMatches([]);
      setPage(0);
      setHasMoreState(true);
      matchesQuery.refetch();
    },
    source,
  };
}
