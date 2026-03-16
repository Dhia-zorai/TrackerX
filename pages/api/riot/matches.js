import { henrikGetMatchesByPuuid } from "@/lib/henrikApi";
import { getCache, setCache } from "@/lib/cache";
import { normalizeHenrikMatch } from "@/lib/utils";

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  const { puuid, region = "na", count = "10", page = "0" } = req.query;
  if (!puuid) return res.status(400).json({ error: "puuid is required" });

  const size = Math.min(parseInt(count, 10) || 10, 10);
  const pageNum = Math.max(parseInt(page, 10) || 0, 0);
  const cacheKey = `matchlist_v3:${puuid}:${region}:${size}:${pageNum}`;
  const cached = getCache(cacheKey);
  if (cached) return res.status(200).json(cached);

  console.log(`[Matches] puuid=${puuid} region=${region} size=${size} page=${pageNum}`);

  try {
    const raw = await henrikGetMatchesByPuuid(puuid, region, size, pageNum);
    const henrikMatches = Array.isArray(raw) ? raw : [];

    console.log(`[Matches] Henrik returned ${henrikMatches.length} matches (page ${pageNum})`);
    const normalized = henrikMatches.map(normalizeHenrikMatch).filter(Boolean);
    const result = {
      matches: normalized,
      source: "henrik",
      count: normalized.length,
      page: pageNum,
      hasMore: normalized.length >= size,
      puuid,
    };
    setCache(cacheKey, result, 300); // 5 min
    return res.status(200).json(result);
  } catch (err) {
    console.error(`[Matches] Henrik API failed: ${err.message}`);
    return res.status(200).json({
      matches: [],
      history: [],
      source: "error",
      count: 0,
      page: pageNum,
      hasMore: false,
      error: err.message,
    });
  }
}
