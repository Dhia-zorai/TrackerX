"use client";
import { motion } from "framer-motion";
import { AlertCircle, WifiOff, UserX, RefreshCw, Lock } from "lucide-react";

const ERROR_CONFIGS = {
  "Player not found": {
    icon: UserX,
    title: "Player Not Found",
    desc: "No account matches this Riot ID. Check the spelling and tag.",
  },
  "No match history found": {
    icon: AlertCircle,
    title: "No Match History",
    desc: "This account has no recorded competitive matches.",
  },
  "Riot API temporarily unavailable": {
    icon: WifiOff,
    title: "API Unavailable",
    desc: "The Riot API is temporarily down. Please try again in a moment.",
  },
  default: {
    icon: AlertCircle,
    title: "Something Went Wrong",
    desc: "An unexpected error occurred.",
  },
};

function isProductionKeyError(message) {
  return message && (
    message.includes("production Riot API key") ||
    message.includes("production API key") ||
    message.includes("Development keys only")
  );
}

export default function ErrorState({ message, onRetry }) {
  if (isProductionKeyError(message)) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass rounded-xl p-8 text-center space-y-4"
      >
        <div className="w-12 h-12 bg-[var(--accent-dim)] rounded-full flex items-center justify-center mx-auto">
          <Lock size={24} className="text-[var(--accent)]" />
        </div>
        <div>
          <p className="font-semibold text-[var(--text-primary)]">Production Key Required</p>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            Match history and ranked data require a{" "}
            <a
              href="https://developer.riotgames.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[var(--accent)] hover:underline"
            >
              production Riot API key
            </a>
            . Development keys only support account lookups.
          </p>
        </div>
      </motion.div>
    );
  }

  const config = ERROR_CONFIGS[message] || {
    ...ERROR_CONFIGS.default,
    desc: message || ERROR_CONFIGS.default.desc,
  };
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass rounded-xl p-8 text-center space-y-4"
    >
      <div className="w-12 h-12 bg-[var(--accent-dim)] rounded-full flex items-center justify-center mx-auto">
        <Icon size={24} className="text-[var(--accent)]" />
      </div>
      <div>
        <p className="font-semibold text-[var(--text-primary)]">{config.title}</p>
        <p className="text-sm text-[var(--text-secondary)] mt-1">{config.desc}</p>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="flex items-center gap-2 mx-auto px-4 py-2 rounded-lg bg-[var(--accent-dim)] text-[var(--accent)] text-sm font-medium hover:bg-[var(--accent)] hover:text-white transition-colors"
        >
          <RefreshCw size={14} /> Try Again
        </button>
      )}
    </motion.div>
  );
}
