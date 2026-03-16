"use client";
import { useQuery } from "@tanstack/react-query";

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
export function useMMR({ puuid, gameName, tagLine, region = "na" }) {
  const enabled = Boolean(puuid || (gameName && tagLine));
  return useQuery({
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
}
