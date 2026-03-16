"use client";
import { motion } from "framer-motion";
import { MapPin, Shield } from "lucide-react";
import { useMMR } from "@/hooks/useMMR";
import { RANK_TIERS } from "@/lib/utils";

function RankBadge({ mmr, loading }) {
  if (loading) {
    return (
      <div className='glass rounded-xl px-4 py-3 flex flex-col items-center gap-1 animate-pulse'>
        <div className='w-5 h-5 bg-[var(--surface-2)] rounded' />
        <div className='w-12 h-3 bg-[var(--surface-2)] rounded mt-1' />
      </div>
    );
  }

  if (!mmr || mmr.tierName === "Unranked" || mmr.tier == null) {
    return (
      <div className='glass rounded-xl px-4 py-3 flex flex-col items-center gap-1'>
        <Shield size={20} className='text-[var(--text-secondary)]' />
        <span className='text-xs font-medium text-[var(--text-secondary)]'>Unranked</span>
      </div>
    );
  }

  // Find accent color for rank tier
  const tierBase = (mmr.tierName || "").replace(/\s+\d+$/, "").trim(); // "Gold 2" -> "Gold"
  const rankInfo = RANK_TIERS.find(t => t.name.toLowerCase() === tierBase.toLowerCase());
  const color = rankInfo?.color || "var(--accent)";

  const imgSrc = mmr.images?.small || null;

  return (
    <div className='glass rounded-xl px-4 py-3 flex flex-col items-center gap-1 min-w-[88px]'>
      {imgSrc ? (
        <img src={imgSrc} alt={mmr.tierName} className='w-8 h-8 object-contain' />
      ) : (
        <Shield size={20} style={{ color }} />
      )}
      <span className='text-xs font-bold' style={{ color }}>{mmr.tierName}</span>
      <span className='text-xs text-[var(--text-secondary)] tabular-nums'>{mmr.rr} RR</span>
      {mmr.mmrChange != null && (
        <span className={
          'text-[10px] font-medium tabular-nums ' +
          (mmr.mmrChange >= 0 ? 'text-green-400' : 'text-red-400')
        }>
          {mmr.mmrChange >= 0 ? '+' : ''}{mmr.mmrChange}
        </span>
      )}
    </div>
  );
}

export default function PlayerBanner({ account, region }) {
  if (!account) return null;
  const { gameName, tagLine, puuid } = account;
  const initials = gameName ? gameName.slice(0, 2).toUpperCase() : '??';

  const { data: mmr, isLoading: mmrLoading } = useMMR({ puuid, region });

  return (
    <motion.div
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className='glass-accent rounded-xl p-6 relative overflow-hidden'
    >
      <div className='absolute inset-0 bg-gradient-to-r from-[var(--accent-dim)] to-transparent opacity-40 pointer-events-none' />
      <div className='relative flex items-center gap-5'>
        {/* Avatar */}
        {account.card?.small ? (
          <img
            src={account.card.small}
            alt={gameName}
            className='w-16 h-16 rounded-full object-cover shrink-0 ring-2 ring-[var(--accent)] glow-accent'
          />
        ) : (
          <div className='w-16 h-16 rounded-full bg-[var(--accent)] flex items-center justify-center text-white font-bold text-xl shrink-0 glow-accent'>
            {initials}
          </div>
        )}

        {/* Name + region */}
        <div className='flex-1 min-w-0'>
          <div className='flex items-center gap-2 flex-wrap'>
            <h1 className='text-2xl font-bold text-[var(--text-primary)] truncate'>{gameName}</h1>
            <span className='text-[var(--text-secondary)] text-lg'>#{tagLine}</span>
          </div>
          <div className='flex items-center gap-4 mt-1 text-sm text-[var(--text-secondary)]'>
            <span className='flex items-center gap-1'><MapPin size={12} />{region.toUpperCase()}</span>
            <span className='text-xs font-mono opacity-50 truncate max-w-[160px]'>{puuid ? puuid.slice(0, 16) + '...' : ''}</span>
          </div>
          {mmr?.peakTier && (
            <p className='text-xs text-[var(--text-secondary)] mt-1 opacity-70'>
              Peak: <span className='font-medium'>{mmr.peakTier}</span>
              {mmr.peakSeason ? ' · ' + mmr.peakSeason : ''}
            </p>
          )}
        </div>

        {/* Rank badge */}
        <div className='shrink-0 text-right'>
          <RankBadge mmr={mmr} loading={mmrLoading} />
        </div>
      </div>
    </motion.div>
  );
}
