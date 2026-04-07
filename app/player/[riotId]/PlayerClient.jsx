"use client";
import { useMemo, useState, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, Download } from "lucide-react";
import { usePlayer } from "@/hooks/usePlayer";
import { useMatches } from "@/hooks/useMatches";
import Dashboard from "@/components/Dashboard";
import MatchHistory from "@/components/MatchHistory";
import ShareCard from "@/components/ShareCard";
import Toast from "@/components/ui/Toast";
import { ProgressIndicator } from "@/components/ProgressIndicator";
import { AgentPieChart, AgentWinRateBar, AcsLineChart, PerformanceRadar } from "@/components/Charts";
import ErrorState from "@/components/ui/ErrorState";
import { decodeRiotIdFromUrl, extractPlayerStats, aggregateStats, getAgentStats } from "@/lib/utils";
import { exportFullJSON } from "@/lib/exportData";
import { OptOutBanner } from "@/components/OptOutBanner";
import { OptedOutCard } from "@/components/OptedOutCard";
import SiteHeader from "@/components/SiteHeader";

export function PlayerClient({ resolvedParams, isAdmin }) {
  const searchParams = useSearchParams();
  const region = searchParams.get('region') || 'na';

  const { gameName, tagLine } = decodeRiotIdFromUrl(resolvedParams.riotId);

  const [filterMode, setFilterMode] = useState('competitive');

  const { data: account, isLoading: accountLoading, error: accountError } = usePlayer(gameName, tagLine, region);
  const { matches, matchListLoading, matchListError, hasMore, loadMore, loadingMore, refetch, isAutoLoading, totalLoadedMatches } = useMatches(
    account?.puuid,
    region,
    gameName,
    tagLine,
    filterMode
  );

  const loading = matchListLoading;

  const isOptedOut = account?.optedOut === true;
  const riotId = `${gameName}#${tagLine}`;

  const [showToast, setShowToast] = useState(false);
  const toastShown = useRef(false);
  useEffect(() => {
    if (!loading && matches.length > 0 && !toastShown.current) {
      toastShown.current = true;
      setShowToast(true);
    }
  }, [loading, matches.length]);

  const filteredMatches = useMemo(() => {
    if (filterMode === 'all') return matches;
    return matches.filter(m =>
      (m.info?.gameMode || m.queue || m.mode || '').toLowerCase() === filterMode
    );
  }, [matches, filterMode]);

  const matchStats = useMemo(() => {
    if (!account?.puuid || !filteredMatches) return [];
    return filteredMatches.map(m => extractPlayerStats(m, account.puuid)).filter(Boolean);
  }, [filteredMatches, account?.puuid]);

  const aggregated = useMemo(() => aggregateStats(matchStats), [matchStats]);
  const agentStats = useMemo(() => getAgentStats(matchStats), [matchStats]);

  const rankTier = "Gold";

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
      <SiteHeader showBack region={region} isAdmin={isAdmin} className='mb-8' />

      {account && !isOptedOut && !isAdmin && (
        <OptOutBanner puuid={account.puuid} riotId={riotId} />
      )}

      {accountLoading ? (
        <div className='glass-accent rounded-xl p-6 animate-pulse h-28' />
      ) : isOptedOut ? (
        <OptedOutCard riotId={riotId} />
      ) : (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className='space-y-8'>
          <Dashboard
            account={account}
            region={region}
            matchStats={matchStats}
            matches={matches}
            loading={loading}
          />

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

          <div className='space-y-4'>
            <div className='bg-gradient-to-br from-[var(--bg-dark)] to-[var(--bg-card)] border-2 border-[var(--accent)]/30 rounded-lg p-4'>
              <div className='text-sm font-bold text-[var(--text-primary)] mb-3 uppercase tracking-wide'>Filter Matches</div>
              <div className='flex items-center gap-2'>
                {['all', 'competitive'].map(mode => (
                  <button key={mode} onClick={() => setFilterMode(mode)}
                    className={`flex-1 px-5 py-2.5 rounded-lg font-bold text-sm transition-all duration-200 cursor-pointer border-2 ${
                      filterMode === mode
                        ? 'bg-[var(--accent)] text-white border-[var(--accent)] shadow-xl shadow-[var(--accent)]/40 scale-105'
                        : 'bg-[var(--bg-card)] border-[var(--text-muted)] text-[var(--text-secondary)] hover:border-[var(--accent)] hover:text-[var(--accent)] hover:bg-[var(--bg-darker)] hover:shadow-lg hover:shadow-[var(--accent)]/20 hover:scale-102'
                    }`}>
                    {mode === 'all' ? 'All Modes' : 'Competitive'}
                  </button>
                ))}
              </div>
            </div>
            <MatchHistory
              puuid={account?.puuid}
              region={region}
              matches={filteredMatches}
              loading={loading}
              loadingMore={loadingMore}
              error={matchListError}
              hasMore={hasMore}
              loadMore={loadMore}
              onRefresh={refetch}
            />
          </div>

          {matchStats.length > 0 && (
            <div className='glass-accent rounded-xl p-6 border border-[var(--border-light)]'>
              <div className='space-y-4'>
                <div className='space-y-2'>
                  <h2 className='text-lg font-bold text-[var(--text-primary)]'>Export Match Data</h2>
                  <p className='text-sm text-[var(--text-secondary)]'>Download your stats in JSON format</p>
                </div>

                <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                  <div className='glass rounded-lg p-4'>
                    <div className='text-xs text-[var(--text-secondary)] mb-1'>Filter Mode</div>
                    <div className='text-sm font-semibold text-[var(--text-primary)]'>
                      {filterMode === 'all' ? 'All Matches' : 'Competitive Only'}
                    </div>
                  </div>

                  <div className='glass rounded-lg p-4'>
                    <div className='text-xs text-[var(--text-secondary)] mb-1'>Matches to Export</div>
                    <div className='text-sm font-semibold text-[var(--text-primary)]'>
                      {filteredMatches.length} {filteredMatches.length === 1 ? 'match' : 'matches'}
                    </div>
                  </div>

                  <div className='glass rounded-lg p-4'>
                    <div className='text-xs text-[var(--text-secondary)] mb-1'>Performance</div>
                    <div className='text-sm font-semibold text-[var(--text-primary)]'>
                      {aggregated.kd?.toFixed(2) || '0.00'} K/D • {aggregated.acs?.toFixed(0) || '0'} ACS
                    </div>
                  </div>
                </div>

                <button onClick={handleExport}
                  className='w-full flex items-center justify-center gap-2 px-4 py-3 bg-[var(--accent)] text-white font-semibold rounded-lg hover:opacity-90 transition-opacity'>
                  <Download size={16} />
                  Export JSON
                </button>
              </div>
            </div>
          )}

          {matchStats.length > 0 && (
            <div className='space-y-3'>
              <h2 className='text-lg font-bold text-[var(--text-primary)]'>Share Stats</h2>
              <ShareCard account={account} stats={aggregated} agentStats={agentStats} />
            </div>
          )}
        </motion.div>
      )}

      <Toast
        visible={showToast}
        message="Stats are based on currently analyzed matches and will improve as more matches load."
        onDismiss={() => setShowToast(false)}
      />
      
      <ProgressIndicator matchCount={filteredMatches.length} isLoading={isAutoLoading} />
    </main>
  );
}
