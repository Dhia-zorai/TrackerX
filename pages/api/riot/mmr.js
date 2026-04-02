import { henrikGetMMR, henrikGetMMRByPuuid } from "@/lib/henrikApi";
import { getCache, setCache } from "@/lib/cache";

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  const { gameName, tagLine, puuid, region = "na" } = req.query;

  if (!gameName && !puuid) {
    return res.status(400).json({ error: "gameName+tagLine or puuid is required" });
  }

  const cacheKey = puuid
    ? "mmr:" + puuid + ":" + region
    : "mmr:" + gameName + ":" + tagLine + ":" + region;
  const cached = getCache(cacheKey);
  if (cached) return res.status(200).json(cached);

  try {
    let data;
    if (puuid) {
      data = await henrikGetMMRByPuuid(puuid, region);
    } else {
      data = await henrikGetMMR(gameName, tagLine, region);
    }

    // Henrik v2 MMR shape:
    // current_data: { currenttier, currenttier_patched, ranking_in_tier, mmr_change_to_last_game, elo }
    // highest_rank: { patched_tier, tier, season }
    // images: { small, large }
    const cur = data?.current_data || {};
    const highest = data?.highest_rank || {};
    const result = {
      tier: cur.currenttier ?? null,
      tierName: cur.currenttier_patched || "Unranked",
      rr: cur.ranking_in_tier ?? 0,
      elo: cur.elo ?? null,
      mmrChange: cur.mmr_change_to_last_game ?? null,
      peakTier: highest.patched_tier || null,
      peakSeason: highest.season || null,
      images: data?.images || {},
    };

    setCache(cacheKey, result, 600); // 10 min
    return res.status(200).json(result);
  } catch (err) {
    if (err.status === 404) return res.status(404).json({ error: "MMR data not found — player may be unranked" });
    if (err.status === 401) return res.status(401).json({ error: "Henrik API key required. Add HENRIK_API_KEY to .env.local" });
    return res.status(502).json({ error: "Could not fetch rank data" });
  }
}
