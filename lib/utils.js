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

export function formatRiotId(gameName, tagLine) {
  return gameName + "#" + tagLine;
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

export function formatRatio(n) {
  if (n == null || isNaN(n)) return "0.00";
  return parseFloat(n).toFixed(2);
}

export function formatPct(n) {
  if (n == null || isNaN(n)) return "0%";
  return Math.round(n) + "%";
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
  const teamId = player.teamId;
  const team = (match.teams || []).find(t => t.teamId === teamId);
  const won = team ? team.won === true : false;
  const drew = (match.teams || []).every(t => !t.won);
  return {
    kills, deaths, assists,
    kd: parseFloat(kd.toFixed(2)),
    acs, hsPct: parseFloat(hsPct.toFixed(1)),
    agentId: player.characterId,
    teamId, won, drew, roundsPlayed, score,
    gameName: player.gameName,
    tagLine: player.tagLine,
  };
}

export function aggregateStats(statsArray) {
  const valid = (statsArray || []).filter(Boolean);
  if (valid.length === 0) return { kd: 0, acs: 0, hsPct: 0, winRate: 0, kills: 0, deaths: 0, assists: 0, gamesPlayed: 0, wins: 0 };
  const gamesPlayed = valid.length;
  const wins = valid.filter(s => s.won && !s.drew).length;
  const totalKills = valid.reduce((a, s) => a + s.kills, 0);
  const totalDeaths = valid.reduce((a, s) => a + s.deaths, 0);
  const totalAssists = valid.reduce((a, s) => a + s.assists, 0);
  return {
    gamesPlayed, wins,
    winRate: parseFloat(((wins / gamesPlayed) * 100).toFixed(1)),
    kills: totalKills, deaths: totalDeaths, assists: totalAssists,
    kd: parseFloat((totalDeaths > 0 ? totalKills / totalDeaths : totalKills).toFixed(2)),
    acs: Math.round(valid.reduce((a, s) => a + s.acs, 0) / gamesPlayed),
    hsPct: parseFloat((valid.reduce((a, s) => a + s.hsPct, 0) / gamesPlayed).toFixed(1)),
  };
}

export function getAgentStats(statsArray) {
  const agentMap = {};
  for (const s of (statsArray || [])) {
    if (!s || !s.agentId) continue;
    if (!agentMap[s.agentId]) agentMap[s.agentId] = { agentId: s.agentId, games: 0, wins: 0, kills: 0, deaths: 0 };
    agentMap[s.agentId].games++;
    if (s.won && !s.drew) agentMap[s.agentId].wins++;
    agentMap[s.agentId].kills += s.kills;
    agentMap[s.agentId].deaths += s.deaths;
  }
  return Object.values(agentMap)
    .sort((a, b) => b.games - a.games)
    .map(a => ({ ...a,
      winRate: parseFloat(((a.wins / a.games) * 100).toFixed(1)),
      kd: parseFloat((a.deaths > 0 ? a.kills / a.deaths : a.kills).toFixed(2)),
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

// Normalize a Henrik v3 match object into the shape extractPlayerStats() expects.
// Henrik: players.all_players[], teams.red/blue, metadata
// Official: players[], teams[], info.roundsPlayed
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
    info: { roundsPlayed },
    // Keep raw for any components that need it
    _henrik: henrikMatch,
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