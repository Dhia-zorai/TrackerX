"use client";
import { motion } from "framer-motion";
import PlayerSearch from "@/components/PlayerSearch";
import { Crosshair, TrendingUp, Activity, FileJson } from "lucide-react";
import ThemeToggle from "@/components/ui/ThemeToggle";

const features = [
  {
    icon: TrendingUp,
    title: "Match History",
    desc: "Full K/D/A, ACS, and scoreboard for every game",
    color: "var(--accent)",
  },
  {
    icon: Crosshair,
    title: "Agent Stats",
    desc: "Win rates and performance broken down by agent",
    color: "var(--accent2)",
  },
  {
    icon: Activity,
    title: "Performance Trends",
    desc: "Track how your stats evolve over time with interactive graphs and insights",
    color: "#6366f1",
  },
  {
    icon: FileJson,
    title: "Data Export (JSON)",
    desc: "Download your stats as structured JSON for deeper analysis or external tools",
    color: "#10b981",
  },
];

export default function Home() {
  return (
    <main className="w-full min-h-screen flex flex-col items-center justify-center px-4 py-16 relative overflow-hidden">
      {/* Grid dot background */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            "radial-gradient(circle, rgba(124,92,252,0.08) 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }}
      />

      {/* Central glow blob */}
      <div
        className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[700px] h-[500px] pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse, rgba(124,92,252,0.10) 0%, rgba(34,211,238,0.04) 55%, transparent 75%)",
          filter: "blur(40px)",
        }}
      />

      {/* Theme toggle */}
      <div className="absolute top-6 right-6 z-10">
        <ThemeToggle />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
        className="flex flex-col items-center gap-10 w-full max-w-2xl text-center relative z-10"
      >
        {/* Wordmark */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="flex items-center gap-3"
        >
          <div className="w-10 h-10 rounded-xl flex items-center justify-center glow-sm gradient-brand shrink-0">
            <Crosshair size={20} className="text-white" strokeWidth={2.5} />
          </div>
          <span className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">
            Tracker<span className="gradient-text">X</span>
          </span>
        </motion.div>

        {/* Headline */}
        <div className="space-y-4">
          <h1 className="text-5xl sm:text-6xl font-bold tracking-tight leading-[1.08]">
            <span className="text-[var(--text-primary)]">
              Your VALORANT stats
            </span>
            <br />
          </h1>
          <p className="text-base text-[var(--text-secondary)] max-w-sm mx-auto leading-relaxed">
            Search any Riot ID. Instantly view competitive performance, match
            history and analytics.
          </p>
        </div>

        {/* Search bar */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="w-full"
        >
          <PlayerSearch />
        </motion.div>

        {/* Feature pills */}
        <div className="grid grid-cols-2 gap-3 w-full">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                delay: 0.22 + i * 0.07,
                duration: 0.45,
                ease: [0.16, 1, 0.3, 1],
              }}
              className="glass rounded-xl p-4 text-left flex items-start gap-3 hover:-translate-y-0.5 transition-transform duration-200"
            >
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                style={{ background: f.color + "1a" }}
              >
                <f.icon size={15} style={{ color: f.color }} />
              </div>
              <div>
                <p className="text-sm font-semibold text-[var(--text-primary)]">
                  {f.title}
                </p>
                <p className="text-xs text-[var(--text-secondary)] mt-0.5 leading-relaxed">
                  {f.desc}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Footer note */}
        <p className="text-xs text-[var(--text-muted)]">
          Powered by Henrik Dev API &middot; Not affiliated with Riot Games
        </p>
      </motion.div>
    </main>
  );
}
