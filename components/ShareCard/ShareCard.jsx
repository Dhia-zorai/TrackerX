"use client";
import { useRef } from "react";
import { motion } from "framer-motion";
import { Download, Crosshair, TrendingUp, Target, Zap } from "lucide-react";
import { toPng } from "html-to-image";

export default function ShareCard({ account, stats }) {
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

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className='space-y-3'>
      {/* Exportable card */}
      <div ref={cardRef} style={{ fontFamily: 'Inter, sans-serif', background: '#0f1923', padding: '32px', borderRadius: '16px', border: '1px solid rgba(255,70,85,0.3)', width: '380px' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
          <div style={{ width: '48px', height: '48px', background: '#ff4655', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold', fontSize: '18px' }}>
            {account.gameName?.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <p style={{ color: '#ecf0f1', fontWeight: 'bold', fontSize: '18px', margin: 0 }}>{account.gameName}</p>
            <p style={{ color: '#8899aa', fontSize: '13px', margin: 0 }}>#{account.tagLine}</p>
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{ width: '8px', height: '8px', background: '#ff4655', borderRadius: '50%' }} />
            <span style={{ color: '#ff4655', fontSize: '12px', fontWeight: '600' }}>TrackerX</span>
          </div>
        </div>

        {/* Stats grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          {[
            { label: 'Win Rate', value: stats.winRate + '%', color: '#4ade80' },
            { label: 'K/D Ratio', value: stats.kd.toFixed(2), color: '#ff4655' },
            { label: 'Avg ACS', value: stats.acs, color: '#f0b429' },
            { label: 'HS%', value: stats.hsPct + '%', color: '#4fc3f7' },
          ].map(s => (
            <div key={s.label} style={{ background: 'rgba(255,255,255,0.04)', borderRadius: '10px', padding: '14px', border: '1px solid rgba(255,255,255,0.08)' }}>
              <p style={{ color: '#8899aa', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 6px' }}>{s.label}</p>
              <p style={{ color: s.color, fontSize: '24px', fontWeight: 'bold', margin: 0 }}>{s.value}</p>
            </div>
          ))}
        </div>

        <p style={{ color: '#8899aa', fontSize: '10px', textAlign: 'center', marginTop: '20px', margin: '20px 0 0' }}>
          trackerx.app &bull; {stats.gamesPlayed} games
        </p>
      </div>

      <button onClick={handleExport}
        className='flex items-center gap-2 px-4 py-2 glass-accent rounded-lg text-sm font-medium text-[var(--accent)] hover:bg-[var(--accent)] hover:text-white transition-colors'>
        <Download size={14} /> Export as PNG
      </button>
    </motion.div>
  );
}