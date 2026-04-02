// Henrik's Unofficial Valorant API client - server-side only
// Integrated with Supabase caching
import { getServiceSupabase } from './supabase';
import { computeMatchStats } from './computeMatchStats';

const HENRIK_BASE = "https://api.henrikdev.xyz";
const HENRIK_REGIONS = { na: "na", eu: "eu", ap: "ap", kr: "kr" };

async function henrikFetch(path, retries = 2) {
  const apiKey = process.env.HENRIK_API_KEY;
  console.log(`[Henrik] Fetching: ${path}`);
  const headers = {};
  if (apiKey) headers["Authorization"] = apiKey;

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
        const e = new Error("Henrik API: Invalid or missing key. Set HENRIK_API_KEY in env"); 
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

export async function henrikGetAccount(name, tag) {
  const supabase = getServiceSupabase();
  const riotId = `${name}#${tag}`.toLowerCase();

  // Find player by exact riotId match
  const { data: cachedPlayer } = await supabase
    .from('players')
    .select('*')
    .eq('riot_id', riotId)
    .single();

  if (cachedPlayer && cachedPlayer.last_fetched_at) {
    const ageMs = Date.now() - new Date(cachedPlayer.last_fetched_at).getTime();
    if (ageMs < 60 * 60 * 1000) {
      console.log(`[Cache] Returning cached account for ${riotId}`);
      return {
        puuid: cachedPlayer.puuid,
        name: cachedPlayer.riot_id.split('#')[0],
        tag: cachedPlayer.riot_id.split('#')[1],
        region: cachedPlayer.region,
        account_level: cachedPlayer.account_level,
        card: { id: cachedPlayer.card_id }
      };
    }
  }

  // Fetch fresh
  const data = await henrikFetch(`/valorant/v2/account/${encodeURIComponent(name)}/${encodeURIComponent(tag)}`);
  
  if (data && data.puuid) {
    // Upsert
    const { error } = await supabase.from('players').upsert({
      puuid: data.puuid,
      riot_id: `${data.name}#${data.tag}`.toLowerCase(),
      region: data.region,
      account_level: data.account_level,
      card_id: data.card?.id || null,
      last_fetched_at: new Date().toISOString()
    }, { onConflict: 'puuid' });
    if (error) console.error('[Supabase] players upsert error:', error.message);
  }

  return data;
}

// Fetch a single match details, compute stats, insert to DB
async function fetchAndCacheMatch(matchId, puuid) {
  const supabase = getServiceSupabase();
  
  // See if we have this stat combo cached
  const { data: existingStat } = await supabase
    .from('player_match_stats')
    .select('match_id')
    .eq('puuid', puuid)
    .eq('match_id', matchId)
    .single();

  if (existingStat) {
    console.log(`[Cache] Match ${matchId} for puuid ${puuid} found in DB.`);
    
    // We still need the full match data for the client in `raw_json`
    const { data: matchData } = await supabase
      .from('matches')
      .select('raw_json')
      .eq('match_id', matchId)
      .single();

    if (matchData && matchData.raw_json) {
      return matchData.raw_json;
    }
  }

  // Missing from DB, fetch fresh
  const data = await henrikFetch(`/valorant/v2/match/${encodeURIComponent(matchId)}`);
  
  if (!data || !data.metadata) return data;

  const metadata = data.metadata;

  // Insert match raw JSON (ignore conflict if already exists from another player)
  const { error: matchErr } = await supabase.from('matches').upsert({
    match_id: metadata.matchid,
    map: metadata.map,
    mode: metadata.mode,
    season_id: metadata.season_id,
    started_at: new Date(metadata.game_start * 1000).toISOString(),
    raw_json: data,
    fetched_at: new Date().toISOString()
  }, { onConflict: 'match_id', ignoreDuplicates: true });
  if (matchErr) console.error('[Supabase] matches upsert error:', matchErr.message);

  // Compute and insert player stats
  const stats = computeMatchStats(data, puuid);
  
  const { error: statsErr } = await supabase.from('player_match_stats').upsert(stats, { onConflict: 'puuid,match_id' });
  if (statsErr) console.error('[Supabase] player_match_stats upsert error:', statsErr.message);

  return data;
}

export async function henrikGetMatchesByPuuid(puuid, region = "na", size = 10) {
  const r = HENRIK_REGIONS[region] || "na";
  const rawList = await henrikFetch(`/valorant/v3/by-puuid/matches/${r}/${puuid}?size=${size}`);
  
  // v3 returns array of full matches. We still want to cache them.
  const processedMatches = [];
  for (const match of (rawList || [])) {
    if (!match.metadata?.matchid) continue;
    
    // We already got the full payload here, we don't need to re-fetch!
    const supabase = getServiceSupabase();
    
    const { error: matchErr } = await supabase.from('matches').upsert({
      match_id: match.metadata.matchid,
      map: match.metadata.map,
      mode: match.metadata.mode,
      season_id: match.metadata.season_id,
      started_at: new Date(match.metadata.game_start * 1000).toISOString(),
      raw_json: match,
      fetched_at: new Date().toISOString()
    }, { onConflict: 'match_id', ignoreDuplicates: true });
    if (matchErr) console.error('[Supabase] matches v3 upsert error:', matchErr.message);

    const stats = computeMatchStats(match, puuid);
    const { error: statsErr } = await supabase.from('player_match_stats').upsert(stats, { onConflict: 'puuid,match_id' });
    if (statsErr) console.error('[Supabase] stats v3 upsert error:', statsErr.message);

    processedMatches.push(match);
  }

  return processedMatches;
}

export async function henrikGetLifetimeMatches(name, tag, region = "na", page = 1, size = 10, mode = 'competitive') {
  const r = HENRIK_REGIONS[region] || "na";
  const endpoint = `/valorant/v1/lifetime/matches/${r}/${encodeURIComponent(name)}/${encodeURIComponent(tag)}?page=${page}&size=${size}&mode=${mode}`;
  const response = await henrikFetch(endpoint);
  
  const summaries = Array.isArray(response) ? response : (response?.data || response || []);

  const puuid = summaries[0]?.stats?.puuid;
  if (!puuid) return summaries;

  const fullMatches = [];

  for (const summary of summaries) {
    if (!summary.meta?.id) continue;
    const matchId = summary.meta.id;
    try {
      const fullMatch = await fetchAndCacheMatch(matchId, puuid);
      fullMatches.push(fullMatch);
    } catch (err) {
      console.error(`[Henrik] Failed to fetch full match ${matchId}:`, err.message);
      // Fallback: continue with the summary if full match fails
      fullMatches.push(summary); 
    }
  }

  return fullMatches;
}

export async function henrikGetMMR(name, tag, region = "na") {
  const r = HENRIK_REGIONS[region] || "na";
  const data = await henrikFetch(`/valorant/v2/mmr/${r}/${encodeURIComponent(name)}/${encodeURIComponent(tag)}`);
  
  // Always fetch fresh, append to mmr_snapshots
  if (data && data.puuid) {
    const supabase = getServiceSupabase();
    const { error } = await supabase.from('mmr_snapshots').insert({
      puuid: data.puuid,
      tier: data.current_data?.currenttier || null,
      tier_name: data.current_data?.currenttierpatched || null,
      ranking_in_tier: data.current_data?.ranking_in_tier || null,
      peak_tier: data.highest_rank?.tier || null,
      peak_tier_name: data.highest_rank?.patched_tier || null,
      snapshotted_at: new Date().toISOString()
    });
    if (error) console.error('[Supabase] mmr_snapshots insert error:', error.message);
  }
  return data;
}

export async function henrikGetMMRByPuuid(puuid, region = "na") {
  const r = HENRIK_REGIONS[region] || "na";
  return henrikFetch(`/valorant/v2/by-puuid/mmr/${r}/${puuid}`);
}

export async function henrikGetLeaderboard(region = "na", size = 10) {
  const r = HENRIK_REGIONS[region] || "na";
  return henrikFetch(`/valorant/v1/leaderboard/${r}?size=${size}`);
}

export async function henrikGetMatch(matchId) {
  return henrikFetch(`/valorant/v2/match/${encodeURIComponent(matchId)}`);
}
