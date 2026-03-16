import { getAccountByRiotId } from "@/lib/riotApi";
import { henrikGetAccount } from "@/lib/henrikApi";
import { getCache, setCache } from "@/lib/cache";

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  const { gameName, tagLine, region = "na" } = req.query;
  if (!gameName || !tagLine) {
    return res.status(400).json({ error: "gameName and tagLine are required" });
  }

  const cacheKey = "account:" + gameName + ":" + tagLine + ":" + region;
  const cached = getCache(cacheKey);
  if (cached) return res.status(200).json(cached);

  // --- Primary: Official Riot API (account lookups work on dev keys) ---
  try {
    const account = await getAccountByRiotId(gameName, tagLine, region);
    setCache(cacheKey, account, 600); // 10 min
    return res.status(200).json(account);
  } catch (riotErr) {
    if (riotErr.status === 404) return res.status(404).json({ error: "Player not found" });
    console.warn("Riot account lookup failed, trying Henrik fallback:", riotErr.message);
  }

  // --- Fallback: Henrik v2 account (also includes card/level) ---
  try {
    const hAccount = await henrikGetAccount(gameName, tagLine);
    // Henrik v2 returns: { puuid, region, account_level, name, tag, card: {...}, last_update }
    const normalized = {
      puuid: hAccount.puuid,
      gameName: hAccount.name || gameName,
      tagLine: hAccount.tag || tagLine,
      accountLevel: hAccount.account_level,
      card: hAccount.card,
    };
    setCache(cacheKey, normalized, 600);
    return res.status(200).json(normalized);
  } catch (henrikErr) {
    if (henrikErr.status === 404) return res.status(404).json({ error: "Player not found" });
    console.error("Account API error (both sources failed):", henrikErr.message);
    return res.status(502).json({ error: "Could not look up player — both APIs unavailable" });
  }
}
