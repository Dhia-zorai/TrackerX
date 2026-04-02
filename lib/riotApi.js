// Riot Games API client - server-side only

const REGION_HOSTS = {
  na: "https://americas.api.riotgames.com",
  eu: "https://europe.api.riotgames.com",
  ap: "https://asia.api.riotgames.com",
  kr: "https://asia.api.riotgames.com",
  latam: "https://americas.api.riotgames.com",
  br: "https://americas.api.riotgames.com",
};

async function riotFetch(url, retries = 3) {
  const apiKey = process.env.RIOT_API_KEY;
  if (!apiKey) throw new Error("RIOT_API_KEY env var not set in Vercel or .env.local");
  console.log(`[Riot] Fetching: ${url}`);
  let lastError;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, {
        headers: { "X-Riot-Token": apiKey },
        cache: "no-store",
      });
      console.log(`[Riot] Response Status: ${res.status}`);
      if (res.status === 429) {
        const retryAfter = parseInt(res.headers.get("Retry-After") || "5", 10);
        const wait = retryAfter * 1000 * Math.pow(2, attempt);
        await new Promise(r => setTimeout(r, wait));
        lastError = new Error("Rate limited");
        continue;
      }
      if (res.status === 401 || res.status === 403) { 
        const e = new Error("Riot API key invalid or expired (dev keys expire every 24h)"); 
        e.status = 403; 
        throw e; 
      }
      if (res.status === 404) { const e = new Error("Not found"); e.status = 404; throw e; }
      if (!res.ok) { const e = new Error("Riot API error: " + res.status); e.status = res.status; throw e; }
      return await res.json();
    } catch (err) {
      console.error(`[Riot] Fetch error (attempt ${attempt}): ${err.message}`);
      if (err.status === 403 || err.status === 404) throw err;
      lastError = err;
      if (attempt < retries) await new Promise(r => setTimeout(r, 1000 * Math.pow(2, attempt)));
    }
  }
  throw lastError;
}

export async function getAccountByRiotId(gameName, tagLine, region = "na") {
  const host = REGION_HOSTS[region] || REGION_HOSTS.na;
  return riotFetch(host + "/riot/account/v1/accounts/by-riot-id/" + encodeURIComponent(gameName) + "/" + encodeURIComponent(tagLine));
}

export async function getMatch(matchId, region = "na") {
  const host = REGION_HOSTS[region] || REGION_HOSTS.na;
  return riotFetch(host + "/val/match/v1/matches/" + matchId);
}

export async function getContent(region = "na") {
  const host = REGION_HOSTS[region] || REGION_HOSTS.na;
  return riotFetch(host + "/val/content/v1/contents?locale=en-US");
}

export async function getLeaderboard(actId, region = "na", size = 10, startIndex = 0) {
  const host = REGION_HOSTS[region] || REGION_HOSTS.na;
  return riotFetch(host + "/val/ranked/v1/leaderboards/by-act/" + actId + "?size=" + size + "&startIndex=" + startIndex);
}

export { REGION_HOSTS };