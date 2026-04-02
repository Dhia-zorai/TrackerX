import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";

async function fetchMatchPage({ puuid, region, page = 0, name, tag, mode }) {
  let url = `/api/riot/matches?puuid=${puuid}&region=${region}&page=${page}&count=20`;
  if (name && tag) {
    url += `&name=${encodeURIComponent(name)}&tag=${encodeURIComponent(tag)}`;
  }
  if (mode && mode !== 'all') {
    url += `&mode=${mode}`;
  }

  const res = await fetch(url);
  const data = await res.json();
  if (!res.ok) {
    throw Object.assign(new Error(data.error || "Failed to fetch match page"), { status: res.status });
  }
  return data;
}

export function useMatches(puuid, region = "na", name, tag, mode = "competitive") {
  const [extraMatches, setExtraMatches] = useState([]);
  const [page, setPage] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMoreState, setHasMoreState] = useState(true);
  const [isAutoLoading, setIsAutoLoading] = useState(false);

  const autoLoadStartedRef = useRef(false);

  // Initial fetch (Page 0)
  const matchesQuery = useQuery({
    queryKey: ["matches", puuid, region, 0, mode],
    queryFn: () => fetchMatchPage({ puuid, region, page: 0, name, tag, mode }),
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

  // All matches = base page 0 + any lazily loaded extra pages
  const allMatches = [...baseMatches, ...extraMatches];

  const hasMore = page === 0
    ? (matchesQuery.data?.hasMore ?? baseMatches.length >= 10)
    : hasMoreState;

  const loadMore = useCallback(async () => {
    if (!puuid || loadingMore) return;
    const nextPage = page + 1;
    setLoadingMore(true);
    try {
      const data = await fetchMatchPage({ puuid, region, page: nextPage, name, tag, mode });
      const newMatches = data?.matches || [];
      setExtraMatches(prev => {
        const existingIds = new Set([
          ...baseMatches.map(m => m.matchId),
          ...prev.map(m => m.matchId),
        ]);
        const deduped = newMatches.filter(m => m.matchId && !existingIds.has(m.matchId));
        return [...prev, ...deduped];
      });
      setHasMoreState(data?.hasMore ?? newMatches.length >= 20);
      setPage(nextPage);
    } catch (e) {
      console.error("[useMatches] loadMore failed:", e.message);
    } finally {
      setLoadingMore(false);
    }
  }, [puuid, region, page, loadingMore, baseMatches, name, tag, mode]);

  // Auto-load additional pages after initial page 0 arrives
  useEffect(() => {
    if (!matchesQuery.isLoading && baseMatches.length > 0 && !autoLoadStartedRef.current && puuid && isHenrik) {
      autoLoadStartedRef.current = true;
      
      // Trigger auto-load for EXACTLY ONE PAGE (page 1)
      const autoLoad = async () => {
        setIsAutoLoading(true);
        try {
          console.log(`[useMatches] auto-loading page 1...`);
          const data = await fetchMatchPage({ puuid, region, page: 1, name, tag, mode });
          const newMatches = data?.matches || [];
          
          setExtraMatches(prev => {
            const existingIds = new Set([
              ...baseMatches.map(m => m.matchId),
              ...prev.map(m => m.matchId),
            ]);
            const deduped = newMatches.filter(m => m.matchId && !existingIds.has(m.matchId));
            return [...prev, ...deduped];
          });
          
          setPage(1);
          setHasMoreState(data?.hasMore ?? newMatches.length >= 20);
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
  }, [matchesQuery.isLoading, baseMatches, puuid, region, name, tag, mode]);

  // Reset extra matches when puuid changes or mode changes
  useEffect(() => {
    setExtraMatches([]);
    setPage(0);
    setHasMoreState(true);
    setIsAutoLoading(false);
    autoLoadStartedRef.current = false;
  }, [puuid, region, mode]);

  return {
    matches: allMatches,
    matchListLoading: matchesQuery.isLoading,
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
