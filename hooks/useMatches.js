import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";

async function fetchMatchPage({ puuid, region, page = 0, name, tag }) {
  let url = `/api/riot/matches?puuid=${puuid}&region=${region}&page=${page}&count=10`;
  if (name && tag) {
    url += `&name=${encodeURIComponent(name)}&tag=${encodeURIComponent(tag)}`;
  }

  const res = await fetch(url);
  const data = await res.json();
  if (!res.ok) {
    throw Object.assign(new Error(data.error || "Failed to fetch match page"), { status: res.status });
  }
  return data;
}

async function fetchMatchDetail({ matchId, region }) {
  const res = await fetch(`/api/riot/match?matchId=${encodeURIComponent(matchId)}&region=${region}`);
  const data = await res.json();
  if (!res.ok) {
    throw Object.assign(new Error(data.error || "Failed to fetch match details"), { status: res.status });
  }
  return data;
}

export function useMatches(puuid, region = "na", name, tag) {
  const [extraMatches, setExtraMatches] = useState([]);
  const [page, setPage] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMoreState, setHasMoreState] = useState(true);
  const [isAutoLoading, setIsAutoLoading] = useState(false);

  const autoLoadStartedRef = useRef(false);

  // Initial fetch (Page 0)
  const matchesQuery = useQuery({
    queryKey: ["matches", puuid, region, 0],
    queryFn: () => fetchMatchPage({ puuid, region, page: 0, name, tag }),
    enabled: !!puuid,
    staleTime: 5 * 60 * 1000,
    retry: (failCount, err) => {
      if (err?.status === 401 || err?.status === 404) return false;
      return failCount < 2;
    },
  });

  const source = matchesQuery.data?.source;

  // Henrik path: full match objects in data.matches
  const baseMatches = useMemo(() => matchesQuery.data?.matches || [], [matchesQuery.data]);

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
        return [...prev, ...deduped];
      });
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
    if (!matchesQuery.isLoading && baseMatches.length > 0 && !autoLoadStartedRef.current && puuid && isHenrik) {
      autoLoadStartedRef.current = true;
      
      // Trigger auto-load for EXACTLY ONE PAGE (page 1)
      const autoLoad = async () => {
        setIsAutoLoading(true);
        try {
          console.log(`[useMatches] auto-loading page 1...`);
          const data = await fetchMatchPage({ puuid, region, page: 1, name, tag });
          const newMatches = data?.matches || [];
          
          setExtraMatches(prev => {
            const existingIds = new Set([
              ...baseMatches.map(m => m.matchId),
              ...prev.map(m => m.matchId),
            ]);
            const deduped = newMatches.filter(m => m.matchId && !existingIds.has(m.matchId));
            console.log(`[useMatches] auto-load page 1: ${deduped.length} new matches`);
            return [...prev, ...deduped];
          });
          
          setPage(1);
          setHasMoreState(data?.hasMore ?? newMatches.length >= 10);
        } catch (e) {
          console.error("[useMatches] auto-load failed:", e.message);
        } finally {
          setIsAutoLoading(false);
        }
      };
      
      // Give the UI a moment to render before firing background requests
      setTimeout(() => {
        autoLoad();
      }, 1500);
    }
  }, [matchesQuery.isLoading, baseMatches, puuid, region, name, tag, isHenrik]);

  // Reset extra matches when puuid changes
  useEffect(() => {
    setExtraMatches([]);
    setPage(0);
    setHasMoreState(true);
    setIsAutoLoading(false);
    autoLoadStartedRef.current = false;
  }, [puuid, region]);

  return {
    matches: allMatches,
    matchListLoading: matchesQuery.isLoading,
    matchDetailsLoading: riotDetailQuery.isLoading,
    matchListError: matchesQuery.error,
    hasMore,
    loadMore,
    loadingMore,
    refetch: () => {
      setExtraMatches([]);
      setPage(0);
      autoLoadStartedRef.current = false;
      matchesQuery.refetch();
    },
    isAutoLoading,
    totalLoadedMatches: allMatches.length
  };
}
