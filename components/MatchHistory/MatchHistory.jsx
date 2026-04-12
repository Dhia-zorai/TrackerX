"use client";
import { motion } from "framer-motion";
import { RefreshCw, ChevronDown, Loader2 } from "lucide-react";
import MatchCard from "./MatchCard";
import { MatchCardSkeleton } from "@/components/ui/Skeleton";
import ErrorState from "@/components/ui/ErrorState";
import { groupMatchesByDay, extractPlayerStats } from "@/lib/utils";

function SessionWrapUp({ date, matches, puuid }) {
  let wins = 0;
  let losses = 0;
  let draws = 0;
  let totalKills = 0;
  let totalDeaths = 0;
  
  matches.forEach(m => {
    const s = extractPlayerStats(m, puuid);
    if (!s) return;
    if (s.won && !s.drew) wins++;
    else if (s.drew) draws++;
    else losses++;
    totalKills += s.kills || 0;
    totalDeaths += s.deaths || 0;
  });
  
  const kd = totalDeaths > 0 ? (totalKills / totalDeaths).toFixed(2) : totalKills.toFixed(2);
  const winRate = matches.length > 0 ? ((wins / matches.length) * 100).toFixed(0) : 0;
  
  return (
    <div className="flex items-center justify-between px-3 py-2 mt-6 mb-2 text-sm">
      <div className="font-bold text-[var(--text-primary)]">{date}</div>
      <div className="flex items-center gap-4 text-xs font-medium text-[var(--text-secondary)]">
        <span>{wins}W {losses}L {draws > 0 ? `${draws}D` : ''}</span>
        <span>{kd} K/D</span>
        <span className={wins >= losses ? "text-[var(--win)]" : "text-[var(--loss)]"}>{winRate}% WR</span>
      </div>
    </div>
  );
}

export default function MatchHistory({ puuid, region, matches, loading, loadingMore, error, hasMore, loadMore, onRefresh, analyticsByMatchId = {} }) {
  const groupedMatches = groupMatchesByDay(matches);

  return (
    <div className='space-y-4'>
      <div className='flex items-center justify-between'>
        <h2 className='text-lg font-bold text-[var(--text-primary)]'>Match History</h2>
        {onRefresh && (
          <button onClick={onRefresh}
            className='flex items-center gap-1.5 text-xs text-[var(--text-secondary)] hover:text-[var(--accent)] transition-colors'>
            <RefreshCw size={12} /> Refresh
          </button>
        )}
      </div>

      {error && !loading && <ErrorState message={error.message} onRetry={onRefresh} />}

      <div className='space-y-1'>
        {loading && matches.length === 0
          ? [...Array(5)].map((_, i) => <MatchCardSkeleton key={i} className="mb-3" />)
          : groupedMatches.map((group, groupIdx) => (
              <div key={group.date}>
                <SessionWrapUp date={group.date} matches={group.matches} puuid={puuid} />
                <div className="space-y-3">
                  {group.matches.map((match, i) =>
                    match ? (
                      <motion.div key={match.matchId || i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }}>
                        <MatchCard match={match} puuid={puuid} region={region} analytics={analyticsByMatchId[match.matchId]} />
                      </motion.div>
                    ) : null
                  )}
                </div>
              </div>
            ))
        }
      </div>

      {hasMore && (
        <div className='flex justify-center pt-2'>
          <button
            onClick={loadMore}
            disabled={loadingMore}
            className='flex items-center gap-2 px-6 py-2.5 glass-accent rounded-xl text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--accent)] hover:border-[var(--border-accent)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors'>
            {loadingMore
              ? <><Loader2 size={14} className='animate-spin' /> Loading...</>
              : <><ChevronDown size={14} /> Load More</>
            }
          </button>
        </div>
      )}

      {!loading && !error && matches.length === 0 && (
        <div className='glass rounded-xl p-8 text-center text-[var(--text-secondary)]'>
          <p className='text-sm'>No match data available</p>
        </div>
      )}
    </div>
  );
}
