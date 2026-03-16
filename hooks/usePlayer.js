"use client";
import { useQuery } from "@tanstack/react-query";

async function fetchAccount({ gameName, tagLine, region }) {
  const res = await fetch(
    "/api/riot/account?" + new URLSearchParams({ gameName, tagLine, region })
  );
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to fetch account");
  return data;
}

export function usePlayer(gameName, tagLine, region = "na") {
  return useQuery({
    queryKey: ["player", gameName, tagLine, region],
    queryFn: () => fetchAccount({ gameName, tagLine, region }),
    enabled: Boolean(gameName && tagLine),
    staleTime: 10 * 60 * 1000,
  });
}