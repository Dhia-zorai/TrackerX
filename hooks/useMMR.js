"use client";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { getCurrentRankFromMatches } from "@/lib/utils";

async function fetchMMR({ puuid, gameName, tagLine, region }) {
  const params = puuid
    ? { puuid, region }
    : { gameName, tagLine, region };
  const res = await fetch("/api/riot/mmr?" + new URLSearchParams(params));
  const data = await res.json();
  if (!res.ok) throw Object.assign(new Error(data.error || "Failed to fetch MMR"), { status: res.status });
  return data;
}

// Pass either puuid or gameName+tagLine
// Optional: pass matches array for fallback when MMR endpoint returns unranked
export function useMMR({ puuid, gameName, tagLine, region = "na", matches = [] }) {
  const enabled = Boolean(puuid || (gameName && tagLine));
  
  const query = useQuery({
    queryKey: ["mmr", puuid || (gameName + "#" + tagLine), region],
    queryFn: () => fetchMMR({ puuid, gameName, tagLine, region }),
    enabled,
    staleTime: 10 * 60 * 1000,
    retry: (failCount, err) => {
      // Don't retry auth errors or not-found
      if (err?.status === 401 || err?.status === 404) return false;
      return failCount < 2;
    },
  });

  // If MMR endpoint failed or returned unranked, try fallback from matches
  const data = useMemo(() => {
    const mmr = query.data;
    
    // If we have valid rank from MMR endpoint, use it
    if (mmr?.tier && mmr.tier > 0 && mmr.tierName !== "Unranked") {
      return mmr;
    }
    
    // Try fallback from matches
    const matchRank = getCurrentRankFromMatches(matches, puuid);
    
    if (matchRank) {
      return {
        ...mmr,  // Keep peak rank and other data from MMR endpoint
        tier: matchRank.tier,
        tierName: matchRank.tierName,
        rr: matchRank.rr,
        fromMatches: true,  // Flag for UI to show "from last match"
      };
    }
    
    return mmr;
  }, [query.data, matches, puuid]);

  return { ...query, data };
}
