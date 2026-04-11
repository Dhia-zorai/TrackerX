"use client";
import { useMemo } from "react";
import { motion } from "framer-motion";
import { Crosshair, Target, TrendingUp, Zap, User, Users, Swords } from "lucide-react";
import StatCard from "@/components/StatCard";
import PlayerBanner from "./PlayerBanner";
import { aggregateStats, getAgentStats, capitalizeAgent } from "@/lib/utils";
import { StatCardSkeleton } from "@/components/ui/Skeleton";
import { AgentIcon } from "@/components/ui/AgentIcon";
import { getAgentAsset } from "@/lib/assetMappings";

export default function Dashboard({ account, region, matchStats, matches, loading }) {
  const stats = useMemo(() => aggregateStats(matchStats), [matchStats]);
  const agentStats = useMemo(() => getAgentStats(matchStats), [matchStats]);
  const topAgent = agentStats[0];

  const cards = [
    { label: 'Win Rate', value: stats.gamesPlayed > 0 ? parseFloat(stats.winRate.toFixed(1)) : 0, suffix: '%', sub: stats.wins + 'W / ' + (stats.gamesPlayed - stats.wins) + 'L across ' + stats.gamesPlayed + ' games', icon: TrendingUp, color: '#34d399', delay: 0.1 },
    { label: 'K/D Ratio', value: stats.kd, sub: stats.kills + 'K ' + stats.deaths + 'D ' + stats.assists + 'A', icon: Crosshair, color: '#7c5cfc', delay: 0.15 },
    { label: 'Avg ACS', value: stats.acs, sub: 'Average combat score', icon: Zap, color: '#22d3ee', delay: 0.2 },
    { label: 'HS%', value: parseFloat(stats.hsPct.toFixed(1)), suffix: '%', sub: `Body: ${stats.bodyPct.toFixed(1)}% | Leg: ${stats.legPct.toFixed(1)}%`, icon: Target, color: '#f59e0b', delay: 0.25 },
    { label: 'KP%', value: parseFloat(stats.kpPct.toFixed(1)), suffix: '%', sub: 'Kill Participation', icon: Users, color: '#ec4899', delay: 0.3 },
    { label: 'KPR', value: parseFloat(stats.kpr.toFixed(2)), sub: 'Kills Per Round', icon: Swords, color: '#ef4444', delay: 0.35 },
  ];

  return (
    <div className='space-y-6'>
      <PlayerBanner account={account} region={region} matches={matches} />
      <div className='grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4'>
        {loading
          ? [...Array(6)].map((_, i) => <StatCardSkeleton key={i} />)
          : cards.map(card => <StatCard key={card.label} {...card} />)
        }
      </div>
      {!loading && topAgent && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
          className='glass-accent rounded-xl p-5 flex items-center gap-5'>
          <div className='w-12 h-12 bg-[var(--accent-dim)] rounded-xl flex items-center justify-center overflow-hidden'>
            {getAgentAsset(topAgent.agentId) ? (
              <AgentIcon
                agentName={topAgent.agentId}
                size={48}
                className='rounded-xl object-cover'
              />
            ) : (
              <User size={24} className='text-[var(--accent)]' />
            )}
          </div>
          <div className='flex-1'>
            <p className='text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider mb-1'>Most Played Agent</p>
            <p className='text-xl font-bold text-[var(--text-primary)]'>{capitalizeAgent(topAgent.agentId)}</p>
            <p className='text-xs text-[var(--text-secondary)] mt-0.5'>{topAgent.games} games &middot; {topAgent.winRate}% WR &middot; {topAgent.kd} K/D</p>
          </div>
          <div className='text-right'>
            <p className='text-2xl font-bold text-[var(--text-primary)]'>{topAgent.games}</p>
            <p className='text-xs text-[var(--text-secondary)]'>games</p>
          </div>
        </motion.div>
      )}
    </div>
  );
}