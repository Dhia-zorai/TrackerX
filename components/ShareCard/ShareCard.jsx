"use client";
import { useRef } from "react";
import { motion } from "framer-motion";
import { Download } from "lucide-react";
import { toPng } from "html-to-image";

export default function ShareCard({ account, stats, agentStats }) {
  const cardRef = useRef(null);

  async function handleExport() {
    if (!cardRef.current) return;
    try {
      const dataUrl = await toPng(cardRef.current, { quality: 1, pixelRatio: 2 });
      const link = document.createElement('a');
      link.download = (account?.gameName || 'stats') + '-trackerx.png';
      link.href = dataUrl;
      link.click();
    } catch (e) {
      console.error('Export failed:', e);
    }
  }

  if (!account || !stats) return null;

  const topAgent = agentStats?.[0] ?? null;

  const statItems = [
    { label: 'Win Rate',      value: stats.winRate + '%',       color: '#4ade80' },
    { label: 'K/D Ratio',     value: stats.kd.toFixed(2),       color: '#ff4655' },
    { label: 'Avg ACS',       value: String(stats.acs),         color: '#f0b429' },
    { label: 'HS%',           value: stats.hsPct + '%',         color: '#4fc3f7' },
    { label: 'Avg Kills',     value: stats.avgKills?.toFixed(1) ?? '—', color: '#c084fc' },
    { label: 'Games',         value: String(stats.gamesPlayed), color: '#94a3b8' },
  ];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className='space-y-3'>
      {/* Exportable card */}
      <div ref={cardRef} style={{
        fontFamily: 'Inter, sans-serif',
        background: '#0f1923',
        padding: '32px',
        borderRadius: '16px',
        border: '1px solid rgba(255,70,85,0.3)',
        width: '380px',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
          <div style={{
            width: '48px', height: '48px', background: '#ff4655', borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'white', fontWeight: 'bold', fontSize: '18px', flexShrink: 0,
          }}>
            {account.gameName?.slice(0, 2).toUpperCase()}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ color: '#ecf0f1', fontWeight: 'bold', fontSize: '18px', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {account.gameName}
            </p>
            <p style={{ color: '#8899aa', fontSize: '13px', margin: 0 }}>#{account.tagLine}</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
            <div style={{ width: '8px', height: '8px', background: '#ff4655', borderRadius: '50%' }} />
            <span style={{ color: '#ff4655', fontSize: '12px', fontWeight: '600' }}>TrackerX</span>
          </div>
        </div>

        {/* Stats grid — 2×3 */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '14px' }}>
          {statItems.map(s => (
            <div key={s.label} style={{
              background: 'rgba(255,255,255,0.04)',
              borderRadius: '10px',
              padding: '12px 14px',
              border: '1px solid rgba(255,255,255,0.08)',
            }}>
              <p style={{ color: '#8899aa', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 5px' }}>
                {s.label}
              </p>
              <p style={{ color: s.color, fontSize: '22px', fontWeight: 'bold', margin: 0 }}>
                {s.value}
              </p>
            </div>
          ))}
        </div>

        {/* Top Agent spotlight */}
        {topAgent && (
          <div style={{
            background: 'rgba(255,70,85,0.08)',
            borderRadius: '10px',
            padding: '12px 14px',
            border: '1px solid rgba(255,70,85,0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <div>
              <p style={{ color: '#8899aa', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 4px' }}>
                Top Agent
              </p>
              <p style={{ color: '#ecf0f1', fontSize: '15px', fontWeight: 'bold', margin: 0 }}>
                {topAgent.agent}
              </p>
            </div>
            <div style={{ display: 'flex', gap: '16px', textAlign: 'right' }}>
              <div>
                <p style={{ color: '#8899aa', fontSize: '10px', margin: '0 0 3px' }}>Games</p>
                <p style={{ color: '#ecf0f1', fontSize: '14px', fontWeight: '600', margin: 0 }}>{topAgent.games}</p>
              </div>
              <div>
                <p style={{ color: '#8899aa', fontSize: '10px', margin: '0 0 3px' }}>Win Rate</p>
                <p style={{ color: '#4ade80', fontSize: '14px', fontWeight: '600', margin: 0 }}>{topAgent.winRate}%</p>
              </div>
            </div>
          </div>
        )}

        <p style={{ color: '#8899aa', fontSize: '10px', textAlign: 'center', margin: '16px 0 0' }}>
          trackerx.app &bull; {stats.gamesPlayed} games analyzed
        </p>
      </div>

      <button onClick={handleExport}
        className='flex items-center gap-2 px-4 py-2 glass-accent rounded-lg text-sm font-medium text-[var(--accent)] hover:bg-[var(--accent)] hover:text-white transition-colors'>
        <Download size={14} /> Export as PNG
      </button>
    </motion.div>
  );
}
