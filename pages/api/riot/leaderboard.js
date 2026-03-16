import { henrikGetLeaderboard } from "@/lib/henrikApi";
import { getLeaderboard, getContent } from "@/lib/riotApi";
import { getCache, setCache } from "@/lib/cache";

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  const { region = "na", size = "10" } = req.query;
  const sz = parseInt(size, 10) || 10;

  const cacheKey = "leaderboard_v2:" + region + ":" + sz;
  const cached = getCache(cacheKey);
  if (cached) return res.status(200).json(cached);

  // --- Primary: Henrik leaderboard ---
  try {
    const data = await henrikGetLeaderboard(region, sz);
    // Henrik returns an array of players: [{ puuid, gameName, tagLine, leaderboardRank, rankedRating, ... }]
    const players = Array.isArray(data) ? data : (data?.players || []);
    const result = { players, source: "henrik", region };
    setCache(cacheKey, result, 900); // 15 min
    return res.status(200).json(result);
  } catch (henrikErr) {
    console.warn("Henrik leaderboard failed, trying Riot fallback:", henrikErr.message);
  }

  // --- Fallback: Official Riot API ---
  const { actId } = req.query;
  let resolvedActId = actId;
  if (!resolvedActId) {
    try {
      const contentKey = "content:" + region;
      let content = getCache(contentKey);
      if (!content) {
        content = await getContent(region);
        setCache(contentKey, content, 3600);
      }
      const acts = (content.acts || []).filter(a => a.isActive !== false);
      const current = acts.find(a => a.isActive) || acts[acts.length - 1];
      resolvedActId = current ? current.id : null;
    } catch (e) {
      if (e.status === 403) {
        return res.status(403).json({ error: "Leaderboard requires a production Riot API key." });
      }
      return res.status(500).json({ error: "Could not determine current act" });
    }
  }

  if (!resolvedActId) return res.status(400).json({ error: "actId is required" });

  try {
    const data = await getLeaderboard(resolvedActId, region, sz, 0);
    const result = { ...data, actId: resolvedActId, source: "riot", region };
    setCache(cacheKey, result, 900);
    return res.status(200).json(result);
  } catch (riotErr) {
    if (riotErr.status === 403) return res.status(403).json({ error: "Leaderboard requires a production Riot API key." });
    if (riotErr.status === 404) return res.status(404).json({ error: "Leaderboard not found" });
    console.error("Leaderboard API error:", riotErr.message);
    return res.status(502).json({ error: "Leaderboard temporarily unavailable" });
  }
}
