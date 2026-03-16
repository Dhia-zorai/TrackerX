"use client";
import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Info } from "lucide-react";

/**
 * Toast — small non-intrusive notification.
 *
 * Props:
 *   visible   boolean  — controls whether the toast is shown
 *   message   string   — text to display
 *   onDismiss function — called when the user dismisses or timeout expires
 *   duration  number   — ms before auto-dismiss (default 10 000)
 */
export default function Toast({ visible, message, onDismiss, duration = 10000 }) {
  const timerRef = useRef(null);

  useEffect(() => {
    if (visible) {
      timerRef.current = setTimeout(() => {
        onDismiss?.();
      }, duration);
    }
    return () => clearTimeout(timerRef.current);
  }, [visible, duration, onDismiss]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 16, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 16, scale: 0.97 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="fixed bottom-6 right-6 z-50 max-w-sm w-full pointer-events-auto"
        >
          <div
            className="flex items-start gap-3 rounded-xl px-4 py-3 border border-[var(--border-accent)] shadow-lg"
            style={{ background: 'var(--bg-elevated)' }}
          >
            <div className="shrink-0 mt-0.5">
              <Info size={15} className="text-[var(--accent)]" />
            </div>
            <p className="flex-1 text-xs leading-relaxed text-[var(--text-secondary)]">
              {message}
            </p>
            <button
              onClick={onDismiss}
              className="shrink-0 mt-0.5 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
              aria-label="Dismiss"
            >
              <X size={13} />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
