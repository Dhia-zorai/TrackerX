"use client";
import { motion } from "framer-motion";
import { computeOpeningDuelStats } from "@/lib/analyticsUtils";

export default function OpeningDuelsCard({ matches, loading = false }) {
  const stats = computeOpeningDuelStats(matches);
  const noData = stats.fbMatches === 0 && stats.fdMatches === 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.22, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className='glass-accent rounded-xl p-5'
    >
      <p className='text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider mb-3'>Opening Duels</p>
      {loading && (
        <p className='text-[11px] text-[var(--text-secondary)] mb-2'>Loading detailed round data...</p>
      )}
      <div className='grid grid-cols-2 gap-4'>
        <div>
          <p className='text-[12px] text-[var(--text-secondary)]'>First Blood Rate</p>
          <p className='text-[28px] font-medium text-[var(--win)] leading-tight'>
            {stats.firstBloodRate == null ? "—" : `${stats.firstBloodRate.toFixed(1)}%`}
          </p>
          <p className='text-[11px] text-[var(--text-secondary)]'>
            {stats.fbCount} in {stats.fbMatches} matches
          </p>
        </div>
        <div className='border-l border-[var(--border)] pl-4'>
          <p className='text-[12px] text-[var(--text-secondary)]'>First Death Rate</p>
          <p className='text-[28px] font-medium text-[var(--loss)] leading-tight'>
            {stats.firstDeathRate == null ? "—" : `${stats.firstDeathRate.toFixed(1)}%`}
          </p>
          <p className='text-[11px] text-[var(--text-secondary)]'>
            {stats.fdCount} in {stats.fdMatches} matches
          </p>
        </div>
      </div>
      {noData && <p className='text-[11px] text-[var(--text-secondary)] mt-3'>No data available</p>}
    </motion.div>
  );
}
