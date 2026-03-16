// Fallback: fetch a single match by ID via official Riot API.
// Only used when Henrik is unavailable and Riot returns match IDs without details.
// Requires a production Riot API key — development keys return 403.
import { getMatch } from "@/lib/riotApi";
import { getCache, setCache } from "@/lib/cache";

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  const { matchId, region = "na" } = req.query;
  if (!matchId) return res.status(400).json({ error: "matchId is required" });

  const cacheKey = "match:" + matchId;
  const cached = getCache(cacheKey);
  if (cached) return res.status(200).json(cached);

  try {
    const data = await getMatch(matchId, region);
    setCache(cacheKey, data, 3600); // 1 hour — match data is immutable
    return res.status(200).json(data);
  } catch (err) {
    if (err.status === 403) return res.status(403).json({ error: "Match details require a production Riot API key." });
    if (err.status === 404) return res.status(404).json({ error: "Match not found" });
    console.error("Match API error:", err.message);
    return res.status(502).json({ error: "Riot API temporarily unavailable" });
  }
}
