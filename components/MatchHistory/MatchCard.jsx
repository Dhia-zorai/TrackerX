"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, User } from "lucide-react";
import { extractPlayerStats, timeAgo, formatRatio } from "@/lib/utils";

function ResultChip({ won, drew }) {
  if (drew) return <span className="chip-draw text-xs px-2 py-0.5 rounded-md font-semibold">DRAW</span>;
  if (won) return <span className="chip-win text-xs px-2 py-0.5 rounded-md font-semibold">WIN</span>;
  return <span className="chip-loss text-xs px-2 py-0.5 rounded-md font-semibold">LOSS</span>;
}

function ScoreboardRow({ player, isHighlighted }) {
  const stats = player.stats || {};
  return (
    <div className={'flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs ' + (isHighlighted ? 'bg-[var(--accent-dim)] border border-[var(--border-accent)]' : 'hover:bg-[var(--bg-card)]')}>
      <span className={'flex-1 font-medium truncate ' + (isHighlighted ? 'text-[var(--accent)]' : 'text-[var(--text-primary)]')}>
        {player.gameName}#{player.tagLine}
      </span>
      <span className="w-12 text-center text-[var(--text-secondary)]">{stats.kills || 0}/{stats.deaths || 0}/{stats.assists || 0}</span>
      <span className="w-12 text-center text-[var(--text-secondary)]">{stats.score ? Math.round(stats.score / Math.max(1, 12)) : 0}</span>
    </div>
  );
}

export default function MatchCard({ match, puuid }) {
  const [expanded, setExpanded] = useState(false);
  if (!match) return null;

  const playerStats = extractPlayerStats(match, puuid);
  if (!playerStats) return null;

  const info = match.info || {};
  const mapName = info.mapId ? info.mapId.split('/').pop() : 'Unknown Map';
  const gameMode = info.gameMode || 'Unrated';
  const timestamp = info.gameStartMillis || 0;

  // Teams
  const teams = match.teams || [];
  const team0 = teams[0] || {};
  const team1 = teams[1] || {};
  const score = team0.roundsWon !== undefined
    ? team0.roundsWon + ' - ' + team1.roundsWon
    : '';

  // Split players by team
  const allPlayers = match.players || [];
  const myTeam = allPlayers.filter(p => p.teamId === playerStats.teamId);
  const enemyTeam = allPlayers.filter(p => p.teamId !== playerStats.teamId);

  const borderColor = playerStats.drew ? 'border-[var(--draw)]' : playerStats.won ? 'border-[var(--win)]' : 'border-[var(--loss)]';

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={'glass rounded-xl overflow-hidden border-l-4 ' + borderColor}
    >
      {/* Main row */}
      <div
        className='flex items-center gap-3 p-4 cursor-pointer hover:bg-[var(--bg-card)] transition-colors'
        onClick={() => setExpanded(e => !e)}
      >
        {/* Map */}
        <div className='w-14 h-14 bg-[var(--bg-secondary)] rounded-lg flex items-center justify-center shrink-0 overflow-hidden'>
          <div className='text-center'>
            <p className='text-[8px] text-[var(--text-secondary)] leading-none'>MAP</p>
            <p className='text-xs font-bold text-[var(--text-primary)] leading-tight capitalize mt-0.5'>{mapName.slice(0,6)}</p>
          </div>
        </div>

        {/* Info */}
        <div className='flex-1 min-w-0'>
          <div className='flex items-center gap-2 flex-wrap'>
            <ResultChip won={playerStats.won} drew={playerStats.drew} />
            <span className='text-xs text-[var(--text-secondary)] capitalize'>{gameMode}</span>
            {score && <span className='text-xs font-semibold text-[var(--text-primary)]'>{score}</span>}
          </div>
          <div className='flex items-center gap-3 mt-1 text-xs text-[var(--text-secondary)]'>
            <span className='capitalize font-medium text-[var(--text-primary)]'>{playerStats.agentId || 'Unknown'}</span>
            <span>{timeAgo(timestamp)}</span>
          </div>
        </div>

        {/* Stats */}
        <div className='text-right shrink-0'>
          <p className='text-sm font-bold text-[var(--text-primary)]'>
            {playerStats.kills}/{playerStats.deaths}/{playerStats.assists}
          </p>
          <p className='text-xs text-[var(--text-secondary)]'>
            {formatRatio(playerStats.kd)} KD &middot; {playerStats.acs} ACS
          </p>
          <p className='text-xs text-[var(--text-secondary)]'>{playerStats.hsPct.toFixed(0)}% HS</p>
        </div>

        <ChevronDown
          size={16}
          className={'text-[var(--text-secondary)] transition-transform shrink-0 ' + (expanded ? 'rotate-180' : '')}
        />
      </div>

      {/* Expanded scoreboard */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className='overflow-hidden border-t border-[var(--border)]'
          >
            <div className='p-4 space-y-4'>
              {/* Header */}
              <div className='flex items-center gap-2 px-3 text-xs text-[var(--text-secondary)] font-medium uppercase tracking-wider'>
                <span className='flex-1'>Player</span>
                <span className='w-12 text-center'>K/D/A</span>
                <span className='w-12 text-center'>ACS</span>
              </div>

              {/* My team */}
              <div>
                <p className='text-xs text-[var(--text-secondary)] mb-1 px-3'>Your Team</p>
                {myTeam.map(p => (
                  <ScoreboardRow key={p.puuid} player={p} isHighlighted={p.puuid === puuid} />
                ))}
              </div>

              {/* Enemy team */}
              <div>
                <p className='text-xs text-[var(--text-secondary)] mb-1 px-3'>Enemy Team</p>
                {enemyTeam.map(p => (
                  <ScoreboardRow key={p.puuid} player={p} isHighlighted={false} />
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}