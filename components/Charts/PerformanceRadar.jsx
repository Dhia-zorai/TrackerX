"use client";
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { motion } from "framer-motion";
import { AVG_STATS_BY_RANK } from "@/lib/utils";

export default function PerformanceRadar({ stats, rankTier = 'Gold' }) {
  if (!stats || stats.gamesPlayed === 0) return null;

  const avg = AVG_STATS_BY_RANK[rankTier] || AVG_STATS_BY_RANK.Gold;

  // Normalize to 0-100 scale relative to Radiant max
  const max = AVG_STATS_BY_RANK.Radiant;
  function norm(val, key) {
    return Math.round(Math.min((val / (max[key] * 1.2)) * 100, 100));
  }

  const data = [
    { metric: 'K/D', player: norm(stats.kd, 'kd'), avg: norm(avg.kd, 'kd') },
    { metric: 'ACS', player: norm(stats.acs, 'acs'), avg: norm(avg.acs, 'acs') },
    { metric: 'HS%', player: norm(stats.hsPct, 'hsPct'), avg: norm(avg.hsPct, 'hsPct') },
    { metric: 'Win %', player: norm(stats.winRate, 'winRate'), avg: norm(avg.winRate, 'winRate') },
  ];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.35 }}
      className='glass-accent rounded-xl p-5'>
      <div className='flex items-center justify-between mb-4'>
        <h3 className='text-sm font-semibold text-[var(--text-primary)]'>Performance Radar</h3>
        <span className='text-xs text-[var(--text-secondary)]'>vs {rankTier} avg</span>
      </div>
      <ResponsiveContainer width='100%' height={240}>
        <RadarChart data={data} margin={{ top: 8, right: 24, bottom: 8, left: 24 }}>
          <PolarGrid stroke='var(--border)' />
          <PolarAngleAxis dataKey='metric' tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} />
          <Radar name='You' dataKey='player' stroke='#7c5cfc' fill='#7c5cfc' fillOpacity={0.2} animationDuration={800} />
          <Radar name={rankTier + ' avg'} dataKey='avg' stroke='#22d3ee' fill='#22d3ee' fillOpacity={0.1} />
          <Tooltip formatter={(v, n) => [v + '/100', n]} contentStyle={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-accent)', borderRadius: '8px', fontSize: '11px' }} />
          <Legend formatter={v => <span className='text-xs text-[var(--text-secondary)]'>{v}</span>} />
        </RadarChart>
      </ResponsiveContainer>
    </motion.div>
  );
}