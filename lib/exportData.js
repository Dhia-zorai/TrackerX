import { extractPlayerStats, capitalizeAgent } from './utils';
import { computeMatchStats } from './computeMatchStats';

export function exportFullJSON(account, region, matches, puuid, aggregated, agentStats, filename) {
  const payload = buildExportPayload(account, region, matches, puuid, aggregated, agentStats);
  const fname = filename || `${account?.gameName || 'player'}-trackerx.json`;
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fname;
  a.click();
  URL.revokeObjectURL(url);
}

function buildExportPayload(account, region, matches, puuid, aggregated, agentStats) {
  const mapMap = {};
  
  let sumKast = 0, countKast = 0;
  let totalFb = 0, totalFd = 0;
  let sumDpr = 0, countDpr = 0;
  let globalAtkRounds = 0, globalAtkWins = 0;
  let globalDefRounds = 0, globalDefWins = 0;
  let matchesWithFbData = 0;

  const matchRows = (matches || []).map(m => {
    const s = extractPlayerStats(m, puuid);
    const info = m?.info || {};
    const mapName = info.mapId?.split("/").pop() || m.map || "Unknown";
    const durationSec = m.gameLength ?? null;
    
    // We compute advanced stats directly from the raw match JSON
    const advanced = m._henrik ? computeMatchStats(m._henrik, puuid) : computeMatchStats(m, puuid);

    let score = null;
    if (m.teams && m.teams.length === 2) {
      const playerTeam = m.teams.find(t => t.teamId === s?.teamId);
      const oppTeam = m.teams.find(t => t.teamId !== s?.teamId);
      if (playerTeam && oppTeam) {
        score = `${playerTeam.roundsWon ?? "?"}–${oppTeam.roundsWon ?? "?"}`;
      }
    }

    // Accumulate advanced stats for overall & map
    if (advanced.kast_pct !== null) { sumKast += advanced.kast_pct; countKast++; }
    if (advanced.first_bloods !== null || advanced.first_deaths !== null) {
      if (advanced.first_bloods !== null) totalFb += advanced.first_bloods;
      if (advanced.first_deaths !== null) totalFd += advanced.first_deaths;
      matchesWithFbData++;
    }
    if (advanced.damage_per_round !== null) { sumDpr += advanced.damage_per_round; countDpr++; }
    if (advanced.side_attack_rounds !== null) {
      globalAtkRounds += advanced.side_attack_rounds;
      globalAtkWins += advanced.side_attack_wins;
    }
    if (advanced.side_defense_rounds !== null) {
      globalDefRounds += advanced.side_defense_rounds;
      globalDefWins += advanced.side_defense_wins;
    }

    // Map stats tracking
    if (!mapMap[mapName]) {
      mapMap[mapName] = { 
        map: mapName, games: 0, wins: 0, totalAcs: 0, totalKills: 0, totalDeaths: 0,
        atkRounds: 0, atkWins: 0, defRounds: 0, defWins: 0,
        sumKast: 0, countKast: 0, sumDpr: 0, countDpr: 0
      };
    }
    const mm = mapMap[mapName];
    mm.games++;
    if (s?.won && !s?.drew) mm.wins++;
    if (s?.acs) mm.totalAcs += s.acs;
    if (s?.kills) mm.totalKills += s.kills;
    if (s?.deaths) mm.totalDeaths += s.deaths;
    
    if (advanced.side_attack_rounds !== null) {
      mm.atkRounds += advanced.side_attack_rounds;
      mm.atkWins += advanced.side_attack_wins;
    }
    if (advanced.side_defense_rounds !== null) {
      mm.defRounds += advanced.side_defense_rounds;
      mm.defWins += advanced.side_defense_wins;
    }
    if (advanced.kast_pct !== null) { mm.sumKast += advanced.kast_pct; mm.countKast++; }
    if (advanced.damage_per_round !== null) { mm.sumDpr += advanced.damage_per_round; mm.countDpr++; }

    // Ranks from basic stats extraction
    const currentRank = s?.currentTierName || null;
    // We don't have peak rank in match history natively, but we include current
    
    return {
      matchId: m.matchId || null,
      date: info.gameStartMillis ? new Date(info.gameStartMillis).toISOString().slice(0, 10) : null,
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
      bodyPct: s?.bodyPct ?? null,
      legPct: s?.legPct ?? null,
      kpPct: s?.kpPct ?? null,
      kpr: s?.kpr ?? null,
      damage: advanced.damage_total,
      durationSeconds: durationSec,
      currentRank: currentRank,
      peakRank: null, // Omitted as per match it's unavailable, but schema stays compliant
      kastPct: advanced.kast_pct,
      firstBloods: advanced.first_bloods,
      firstDeaths: advanced.first_deaths,
      damageTotal: advanced.damage_total,
      damagePerRound: advanced.damage_per_round,
      sideAttackRounds: advanced.side_attack_rounds,
      sideDefenseRounds: advanced.side_defense_rounds,
      sideAttackWins: advanced.side_attack_wins,
      sideDefenseWins: advanced.side_defense_wins
    };
  });

  const mapStats = Object.values(mapMap).sort((a, b) => b.games - a.games).map(e => ({
    map: e.map,
    games: e.games,
    winRate: parseFloat(((e.wins / e.games) * 100).toFixed(1)),
    acs: Math.round(e.totalAcs / e.games),
    kd: parseFloat((e.totalDeaths > 0 ? e.totalKills / e.totalDeaths : e.totalKills).toFixed(2)),
    attackWinPct: e.atkRounds > 0 ? parseFloat(((e.atkWins / e.atkRounds) * 100).toFixed(1)) : null,
    defenseWinPct: e.defRounds > 0 ? parseFloat(((e.defWins / e.defRounds) * 100).toFixed(1)) : null,
    avgKast: e.countKast > 0 ? parseFloat((e.sumKast / e.countKast).toFixed(1)) : null,
    avgDamagePerRound: e.countDpr > 0 ? parseFloat((e.sumDpr / e.countDpr).toFixed(1)) : null
  }));

  const agents = (agentStats || []).map(a => ({
    agent: capitalizeAgent(a.agentId),
    games: a.games,
    winRate: a.winRate,
    acs: a.acs ?? null,
    kd: a.kd,
    hsPct: a.hsPct ?? null,
    firstBloodRate: null,
  }));

  return {
    exportedAt: new Date().toISOString(),
    player: account ? `${account.gameName}#${account.tagLine}` : null,
    region: region || null,
    matchesAnalyzed: matchRows.length,
    overallStats: {
      kd: aggregated.kd ?? null,
      winRate: aggregated.winRate ?? null,
      hsPct: aggregated.hsPct ?? null,
      bodyPct: aggregated.bodyPct ?? null,
      legPct: aggregated.legPct ?? null,
      kpPct: aggregated.kpPct ?? null,
      kpr: aggregated.kpr ?? null,
      acs: aggregated.acs ?? null,
      kills: aggregated.kills ?? null,
      deaths: aggregated.deaths ?? null,
      assists: aggregated.assists ?? null,
      wins: aggregated.wins ?? null,
      avgKills: aggregated.kills && aggregated.gamesPlayed ? parseFloat((aggregated.kills / aggregated.gamesPlayed).toFixed(2)) : null,
      avgDeaths: aggregated.deaths && aggregated.gamesPlayed ? parseFloat((aggregated.deaths / aggregated.gamesPlayed).toFixed(2)) : null,
      avgAssists: aggregated.assists && aggregated.gamesPlayed ? parseFloat((aggregated.assists / aggregated.gamesPlayed).toFixed(2)) : null,
      avgKast: countKast > 0 ? parseFloat((sumKast / countKast).toFixed(1)) : null,
      totalFirstBloods: totalFb,
      totalFirstDeaths: totalFd,
      avgDamagePerRound: countDpr > 0 ? parseFloat((sumDpr / countDpr).toFixed(1)) : null,
      attackWinPct: globalAtkRounds > 0 ? parseFloat(((globalAtkWins / globalAtkRounds) * 100).toFixed(1)) : null,
      defenseWinPct: globalDefRounds > 0 ? parseFloat(((globalDefWins / globalDefRounds) * 100).toFixed(1)) : null,
      clutchSuccessRate: null
    },
    agents,
    maps: mapStats,
    roundImpact: {
      openingDuelSuccessRate: totalFb !== null && totalFd !== null && (totalFb + totalFd) > 0 ? parseFloat(((totalFb / (totalFb + totalFd)) * 100).toFixed(1)) : null,
      firstBloodRate: matchesWithFbData > 0 ? parseFloat(((totalFb / (globalAtkRounds + globalDefRounds || matchesWithFbData)) * 100).toFixed(1)) : null, // this depends on how we define it, let's keep it simple

      tradeKills: null,
      tradedDeaths: null,
      multiKillRounds: null,
      ecoPerformance: null,
      antiEcoPerformance: null,
    },
    weapons: [],
    teamImpact: {
      spikePlants: null,
      spikeDefuses: null,
      clutchAttempts: null,
      clutchWins: null,
    },
    matches: matchRows,
  };
}
