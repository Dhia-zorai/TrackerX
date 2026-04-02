export function computeMatchStats(rawMatch, puuid) {
  const metadata = rawMatch?.metadata || {};
  const matchId = metadata.matchid || 'unknown';
  const matchDate = metadata.game_start ? new Date(metadata.game_start * 1000).toISOString() : new Date().toISOString();

  if (!rawMatch || !rawMatch.players || !rawMatch.players.all_players) {
    return createEmptyStats(puuid, matchId, matchDate);
  }

  const player = rawMatch.players.all_players.find(p => p.puuid === puuid);
  if (!player) {
    return createEmptyStats(puuid, matchId, matchDate);
  }

  const teamId = player.team; // "Red" or "Blue"
  const stats = player.stats || {};
  const kills = stats.kills || 0;
  const deaths = stats.deaths || 0;
  const assists = stats.assists || 0;
  const score = Math.round(stats.score || 0);

  const hsHits = stats.headshots || 0;
  const bodyHits = stats.bodyshots || 0;
  const legHits = stats.legshots || 0;
  const totalHits = hsHits + bodyHits + legHits;
  const hsPct = totalHits > 0 ? (hsHits / totalHits) * 100 : 0;

  const rounds = rawMatch.rounds || [];
  const roundsPlayed = rounds.length > 0 ? rounds.length : 1;
  const acs = Math.round(score / roundsPlayed);
  const kd = deaths > 0 ? kills / deaths : kills;

  const redTeam = rawMatch.teams?.red || {};
  const blueTeam = rawMatch.teams?.blue || {};
  
  let result = 'Draw';
  if (teamId === 'Red') {
    if (redTeam.has_won) result = 'Win';
    else if (blueTeam.has_won) result = 'Loss';
  } else if (teamId === 'Blue') {
    if (blueTeam.has_won) result = 'Win';
    else if (redTeam.has_won) result = 'Loss';
  }

  const rrChange = player.mmr_change_to_last_game ?? null;
  const agent = player.character?.toLowerCase() || player.character || 'unknown';

  let sideAttackRounds = 0;
  let sideDefenseRounds = 0;
  let sideAttackWins = 0;
  let sideDefenseWins = 0;
  let passedKastRounds = 0;
  let firstBloods = 0;
  let firstDeaths = 0;
  let damageTotal = 0;

  if (rounds.length > 0) {
    rounds.forEach((round, roundIndex) => {
      // Standard: First 12 rounds Red attacks, Blue defends
      const isRedAttack = roundIndex < 12;
      const isAttack = (teamId === 'Red' && isRedAttack) || (teamId === 'Blue' && !isRedAttack);
      const isDefense = !isAttack;

      if (isAttack) sideAttackRounds++;
      else sideDefenseRounds++;

      const roundWon = round.winning_team === teamId;
      if (roundWon && isAttack) sideAttackWins++;
      if (roundWon && isDefense) sideDefenseWins++;

      let k = false, a = false, s = true, t = false;
      const killEvents = round.kill_events || [];
      
      if (killEvents.length > 0) {
        const sortedKills = [...killEvents].sort((x, y) => x.kill_time_in_round - y.kill_time_in_round);
        const fbEvent = sortedKills[0];
        if (fbEvent.killer_puuid === puuid) firstBloods++;
        if (fbEvent.victim_puuid === puuid) firstDeaths++;
      }

      killEvents.forEach(ke => {
        if (ke.killer_puuid === puuid) k = true;
        if (ke.assistants && ke.assistants.some(ast => ast.assistant_puuid === puuid)) a = true;
        if (ke.victim_puuid === puuid) {
          s = false; // died
          const deathTime = ke.kill_time_in_match;
          const killer = ke.killer_puuid;
          const traded = killEvents.some(k2 => k2.victim_puuid === killer && k2.kill_time_in_match > deathTime && (k2.kill_time_in_match - deathTime) <= 5000);
          if (traded) t = true;
        }
      });

      if (k || a || s || t) passedKastRounds++;

      const pStats = (round.player_stats || []).find(p => p.player_puuid === puuid);
      if (pStats && pStats.damage) {
        damageTotal += pStats.damage;
      } else if (pStats && pStats.damage_events) {
        // Fallback if damage is an array of events
        pStats.damage_events.forEach(de => {
          if (de.receiver_puuid !== puuid) damageTotal += (de.damage || 0);
        });
      }
    });
  } else {
    passedKastRounds = null;
    firstBloods = null;
    firstDeaths = null;
    sideAttackRounds = null;
    sideDefenseRounds = null;
    sideAttackWins = null;
    sideDefenseWins = null;
    damageTotal = null;
  }

  const kastPct = passedKastRounds !== null ? (passedKastRounds / roundsPlayed) * 100 : null;
  const damagePerRound = damageTotal !== null ? damageTotal / roundsPlayed : null;

  return {
    puuid,
    match_id: matchId,
    agent,
    result,
    kills,
    deaths,
    assists,
    acs,
    kd: parseFloat(kd.toFixed(2)),
    hs_pct: parseFloat(hsPct.toFixed(2)),
    score,
    rr_change: rrChange,
    rounds_played: roundsPlayed,
    side_attack_rounds: sideAttackRounds,
    side_defense_rounds: sideDefenseRounds,
    side_attack_wins: sideAttackWins,
    side_defense_wins: sideDefenseWins,
    kast_pct: kastPct !== null ? parseFloat(kastPct.toFixed(2)) : null,
    first_bloods: firstBloods,
    first_deaths: firstDeaths,
    damage_total: damageTotal,
    damage_per_round: damagePerRound !== null ? parseFloat(damagePerRound.toFixed(2)) : null,
    match_date: matchDate
  };
}

function createEmptyStats(puuid, matchId, matchDate) {
  return {
    puuid,
    match_id: matchId,
    agent: null,
    result: null,
    kills: null,
    deaths: null,
    assists: null,
    acs: null,
    kd: null,
    hs_pct: null,
    score: null,
    rr_change: null,
    rounds_played: null,
    side_attack_rounds: null,
    side_defense_rounds: null,
    side_attack_wins: null,
    side_defense_wins: null,
    kast_pct: null,
    first_bloods: null,
    first_deaths: null,
    damage_total: null,
    damage_per_round: null,
    match_date: matchDate
  };
}
