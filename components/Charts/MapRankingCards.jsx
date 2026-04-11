"use client";
import { motion } from "framer-motion";
import { computeMapRankings } from "@/lib/analyticsUtils";
import { MapImage } from "@/components/ui/MapImage";

export default function MapRankingCards({ matches }) {
  const { best, worst } = computeMapRankings(matches);

  if (!best || !worst) {
    return (
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.38 }} className='glass-accent rounded-xl p-5'>
        <p className='text-sm text-[var(--text-secondary)]'>Play more maps to see breakdown</p>
      </motion.div>
    );
  }

  return (
    <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.38 }} className='relative overflow-hidden rounded-xl border border-[var(--border-accent)]'>
        <MapImage mapName={best.map} width={640} height={260} className='absolute inset-0 w-full h-full object-cover' showName={false} />
        <div className='absolute inset-0 bg-gradient-to-r from-[var(--bg-primary)]/40 via-[var(--bg-primary)]/35 to-[var(--bg-primary)]/45' />
        <div className='absolute left-0 top-0 bottom-0 w-[2px] bg-[var(--win)]' />
        <div className='relative p-5'>
          <p className='text-[12px] text-[var(--text-secondary)] mb-1'>Best Map</p>
          <p className='text-[20px] font-medium text-[var(--text-primary)]'>{best.map}</p>
          <p className='text-[13px] text-[var(--text-secondary)] mt-1'>Win Rate {best.winRate.toFixed(1)}% &middot; K/D {best.kd.toFixed(2)}</p>
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.42 }} className='relative overflow-hidden rounded-xl border border-[var(--border-accent)]'>
        <MapImage mapName={worst.map} width={640} height={260} className='absolute inset-0 w-full h-full object-cover' showName={false} />
        <div className='absolute inset-0 bg-gradient-to-r from-[var(--bg-primary)]/40 via-[var(--bg-primary)]/35 to-[var(--bg-primary)]/45' />
        <div className='absolute left-0 top-0 bottom-0 w-[2px] bg-[var(--loss)]' />
        <div className='relative p-5'>
          <p className='text-[12px] text-[var(--text-secondary)] mb-1'>Worst Map</p>
          <p className='text-[20px] font-medium text-[var(--text-primary)]'>{worst.map}</p>
          <p className='text-[13px] text-[var(--text-secondary)] mt-1'>Win Rate {worst.winRate.toFixed(1)}% &middot; K/D {worst.kd.toFixed(2)}</p>
        </div>
      </motion.div>
    </div>
  );
}
