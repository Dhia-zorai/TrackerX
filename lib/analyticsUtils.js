function isCompetitiveMatch(match) {
  const mode = (match?.mode || match?.queue || match?.info?.gameMode || "").toLowerCase();
  return mode === "competitive";
}

function safeNum(v) {
  return typeof v === "number" && Number.isFinite(v) ? v : null;
}

export function computeKastTrend(matches) {
  const list = Array.isArray(matches) ? matches : [];
  const filtered = list
    .filter((m) => isCompetitiveMatch(m) && safeNum(m.kast_pct) !== null)
    .sort((a, b) => new Date(a.match_date || 0).getTime() - new Date(b.match_date || 0).getTime());

  return filtered.map((m, i) => ({
    index: i + 1,
    kast_pct: Number(m.kast_pct),
  }));
}

export function computeSideWinRates(matches) {
  const list = Array.isArray(matches) ? matches : [];
  const mapAgg = {};

  for (const m of list) {
    if (!isCompetitiveMatch(m)) continue;
    const map = m?.map || "Unknown";
    if (!mapAgg[map]) {
      mapAgg[map] = {
        map,
        games: 0,
        attackRounds: 0,
        attackWins: 0,
        defenseRounds: 0,
        defenseWins: 0,
      };
    }

    const entry = mapAgg[map];
    entry.games += 1;
    entry.attackRounds += safeNum(m.side_attack_rounds) || 0;
    entry.attackWins += safeNum(m.side_attack_wins) || 0;
    entry.defenseRounds += safeNum(m.side_defense_rounds) || 0;
    entry.defenseWins += safeNum(m.side_defense_wins) || 0;
  }

  return Object.values(mapAgg)
    .filter((e) => e.games >= 2)
    .map((e) => {
      const attackWinPct = e.attackRounds > 0 ? (e.attackWins / e.attackRounds) * 100 : null;
      const defenseWinPct = e.defenseRounds > 0 ? (e.defenseWins / e.defenseRounds) * 100 : null;
      return {
        map: e.map,
        attackWinPct,
        defenseWinPct,
        games: e.games,
      };
    })
    .filter((e) => !(e.attackWinPct === null && e.defenseWinPct === null))
    .sort((a, b) => b.games - a.games);
}

export function computeOpeningDuelStats(matches) {
  const list = Array.isArray(matches) ? matches : [];
  let fbCount = 0;
  let fdCount = 0;
  let fbMatches = 0;
  let fdMatches = 0;

  for (const m of list) {
    if (!isCompetitiveMatch(m)) continue;

    const fb = safeNum(m.first_bloods);
    const fd = safeNum(m.first_deaths);

    if (fb !== null) {
      fbCount += fb;
      fbMatches += 1;
    }
    if (fd !== null) {
      fdCount += fd;
      fdMatches += 1;
    }
  }

  const firstBloodRate = fbMatches > 0 ? (fbCount / fbMatches) * 100 : null;
  const firstDeathRate = fdMatches > 0 ? (fdCount / fdMatches) * 100 : null;

  return {
    firstBloodRate,
    firstDeathRate,
    fbCount,
    fdCount,
    totalMatches: Math.max(fbMatches, fdMatches),
    fbMatches,
    fdMatches,
  };
}

export function computeMapRankings(matches) {
  const list = Array.isArray(matches) ? matches : [];
  const mapAgg = {};

  for (const m of list) {
    if (!isCompetitiveMatch(m)) continue;
    const map = m?.map || "Unknown";
    if (!mapAgg[map]) {
      mapAgg[map] = { map, games: 0, wins: 0, kdSum: 0, kdCount: 0 };
    }

    const entry = mapAgg[map];
    entry.games += 1;
    if (m.result === "Win") entry.wins += 1;

    const kd = safeNum(m.kd);
    if (kd !== null) {
      entry.kdSum += kd;
      entry.kdCount += 1;
    }
  }

  const ranked = Object.values(mapAgg)
    .filter((e) => e.games >= 3)
    .map((e) => {
      const winRate = (e.wins / e.games) * 100;
      const kd = e.kdCount > 0 ? e.kdSum / e.kdCount : 0;
      const combinedScore = (winRate * 0.6) + (kd * 20 * 0.4);
      return { map: e.map, winRate, kd, combinedScore, games: e.games };
    })
    .sort((a, b) => b.combinedScore - a.combinedScore);

  if (ranked.length < 2) {
    return { best: null, worst: null };
  }

  const best = ranked[0];
  const worst = ranked[ranked.length - 1];

  return {
    best: { map: best.map, winRate: best.winRate, kd: best.kd },
    worst: { map: worst.map, winRate: worst.winRate, kd: worst.kd },
  };
}
