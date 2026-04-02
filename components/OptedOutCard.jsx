"use client";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";

export function OptedOutCard({ riotId }) {
  const router = useRouter();

  return (
    <div className="min-h-[60vh] flex items-center justify-center w-full relative overflow-hidden">
      {/* Radial gradient grid background - same as landing page */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(circle, rgba(124,92,252,0.08) 1px, transparent 1px)',
          backgroundSize: '32px 32px',
        }}
      />
      <div 
        className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[700px] h-[500px] pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse, rgba(124,92,252,0.10) 0%, rgba(34,211,238,0.08) 50%, transparent 70%)',
          filter: 'blur(40px)',
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        className="glass rounded-xl p-8 max-w-md text-center relative z-10"
      >
        <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-3">
          {riotId}
        </h1>
        <p className="text-sm text-[var(--text-secondary)] mb-6">
          This profile is private by player request. Match data has been removed from TrackerX.
        </p>
        <button
          onClick={() => router.back()}
          className="px-4 py-2 rounded-lg border transition-colors cursor-pointer"
          style={{
            borderColor: 'var(--border)',
            color: 'var(--text-secondary)',
          }}
        >
          Go back
        </button>
      </motion.div>
    </div>
  );
}
