"use client";
import { motion } from "framer-motion";
import { MapPin } from "lucide-react";
import { useMMR } from "@/hooks/useMMR";
import { RANK_TIERS } from "@/lib/utils";
import { RankIcon } from "@/components/ui/RankIcon";

// Generate gradient based on player name hash — uses brand-adjacent palette
function getAvatarGradient(name) {
  const colors = [
    { from: "#7c5cfc", to: "#a78bfa" }, // Violet
    { from: "#22d3ee", to: "#7c5cfc" }, // Cyan → Violet
    { from: "#34d399", to: "#22d3ee" }, // Emerald → Cyan
    { from: "#a78bfa", to: "#f472b6" }, // Purple → Pink
    { from: "#f59e0b", to: "#ef4444" }, // Amber → Red
    { from: "#6366f1", to: "#22d3ee" }, // Indigo → Cyan
    { from: "#10b981", to: "#3b82f6" }, // Emerald → Blue
    { from: "#ec4899", to: "#8b5cf6" }, // Pink → Purple
  ];

  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash << 5) - hash + name.charCodeAt(i);
    hash = hash & hash;
  }

  const index = Math.abs(hash) % colors.length;
  return colors[index];
}

function RankBadge({ mmr, loading }) {
  if (loading) {
    return (
      <div className="glass rounded-xl px-4 py-3 flex flex-col items-center gap-1 animate-pulse">
        <div className="w-8 h-8 bg-[var(--bg-elevated)] rounded" />
        <div className="w-12 h-3 bg-[var(--bg-elevated)] rounded mt-1" />
      </div>
    );
  }

  const isRanked =
    mmr && mmr.tier != null && mmr.tier > 0 && mmr.tierName !== "Unranked";

  // Ranked — show current rank, RR, and ±change
  if (isRanked) {
    const tierBase = (mmr.tierName || "").replace(/\s+\d+$/, "").trim();
    const rankInfo = RANK_TIERS.find(
      (t) => t.name.toLowerCase() === tierBase.toLowerCase(),
    );
    const color = rankInfo?.color || "var(--accent)";

    return (
      <div className="glass rounded-xl px-4 py-3 flex flex-col items-center gap-1 min-w-[88px]">
        <RankIcon
          tierName={mmr.tierName}
          size={54}
          className="object-contain"
        />
        <span className="text-xs font-bold" style={{ color }}>
          {mmr.tierName}
        </span>
        <span className="text-xs text-[var(--text-secondary)] tabular-nums">
          {mmr.rr} RR
        </span>
        {mmr.mmrChange != null && (
          <span
            className={
              "text-[10px] font-medium tabular-nums " +
              (mmr.mmrChange >= 0 ? "text-green-400" : "text-red-400")
            }
          >
            {mmr.mmrChange >= 0 ? "+" : ""}
            {mmr.mmrChange}
          </span>
        )}
      </div>
    );
  }

  // Unranked but has an all-time peak — show that instead
  if (mmr?.peakTier) {
    const peakBase = mmr.peakTier.replace(/\s+\d+$/, "").trim();
    const rankInfo = RANK_TIERS.find(
      (t) => t.name.toLowerCase() === peakBase.toLowerCase(),
    );
    const color = rankInfo?.color || "var(--text-secondary)";

    return (
      <div
        className="glass rounded-xl px-4 py-3 flex flex-col items-center gap-1 min-w-[88px]"
        style={{ opacity: 0.75 }}
      >
        <RankIcon
          tierName={mmr.peakTier}
          size={48}
          className="object-contain"
          grayscale
        />
        <span className="text-xs font-bold" style={{ color }}>
          {mmr.peakTier}
        </span>
        <span className="text-[10px] text-[var(--text-secondary)] uppercase tracking-wider font-medium">
          Peak
        </span>
      </div>
    );
  }

  // No rank data at all — hide the badge entirely
  return null;
}

export default function PlayerBanner({ account, region }) {
  if (!account) return null;
  const { gameName, tagLine, puuid } = account;
  // Handle both Riot API (accountLevel) and Henrik API (account_level) shapes
  const level = account.account_level || account.accountLevel || 0;
  const initials = gameName ? gameName.slice(0, 2).toUpperCase() : "??";
  const gradient = getAvatarGradient(gameName || "");

  const { data: mmr, isLoading: mmrLoading } = useMMR({ puuid, region });

  return (
    <motion.div
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="glass-accent rounded-xl p-6 relative overflow-hidden"
    >
      {/* Gradient sweep */}
      <div className="absolute inset-0 bg-gradient-to-r from-[var(--accent-dim)] via-transparent to-transparent pointer-events-none" />

      <div className="relative flex items-center gap-3 sm:gap-5">
        {/* Avatar — always initials-based gradient, no broken image fallback */}
        <div className="relative shrink-0">
          <div
            className="w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center text-white font-bold text-xl select-none relative overflow-hidden"
            style={{
              background: `linear-gradient(135deg, ${gradient.from}, ${gradient.to})`,
              boxShadow: `0 0 24px ${gradient.from}55`,
            }}
          >
            <span className="relative z-10">{initials}</span>
            <div
              className="absolute inset-0 opacity-25"
              style={{
                background:
                  "radial-gradient(circle at 30% 25%, rgba(255,255,255,0.5), transparent 65%)",
              }}
            />
          </div>
          {/* Level badge */}
          {level > 0 && (
            <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-[var(--bg-elevated)] border border-[var(--border-accent)] flex items-center justify-center">
              <span className="text-[9px] font-bold text-[var(--accent)] tabular-nums leading-none">
                {level}
              </span>
            </div>
          )}
        </div>

        {/* Name + region */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl sm:text-2xl font-bold text-[var(--text-primary)] truncate">
              {gameName}
            </h1>
            <span className="text-[var(--text-secondary)] text-lg font-normal">
              #{tagLine}
            </span>
          </div>
          <div className="flex items-center gap-3 mt-1 text-xs text-[var(--text-secondary)]">
            <span className="flex items-center gap-1 uppercase tracking-wide font-medium">
              <MapPin size={11} />
              {region}
            </span>
          </div>
        </div>

        {/* Rank badge */}
        <div className="shrink-0">
          <RankBadge mmr={mmr} loading={mmrLoading} />
        </div>
      </div>
    </motion.div>
  );
}
