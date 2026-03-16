"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { extractPlayerStats, timeAgo, formatRatio } from "@/lib/utils";

function ResultChip({ won, drew }) {
  if (drew) return <span className="chip-draw text-[10px] px-2 py-0.5 rounded font-bold tracking-wide">DRAW</span>;
  if (won)  return <span className="chip-win  text-[10px] px-2 py-0.5 rounded font-bold tracking-wide">WIN</span>;
  return          <span className="chip-loss text-[10px] px-2 py-0.5 rounded font-bold tracking-wide">LOSS</span>;
}

// Thin HS% progress bar
function HsBar({ pct }) {
  const clamped = Math.min(Math.max(pct, 0), 100);
  return (
    <div className="stat-bar-track w-14">
      <div className="stat-bar-fill" style={{ width: clamped + '%' }} />
    </div>
  );
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
        className='flex items-center gap-4 px-4 py-3 cursor-pointer hover:bg-[var(--bg-card-hover)] transition-colors'
        onClick={() => setExpanded(e => !e)}
      >
        {/* Map block */}
        <div
          className='w-[52px] h-[52px] rounded-lg flex flex-col items-center justify-center shrink-0 border border-[var(--border)]'
          style={{ background: accentBg }}
        >
          <span className='text-[7px] font-semibold text-[var(--text-muted)] uppercase tracking-widest leading-none'>MAP</span>
          <span className='text-[11px] font-bold text-[var(--text-primary)] capitalize mt-0.5 leading-tight text-center px-0.5'>{mapName}</span>
        </div>

        {/* Left: result + meta */}
        <div className='flex-1 min-w-0 space-y-1'>
          <div className='flex items-center gap-2'>
            <ResultChip won={playerStats.won} drew={playerStats.drew} />
            {score && <span className='text-xs font-semibold text-[var(--text-primary)] tabular-nums'>{score}</span>}
            <span className='text-xs text-[var(--text-secondary)] capitalize'>{gameMode}</span>
          </div>
          <div className='flex items-center gap-2 text-xs'>
            <span className='font-semibold text-[var(--text-primary)] capitalize'>{playerStats.agentId || 'Unknown'}</span>
            <span className='text-[var(--text-muted)]'>·</span>
            <span className='text-[var(--text-secondary)]'>{timeAgo(timestamp)}</span>
          </div>
        </div>

        {/* Right: stats */}
        <div className='shrink-0 text-right space-y-1'>
          <p className='text-sm font-bold text-[var(--text-primary)] tabular-nums'>
            {playerStats.kills}/{playerStats.deaths}/{playerStats.assists}
          </p>
          <p className='text-xs text-[var(--text-secondary)] tabular-nums'>
            <span className='text-[var(--text-primary)] font-medium'>{formatRatio(playerStats.kd)}</span> KD
            &nbsp;·&nbsp;
            <span className='text-[var(--text-primary)] font-medium'>{playerStats.acs}</span> ACS
          </p>
          <div className='flex items-center justify-end gap-1.5'>
            <span className='text-[10px] text-[var(--text-secondary)]'>{playerStats.hsPct.toFixed(0)}% HS</span>
            <HsBar pct={playerStats.hsPct} />
          </div>
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
                <span className='w-16 text-center'>K / D / A</span>
                <span className='w-10 text-center'>ACS</span>
              </div>
              <div>
                <p className='text-[10px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1.5 px-3'>Your Team</p>
                {myTeam.map(p => <ScoreboardRow key={p.puuid} player={p} isHighlighted={p.puuid === puuid} />)}
              </div>
              <div>
                <p className='text-[10px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1.5 px-3'>Enemy Team</p>
                {enemyTeam.map(p => <ScoreboardRow key={p.puuid} player={p} isHighlighted={false} />)}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}