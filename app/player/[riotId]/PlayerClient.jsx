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
import { AgentPieChart, AgentWinRateBar, AcsLineChart, PerformanceRadar, AttackDefenseByMapChart, MapRankingCards } from "@/components/Charts";
import ErrorState from "@/components/ui/ErrorState";
import { decodeRiotIdFromUrl, extractPlayerStats, aggregateStats, getAgentStats } from "@/lib/utils";
import { exportFullJSON } from "@/lib/exportData";
import { computeMatchStats } from "@/lib/computeMatchStats";
import { OptOutBanner } from "@/components/OptOutBanner";
import { OptedOutCard } from "@/components/OptedOutCard";
import SiteHeader from "@/components/SiteHeader";

export function PlayerClient({ resolvedParams, isAdmin }) {
  const searchParams = useSearchParams();
  const region = searchParams.get('region') || 'na';

  const { gameName, tagLine } = decodeRiotIdFromUrl(resolvedParams.riotId);

  const [filterMode, setFilterMode] = useState('competitive');
  const [analyticsByMatchId, setAnalyticsByMatchId] = useState({});
  const [analyticsLoading, setAnalyticsLoading] = useState(false);

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

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    const analyticsRef = { current: analyticsByMatchId };
    
    let cancelled = false;

    async function hydrateAnalytics() {
      if (!account?.puuid || !filteredMatches.length) {
        if (!cancelled) setAnalyticsByMatchId((prev) => Object.keys(prev).length === 0 ? prev : {});
        return;
      }

      if (!cancelled) setAnalyticsLoading(true);

      const needsDetails = filteredMatches
        .filter((m) => m?.matchId)
        .filter((m) => !analyticsRef.current[m.matchId])
        .filter((m) => {
          const hasRootAdvanced =
            m.kast_pct != null ||
            m.first_bloods != null ||
            m.first_deaths != null ||
            m.side_attack_rounds != null ||
            m.side_defense_rounds != null;
          const hasRawRounds = Array.isArray(m?._henrik?.rounds) && m._henrik.rounds.length > 0;
          return !hasRootAdvanced && !hasRawRounds;
        });

      if (needsDetails.length === 0) {
        if (!cancelled) setAnalyticsLoading(false);
        return;
      }

      async function fetchWithRetry(matchId, attempts = 3) {
        for (let i = 0; i <= attempts; i++) {
          try {
            const res = await fetch(`/api/riot/match-detail?matchId=${encodeURIComponent(matchId)}`);
            if (res.ok) return await res.json();
          } catch {
          }
          if (i < attempts) {
            await new Promise((r) => setTimeout(r, 800 * (i + 1)));
          }
        }
        return null;
      }

      const entries = [];
      for (const m of needsDetails) {
        if (cancelled) break;
        const detail = await fetchWithRetry(m.matchId, 3);
        if (!detail) continue;
        const raw = detail?._henrik || detail;
        const adv = computeMatchStats(raw, account.puuid);
        entries.push([m.matchId, adv]);
      }

      if (cancelled) return;

      const next = {};
      for (const item of entries) {
        if (item && item[0] && item[1]) next[item[0]] = item[1];
      }
      if (Object.keys(next).length > 0) {
        setAnalyticsByMatchId((prev) => ({ ...prev, ...next }));
      }
      setAnalyticsLoading(false);
    }

    hydrateAnalytics();
    return () => {
      cancelled = true;
    };
  }, [filteredMatches, account?.puuid]);

  const analyticsMatches = useMemo(() => {
    if (!account?.puuid) return [];

    return filteredMatches
      .map((m) => {
        const base = extractPlayerStats(m, account.puuid);
        if (!base) return null;

        const mode = (m.info?.gameMode || m.queue || m.mode || "").toLowerCase();
        const matchDate = m.info?.gameStartMillis
          ? new Date(m.info.gameStartMillis).toISOString()
          : null;

        let advanced = null;
        if (m?._henrik && Array.isArray(m._henrik.rounds) && m._henrik.rounds.length > 0) {
          advanced = computeMatchStats(m._henrik, account.puuid);
        } else if (m?.matchId && analyticsByMatchId[m.matchId]) {
          advanced = analyticsByMatchId[m.matchId];
        }

        const normalizedPlayer = m.players?.find((p) => p.puuid === account.puuid);
        const rawPlayer = m?._henrik?.players?.all_players?.find((p) => p.puuid === account.puuid);
        const pStats = normalizedPlayer?.stats || rawPlayer?.stats || {};

        const inlineKast = pStats.kast_pct ?? pStats.kast ?? pStats.kastPercentage ?? null;
        const inlineFb = pStats.first_bloods ?? pStats.first_kills ?? pStats.firstBloods ?? pStats.firstKills ?? null;
        const inlineFd = pStats.first_deaths ?? pStats.firstDeaths ?? null;

        return {
          map: m.map || m.info?.mapId || "Unknown",
          result: base.drew ? "Draw" : base.won ? "Win" : "Loss",
          kd: base.kd,
          acs: base.acs,
          hs_pct: base.hsPct,
          match_date: matchDate,
          mode,
          kast_pct: advanced?.kast_pct ?? inlineKast ?? m.kast_pct ?? m.kastPct ?? null,
          first_bloods: advanced?.first_bloods ?? inlineFb ?? m.first_bloods ?? m.firstBloods ?? null,
          first_deaths: advanced?.first_deaths ?? inlineFd ?? m.first_deaths ?? m.firstDeaths ?? null,
          side_attack_rounds: advanced?.side_attack_rounds ?? m.side_attack_rounds ?? m.sideAttackRounds ?? null,
          side_attack_wins: advanced?.side_attack_wins ?? m.side_attack_wins ?? m.sideAttackWins ?? null,
          side_defense_rounds: advanced?.side_defense_rounds ?? m.side_defense_rounds ?? m.sideDefenseRounds ?? null,
          side_defense_wins: advanced?.side_defense_wins ?? m.side_defense_wins ?? m.sideDefenseWins ?? null,
        };
      })
      .filter(Boolean);
  }, [filteredMatches, account?.puuid]);

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
      <SiteHeader showBack region={region} isAdmin={isAdmin} enableSpotlight className='mb-8' />

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
                <AttackDefenseByMapChart matches={analyticsMatches} />
              </div>
              <div className='mt-4'>
                <MapRankingCards matches={analyticsMatches} />
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
              analyticsByMatchId={analyticsByMatchId}
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
