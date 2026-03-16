import { henrikGetMatchesByPuuid } from "@/lib/henrikApi";
import { getMatchList } from "@/lib/riotApi";
import { getCache, setCache } from "@/lib/cache";
import { normalizeHenrikMatch } from "@/lib/utils";

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  const { puuid, region = "na", count = "10" } = req.query;
  if (!puuid) return res.status(400).json({ error: "puuid is required" });

  const size = Math.min(parseInt(count, 10) || 10, 10); // Henrik max 10 per call
  const cacheKey = "matchlist_v2:" + puuid + ":" + region + ":" + size;
  const cached = getCache(cacheKey);
  if (cached) return res.status(200).json(cached);

  // --- Primary: Henrik v3 (returns full match objects in one call) ---
  try {
    const henrikMatches = await henrikGetMatchesByPuuid(puuid, region, size);
    if (Array.isArray(henrikMatches) && henrikMatches.length > 0) {
      const normalized = henrikMatches.map(normalizeHenrikMatch).filter(Boolean);
      const result = { matches: normalized, source: "henrik" };
      setCache(cacheKey, result, 300); // 5 min
      return res.status(200).json(result);
    }
  } catch (henrikErr) {
    // 401 = bad/missing key, 404 = no matches — fall through to Riot fallback
    if (henrikErr.status !== 401 && henrikErr.status !== 404) {
      console.warn("Henrik matches failed, trying Riot fallback:", henrikErr.message);
    }
  }

  // --- Fallback: Official Riot API (returns match ID list only, no details) ---
  try {
    const riotData = await getMatchList(puuid, region, size);
    // Riot returns { history: [{ matchId, gameStartTime, ... }] }
    // We can't fetch individual match details without a production key so we
    // return the history array — the hook checks for source === "riot_ids" and
    // will trigger per-match detail fetches.
    const result = { matches: [], history: riotData.history || [], source: "riot_ids" };
    setCache(cacheKey, result, 300);
    return res.status(200).json(result);
  } catch (riotErr) {
    if (riotErr.status === 403) {
      return res.status(200).json({
        matches: [],
        history: [],
        source: "unavailable",
        error: "Match history unavailable — Henrik API key required or Riot production key needed.",
      });
    }
    if (riotErr.status === 404) return res.status(200).json({ matches: [], history: [], source: "empty" });
    console.error("Matches API error (both sources failed):", riotErr.message);
    return res.status(502).json({ error: "Match history temporarily unavailable" });
  }
}
