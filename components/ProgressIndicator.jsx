'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';

export function ProgressIndicator({ matchCount, isLoading }) {
  const [visible, setVisible] = useState(false);
  const [hideTimer, setHideTimer] = useState(null);

  useEffect(() => {
    // Show indicator when loading or match count changes
    if (isLoading || matchCount > 0) {
      setVisible(true);
      
      // Clear any existing hide timer
      if (hideTimer) {
        clearTimeout(hideTimer);
        setHideTimer(null);
      }
    }

    // When loading finishes, hide after 3 seconds
    if (!isLoading && matchCount > 0) {
      const timer = setTimeout(() => {
        setVisible(false);
      }, 3000);
      setHideTimer(timer);

      return () => clearTimeout(timer);
    }
  }, [isLoading, matchCount]);

  return (
    <AnimatePresence>
      {visible && matchCount > 0 && (
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
            {isLoading ? 'Loading remaining matches...' : `Analyzed ${matchCount} matches`}
          </span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
