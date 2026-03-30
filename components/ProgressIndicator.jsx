'use client';

import { motion, AnimatePresence } from 'framer-motion';

export function ProgressIndicator({ matchCount, isLoading }) {
  return (
    <AnimatePresence>
      {matchCount > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
          className="fixed top-20 right-6 z-40 flex items-center gap-2 px-4 py-2.5 rounded-lg bg-blue-500/10 border border-blue-500/30 backdrop-blur-sm"
        >
          {isLoading && (
            <div className="w-3 h-3 rounded-full bg-blue-500 animate-pulse" />
          )}
          <span className="text-sm font-medium text-blue-300">
            Analyzing {matchCount} matches{isLoading ? '…' : ''}
          </span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
