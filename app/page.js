"use client";
import { motion } from "framer-motion";
import PlayerSearch from "@/components/PlayerSearch";
import { Crosshair, TrendingUp, Users, Shield } from "lucide-react";
import ThemeToggle from "@/components/ui/ThemeToggle";

const features = [
  { icon: TrendingUp, title: "Match History", desc: "Full K/D/A, ACS, and scoreboard for every game" },
  { icon: Crosshair, title: "Agent Stats", desc: "Win rates and performance by agent" },
  { icon: Users, title: "Leaderboard", desc: "Top Radiant players in your region" },
  { icon: Shield, title: "Export Data", desc: "Download your stats as CSV or JSON" },
];

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 py-16 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-[var(--accent)] opacity-[0.04] rounded-full blur-[120px]" />
      </div>

      {/* Theme toggle */}
      <div className="absolute top-6 right-6">
        <ThemeToggle />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col items-center gap-8 w-full max-w-2xl text-center"
      >
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[var(--accent)] rounded-lg flex items-center justify-center glow-accent">
            <Crosshair size={22} className="text-white" strokeWidth={2.5} />
          </div>
          <span className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">
            Tracker<span className="text-[var(--accent)]">X</span>
          </span>
        </div>

        {/* Headline */}
        <div className="space-y-3">
          <h1 className="text-5xl font-bold tracking-tight text-[var(--text-primary)] leading-tight">
            Your Valorant Stats,<br />
            <span className="text-[var(--accent)]">Instant & Clean</span>
          </h1>
          <p className="text-lg text-[var(--text-secondary)] max-w-md mx-auto">
            Search any Riot ID and instantly view competitive performance,
            match history, and agent analytics.
          </p>
        </div>

        {/* Search */}
        <PlayerSearch />

        {/* Feature pills */}
        <div className="grid grid-cols-2 gap-3 w-full mt-4">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.08 }}
              className="glass rounded-xl p-4 text-left flex items-start gap-3 group hover:-translate-y-0.5 transition-transform duration-200"
            >
              <div className="w-8 h-8 bg-[var(--accent-dim)] rounded-lg flex items-center justify-center shrink-0 group-hover:bg-[var(--accent)] transition-colors">
                <f.icon size={16} className="text-[var(--accent)] group-hover:text-white transition-colors" />
              </div>
              <div>
                <p className="text-sm font-semibold text-[var(--text-primary)]">{f.title}</p>
                <p className="text-xs text-[var(--text-secondary)] mt-0.5">{f.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </main>
  );
}
