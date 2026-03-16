"use client";
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { motion } from "framer-motion";

const COLORS = ['#7c5cfc','#22d3ee','#34d399','#f59e0b','#a78bfa','#f472b6','#60a5fa','#4ade80'];

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0];
  return (
    <div className='glass-accent rounded-lg px-3 py-2 text-xs'>
      <p className='font-semibold text-[var(--text-primary)] capitalize'>{d.name}</p>
      <p className='text-[var(--text-secondary)]'>{d.value} games ({d.payload.pct}%)</p>
    </div>
  );
};

export default function AgentPieChart({ agentStats }) {
  if (!agentStats || agentStats.length === 0) return null;

  const total = agentStats.reduce((a, s) => a + s.games, 0);
  const data = agentStats.slice(0, 7).map(s => ({
    name: s.agentId,
    value: s.games,
    pct: Math.round((s.games / total) * 100),
  }));

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
      className='glass-accent rounded-xl p-5'>
      <h3 className='text-sm font-semibold text-[var(--text-primary)] mb-4'>Agent Usage</h3>
      <ResponsiveContainer width='100%' height={240}>
        <PieChart>
          <Pie data={data} cx='50%' cy='50%' innerRadius={60} outerRadius={90}
            paddingAngle={3} dataKey='value'
            animationBegin={0} animationDuration={800}>
            {data.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend
            formatter={v => <span className='text-xs capitalize text-[var(--text-secondary)]'>{v}</span>}
          />
        </PieChart>
      </ResponsiveContainer>
    </motion.div>
  );
}