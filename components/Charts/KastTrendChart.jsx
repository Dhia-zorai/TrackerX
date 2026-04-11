"use client";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import { motion } from "framer-motion";
import { computeKastTrend } from "@/lib/analyticsUtils";

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className='bg-[var(--bg-elevated)] border border-[var(--border-accent)] shadow-2xl rounded-lg px-4 py-3 text-xs min-w-[140px]'>
      <p className='font-bold text-[var(--text-primary)] mb-2 pb-2 border-b border-[var(--border)]'>Match {d.index}</p>
      <div className='flex flex-col gap-2'>
        <p className='flex items-center justify-between gap-4'>
          <span className='text-[var(--text-secondary)] font-medium'>KAST%</span>
          <span className={`font-bold ${d.kast_pct >= 70 ? 'text-[var(--win)]' : d.kast_pct <= 50 ? 'text-[var(--loss)]' : 'text-[var(--text-primary)]'}`}>
            {d.kast_pct.toFixed(1)}%
          </span>
        </p>
      </div>
    </div>
  );
};

export default function KastTrendChart({ matches, loading = false }) {
  const data = computeKastTrend(matches);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.35 }} className='glass-accent rounded-xl p-5'>
      <h3 className='text-sm font-semibold text-[var(--text-primary)] mb-4'>KAST% Trend</h3>
      {data.length < 3 ? (
        <div className='h-[200px] flex items-center justify-center text-sm text-[var(--text-secondary)]'>
          {loading ? 'Loading detailed round data...' : 'Not enough data yet'}
        </div>
      ) : (
        <ResponsiveContainer width='100%' height={200}>
          <LineChart data={data} margin={{ left: 0, right: 8 }}>
            <CartesianGrid strokeDasharray='3 3' stroke='var(--border)' />
            <XAxis
              dataKey='index'
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
            <Tooltip content={<CustomTooltip />} />
            <ReferenceLine
              y={70}
              stroke='var(--text-secondary)'
              strokeDasharray='4 4'
              label={{ value: 'Good KAST', position: 'insideTopRight', fill: 'var(--text-secondary)', fontSize: 11 }}
            />
            <Line
              type='monotone'
              dataKey='kast_pct'
              stroke='var(--accent)'
              strokeWidth={2}
              dot={{ r: 3, fill: 'var(--accent)', stroke: 'none' }}
              activeDot={{ r: 5, fill: 'var(--accent)' }}
              animationDuration={800}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </motion.div>
  );
}
