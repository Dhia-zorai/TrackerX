"use client";
import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";

function AnimatedNumber({ value, duration = 800, decimals = 0 }) {
  const [display, setDisplay] = useState(0);
  const frameRef = useRef(null);
  useEffect(() => {
    const to = typeof value === 'number' ? value : parseFloat(value) || 0;
    const start = performance.now();
    function tick(now) {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(to * eased);
      if (progress < 1) frameRef.current = requestAnimationFrame(tick);
    }
    frameRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameRef.current);
  }, [value, duration]);
  return <span>{display.toFixed(decimals)}</span>;
}

export default function StatCard({ label, value, sub, icon: Icon, color, delay = 0, suffix = '' }) {
  const numVal = typeof value === 'number' ? value : parseFloat(value) || 0;
  const decimals = numVal % 1 !== 0 ? 2 : 0;
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ y: -2, boxShadow: '0 8px 32px var(--accent-glow)' }}
      className='glass-accent rounded-xl p-5 cursor-default flex flex-col justify-between'
    >
      <div className='flex items-start justify-between'>
        <span className='text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider'>{label}</span>
        {Icon && (
          <div className='w-7 h-7 rounded-lg flex items-center justify-center shrink-0'
            style={{ background: color ? color + '22' : 'var(--accent-dim)' }}>
            <Icon size={14} style={{ color: color || 'var(--accent)' }} />
          </div>
        )}
      </div>
      <div className='mt-3 flex-1 flex flex-col justify-end'>
        <div className='flex items-baseline gap-2'>
          <p className='text-3xl font-bold text-[var(--text-primary)] tracking-tight'>
            {typeof value === 'number' ? <AnimatedNumber value={numVal} decimals={decimals} /> : value}
            {suffix && <span className='text-lg ml-0.5 text-[var(--text-secondary)]'>{suffix}</span>}
          </p>
        </div>
        <div className='mt-1 min-h-[16px]'>
          {sub && <p title={sub} className='text-[10px] sm:text-[11px] text-[var(--text-secondary)] truncate w-full'>{sub}</p>}
        </div>
      </div>
    </motion.div>
  );
}