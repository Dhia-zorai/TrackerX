"use client";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import { motion } from "framer-motion";
import { useRankHistory } from "@/hooks/useRankHistory";

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className='glass-accent rounded-lg px-3 py-2 text-xs'>
      <p className='text-[var(--text-secondary)]'>Game {d.game}</p>
      <p className='font-semibold text-[var(--text-primary)]'>ACS: {d.acs}</p>
      <p className='text-[var(--text-secondary)]'>K/D: {d.kd}</p>
      <span className={d.won ? 'text-[var(--win)]' : 'text-[var(--loss)]'}>{d.won ? 'Win' : 'Loss'}</span>
    </div>
  );
};

export default function AcsLineChart({ matchStats }) {
  const { data } = useRankHistory(matchStats);
  if (!data || data.length === 0) return null;

  const avg = data.length > 0 ? Math.round(data.reduce((a, d) => a + d.acs, 0) / data.length) : 0;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
      className='glass-accent rounded-xl p-5'>
      <div className='flex items-center justify-between mb-4'>
        <h3 className='text-sm font-semibold text-[var(--text-primary)]'>ACS Over Time</h3>
        <span className='text-xs text-[var(--text-secondary)]'>Avg: <span className='text-[var(--text-primary)] font-semibold'>{avg}</span></span>
      </div>
      <ResponsiveContainer width='100%' height={200}>
        <LineChart data={data} margin={{ left: 0, right: 8 }}>
          <CartesianGrid strokeDasharray='3 3' stroke='var(--border)' />
          <XAxis dataKey='game' tickLine={false} axisLine={false}
            tick={{ fill: 'var(--text-secondary)', fontSize: 10 }} label={{ value: 'Game', position: 'insideBottomRight', offset: -4, fontSize: 10, fill: 'var(--text-secondary)' }} />
          <YAxis tickLine={false} axisLine={false} tick={{ fill: 'var(--text-secondary)', fontSize: 10 }} />
          <Tooltip content={<CustomTooltip />} />
          <ReferenceLine y={avg} stroke='var(--accent)' strokeDasharray='4 4' strokeOpacity={0.5} />
          <Line type='monotone' dataKey='acs' stroke='#ff4655' strokeWidth={2}
            dot={d => (
              <circle key={d.index} cx={d.cx} cy={d.cy} r={3}
                fill={d.payload.won ? '#4ade80' : '#f87171'}
                stroke='none' />
            )}
            activeDot={{ r: 5, fill: '#ff4655' }}
            animationDuration={800} />
        </LineChart>
      </ResponsiveContainer>
      <p className='text-xs text-[var(--text-secondary)] mt-2 text-center'>Dots: green = win, red = loss</p>
    </motion.div>
  );
}