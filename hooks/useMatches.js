"use client";
import { useQuery } from "@tanstack/react-query";
import { useState, useCallback, useEffect, useRef } from "react";

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
  
  // Auto-load tracking
  const [isAutoLoading, setIsAutoLoading] = useState(false);
  const autoLoadPageRef = useRef(0);
  const autoLoadStartedRef = useRef(false);

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

  // Auto-load additional pages after initial page 0 arrives
  useEffect(() => {
    if (!matchesQuery.isLoading && baseMatches.length > 0 && !autoLoadStartedRef.current && puuid) {
      autoLoadStartedRef.current = true;
      
      // Trigger auto-load for pages 1-4 (40 more matches for 50 total)
      const autoLoad = async () => {
        setIsAutoLoading(true);
        try {
          for (let i = 1; i <= 4; i++) {
            // Check if we should continue
            if (!autoLoadStartedRef.current) break;
            
            try {
              console.log(`[useMatches] auto-loading page ${i}...`);
              const data = await fetchMatchPage({ puuid, region, page: i, name, tag });
              const newMatches = data?.matches || [];
              
              setExtraMatches(prev => {
                const existingIds = new Set([
                  ...baseMatches.map(m => m.matchId),
                  ...prev.map(m => m.matchId),
                ]);
                const deduped = newMatches.filter(m => m.matchId && !existingIds.has(m.matchId));
                console.log(`[useMatches] auto-load page ${i}: ${deduped.length} new matches`);
                return [...prev, ...deduped];
              });
              
              setPage(i);
              setHasMoreState(data?.hasMore ?? newMatches.length >= 10);
              
              // Only continue if there are more matches and hasMore is true
              if (newMatches.length < 10 || !data?.hasMore) {
                console.log(`[useMatches] auto-load stopping: no more matches available`);
                break;
              }
              
              // Small delay before next page to avoid hammering API
              await new Promise(resolve => setTimeout(resolve, 300));
            } catch (err) {
              console.error(`[useMatches] auto-load page ${i} failed:`, err.message);
              break;
            }
          }
        } finally {
          setIsAutoLoading(false);
        }
      };
      
      autoLoad();
    }
  }, [matchesQuery.isLoading, baseMatches, puuid, region, name, tag]);

  const matchListLoading = matchesQuery.isLoading;
  const matchDetailsLoading = !isHenrik && riotDetailQuery.isLoading;
  
  // Calculate total matches loaded (base + extra)
  const totalLoadedMatches = isHenrik ? baseMatches.length + extraMatches.length : allMatches.length;

  return {
    matchListLoading,
    matchListError: matchesQuery.error,
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
      autoLoadStartedRef.current = false;
      matchesQuery.refetch();
    },
    source,
    // New: auto-load progress
    isAutoLoading,
    totalLoadedMatches,
  };
}
