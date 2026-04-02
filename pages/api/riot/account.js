import { getAccountByRiotId } from "@/lib/riotApi";
import { henrikGetAccount } from "@/lib/henrikApi";
import { getCache, setCache } from "@/lib/cache";
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabaseAnon = createClient(supabaseUrl, supabaseAnonKey);

function getAdminFromCookie(req) {
  const cookieHeader = req.headers.cookie || '';
  const match = cookieHeader.match(/trackerx_admin=([^;]+)/);
  return match && match[1] === process.env.ADMIN_COOKIE_SECRET;
}

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  const { gameName, tagLine, region = "na" } = req.query;
  if (!gameName || !tagLine) {
    return res.status(400).json({ error: "gameName and tagLine are required" });
  }

  const cacheKey = "account:" + gameName + ":" + tagLine + ":" + region;
  const cached = getCache(cacheKey);
  if (cached) {
    // Check opt-out status on cache hit too
    if (!getAdminFromCookie(req)) {
      const resolvedPuuid = cached.puuid;
      const { data: optOut } = await supabaseAnon
        .from('opt_outs')
        .select('puuid')
        .eq('puuid', resolvedPuuid)
        .maybeSingle();
      if (optOut) return res.status(200).json({ optedOut: true });
    }
    return res.status(200).json(cached);
  }

  // Admin bypass — skip opt-out check
  if (getAdminFromCookie(req)) {
    try {
      const account = await getAccountByRiotId(gameName, tagLine, region);
      setCache(cacheKey, account, 600);
      return res.status(200).json(account);
    } catch (riotErr) {
      if (riotErr.status === 404) return res.status(404).json({ error: "Player not found" });
    }

    try {
      const hAccount = await henrikGetAccount(gameName, tagLine);
      const detectedRegion = hAccount.region || region || "na";
      const normalized = {
        puuid: hAccount.puuid,
        gameName: hAccount.name || gameName,
        tagLine: hAccount.tag || tagLine,
        accountLevel: hAccount.account_level,
        card: hAccount.card,
        detectedRegion: detectedRegion,
      };
      setCache(cacheKey, normalized, 600);
      return res.status(200).json(normalized);
    } catch (henrikErr) {
      if (henrikErr.status === 404) return res.status(404).json({ error: "Player not found" });
      return res.status(502).json({ error: "Could not look up player — both APIs unavailable" });
    }
  }

  // --- Primary: Official Riot API ---
  let resolvedPuuid = null;
  try {
    const account = await getAccountByRiotId(gameName, tagLine, region);
    resolvedPuuid = account.puuid;
    setCache(cacheKey, account, 600);
  } catch (riotErr) {
    if (riotErr.status === 404) {
      // Try Henrik fallback
    } else {
      // Try Henrik anyway
    }
  }

  // --- Fallback: Henrik API if no puuid yet ---
  if (!resolvedPuuid) {
    try {
      const hAccount = await henrikGetAccount(gameName, tagLine);
      if (hAccount && hAccount.puuid) {
        resolvedPuuid = hAccount.puuid;
        const detectedRegion = hAccount.region || region || "na";
        const normalized = {
          puuid: hAccount.puuid,
          gameName: hAccount.name || gameName,
          tagLine: hAccount.tag || tagLine,
          accountLevel: hAccount.account_level,
          card: hAccount.card,
          detectedRegion: detectedRegion,
        };
        setCache(cacheKey, normalized, 600);
      }
    } catch (henrikErr) {
      if (henrikErr.status === 404) return res.status(404).json({ error: "Player not found" });
    }
  }

  // --- Opt-out gate: check after resolving puuid ---
  if (resolvedPuuid) {
    const { data: optOut } = await supabaseAnon
      .from('opt_outs')
      .select('puuid')
      .eq('puuid', resolvedPuuid)
      .maybeSingle();
    
    if (optOut) {
      return res.status(200).json({ optedOut: true });
    }
  }

  // --- Return cached data if we have it ---
  const cachedAfterCheck = getCache(cacheKey);
  if (cachedAfterCheck) return res.status(200).json(cachedAfterCheck);

  // If we reach here, no data was found
  return res.status(404).json({ error: "Player not found" });
}
