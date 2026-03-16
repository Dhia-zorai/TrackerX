"use client";
import { Sun, Moon } from "lucide-react";
import { usePlayerStore } from "@/store/playerStore";
import { motion } from "framer-motion";

export default function ThemeToggle() {
  const { theme, toggleTheme } = usePlayerStore();
  const isDark = theme === "dark";

  return (
    <button
      onClick={toggleTheme}
      className="w-9 h-9 glass rounded-lg flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--accent)] hover:border-[var(--border-accent)] transition-colors"
      aria-label="Toggle theme"
    >
      <motion.div
        key={theme}
        initial={{ rotate: -30, opacity: 0 }}
        animate={{ rotate: 0, opacity: 1 }}
        exit={{ rotate: 30, opacity: 0 }}
        transition={{ duration: 0.2 }}
      >
        {isDark ? <Sun size={16} /> : <Moon size={16} />}
      </motion.div>
    </button>
  );
}
