export function parseRiotId(input) {
  if (!input || typeof input !== "string") return null;
  const trimmed = input.trim();
  const hashIndex = trimmed.lastIndexOf("#");
  if (hashIndex <= 0 || hashIndex === trimmed.length - 1) return null;
  const gameName = trimmed.slice(0, hashIndex).trim();
  const tagLine = trimmed.slice(hashIndex + 1).trim();
  if (!gameName || !tagLine) return null;
  return { gameName, tagLine };
}

export function timeAgo(ms) {
  const diff = Date.now() - ms;
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return minutes + "m ago";
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return hours + "h ago";
  const days = Math.floor(hours / 24);
  if (days < 7) return days + "d ago";
  return Math.floor(days / 7) + "w ago";
}

export function extractPlayerStats(match, puuid) {
  if (!match || !match.players) return null;
  const player = match.players.find(p => p.puuid === puuid);
  if (!player) return null;
  const stats = player.stats || {};
  const kills = stats.kills || 0;
  const deaths = stats.deaths || 0;
  const assists = stats.assists || 0;
  const score = stats.score || 0;
  const roundsPlayed = (match.info && match.info.roundsPlayed) || 1;
  const kd = deaths > 0 ? kills / deaths : kills;
  const acs = Math.round(score / roundsPlayed);
  const hsHits = stats.headshots || 0;
  const bodyHits = stats.bodyshots || 0;
  const legHits = stats.legshots || 0;
  const totalHits = hsHits + bodyHits + legHits;
  const hsPct = totalHits > 0 ? (hsHits / totalHits) * 100 : 0;
  const bodyPct = totalHits > 0 ? (bodyHits / totalHits) * 100 : 0;
  const legPct = totalHits > 0 ? (legHits / totalHits) * 100 : 0;
  const teamId = player.teamId;
  const team = (match.teams || []).find(t => t.teamId === teamId);
  const won = team ? team.won === true : false;
  const drew = (match.teams || []).every(t => !t.won);
  
  const kpr = roundsPlayed > 0 ? kills / roundsPlayed : 0;
  let kpPct = null;
  if (match.players && match.players.length > 1) {
    let teamKills = 0;
    match.players.forEach(p => {
      if (p.teamId === teamId) teamKills += (p.stats?.kills || 0);
    });
    kpPct = teamKills > 0 ? ((kills + assists) / teamKills) * 100 : 0;
  }

  return {
    kills, deaths, assists,
    kd: parseFloat(kd.toFixed(2)),
    acs, 
    hsPct: parseFloat(hsPct.toFixed(1)),
    bodyPct: parseFloat(bodyPct.toFixed(1)),
    legPct: parseFloat(legPct.toFixed(1)),
    kpPct: kpPct !== null ? parseFloat(kpPct.toFixed(1)) : null,
    kpr: parseFloat(kpr.toFixed(2)),
    agentId: player.characterId,
    teamId, won, drew, roundsPlayed, score,
    gameName: player.gameName,
    tagLine: player.tagLine,
    // RR change data for competitive matches
    mmrChange: player.mmr_change_to_last_game ?? null,
    currentTier: player.currenttier ?? null,
    currentTierName: player.currenttier_patched ?? null,
    competitiveMovement: player.competitive_movement ?? null,
  };
}

export function aggregateStats(statsArray) {
  const valid = (statsArray || []).filter(Boolean);
  if (valid.length === 0) return { kd: 0, acs: 0, hsPct: 0, bodyPct: 0, legPct: 0, winRate: 0, kills: 0, deaths: 0, assists: 0, gamesPlayed: 0, wins: 0, avgKills: 0, kpr: 0, kpPct: 0 };
  const gamesPlayed = valid.length;
  const wins = valid.filter(s => s.won && !s.drew).length;
  const totalKills = valid.reduce((a, s) => a + s.kills, 0);
  const totalDeaths = valid.reduce((a, s) => a + s.deaths, 0);
  const totalAssists = valid.reduce((a, s) => a + s.assists, 0);
  const totalRounds = valid.reduce((a, s) => a + (s.roundsPlayed || 1), 0);
  
  const kpValid = valid.filter(s => s.kpPct !== null);
  const kpPct = kpValid.length > 0 ? kpValid.reduce((a, s) => a + s.kpPct, 0) / kpValid.length : 0;
  
  return {
    gamesPlayed, wins,
    winRate: parseFloat(((wins / gamesPlayed) * 100).toFixed(1)),
    kills: totalKills, deaths: totalDeaths, assists: totalAssists,
    avgKills: parseFloat((totalKills / gamesPlayed).toFixed(1)),
    kd: parseFloat((totalDeaths > 0 ? totalKills / totalDeaths : totalKills).toFixed(2)),
    acs: Math.round(valid.reduce((a, s) => a + s.acs, 0) / gamesPlayed),
    hsPct: parseFloat((valid.reduce((a, s) => a + s.hsPct, 0) / gamesPlayed).toFixed(1)),
    bodyPct: parseFloat((valid.reduce((a, s) => a + (s.bodyPct||0), 0) / gamesPlayed).toFixed(1)),
    legPct: parseFloat((valid.reduce((a, s) => a + (s.legPct||0), 0) / gamesPlayed).toFixed(1)),
    kpr: parseFloat((totalRounds > 0 ? totalKills / totalRounds : 0).toFixed(2)),
    kpPct: parseFloat(kpPct.toFixed(1)),
  };
}

export function getAgentStats(statsArray) {
  const agentMap = {};
  for (const s of (statsArray || [])) {
    if (!s || !s.agentId) continue;
    if (!agentMap[s.agentId]) {
      agentMap[s.agentId] = { agentId: s.agentId, games: 0, wins: 0, kills: 0, deaths: 0, totalAcs: 0, totalHsPct: 0 };
    }
    const entry = agentMap[s.agentId];
    entry.games++;
    if (s.won && !s.drew) entry.wins++;
    entry.kills += s.kills;
    entry.deaths += s.deaths;
    entry.totalAcs += s.acs || 0;
    entry.totalHsPct += s.hsPct || 0;
  }
  return Object.values(agentMap)
    .sort((a, b) => b.games - a.games)
    .map(a => ({
      ...a,
      winRate: parseFloat(((a.wins / a.games) * 100).toFixed(1)),
      kd: parseFloat((a.deaths > 0 ? a.kills / a.deaths : a.kills).toFixed(2)),
      acs: Math.round(a.totalAcs / a.games),
      hsPct: parseFloat((a.totalHsPct / a.games).toFixed(1)),
    }));
}

export function encodeRiotIdForUrl(gameName, tagLine) {
  return encodeURIComponent(gameName) + "-" + encodeURIComponent(tagLine);
}

export function decodeRiotIdFromUrl(param) {
  const decoded = decodeURIComponent(param);
  if (decoded.includes("#")) {
    const idx = decoded.lastIndexOf("#");
    return { gameName: decoded.slice(0, idx), tagLine: decoded.slice(idx + 1) };
  }
  const lastDash = decoded.lastIndexOf("-");
  if (lastDash === -1) return { gameName: decoded, tagLine: "" };
  return { gameName: decoded.slice(0, lastDash), tagLine: decoded.slice(lastDash + 1) };
}

export const RANK_TIERS = [
  { name: "Iron", color: "#8a9bb5" },
  { name: "Bronze", color: "#a8734e" },
  { name: "Silver", color: "#c0c0c0" },
  { name: "Gold", color: "#f0b429" },
  { name: "Platinum", color: "#4fc3f7" },
  { name: "Diamond", color: "#9c27b0" },
  { name: "Ascendant", color: "#4caf50" },
  { name: "Immortal", color: "#ef5350" },
  { name: "Radiant", color: "#ffe082" },
];

// ---------------------------------------------------------------------------
// Rank tier helpers
// ---------------------------------------------------------------------------

/**
 * Convert rank tier number (0-27) to display name
 * @param {number} tier - Rank tier number from API
 * @returns {string} Display name (e.g., "Gold 3", "Radiant")
 */
export function normalizeRankTier(tier) {
  if (tier == null || tier === 0) return "Unranked";
  
  const ranks = [
    "Unranked",                              // 0
    null, null,                              // 1-2 = Unused
    "Iron 1", "Iron 2", "Iron 3",            // 3-5
    "Bronze 1", "Bronze 2", "Bronze 3",      // 6-8
    "Silver 1", "Silver 2", "Silver 3",      // 9-11
    "Gold 1", "Gold 2", "Gold 3",            // 12-14
    "Platinum 1", "Platinum 2", "Platinum 3", // 15-17
    "Diamond 1", "Diamond 2", "Diamond 3",   // 18-20
    "Ascendant 1", "Ascendant 2", "Ascendant 3", // 21-23
    "Immortal 1", "Immortal 2", "Immortal 3", // 24-26
    "Radiant"                                // 27
  ];
  
  return ranks[tier] || "Unranked";
}

/**
 * Extract current rank from the most recent competitive match
 * @param {Array} matches - Normalized matches array
 * @param {string} puuid - Player's PUUID
 * @returns {Object|null} { tier, tierName, rr, matchId, gameStart, fromMatches } or null
 */
export function getCurrentRankFromMatches(matches, puuid) {
  if (!matches?.length || !puuid) return null;
  
  // Filter to competitive matches only
  const compMatches = matches.filter(m => {
    const mode = (m.mode || m.queue || m.info?.gameMode || '').toLowerCase();
    return mode === 'competitive';
  });
  
  if (!compMatches.length) return null;
  
  // Sort by game start time (most recent first)
  const sorted = [...compMatches].sort((a, b) => 
    (b.gameStart || 0) - (a.gameStart || 0)
  );
  
  // Find the player in the most recent match
  const latestMatch = sorted[0];
  const player = latestMatch.players?.find(p => p.puuid === puuid);
  
  // Also check raw Henrik data for rank info
  const rawPlayers = latestMatch._henrik?.players?.all_players || [];
  const rawPlayer = rawPlayers.find(p => p.puuid === puuid);
  
  // Try normalized player first, then raw Henrik data
  const tier = player?.currenttier || rawPlayer?.currenttier;
  const tierPatched = player?.currenttier_patched || rawPlayer?.currenttier_patched;
  const rr = player?.ranking_in_tier ?? rawPlayer?.ranking_in_tier ?? null;
  
  if (!tier) return null;
  
  return {
    tier: tier,
    tierName: tierPatched || normalizeRankTier(tier),
    rr: rr,
    matchId: latestMatch.matchId,
    gameStart: latestMatch.gameStart,
    fromMatches: true  // Flag to indicate this is derived from matches
  };
}

// Normalize a Henrik v3 match object into the shape extractPlayerStats() expects.
// Henrik: players.all_players[], teams.red/blue, metadata
// Official: players[], teams[], info.roundsPlayed, info.gameMode, info.mapId, info.gameStartMillis
export function normalizeHenrikMatch(henrikMatch) {
  if (!henrikMatch || !henrikMatch.metadata) return null;
  const meta = henrikMatch.metadata;
  const allPlayers = (henrikMatch.players?.all_players || []);
  const redTeam = henrikMatch.teams?.red || {};
  const blueTeam = henrikMatch.teams?.blue || {};

  // Build players array in official shape
  const players = allPlayers.map(p => {
    const s = p.stats || {};
    const totalRounds = (redTeam.rounds_won || 0) + (redTeam.rounds_lost || 0) || 1;
    return {
      puuid: p.puuid,
      gameName: p.name,
      tagLine: p.tag,
      characterId: p.character?.toLowerCase() || p.character || "",
      teamId: p.team === "Red" ? "Red" : "Blue",
      stats: {
        kills: s.kills || 0,
        deaths: s.deaths || 0,
        assists: s.assists || 0,
        score: Math.round((s.score || 0)),
        headshots: s.headshots || 0,
        bodyshots: s.bodyshots || 0,
        legshots: s.legshots || 0,
      },
      // Pass agent image assets through for display
      assets: p.assets || {},
      // Rank data for current rank extraction
      currenttier: p.currenttier ?? null,
      currenttier_patched: p.currenttier_patched ?? null,
      ranking_in_tier: p.ranking_in_tier ?? null,
      competitive_movement: p.competitive_movement ?? null,
      mmr_change_to_last_game: p.mmr_change_to_last_game ?? null,
    };
  });

  // Build teams array
  const roundsPlayed = (redTeam.rounds_won || 0) + (redTeam.rounds_lost || 0) || 1;
  const teams = [
    { teamId: "Red", won: redTeam.has_won === true, roundsWon: redTeam.rounds_won || 0 },
    { teamId: "Blue", won: blueTeam.has_won === true, roundsWon: blueTeam.rounds_won || 0 },
  ];

  return {
    matchId: meta.matchid,
    map: meta.map,
    gameLength: meta.game_length,
    gameStart: meta.game_start,
    queue: meta.queue,
    mode: meta.mode,
    region: meta.region,
    players,
    teams,
    info: { 
      roundsPlayed,
      mapId: meta.map || "Unknown",
      gameMode: meta.mode || "Unrated",
      gameStartMillis: (meta.game_start || 0) * 1000, // Convert seconds to milliseconds
    },
    // Keep raw for any components that need it
    _henrik: henrikMatch,
  };
}

// Normalize a Henrik v1 lifetime match entry into the same shape as normalizeHenrikMatch.
// Lifetime entries only contain one player's stats (the searched player), not all 10 players.
// Shape: { meta: { id, map: {name}, mode, started_at, region }, stats: { puuid, team, character: {name}, score, kills, deaths, assists, shots: {head,body,leg} }, teams: { red, blue } }
export function normalizeLifetimeMatch(entry) {
  if (!entry || !entry.meta || !entry.stats) return null;
  const meta = entry.meta;
  const s = entry.stats;
  const shots = s.shots || {};
  const totalShots = (shots.head || 0) + (shots.body || 0) + (shots.leg || 0) || 1;

  // Determine round counts from teams object
  const teamsObj = entry.teams || {};
  // teams can be { red: N, blue: N } or { Red: N, Blue: N }
  const redWon = (teamsObj.red ?? teamsObj.Red) || 0;
  const blueWon = (teamsObj.blue ?? teamsObj.Blue) || 0;
  const roundsPlayed = redWon + blueWon || 1;

  const playerTeam = (s.team || "Red");
  const playerTeamNorm = playerTeam.charAt(0).toUpperCase() + playerTeam.slice(1).toLowerCase();
  const playerTeamWon = playerTeamNorm === "Red" ? redWon > blueWon : blueWon > redWon;

  const agentName = (s.character?.name || s.character?.id || "").toLowerCase();

  const player = {
    puuid: s.puuid,
    gameName: s.name || "",
    tagLine: s.tag || "",
    characterId: agentName,
    teamId: playerTeamNorm,
    stats: {
      kills: s.kills || 0,
      deaths: s.deaths || 0,
      assists: s.assists || 0,
      score: s.score || 0,
      headshots: shots.head || 0,
      bodyshots: shots.body || 0,
      legshots: shots.leg || 0,
    },
    assets: {},
    // Rank data for current rank extraction
    currenttier: s.currenttier ?? null,
    currenttier_patched: s.currenttier_patched ?? null,
    ranking_in_tier: s.ranking_in_tier ?? null,
    competitive_movement: s.competitive_movement ?? null,
    mmr_change_to_last_game: s.mmr_change_to_last_game ?? null,
  };

  const teams = [
    { teamId: "Red", won: redWon > blueWon, roundsWon: redWon },
    { teamId: "Blue", won: blueWon > redWon, roundsWon: blueWon },
  ];

  // Map name: meta.map may be an object {id, name} or a string
  const mapName = typeof meta.map === "object" ? (meta.map?.name || "Unknown") : (meta.map || "Unknown");
  const modeName = meta.mode || "Unrated";
  // started_at may be ISO string or epoch seconds
  const gameStart = meta.started_at
    ? (typeof meta.started_at === "string" ? Math.floor(new Date(meta.started_at).getTime() / 1000) : meta.started_at)
    : 0;

  return {
    matchId: meta.id,
    map: mapName,
    gameLength: meta.game_length || 0,
    gameStart,
    queue: modeName.toLowerCase(),
    mode: modeName,
    region: meta.region || "",
    players: [player],
    teams,
    info: {
      roundsPlayed,
      mapId: mapName,
      gameMode: modeName,
      gameStartMillis: gameStart * 1000,
    },
    _lifetime: true,
    _henrik: entry,
  };
}

// ---------------------------------------------------------------------------
// Agent name helpers
// ---------------------------------------------------------------------------

/**
 * Capitalize an agentId string.
 * Henrik v3 returns lowercase names ("jett", "sage", "killjoy").
 * Riot API returns UUIDs — show first 8 chars + "…" as a safe fallback.
 */
export function capitalizeAgent(agentId) {
  if (!agentId) return "Unknown";
  // UUID heuristic: 8-4-4-4-12 pattern
  if (/^[0-9a-f]{8}-/i.test(agentId)) return agentId.slice(0, 8) + "…";
  // Lowercase name: capitalize first letter only (handles multi-word like "KAY/O")
  return agentId.charAt(0).toUpperCase() + agentId.slice(1);
}

// ---------------------------------------------------------------------------
// Agent name helpers
// ---------------------------------------------------------------------------

/**
 * Group matchStats + raw matches by map name and compute per-map performance.
 * `matchStats[i]` corresponds to `matches[i]` by index.
 */
export function getMapStats(matchStats, matches) {
  const mapMap = {};
  for (let i = 0; i < matchStats.length; i++) {
    const s = matchStats[i];
    const m = matches[i];
    if (!s || !m) continue;
    const mapName = m.info?.mapId?.split("/").pop() || m.map || "Unknown";
    if (!mapMap[mapName]) {
      mapMap[mapName] = { map: mapName, games: 0, wins: 0, totalAcs: 0, totalKills: 0, totalDeaths: 0 };
    }
    const entry = mapMap[mapName];
    entry.games++;
    if (s.won && !s.drew) entry.wins++;
    entry.totalAcs += s.acs;
    entry.totalKills += s.kills;
    entry.totalDeaths += s.deaths;
  }
  return Object.values(mapMap)
    .sort((a, b) => b.games - a.games)
    .map(e => ({
      map: e.map,
      games: e.games,
      winRate: parseFloat(((e.wins / e.games) * 100).toFixed(1)),
      acs: Math.round(e.totalAcs / e.games),
      kd: parseFloat((e.totalDeaths > 0 ? e.totalKills / e.totalDeaths : e.totalKills).toFixed(2)),
      // These require per-round data not available in Henrik v3 — reserved for future
      attackWinPct: null,
      defenseWinPct: null,
      firstDeaths: null,
    }));
}

// ---------------------------------------------------------------------------
// Full AI-analysis export payload
// ---------------------------------------------------------------------------

/**
 * Build the complete structured export payload suitable for AI analysis.
 * Fields that are unavailable in the current API shape are set to null
 * so the schema remains consistent for consumers.
 */
export function buildExportPayload(account, region, matches, puuid, aggregated, agentStats) {
  const mapStats = getMapStats(
    (matches || []).map(m => extractPlayerStats(m, puuid)).filter(Boolean),
    matches || []
  );

  const agents = (agentStats || []).map(a => ({
    agent: capitalizeAgent(a.agentId),
    games: a.games,
    winRate: a.winRate,
    acs: a.acs ?? null,
    kd: a.kd,
    hsPct: a.hsPct ?? null,
    firstBloodRate: null,
  }));

  const matchRows = (matches || []).map(m => {
    const s = extractPlayerStats(m, puuid);
    const info = m?.info || {};
    const mapName = info.mapId?.split("/").pop() || m.map || null;
    const durationSec = m.gameLength ?? null;
    // Score: derive from team round wins
    let score = null;
    if (m.teams && m.teams.length === 2) {
      const playerTeam = (m.teams || []).find(t => t.teamId === s?.teamId);
      const oppTeam = (m.teams || []).find(t => t.teamId !== s?.teamId);
      if (playerTeam && oppTeam) {
        score = `${playerTeam.roundsWon ?? "?"}–${oppTeam.roundsWon ?? "?"}`;
      }
    }
    return {
      matchId: m.matchId || null,
      date: info.gameStartMillis
        ? new Date(info.gameStartMillis).toISOString().slice(0, 10)
        : null,
      map: mapName,
      agent: s ? capitalizeAgent(s.agentId) : null,
      mode: info.gameMode || m.mode || null,
      score,
      result: s ? (s.drew ? "Draw" : s.won ? "Win" : "Loss") : null,
      kills: s?.kills ?? null,
      deaths: s?.deaths ?? null,
      assists: s?.assists ?? null,
      kd: s?.kd ?? null,
      acs: s?.acs ?? null,
      hsPct: s?.hsPct ?? null,
      damage: null,        // not exposed by Henrik v3 match endpoint
      durationSeconds: durationSec,
    };
  });

  return {
    exportedAt: new Date().toISOString(),
    player: account ? `${account.gameName}#${account.tagLine}` : null,
    region: region || null,
    matchesAnalyzed: matchRows.length,
    overallStats: {
      kd: aggregated.kd ?? null,
      winRate: aggregated.winRate ?? null,
      hsPct: aggregated.hsPct ?? null,
      acs: aggregated.acs ?? null,
      kills: aggregated.kills ?? null,
      deaths: aggregated.deaths ?? null,
      assists: aggregated.assists ?? null,
      wins: aggregated.wins ?? null,
      avgKills: aggregated.kills && aggregated.gamesPlayed
        ? parseFloat((aggregated.kills / aggregated.gamesPlayed).toFixed(2))
        : null,
      avgDeaths: aggregated.deaths && aggregated.gamesPlayed
        ? parseFloat((aggregated.deaths / aggregated.gamesPlayed).toFixed(2))
        : null,
      avgAssists: aggregated.assists && aggregated.gamesPlayed
        ? parseFloat((aggregated.assists / aggregated.gamesPlayed).toFixed(2))
        : null,
      // Not available in current API shape
      damagePerRound: null,
      firstBloods: null,
      firstDeaths: null,
      clutchSuccessRate: null,
      kastPct: null,
    },
    agents,
    maps: mapStats,
    roundImpact: {
      openingDuelSuccessRate: null,
      tradeKills: null,
      tradedDeaths: null,
      multiKillRounds: null,
      ecoPerformance: null,
      antiEcoPerformance: null,
    },
    weapons: [],  // Henrik v3 does not expose per-weapon breakdown in match detail
    teamImpact: {
      spikePlants: null,
      spikeDefuses: null,
      clutchAttempts: null,
      clutchWins: null,
    },
    matches: matchRows,
  };
}

export const AVG_STATS_BY_RANK = {
  Iron: { kd: 0.75, acs: 140, hsPct: 14, winRate: 48 },
  Bronze: { kd: 0.85, acs: 155, hsPct: 16, winRate: 49 },
  Silver: { kd: 0.95, acs: 170, hsPct: 18, winRate: 49 },
  Gold: { kd: 1.05, acs: 190, hsPct: 20, winRate: 50 },
  Platinum: { kd: 1.15, acs: 210, hsPct: 22, winRate: 50 },
  Diamond: { kd: 1.25, acs: 230, hsPct: 24, winRate: 51 },
  Ascendant: { kd: 1.35, acs: 250, hsPct: 26, winRate: 51 },
  Immortal: { kd: 1.5, acs: 280, hsPct: 28, winRate: 52 },
  Radiant: { kd: 1.8, acs: 320, hsPct: 30, winRate: 55 },
};

export function groupMatchesByDay(matches) {
  const groups = {};
  matches.forEach(match => {
    const ms = match.info?.gameStartMillis;
    let dateStr = "Unknown Date";
    
    if (ms) {
      const d = new Date(ms);
      if (!isNaN(d.getTime())) {
        dateStr = d.toLocaleDateString(undefined, {
          weekday: 'long',
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        });
      }
    }
    
    if (!groups[dateStr]) {
      groups[dateStr] = [];
    }
    groups[dateStr].push(match);
  });
  
  return Object.entries(groups).map(([date, matches]) => ({
    date,
    matches
  }));
}

