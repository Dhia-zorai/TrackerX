// Henrik's Unofficial Valorant API client - server-side only
// Docs: https://docs.henrikdev.xyz/valorant/api-reference
// Key management: https://api.henrikdev.xyz/dashboard/

const HENRIK_BASE = "https://api.henrikdev.xyz";

// Henrik uses different region identifiers than Riot for some endpoints
const HENRIK_REGIONS = {
  na: "na",
  eu: "eu",
  ap: "ap",
  kr: "kr",
};

async function henrikFetch(path, retries = 2) {
  const apiKey = process.env.HENRIK_API_KEY;
  console.log(`[Henrik] Fetching: ${path}`);
  const headers = {};
  if (apiKey) {
    headers["Authorization"] = apiKey;
  } else {
    console.warn(`[Henrik] No HENRIK_API_KEY set in env vars`);
  }

  let lastError;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(HENRIK_BASE + path, { headers, cache: "no-store" });
      console.log(`[Henrik] Response Status: ${res.status}`);

      if (res.status === 429) {
        const wait = 2000 * Math.pow(2, attempt);
        await new Promise(r => setTimeout(r, wait));
        lastError = new Error("Rate limited");
        continue;
      }
      if (res.status === 404) {
        const e = new Error("Not found"); e.status = 404; throw e;
      }
      if (res.status === 401 || res.status === 403) {
        const e = new Error("Henrik API: Invalid or missing key. Set HENRIK_API_KEY in Vercel env vars (https://api.henrikdev.xyz/dashboard)"); 
        e.status = 401; 
        throw e;
      }
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        const msg = body?.errors?.[0]?.message || ("Henrik API error: " + res.status);
        const e = new Error(msg); e.status = res.status; throw e;
      }

      const json = await res.json();
      console.log(`[Henrik] Data received: status=${json.status}`);
      // Henrik wraps all responses in { status, data }
      if (json.status && json.status !== 200) {
        const e = new Error(json.errors?.[0]?.message || "Henrik API error"); e.status = json.status; throw e;
      }
      return json.data !== undefined ? json.data : json;
    } catch (err) {
      console.error(`[Henrik] Fetch error (attempt ${attempt}): ${err.message}`);
      if (err.status === 404 || err.status === 401) throw err;
      lastError = err;
      if (attempt < retries) await new Promise(r => setTimeout(r, 1000 * Math.pow(2, attempt)));
    }
  }
  throw lastError;
}

// Account lookup by name+tag (Henrik v2 includes card/level info)
export async function henrikGetAccount(name, tag) {
  return henrikFetch(`/valorant/v2/account/${encodeURIComponent(name)}/${encodeURIComponent(tag)}`);
}

// Match history by PUUID — returns full match objects (no second fetch needed!)
// Note: v3 endpoint does NOT support pagination beyond size — always returns most recent `size` matches
export async function henrikGetMatchesByPuuid(puuid, region = "na", size = 10) {
  const r = HENRIK_REGIONS[region] || "na";
  return henrikFetch(`/valorant/v3/by-puuid/matches/${r}/${puuid}?size=${size}`);
}

// Lifetime match history by name+tag — supports real page+size pagination
// Returns match summaries (one player's stats only, not full 10-player data)
// page is 1-indexed per Henrik API; size max is typically 10-25
export async function henrikGetLifetimeMatches(name, tag, region = "na", page = 1, size = 10) {
  const r = HENRIK_REGIONS[region] || "na";
  return henrikFetch(
    `/valorant/v1/lifetime/matches/${r}/${encodeURIComponent(name)}/${encodeURIComponent(tag)}?page=${page}&size=${size}`
  );
}

// MMR (rank) by name+tag
export async function henrikGetMMR(name, tag, region = "na") {
  const r = HENRIK_REGIONS[region] || "na";
  return henrikFetch(`/valorant/v2/mmr/${r}/${encodeURIComponent(name)}/${encodeURIComponent(tag)}`);
}

// MMR by PUUID
export async function henrikGetMMRByPuuid(puuid, region = "na") {
  const r = HENRIK_REGIONS[region] || "na";
  return henrikFetch(`/valorant/v2/by-puuid/mmr/${r}/${puuid}`);
}

// Leaderboard
export async function henrikGetLeaderboard(region = "na", size = 10) {
  const r = HENRIK_REGIONS[region] || "na";
  return henrikFetch(`/valorant/v1/leaderboard/${r}?size=${size}`);
}
