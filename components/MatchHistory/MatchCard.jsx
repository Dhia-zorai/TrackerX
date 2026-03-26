"use client";
import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ArrowUp, ArrowDown } from "lucide-react";
import { extractPlayerStats, timeAgo, capitalizeAgent } from "@/lib/utils";

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

export default function MatchCard({ match, puuid }) {
  const [expanded, setExpanded] = useState(false);
  const [sortBy, setSortBy] = useState(null);
  const [sortOrder, setSortOrder] = useState('desc');
  
  if (!match) return null;

  const playerStats = extractPlayerStats(match, puuid);
  if (!playerStats) return null;

  const info = match.info || {};
  const mapName = info.mapId
    ? info.mapId.includes('/') ? info.mapId.split('/').pop() : info.mapId
    : 'Unknown';
  const gameMode = info.gameMode || 'Unrated';
  const timestamp = info.gameStartMillis || 0;

  const teams = match.teams || [];
  const team0 = teams[0] || {};
  const team1 = teams[1] || {};
  const score = team0.roundsWon !== undefined ? team0.roundsWon + ' – ' + team1.roundsWon : '';

  const allPlayers = match.players || [];
  const myTeam    = allPlayers.filter(p => p.teamId === playerStats.teamId);
  const enemyTeam = allPlayers.filter(p => p.teamId !== playerStats.teamId);

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

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={'glass rounded-xl overflow-hidden border-l-4 ' + borderColor}
    >
      {/* Main row */}
      <div
        className='flex items-center gap-3 px-3 py-3 cursor-pointer hover:bg-[var(--bg-card-hover)] transition-colors'
        onClick={() => setExpanded(e => !e)}
      >
        {/* Map block */}
        <div
          className='w-11 h-11 rounded-lg flex flex-col items-center justify-center shrink-0 border border-[var(--border)] self-center'
          style={{ background: accentBg }}
        >
          <span className='text-[7px] font-semibold text-[var(--text-muted)] uppercase tracking-widest leading-none'>MAP</span>
          <span className='text-[10px] font-bold text-[var(--text-primary)] capitalize mt-0.5 leading-tight text-center px-0.5'>{mapName}</span>
        </div>

        {/* Middle: two stacked rows */}
        <div className='flex-1 min-w-0 flex flex-col justify-center gap-1.5'>
          {/* Row 1: result chip + agent + mode */}
          <div className='flex items-center gap-2 min-w-0'>
            <ResultChip won={playerStats.won} drew={playerStats.drew} />
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
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}