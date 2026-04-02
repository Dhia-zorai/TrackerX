import { henrikGetMatchesByPuuid, henrikGetLifetimeMatches } from "@/lib/henrikApi";
import { getCache, setCache } from "@/lib/cache";
import { normalizeHenrikMatch, normalizeLifetimeMatch } from "@/lib/utils";

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  const { puuid, region = "na", count = "20", page = "0", name, tag, mode = "" } = req.query;
  if (!puuid) return res.status(400).json({ error: "puuid is required" });

  const size = Math.min(parseInt(count, 10) || 20, 20);
  const pageNum = Math.max(parseInt(page, 10) || 0, 0);
  const cacheKey = `matchlist_v3:${puuid}:${region}:${size}:${pageNum}:${mode}`;
  const cached = getCache(cacheKey);
  if (cached) return res.status(200).json(cached);

  console.log(`[Matches] puuid=${puuid} region=${region} size=${size} page=${pageNum} name=${name} tag=${tag} mode=${mode}`);

  // Page 0: use Henrik v3 (full match objects with all players)
  if (pageNum === 0) {
    try {
      const raw = await henrikGetMatchesByPuuid(puuid, region, size, mode);
      const henrikMatches = Array.isArray(raw) ? raw : [];
      console.log(`[Matches] Henrik v3 returned ${henrikMatches.length} matches (page 0)`);
      const normalized = henrikMatches.map(normalizeHenrikMatch).filter(Boolean);
      const result = {
        matches: normalized,
        source: "henrik",
        count: normalized.length,
        page: 0,
        hasMore: normalized.length >= size,
        puuid,
      };
      setCache(cacheKey, result, 300);
      return res.status(200).json(result);
    } catch (err) {
      console.error(`[Matches] Henrik v3 failed: ${err.message}`);
      return res.status(200).json({
        matches: [],
        history: [],
        source: "error",
        count: 0,
        page: 0,
        hasMore: false,
        error: err.message,
      });
    }
  }

  // Page 1+: use Henrik v1 lifetime endpoint (paginated, player-only stats)
  if (!name || !tag) {
    return res.status(400).json({ error: "name and tag are required for paginated match history" });
  }

  try {
    // Lifetime endpoint is 1-indexed; pageNum here is 0-indexed so add 1
    const lifetimePage = pageNum + 1;
    const raw = await henrikGetLifetimeMatches(name, tag, region, lifetimePage, size, mode);
    // Lifetime endpoint wraps in { data: [...] } or returns array directly
    const entries = Array.isArray(raw) ? raw : (raw?.data || raw || []);
    console.log(`[Matches] Henrik lifetime returned ${entries.length} entries (page ${pageNum})`);
    const normalized = entries.map(normalizeLifetimeMatch).filter(Boolean);
    const result = {
      matches: normalized,
      source: "henrik",
      count: normalized.length,
      page: pageNum,
      hasMore: normalized.length >= size,
      puuid,
    };
    setCache(cacheKey, result, 300);
    return res.status(200).json(result);
  } catch (err) {
    console.error(`[Matches] Henrik lifetime failed: ${err.message}`);
    return res.status(200).json({
      matches: [],
      source: "error",
      count: 0,
      page: pageNum,
      hasMore: false,
      error: err.message,
    });
  }
}
