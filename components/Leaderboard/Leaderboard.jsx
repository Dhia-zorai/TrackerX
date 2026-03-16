"use client";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, Lock } from "lucide-react";
import { Skeleton } from "@/components/ui/Skeleton";

const REGIONS = [{ value: 'na', label: 'NA' }, { value: 'eu', label: 'EU' }];

async function fetchLeaderboard(region) {
  const res = await fetch('/api/riot/leaderboard?' + new URLSearchParams({ region }));
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to load leaderboard');
  return data;
}

function isProductionKeyError(msg) {
  return msg && (msg.includes("production") || msg.includes("Development keys"));
}

export default function Leaderboard() {
  const [region, setRegion] = useState('na');

  const { data, isLoading, error } = useQuery({
    queryKey: ['leaderboard', region],
    queryFn: () => fetchLeaderboard(region),
    staleTime: 15 * 60 * 1000,
    retry: false,
  });

  const players = data?.players || [];

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
      className='glass-accent rounded-xl p-5'>
      <div className='flex items-center justify-between mb-4'>
        <div className='flex items-center gap-2'>
          <Trophy size={16} className='text-[var(--accent)]' />
          <h3 className='text-sm font-semibold text-[var(--text-primary)]'>Leaderboard</h3>
          <span className='text-xs text-[var(--text-secondary)]'>(Top Ranked)</span>
        </div>
        <div className='flex gap-1'>
          {REGIONS.map(r => (
            <button key={r.value} onClick={() => setRegion(r.value)}
              className={'px-2.5 py-1 rounded-md text-xs font-medium transition-colors ' + (r.value === region ? 'bg-[var(--accent)] text-white' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]')}>
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {isLoading && (
        <div className='space-y-2'>
          {[...Array(10)].map((_, i) => <Skeleton key={i} className='h-8 w-full' />)}
        </div>
      )}

      {error && isProductionKeyError(error.message) && (
        <div className='flex flex-col items-center gap-2 py-6 text-center'>
          <div className='w-9 h-9 rounded-full bg-[var(--accent-dim)] flex items-center justify-center'>
            <Lock size={16} className='text-[var(--accent)]' />
          </div>
          <p className='text-xs font-medium text-[var(--text-primary)]'>Production Key Required</p>
          <p className='text-xs text-[var(--text-secondary)] max-w-[220px]'>
            Leaderboard data is restricted to production API keys.
          </p>
        </div>
      )}

      {error && !isProductionKeyError(error.message) && (
        <p className='text-xs text-[var(--text-secondary)] text-center py-4'>{error.message}</p>
      )}

      {!isLoading && !error && players.length === 0 && (
        <p className='text-xs text-[var(--text-secondary)] text-center py-4'>No leaderboard data available</p>
      )}

      <AnimatePresence mode='wait'>
        <motion.div key={region} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className='space-y-1'>
          {players.slice(0, 10).map((p, i) => (
            <div key={p.puuid || i}
              className='flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-[var(--accent-dim)] transition-colors text-sm'>
              <span className={'w-6 text-center font-bold ' + (i === 0 ? 'text-[#ffe082]' : i === 1 ? 'text-[#c0c0c0]' : i === 2 ? 'text-[#a8734e]' : 'text-[var(--text-secondary)]')}>
                {i + 1}
              </span>
              <span className='flex-1 text-[var(--text-primary)] truncate'>
                {p.gameName || 'Anonymous'}
                {p.tagLine && <span className='text-[var(--text-secondary)] text-xs ml-1'>#{p.tagLine}</span>}
              </span>
              <span className='text-xs text-[var(--accent)] font-semibold'>{p.rankedRating} RR</span>
              <span className='text-xs text-[var(--text-secondary)]'>{p.numberOfWins}W</span>
            </div>
          ))}
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
}