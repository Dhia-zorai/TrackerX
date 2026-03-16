"use client";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { motion } from "framer-motion";

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0];
  return (
    <div className='glass-accent rounded-lg px-3 py-2 text-xs'>
      <p className='font-semibold text-[var(--text-primary)] capitalize mb-1'>{label}</p>
      <p className='text-[var(--text-secondary)]'>Win Rate: <span className='text-[var(--text-primary)]'>{d.value}%</span></p>
      <p className='text-[var(--text-secondary)]'>Games: {d.payload.games}</p>
    </div>
  );
};

export default function AgentWinRateBar({ agentStats }) {
  if (!agentStats || agentStats.length === 0) return null;

  const data = agentStats.slice(0, 8).map(s => ({
    name: s.agentId,
    winRate: s.winRate,
    games: s.games,
  }));

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25 }}
      className='glass-accent rounded-xl p-5'>
      <h3 className='text-sm font-semibold text-[var(--text-primary)] mb-4'>Win Rate by Agent</h3>
      <ResponsiveContainer width='100%' height={220}>
        <BarChart data={data} layout='vertical' margin={{ left: 8, right: 16 }}>
          <CartesianGrid strokeDasharray='3 3' stroke='var(--border)' horizontal={false} />
          <XAxis type='number' domain={[0, 100]} tickLine={false} axisLine={false}
            tick={{ fill: 'var(--text-secondary)', fontSize: 10 }}
            tickFormatter={v => v + '%'} />
          <YAxis type='category' dataKey='name' tickLine={false} axisLine={false}
            tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} width={72}
            tickFormatter={v => v.slice(0, 8)} />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'var(--accent-dim)' }} />
          <Bar dataKey='winRate' radius={[0, 6, 6, 0]} animationDuration={800}>
            {data.map((d, i) => (
              <Cell key={i} fill={d.winRate >= 50 ? '#34d399' : '#f87171'} fillOpacity={0.85} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </motion.div>
  );
}