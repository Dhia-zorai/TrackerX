"use client";
import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ArrowUp, ArrowDown, Loader2 } from "lucide-react";
import Link from "next/link";
import { extractPlayerStats, timeAgo, capitalizeAgent, encodeRiotIdForUrl } from "@/lib/utils";
import { computeMatchStats } from "@/lib/computeMatchStats";
import { AgentIcon } from "@/components/ui/AgentIcon";
import { MapImage } from "@/components/ui/MapImage";

// Helper: Sort team by stat
function getSortedTeam(team, sortBy, sortOrder) {
  if (!sortBy) return team;
  
  const sorted = [...team].sort((a, b) => {
    let aVal, bVal;
    
    if (sortBy === 'acs') {
      // ACS is calculated from score, not stored directly
      aVal = a.stats?.score ? Math.round(a.stats.score / 12) : 0;
      bVal = b.stats?.score ? Math.round(b.stats.score / 12) : 0;
    } else {
      // For kills, deaths, assists - access directly from stats
      aVal = a.stats?.[sortBy] ?? 0;
      bVal = b.stats?.[sortBy] ?? 0;
    }
    
    if (sortOrder === 'desc') return bVal - aVal;
    return aVal - bVal;
  });
  
  return sorted;
}

// StatButton: Clickable stat header with sort indicators
function StatButton({ label, onStatClick, currentSort, currentOrder, statKey }) {
  const isActive = currentSort === statKey;
  



  return (

    <button
      onClick={() => onStatClick(statKey)}
      className={'px-3 py-1.5 rounded-md font-bold text-[10px] uppercase tracking-wider transition-all cursor-pointer border flex flex-col items-center gap-1.5 ' +
        (isActive 
          ? 'bg-[var(--accent)]/20 text-[var(--accent)] border-[var(--accent)] shadow-sm' 
          : 'border-[var(--border)] text-[var(--text-secondary)] bg-[var(--bg-card)] hover:border-[var(--accent)] hover:text-[var(--accent)] hover:shadow-sm'
        )}
      title="Click to sort"
    >
      <span className='leading-none'>{label}</span>
      <div className='flex gap-0'>
        <ArrowUp size={8} strokeWidth={3} />
        <ArrowDown size={8} strokeWidth={3} />
      </div>
    </button>
  );
}

function ResultChip({ won, drew }) {
  if (drew) return <span className="chip-draw text-[10px] px-2 py-0.5 rounded font-bold tracking-wide">DRAW</span>;
  if (won)  return <span className="chip-win  text-[10px] px-2 py-0.5 rounded font-bold tracking-wide">WIN</span>;
  return          <span className="chip-loss text-[10px] px-2 py-0.5 rounded font-bold tracking-wide">LOSS</span>;
}

function ScoreboardRow({ player, isHighlighted, currentPuuid, region }) {
  const stats = player.stats || {};
  const acs = stats.score ? Math.round(stats.score / Math.max(1, 12)) : 0;
  const hasValidName = player.gameName && player.tagLine;
  const isCurrentPlayer = player.puuid === currentPuuid;
  const playerName = hasValidName ? `${player.gameName}#${player.tagLine}` : 'Unknown';
  
  const playerLink = hasValidName && !isCurrentPlayer
    ? `/player/${encodeRiotIdForUrl(player.gameName, player.tagLine)}?region=${region || 'eu'}`
    : null;

  return (
    <div className={
      'flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs ' +
      (isHighlighted ? 'bg-[var(--accent-dim)] border border-[var(--border-accent)]' : 'hover:bg-[var(--bg-card)]')
    }>
      <AgentIcon
        agentName={player.characterId}
        size={16}
        className='rounded shrink-0'
      />
      {playerLink ? (
        <Link href={playerLink} className="flex-1 font-medium truncate text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors duration-150 cursor-pointer no-underline">
          {playerName}
        </Link>
      ) : (
        <span className={'flex-1 font-medium truncate ' + (isHighlighted ? 'text-[var(--accent)]' : 'text-[var(--text-muted)]')}>
          {playerName}
        </span>
      )}
      <span className="w-16 text-center tabular-nums text-[var(--text-secondary)]">
        {stats.kills || 0}/{stats.deaths || 0}/{stats.assists || 0}
      </span>
      <span className="w-10 text-center tabular-nums text-[var(--text-secondary)]">{acs}</span>
    </div>
  );
}

// Fetch full match details for lazy loading
async function fetchMatchDetails(matchId) {
  const res = await fetch(`/api/riot/match-detail?matchId=${encodeURIComponent(matchId)}`);
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Failed to fetch match details');
  }
  return res.json();
}

  function renderAdvancedStats(pStats) {
    if (!pStats) return null;

    // Check if we have any advanced data to show
    const hasAdvancedData = 
      pStats.firstBloods !== null || 
      pStats.ecoRounds !== null || 
      pStats.multiKillRounds !== null ||
      pStats.spikePlants !== null;

    if (!hasAdvancedData) return null;

    return (
      <div className="mt-2 pt-4 border-t border-[var(--border)]">
        <p className="text-[10px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-3 px-1">
          Advanced Match Metrics
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Duels & Trades */}
          <div className="bg-[var(--bg-card)] rounded-lg p-3 border border-[var(--border)]">
            <p className="text-[10px] font-semibold text-[var(--text-muted)] uppercase mb-2">Duels & Trades</p>
            <div className="flex justify-between text-xs mb-1.5">
              <span className="text-[var(--text-secondary)]">First Bloods</span>
              <span className="font-medium text-[var(--win)]">{pStats.firstBloods ?? 0}</span>
            </div>
            <div className="flex justify-between text-xs mb-1.5">
              <span className="text-[var(--text-secondary)]">First Deaths</span>
              <span className="font-medium text-[var(--loss)]">{pStats.firstDeaths ?? 0}</span>
            </div>
            <div className="flex justify-between text-xs mb-1.5">
              <span className="text-[var(--text-secondary)]">Trade Kills</span>
              <span className="font-medium text-[var(--accent)]">{pStats.tradeKills ?? 0}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-[var(--text-secondary)]">Traded Deaths</span>
              <span className="font-medium text-[var(--text-primary)]">{pStats.tradedDeaths ?? 0}</span>
            </div>
          </div>

          {/* Objectives */}
          <div className="bg-[var(--bg-card)] rounded-lg p-3 border border-[var(--border)]">
            <p className="text-[10px] font-semibold text-[var(--text-muted)] uppercase mb-2">Objective</p>
            <div className="flex justify-between text-xs mb-1.5">
              <span className="text-[var(--text-secondary)]">Spike Plants</span>
              <span className="font-medium text-[var(--text-primary)]">{pStats.spikePlants ?? 0}</span>
            </div>
            <div className="flex justify-between text-xs mb-1.5">
              <span className="text-[var(--text-secondary)]">Spike Defuses</span>
              <span className="font-medium text-[var(--text-primary)]">{pStats.spikeDefuses ?? 0}</span>
            </div>
            <div className="flex justify-between text-xs mb-1.5">
              <span className="text-[var(--text-secondary)]">Clutches Won</span>
              <span className="font-medium text-[var(--accent)]">{pStats.clutches ?? 0} <span className="text-[var(--text-muted)] text-[10px]">/ {pStats.clutchAttempts ?? 0}</span></span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-[var(--text-secondary)]">Eco Rounds</span>
              <span className="font-medium text-[var(--text-primary)]">{pStats.ecoRounds ?? 0}</span>
            </div>
          </div>

          {/* Multi-Kills */}
          <div className="bg-[var(--bg-card)] rounded-lg p-3 border border-[var(--border)]">
            <p className="text-[10px] font-semibold text-[var(--text-muted)] uppercase mb-2">Multi-Kills</p>
            <div className="grid grid-cols-4 gap-1 text-center h-[calc(100%-24px)] items-center">
              <div className="flex flex-col justify-center">
                <span className="text-[10px] text-[var(--text-secondary)] mb-1">2K</span>
                <span className="font-bold text-[var(--text-primary)]">{pStats.multiKillRounds?.['2'] ?? 0}</span>
              </div>
              <div className="flex flex-col justify-center">
                <span className="text-[10px] text-[var(--text-secondary)] mb-1">3K</span>
                <span className="font-bold text-[var(--text-primary)]">{pStats.multiKillRounds?.['3'] ?? 0}</span>
              </div>
              <div className="flex flex-col justify-center">
                <span className="text-[10px] text-[var(--text-secondary)] mb-1">4K</span>
                <span className="font-bold text-[var(--text-primary)]">{pStats.multiKillRounds?.['4'] ?? 0}</span>
              </div>
              <div className="flex flex-col justify-center bg-[var(--win-dim)] rounded py-1">
                <span className="text-[10px] text-[var(--win)] font-bold mb-1">ACE</span>
                <span className="font-bold text-[var(--win)]">{pStats.multiKillRounds?.['5'] ?? 0}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

export default function MatchCard({ match, puuid, region, analytics }) {
  const [expanded, setExpanded] = useState(false);
  const [sortBy, setSortBy] = useState(null);
  const [sortOrder, setSortOrder] = useState('desc');
  
  // Lazy loading state
  const [fullMatchData, setFullMatchData] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [loadError, setLoadError] = useState(null);

  // Use full match data if available, otherwise use original match
  const activeMatch = fullMatchData || match;
  
  // Extract player stats (may be null if match/puuid invalid)
  const playerStats = useMemo(() => {
    if (!match) return null;
    const stats = extractPlayerStats(activeMatch, puuid);
    if (!stats) return null;
    
    // Add advanced stats from raw if available
    let advanced = { 
      kastPct: null, firstBloods: null, firstDeaths: null,
      clutches: null, clutchAttempts: null, multiKills: null,
      spikePlants: null, spikeDefuses: null,
      tradeKills: null, tradedDeaths: null, ecoRounds: null,
      multiKillRounds: null
    };
    
    // 1. Try to compute from Henrik rounds array (most accurate for v3)
    if (activeMatch._henrik && Array.isArray(activeMatch._henrik.rounds) && activeMatch._henrik.rounds.length > 0) {
      const computed = computeMatchStats(activeMatch._henrik, puuid);
      advanced.kastPct = computed.kast_pct;
      advanced.firstBloods = computed.first_bloods;
      advanced.firstDeaths = computed.first_deaths;
      advanced.clutches = computed.clutch_wins;
      advanced.clutchAttempts = computed.clutch_attempts;
      advanced.spikePlants = computed.spike_plants;
      advanced.spikeDefuses = computed.spike_defuses;
      advanced.tradeKills = computed.trade_kills;
      advanced.tradedDeaths = computed.traded_deaths;
      advanced.ecoRounds = computed.eco_rounds;
      advanced.multiKillRounds = computed.multi_kill_rounds;
      advanced.multiKills = computed.multi_kill_rounds ? 
        Object.entries(computed.multi_kill_rounds)
          .filter(([k, v]) => parseInt(k) >= 3 && v > 0)
          .reduce((sum, [k, v]) => sum + v, 0) : null;
    }
    
    // 2. Try to get from Henrik raw player stats (some API responses include it inline)
    if (advanced.kastPct == null && activeMatch._henrik) {
      const rawPlayer = activeMatch._henrik?.players?.all_players?.find(p => p.puuid === puuid);
      if (rawPlayer?.stats) {
        advanced.kastPct = rawPlayer.stats.kast_pct ?? rawPlayer.stats.kast ?? rawPlayer.stats.kastPercentage ?? null;
        advanced.firstBloods = rawPlayer.stats.first_bloods ?? rawPlayer.stats.first_kills ?? rawPlayer.stats.firstBloods ?? null;
      }
    }
    
    // 3. Try to get from analytics prop (passed down from parent pre-fetching)
    if (analytics) {
      advanced.kastPct = advanced.kastPct ?? analytics.kast_pct;
      advanced.firstBloods = advanced.firstBloods ?? analytics.first_bloods;
      advanced.firstDeaths = advanced.firstDeaths ?? analytics.first_deaths;
      advanced.clutches = advanced.clutches ?? analytics.clutch_wins;
      advanced.clutchAttempts = advanced.clutchAttempts ?? analytics.clutch_attempts;
      advanced.spikePlants = advanced.spikePlants ?? analytics.spike_plants;
      advanced.spikeDefuses = advanced.spikeDefuses ?? analytics.spike_defuses;
      advanced.tradeKills = advanced.tradeKills ?? analytics.trade_kills;
      advanced.tradedDeaths = advanced.tradedDeaths ?? analytics.traded_deaths;
      advanced.ecoRounds = advanced.ecoRounds ?? analytics.eco_rounds;
      advanced.multiKillRounds = advanced.multiKillRounds ?? analytics.multi_kill_rounds;
      advanced.multiKills = advanced.multiKills ?? (analytics.multi_kill_rounds ? 
        Object.entries(analytics.multi_kill_rounds)
          .filter(([k, v]) => parseInt(k) >= 3 && v > 0)
          .reduce((sum, [k, v]) => sum + v, 0) : null);
    }
    
    // 4. Fallback to match object if they were injected at the top level
    return {
      ...stats,
      kastPct: advanced.kastPct ?? activeMatch.kast_pct ?? activeMatch.kastPct ?? null,
      firstBloods: advanced.firstBloods ?? activeMatch.first_bloods ?? activeMatch.firstBloods ?? null,
      firstDeaths: advanced.firstDeaths ?? null,
      clutches: advanced.clutches ?? null,
      clutchAttempts: advanced.clutchAttempts ?? null,
      multiKills: advanced.multiKills ?? null,
      multiKillRounds: advanced.multiKillRounds ?? null,
      spikePlants: advanced.spikePlants ?? null,
      spikeDefuses: advanced.spikeDefuses ?? null,
      tradeKills: advanced.tradeKills ?? null,
      tradedDeaths: advanced.tradedDeaths ?? null,
      ecoRounds: advanced.ecoRounds ?? null,
    };
  }, [activeMatch, puuid, match, analytics]);

  // Derive match info
  const { info, mapName, gameMode, timestamp, teams, allPlayers, myTeam, enemyTeam, needsLazyLoad } = useMemo(() => {
    if (!match || !playerStats) {
      return { info: {}, mapName: 'Unknown', gameMode: 'Unrated', timestamp: 0, teams: [], allPlayers: [], myTeam: [], enemyTeam: [], needsLazyLoad: false };
    }
    
    const info = activeMatch.info || {};
    const mapName = info.mapId
      ? info.mapId.includes('/') ? info.mapId.split('/').pop() : info.mapId
      : 'Unknown';
    const gameMode = info.gameMode || 'Unrated';
    const timestamp = info.gameStartMillis || 0;

    const teams = activeMatch.teams || [];
    const allPlayers = activeMatch.players || [];
    const myTeam = allPlayers.filter(p => p.teamId === playerStats.teamId);
    const enemyTeam = allPlayers.filter(p => p.teamId !== playerStats.teamId);
    
    // Check if we need to lazy-load (missing full players OR missing rounds for advanced stats)
    const lacksRounds = !activeMatch._henrik || !Array.isArray(activeMatch._henrik.rounds) || activeMatch._henrik.rounds.length === 0;
    const lacksAnalytics = !analytics || analytics.multi_kill_rounds == null;
    const needsLazyLoad = (allPlayers.length <= 1 || (lacksRounds && lacksAnalytics)) && !fullMatchData;
    
    return { info, mapName, gameMode, timestamp, teams, allPlayers, myTeam, enemyTeam, needsLazyLoad };
  }, [match, playerStats, activeMatch, fullMatchData, analytics]);

  const team0 = teams[0] || {};
  const team1 = teams[1] || {};
  const score = team0.roundsWon !== undefined ? team0.roundsWon + ' – ' + team1.roundsWon : '';

  // Use a function to trigger lazy loading when clicked to avoid sync setState in effect
  function handleExpand() {
    const nextExpanded = !expanded;
    setExpanded(nextExpanded);
    if (nextExpanded && needsLazyLoad && !loadingDetails && !loadError && match?.matchId) {
      setLoadingDetails(true);
      fetchMatchDetails(match.matchId)
        .then(data => {
          setFullMatchData(data);
          setLoadError(null);
        })
        .catch(err => {
          console.error('[MatchCard] Failed to load match details:', err.message);
          setLoadError(err.message);
        })
        .finally(() => {
          setLoadingDetails(false);
        });
    }
  }

  // Handle stat click: cycle through DESC → ASC → ORIGINAL
  function handleStatClick(statKey) {
    if (sortBy === statKey) {
      // Cycle: desc → asc → null → desc
      if (sortOrder === 'desc') {
        setSortOrder('asc');
      } else {
        setSortBy(null);
        setSortOrder('desc');
      }
    } else {
      setSortBy(statKey);
      setSortOrder('desc');
    }
  }

  // Get sorted teams
  const sortedMyTeam = useMemo(() => getSortedTeam(myTeam, sortBy, sortOrder), [myTeam, sortBy, sortOrder]);
  const sortedEnemyTeam = useMemo(() => getSortedTeam(enemyTeam, sortBy, sortOrder), [enemyTeam, sortBy, sortOrder]);

  // Early return AFTER all hooks
  if (!match || !playerStats) return null;

  const accentBg = playerStats.drew
    ? 'var(--draw-dim)'
    : playerStats.won
      ? 'var(--win-dim)'
      : 'var(--loss-dim)';

  const borderColor = playerStats.drew
    ? 'border-[var(--draw)]'
    : playerStats.won
      ? 'border-[var(--win)]'
      : 'border-[var(--loss)]';

  // Render scoreboard content based on state
  function renderScoreboardContent() {
    // Loading state
    if (loadingDetails) {
      return (
        <div className='flex items-center justify-center gap-2 py-4'>
          <Loader2 size={16} className='animate-spin text-[var(--accent)]' />
          <span className='text-xs text-[var(--text-secondary)]'>Loading scoreboard...</span>
        </div>
      );
    }
    
    // Error state
    if (loadError) {
      return (
        <div className='text-center py-3'>
          <p className='text-xs text-[var(--text-secondary)]'>
            Scoreboard unavailable
          </p>
        </div>
      );
    }
    
    // Full data available
    if (allPlayers.length > 1) {
      return (
        <>
          <div className='flex items-center gap-2 px-3 text-[10px] text-[var(--text-secondary)] font-semibold uppercase tracking-wider'>
            <span className='flex-1'>Player</span>
            <div className='w-16 text-center flex justify-center'>
              <StatButton label="K/D/A" onStatClick={handleStatClick} currentSort={sortBy} currentOrder={sortOrder} statKey="kills" />
            </div>
            <div className='w-10 text-center flex justify-center'>
              <StatButton label="ACS" onStatClick={handleStatClick} currentSort={sortBy} currentOrder={sortOrder} statKey="acs" />
            </div>
          </div>
          <div>
            <p className='text-[10px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1.5 px-3'>Your Team</p>
            {sortedMyTeam.map(p => <ScoreboardRow key={p.puuid} player={p} isHighlighted={p.puuid === puuid} currentPuuid={puuid} region={region} />)}
          </div>
          <div>
            <p className='text-[10px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1.5 px-3'>Enemy Team</p>
            {sortedEnemyTeam.map(p => <ScoreboardRow key={p.puuid} player={p} isHighlighted={false} currentPuuid={puuid} region={region} />)}
          </div>
        </>
      );
    }
    
    // No data and not loading - shouldn't happen but fallback
    return (
      <div className='text-center py-3'>
        <p className='text-xs text-[var(--text-secondary)]'>
          Scoreboard unavailable
        </p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={'glass rounded-xl overflow-hidden border-l-4 relative ' + borderColor}
      style={{ background: accentBg }}
    >
      {/* Background Map Image taking half the card width fading to the right */}
      <div className="absolute inset-y-0 left-0 w-1/2 pointer-events-none opacity-90"
           style={{ 
             maskImage: 'linear-gradient(to right, black 0%, transparent 100%)',
             WebkitMaskImage: 'linear-gradient(to right, black 0%, transparent 100%)'
           }}>
        <MapImage
          mapName={mapName}
          width={800}
          height={400}
          className='w-full h-full object-cover'
          showName={false}
        />
        {/* Dark overlay to ensure text contrast on top of the image */}
        <div className='absolute inset-0 bg-black/40' />
      </div>

      {/* Main row */}
      <div
        className='relative z-10 flex items-center gap-3 px-3 py-3 cursor-pointer hover:bg-[var(--bg-card-hover)] transition-colors'
        onClick={handleExpand}
      >
        {/* Left: Map info block (removed background map since it's now full card half) */}
        <div
          className='relative w-12 h-12 rounded-lg shrink-0 border border-white/20 self-center overflow-hidden flex flex-col items-center justify-center shadow-lg bg-black/60 backdrop-blur-sm'
        >
          <span className='text-[8px] font-bold text-white/90 uppercase tracking-widest leading-none mb-1'>MAP</span>
          <span className='text-xs font-extrabold text-white capitalize leading-tight text-center px-0.5 truncate w-full'>{mapName}</span>
        </div>

        {/* Middle: two stacked rows */}
        <div className='flex-1 min-w-0 flex flex-col justify-center gap-1.5'>
          {/* Row 1: result chip + agent icon + agent name + mode */}
          <div className='flex items-center gap-2 min-w-0 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]'>
            <ResultChip won={playerStats.won} drew={playerStats.drew} />
            
            {/* Agent icon */}
            <AgentIcon
              agentName={playerStats.agentId}
              size={20}
              className='rounded shrink-0 shadow-md'
            />
            
            {/* Agent name */}
            <span className='text-xs font-extrabold text-white truncate'>
              {capitalizeAgent(playerStats.agentId) || 'Unknown'}
            </span>
            
            <span className='text-xs font-semibold text-white/90 capitalize truncate hidden xs:inline'>
              {gameMode}
            </span>
          </div>
          {/* Row 2: score + time + extra stats */}
          <div className='flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-[11px] text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] min-w-0 font-semibold'>
            {score && (
              <>
                <span className='tabular-nums font-extrabold text-white whitespace-nowrap'>{score}</span>
                <span className='text-white/70'>·</span>
              </>
            )}
            <span className='whitespace-nowrap text-white/90'>{timeAgo(timestamp)}</span>
            
            {(playerStats.kpPct != null || playerStats.kpr != null) && (
              <>
                <span className='text-white/70'>•</span>
                <div className='flex items-center gap-1.5 whitespace-nowrap'>
                  {playerStats.kpPct != null && (
                    <span title="Kill Participation" className='tabular-nums'>
                      <span className='font-extrabold text-white'>{playerStats.kpPct.toFixed(0)}%</span> KP
                    </span>
                  )}
                  {playerStats.kpPct != null && playerStats.kpr != null && (
                    <span className='text-white/70'>•</span>
                  )}
                  {playerStats.kpr != null && (
                    <span title="Kills Per Round" className='tabular-nums'>
                      <span className='font-extrabold text-white'>{playerStats.kpr.toFixed(2)}</span> KPR
                    </span>
                  )}
                  {playerStats.clutches > 0 && (
                    <>
                      <span className='text-white/70'>•</span>
                      <span title="Clutch Wins" className='tabular-nums font-extrabold text-[var(--accent)]'>
                        {playerStats.clutches} Clutch{playerStats.clutches > 1 ? 'es' : ''}
                      </span>
                    </>
                  )}
                  {playerStats.multiKills > 0 && (
                    <>
                      <span className='text-white/70'>•</span>
                      <span title="3+ Kill Rounds" className='tabular-nums font-extrabold text-[var(--win)]'>
                        {playerStats.multiKills} Multi-Kill{playerStats.multiKills > 1 ? 's' : ''}
                      </span>
                    </>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Right: stats column — fixed width, always visible */}
        <div className='shrink-0 flex flex-col items-end justify-center gap-1 w-[72px] text-right drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]'>
          <p className='text-sm font-extrabold text-white tabular-nums leading-none' title={playerStats.kastPct != null ? `KAST: ${playerStats.kastPct}%` : 'K/D/A'}>
            {playerStats.kills}/{playerStats.deaths}/{playerStats.assists}
          </p>
          <p className='text-[10px] text-white/90 tabular-nums leading-none font-semibold' title={playerStats.firstBloods != null ? `First Bloods: ${playerStats.firstBloods}` : 'ACS'}>
            <span className='text-white font-extrabold'>{playerStats.acs}</span> ACS
          </p>
          <p className='text-[10px] text-white/90 tabular-nums leading-none font-semibold' title={`Head: ${playerStats.hsPct.toFixed(0)}% | Body: ${playerStats.bodyPct.toFixed(0)}% | Leg: ${playerStats.legPct.toFixed(0)}%`}>
            <span className='text-white font-extrabold'>{playerStats.hsPct.toFixed(0)}%</span> HS
          </p>
          {/* RR change for competitive matches */}
          {gameMode.toLowerCase() === 'competitive' && (
            <p className={`text-[10px] tabular-nums leading-none font-extrabold ${
              playerStats.mmrChange == null
                ? 'text-white/70'
                : playerStats.mmrChange > 0
                  ? 'text-[var(--win)]'
                  : playerStats.mmrChange < 0
                    ? 'text-[var(--loss)]'
                    : 'text-white/90'
            }`}>
              {playerStats.mmrChange == null
                ? 'RR N/A'
                : `${playerStats.mmrChange > 0 ? '+' : ''}${playerStats.mmrChange} RR`}
            </p>
          )}
        </div>

        <ChevronDown
          size={15}
          className={'text-white/80 transition-transform duration-200 shrink-0 drop-shadow-md ' + (expanded ? 'rotate-180' : '')}
        />
      </div>

      {/* Expanded scoreboard */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22 }}
            className='overflow-hidden border-t border-white/10 relative z-10 bg-black/40'
          >
            <div className='p-4 space-y-4'>
              {renderScoreboardContent()}
              {renderAdvancedStats(playerStats)}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
