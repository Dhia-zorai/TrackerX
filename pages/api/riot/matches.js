import { henrikGetMatchesByPuuid } from "@/lib/henrikApi";
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

  console.log(`[Matches] Looking up matches for puuid=${puuid} region=${region} size=${size}`);

  try {
    console.log(`[Matches] Calling Henrik v3 matches API...`);
    const henrikMatches = await henrikGetMatchesByPuuid(puuid, region, size);
    
    if (Array.isArray(henrikMatches)) {
      console.log(`[Matches] Henrik returned ${henrikMatches.length} matches`);
      const normalized = henrikMatches.map(normalizeHenrikMatch).filter(Boolean);
      const result = { 
        matches: normalized, 
        source: "henrik", 
        count: normalized.length,
        puuid 
      };
      setCache(cacheKey, result, 300); // 5 min cache
      return res.status(200).json(result);
    } else {
      console.warn(`[Matches] Henrik returned non-array:`, henrikMatches);
      const result = { matches: [], source: "empty", count: 0 };
      setCache(cacheKey, result, 300);
      return res.status(200).json(result);
    }
  } catch (err) {
    console.error(`[Matches] Henrik API failed: ${err.message}`);
    
    // Return gracefully with empty matches
    const result = { 
      matches: [], 
      history: [],
      source: "error",
      count: 0,
      error: err.message 
    };
    setCache(cacheKey, result, 60); // Cache error for 1 min
    return res.status(200).json(result);
  }
}
