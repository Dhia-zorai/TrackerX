"use client";
import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, AlertTriangle } from "lucide-react";

/**
 * Toast — high-visibility notification.
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
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
          className="fixed bottom-4 left-4 right-4 z-50 sm:bottom-6 sm:left-auto sm:right-6 sm:max-w-sm pointer-events-auto"
        >
          <div
            className="flex items-start gap-3 rounded-xl px-4 py-3.5 shadow-2xl"
            style={{
              background: 'linear-gradient(135deg, #ff4655 0%, #c0303d 100%)',
              border: '1px solid rgba(255,255,255,0.18)',
              boxShadow: '0 8px 32px rgba(255,70,85,0.45), 0 2px 8px rgba(0,0,0,0.4)',
            }}
          >
            <div className="shrink-0 mt-0.5">
              <AlertTriangle size={15} className="text-white" strokeWidth={2.5} />
            </div>
            <p className="flex-1 text-xs font-medium leading-relaxed" style={{ color: 'rgba(255,255,255,0.95)' }}>
              {message}
            </p>
            <button
              onClick={onDismiss}
              className="shrink-0 mt-0.5 transition-opacity hover:opacity-70"
              style={{ color: 'rgba(255,255,255,0.85)' }}
              aria-label="Dismiss"
            >
              <X size={13} strokeWidth={2.5} />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
