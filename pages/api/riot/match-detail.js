// Fetch single match details via Henrik API v2
// Used for lazy-loading full scoreboard data when expanding older matches
import { henrikGetMatch } from "@/lib/henrikApi";
import { getCache, setCache } from "@/lib/cache";
import { normalizeHenrikMatch } from "@/lib/utils";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { matchId } = req.query;
  if (!matchId) {
    return res.status(400).json({ error: "matchId is required" });
  }

  // Check cache first (match data is immutable, cache for 1 hour)
  const cacheKey = `match_detail:${matchId}`;
  const cached = getCache(cacheKey);
  if (cached) {
    return res.status(200).json(cached);
  }

  try {
    const rawMatch = await henrikGetMatch(matchId);
    const normalized = normalizeHenrikMatch(rawMatch);
    
    if (!normalized) {
      return res.status(404).json({ error: "Match not found or invalid data" });
    }

    // Cache for 1 hour (match data never changes)
    setCache(cacheKey, normalized, 3600);
    
    return res.status(200).json(normalized);
  } catch (err) {
    if (err.status === 404) {
      return res.status(404).json({ error: "Match not found" });
    }
    if (err.status === 429) {
      return res.status(429).json({ error: "Rate limited, please try again" });
    }
    
    return res.status(500).json({ error: "Failed to fetch match details" });
  }
}
