"use client";
import { useQuery } from "@tanstack/react-query";

const CACHE_TTL = 8 * 60 * 60 * 1000; // 8 hours in ms

function lsKey(gameName, tagLine, region) {
  return `trackerx:account:${gameName.toLowerCase()}:${tagLine.toLowerCase()}:${region}`;
}

function lsRead(key) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const { data, expiresAt } = JSON.parse(raw);
    if (Date.now() > expiresAt) {
      localStorage.removeItem(key);
      return null;
    }
    return data;
  } catch {
    return null;
  }
}

function lsWrite(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify({ data, expiresAt: Date.now() + CACHE_TTL }));
  } catch {
    // quota exceeded or private browsing — silently ignore
  }
}

async function fetchAccount({ gameName, tagLine, region }) {
  const key = lsKey(gameName, tagLine, region);
  const cached = lsRead(key);
  if (cached) return cached;

  const res = await fetch(
    "/api/riot/account?" + new URLSearchParams({ gameName, tagLine, region })
  );
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to fetch account");

  lsWrite(key, data);
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
