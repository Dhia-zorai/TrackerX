"use client";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { motion } from "framer-motion";
import { computeSideWinRates } from "@/lib/analyticsUtils";

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  const attack = payload.find((p) => p.dataKey === "attackWinPct")?.value;
  const defense = payload.find((p) => p.dataKey === "defenseWinPct")?.value;
  return (
    <div className='bg-[var(--bg-elevated)] border border-[var(--border-accent)] shadow-2xl rounded-lg px-4 py-3 text-xs min-w-[140px]'>
      <p className='font-bold text-[var(--text-primary)] mb-2 pb-2 border-b border-[var(--border)]'>{label}</p>
      <div className='flex flex-col gap-2'>
        <p className='flex items-center justify-between gap-4'>
          <span className='flex items-center gap-1.5 text-[var(--text-secondary)] font-medium'>
            <span className='w-2.5 h-2.5 rounded-full bg-[#f59e0b]'></span> Attack Win %
          </span>
          <span className='font-bold text-[var(--text-primary)]'>{attack == null ? "N/A" : `${attack}%`}</span>
        </p>
        <p className='flex items-center justify-between gap-4'>
          <span className='flex items-center gap-1.5 text-[var(--text-secondary)] font-medium'>
            <span className='w-2.5 h-2.5 rounded-full bg-[#22d3ee]'></span> Defense Win %
          </span>
          <span className='font-bold text-[var(--text-primary)]'>{defense == null ? "N/A" : `${defense}%`}</span>
        </p>
      </div>
    </div>
  );
};

export default function AttackDefenseByMapChart({ matches }) {
  const data = computeSideWinRates(matches).map((d) => ({
    ...d,
    mapShort: d.map.length > 8 ? `${d.map.slice(0, 8)}...` : d.map,
    attackWinPct: d.attackWinPct == null ? 0 : Number(d.attackWinPct.toFixed(1)),
    defenseWinPct: d.defenseWinPct == null ? 0 : Number(d.defenseWinPct.toFixed(1)),
  }));

  if (data.length === 0) return null;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.45 }} className='glass-accent rounded-xl p-5'>
      <div className='mb-6'>
        <h3 className='text-sm font-bold text-[var(--text-primary)]'>Attack vs Defense Win Rate</h3>
        <p className='text-xs text-[var(--text-secondary)] mt-1 max-w-sm'>
          Percentage of rounds won on the attacking and defending side per map.
        </p>
      </div>
      <ResponsiveContainer width='100%' height={240}>
        <BarChart data={data} margin={{ left: 0, right: 8 }}>
          <CartesianGrid strokeDasharray='3 3' stroke='var(--border)' />
          <XAxis
            dataKey='mapShort'
            tickLine={false}
            axisLine={false}
            tick={{ fill: 'var(--text-secondary)', fontSize: 10 }}
          />
          <YAxis
            domain={[0, 100]}
            tickLine={false}
            axisLine={false}
            tick={{ fill: 'var(--text-secondary)', fontSize: 10 }}
            tickFormatter={(v) => `${v}%`}
          />
          <Tooltip 
            content={<CustomTooltip />} 
            cursor={{ fill: 'var(--border)', opacity: 0.4 }}
          />
          <Legend formatter={(v) => <span className='text-xs text-[var(--text-secondary)]'>{v === 'attackWinPct' ? 'Attack' : 'Defense'}</span>} />
          <Bar dataKey='attackWinPct' name='Attack' fill='#f59e0b' radius={[4, 4, 0, 0]} />
          <Bar dataKey='defenseWinPct' name='Defense' fill='#22d3ee' radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </motion.div>
  );
}
