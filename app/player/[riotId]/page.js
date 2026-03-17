"use client";
import { use, useMemo, useState, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, Crosshair, Download } from "lucide-react";
import { usePlayer } from "@/hooks/usePlayer";
import { useMatches } from "@/hooks/useMatches";
import { useMMR } from "@/hooks/useMMR";
import Dashboard from "@/components/Dashboard";
import MatchHistory from "@/components/MatchHistory";
import ShareCard from "@/components/ShareCard";
import Toast from "@/components/ui/Toast";
import { AgentPieChart, AgentWinRateBar, AcsLineChart, PerformanceRadar } from "@/components/Charts";
import ThemeToggle from "@/components/ui/ThemeToggle";
import ErrorState from "@/components/ui/ErrorState";
import { decodeRiotIdFromUrl, extractPlayerStats, aggregateStats, getAgentStats } from "@/lib/utils";
import { exportFullJSON } from "@/lib/exportData";

export default function PlayerPage({ params }) {
  const resolvedParams = use(params);
  const searchParams = useSearchParams();
  const region = searchParams.get('region') || 'na';

  const { gameName, tagLine } = decodeRiotIdFromUrl(resolvedParams.riotId);

  const { data: account, isLoading: accountLoading, error: accountError } = usePlayer(gameName, tagLine, region);
  const { matches, matchDetailsLoading, matchListLoading, matchListError, hasMore, loadMore, loadingMore, refetch } = useMatches(
    account?.puuid,
    region,
    gameName,
    tagLine
  );
  const { data: mmr } = useMMR({ puuid: account?.puuid, region });

  const loading = matchListLoading || matchDetailsLoading;

  // Toast — fire once when first batch of matches loads
  const [showToast, setShowToast] = useState(false);
  const toastShown = useRef(false);
  useEffect(() => {
    if (!loading && matches.length > 0 && !toastShown.current) {
      toastShown.current = true;
      setShowToast(true);
    }
  }, [loading, matches.length]);

  // Match type filter
  const [filterMode, setFilterMode] = useState('all');
  const filteredMatches = useMemo(() => {
    if (filterMode === 'all') return matches;
    return matches.filter(m =>
      (m.info?.gameMode || m.queue || '').toLowerCase() === filterMode
    );
  }, [matches, filterMode]);

  const matchStats = useMemo(() => {
    if (!account?.puuid || !filteredMatches) return [];
    return filteredMatches.map(m => extractPlayerStats(m, account.puuid)).filter(Boolean);
  }, [filteredMatches, account?.puuid]);

  const aggregated = useMemo(() => aggregateStats(matchStats), [matchStats]);
  const agentStats = useMemo(() => getAgentStats(matchStats), [matchStats]);

  // Derive rank tier name for PerformanceRadar (strip number e.g. "Gold 2" -> "Gold")
  const rankTier = mmr?.tierName
    ? mmr.tierName.replace(/\s+\d+$/, "").trim()
    : "Gold";

  function handleExport() {
    exportFullJSON(account, region, filteredMatches, account?.puuid, aggregated, agentStats);
  }

  if (accountError) {
    return (
      <main className='min-h-screen w-full px-4 py-12 max-w-3xl mx-auto'>
        <Link href='/' className='flex items-center gap-2 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] mb-8 transition-colors'>
          <ArrowLeft size={14} /> Back to search
        </Link>
        <ErrorState message={accountError.message} />
      </main>
    );
  }

  return (
    <main className='min-h-screen w-full px-4 py-8 max-w-5xl mx-auto'>
      {/* Navbar */}
      <div className='flex items-center justify-between mb-8'>
        <Link href='/' className='flex items-center gap-2 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors'>
          <ArrowLeft size={14} />
          <div className='flex items-center gap-1.5'>
            <div className='w-5 h-5 bg-[var(--accent)] rounded flex items-center justify-center'>
              <Crosshair size={11} className='text-white' strokeWidth={2.5} />
            </div>
            <span className='font-semibold text-[var(--text-primary)]'>Tracker<span className='text-[var(--accent)]'>X</span></span>
          </div>
        </Link>
        <div className='flex items-center gap-2'>
          <div className='flex gap-1.5'>
            <button onClick={handleExport}
              className='flex items-center gap-1.5 px-3 py-1.5 glass rounded-lg text-xs text-[var(--text-secondary)] hover:text-[var(--accent)] transition-colors'>
              <Download size={11} /> Export JSON
            </button>
          </div>
          <ThemeToggle />
        </div>
      </div>

      {accountLoading ? (
        <div className='glass-accent rounded-xl p-6 animate-pulse h-28' />
      ) : (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className='space-y-8'>
          {/* Dashboard (banner + stat cards) */}
          <Dashboard
            account={account}
            region={region}
            matchStats={matchStats}
            loading={loading}
          />

          {/* Charts grid */}
          {!loading && matchStats.length > 0 && (
            <section>
              <h2 className='text-lg font-bold text-[var(--text-primary)] mb-4'>Performance Analytics</h2>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <AcsLineChart matchStats={matchStats} />
                <PerformanceRadar stats={aggregated} rankTier={rankTier} />
                <AgentPieChart agentStats={agentStats} />
                <AgentWinRateBar agentStats={agentStats} />
              </div>
            </section>
          )}

          {/* Match History */}
          <div className='space-y-3'>
            {/* Filter pills */}
            <div className='flex items-center gap-2'>
              {['all', 'competitive'].map(mode => (
                <button key={mode} onClick={() => setFilterMode(mode)}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                    filterMode === mode
                      ? 'bg-[var(--accent)] text-white'
                      : 'glass text-[var(--text-secondary)] hover:text-[var(--accent)]'
                  }`}>
                  {mode === 'all' ? 'All Modes' : 'Competitive'}
                </button>
              ))}
            </div>
            <MatchHistory
              puuid={account?.puuid}
              matches={filteredMatches}
              loading={loading}
              loadingMore={loadingMore}
              error={matchListError}
              hasMore={hasMore}
              loadMore={loadMore}
              onRefresh={refetch}
            />
          </div>

          {/* Share Card */}
          {matchStats.length > 0 && (
            <div className='space-y-3'>
              <h2 className='text-lg font-bold text-[var(--text-primary)]'>Share Stats</h2>
              <ShareCard account={account} stats={aggregated} agentStats={agentStats} />
            </div>
          )}
        </motion.div>
      )}

      {/* Toast */}
      <Toast
        visible={showToast}
        message="Stats are calculated from the matches currently loaded. Loading more matches will improve accuracy."
        onDismiss={() => setShowToast(false)}
      />
    </main>
  );
}
