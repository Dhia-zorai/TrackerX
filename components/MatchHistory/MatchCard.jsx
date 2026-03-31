"use client";
import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ArrowUp, ArrowDown, Loader2 } from "lucide-react";
import { extractPlayerStats, timeAgo, capitalizeAgent } from "@/lib/utils";
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
          : 'border-[var(--text-muted)] text-[var(--text-muted)] hover:bg-[var(--bg-card)] hover:border-[var(--accent)] hover:text-[var(--text-primary)] hover:shadow-sm'
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

function ScoreboardRow({ player, isHighlighted }) {
  const stats = player.stats || {};
  const acs = stats.score ? Math.round(stats.score / Math.max(1, 12)) : 0;
  return (
    <div className={
      'flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs ' +
      (isHighlighted ? 'bg-[var(--accent-dim)] border border-[var(--border-accent)]' : 'hover:bg-[var(--bg-card)]')
    }>
      <span className={'flex-1 font-medium truncate ' + (isHighlighted ? 'text-[var(--accent)]' : 'text-[var(--text-primary)]')}>
        {player.gameName}#{player.tagLine}
      </span>
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

export default function MatchCard({ match, puuid }) {
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
    return extractPlayerStats(activeMatch, puuid);
  }, [activeMatch, puuid, match]);

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
    
    // Check if we need to lazy-load (only 1 player = lifetime endpoint data)
    const needsLazyLoad = allPlayers.length <= 1 && !fullMatchData;
    
    return { info, mapName, gameMode, timestamp, teams, allPlayers, myTeam, enemyTeam, needsLazyLoad };
  }, [match, playerStats, activeMatch, fullMatchData]);

  const team0 = teams[0] || {};
  const team1 = teams[1] || {};
  const score = team0.roundsWon !== undefined ? team0.roundsWon + ' – ' + team1.roundsWon : '';

  // Lazy load full match details when expanding
  useEffect(() => {
    if (expanded && needsLazyLoad && !loadingDetails && !loadError && match?.matchId) {
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
  }, [expanded, needsLazyLoad, loadingDetails, loadError, match?.matchId]);

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
          <span className='text-xs text-[var(--text-muted)]'>Loading scoreboard...</span>
        </div>
      );
    }
    
    // Error state
    if (loadError) {
      return (
        <div className='text-center py-3'>
          <p className='text-xs text-[var(--text-muted)]'>
            Scoreboard unavailable
          </p>
        </div>
      );
    }
    
    // Full data available
    if (allPlayers.length > 1) {
      return (
        <>
          <div className='flex items-center gap-2 px-3 text-[10px] text-[var(--text-muted)] font-semibold uppercase tracking-wider'>
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
            {sortedMyTeam.map(p => <ScoreboardRow key={p.puuid} player={p} isHighlighted={p.puuid === puuid} />)}
          </div>
          <div>
            <p className='text-[10px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1.5 px-3'>Enemy Team</p>
            {sortedEnemyTeam.map(p => <ScoreboardRow key={p.puuid} player={p} isHighlighted={false} />)}
          </div>
        </>
      );
    }
    
    // No data and not loading - shouldn't happen but fallback
    return (
      <div className='text-center py-3'>
        <p className='text-xs text-[var(--text-muted)]'>
          Scoreboard unavailable
        </p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={'glass rounded-xl overflow-hidden border-l-4 ' + borderColor}
      style={{ background: accentBg }}
    >
      {/* Main row */}
      <div
        className='flex items-center gap-3 px-3 py-3 cursor-pointer hover:bg-[var(--bg-card-hover)] transition-colors'
        onClick={() => setExpanded(e => !e)}
      >
        {/* Map block - Enhanced with thumbnail and gradient overlay */}
        <div
          className='relative w-11 h-11 rounded-lg shrink-0 border border-[var(--border)] self-center overflow-hidden'
          style={{ background: accentBg }}
        >
          {/* Map image as background */}
          <MapImage
            mapName={mapName}
            width={44}
            height={44}
            className='absolute inset-0 object-cover opacity-100'
            showName={false}
          />
          
          {/* Dark gradient overlay for text contrast */}
          <div 
            className='absolute inset-0 z-[5]'
            style={{ 
              background: 'linear-gradient(180deg, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.6) 100%)' 
            }}
          />
          
          {/* Text overlay */}
          <div className='relative z-10 flex flex-col items-center justify-center h-full'>
            <span className='text-[7px] font-semibold text-white uppercase tracking-widest leading-none'>MAP</span>
            <span className='text-[10px] font-bold text-white capitalize mt-0.5 leading-tight text-center px-0.5'>{mapName}</span>
          </div>
        </div>

        {/* Middle: two stacked rows */}
        <div className='flex-1 min-w-0 flex flex-col justify-center gap-1.5'>
          {/* Row 1: result chip + agent icon + agent name + mode */}
          <div className='flex items-center gap-2 min-w-0'>
            <ResultChip won={playerStats.won} drew={playerStats.drew} />
            
            {/* Agent icon */}
            <AgentIcon
              agentName={playerStats.agentId}
              size={20}
              className='rounded shrink-0'
            />
            
            {/* Agent name */}
            <span className='text-xs font-semibold text-[var(--text-primary)] truncate'>
              {capitalizeAgent(playerStats.agentId) || 'Unknown'}
            </span>
            
            <span className='text-xs text-[var(--text-secondary)] capitalize truncate hidden xs:inline'>
              {gameMode}
            </span>
          </div>
          {/* Row 2: score + time */}
          <div className='flex items-center gap-1.5 text-xs text-[var(--text-secondary)] min-w-0'>
            {score && (
              <>
                <span className='tabular-nums font-medium text-[var(--text-primary)]'>{score}</span>
                <span className='text-[var(--text-muted)]'>·</span>
              </>
            )}
            <span className='truncate'>{timeAgo(timestamp)}</span>
          </div>
        </div>

        {/* Right: stats column — fixed width, always visible */}
        <div className='shrink-0 flex flex-col items-end justify-center gap-1 w-[72px] text-right'>
          <p className='text-sm font-bold text-[var(--text-primary)] tabular-nums leading-none'>
            {playerStats.kills}/{playerStats.deaths}/{playerStats.assists}
          </p>
          <p className='text-[10px] text-[var(--text-secondary)] tabular-nums leading-none'>
            <span className='text-[var(--text-primary)] font-medium'>{playerStats.acs}</span> ACS
          </p>
          <p className='text-[10px] text-[var(--text-secondary)] tabular-nums leading-none'>
            <span className='text-[var(--text-primary)] font-medium'>{playerStats.hsPct.toFixed(0)}%</span> HS
          </p>
          {/* RR change for competitive matches */}
          {gameMode.toLowerCase() === 'competitive' && (
            <p className={`text-[10px] tabular-nums leading-none font-medium ${
              playerStats.mmrChange == null
                ? 'text-[var(--text-muted)]'
                : playerStats.mmrChange > 0
                  ? 'text-[var(--win)]'
                  : playerStats.mmrChange < 0
                    ? 'text-[var(--loss)]'
                    : 'text-[var(--text-secondary)]'
            }`}>
              {playerStats.mmrChange == null
                ? 'RR N/A'
                : `${playerStats.mmrChange > 0 ? '+' : ''}${playerStats.mmrChange} RR`}
            </p>
          )}
        </div>

        <ChevronDown
          size={15}
          className={'text-[var(--text-muted)] transition-transform duration-200 shrink-0 ' + (expanded ? 'rotate-180' : '')}
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
            className='overflow-hidden border-t border-[var(--border)]'
          >
            <div className='p-4 space-y-4'>
              {renderScoreboardContent()}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
