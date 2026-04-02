"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2 } from "lucide-react";
import { usePlayerStore } from "@/store/playerStore";

export function OptOutModal({ isOpen, onClose, puuid, riotId }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const removeRecentSearch = usePlayerStore((state) => state.removeRecentSearch);

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen, onClose]);

  async function handleConfirm() {
    setLoading(true);
    setError(null);
    
    try {
      const res = await fetch('/api/optout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ puuid, riotId }),
      });
      
      const data = await res.json();
      
      if (data.success || data.alreadyOptedOut) {
        // Remove from recent searches
        removeRecentSearch(riotId);
        onClose();
        // Force page refresh to show opted out state
        window.location.reload();
      } else {
        setError(data.error || 'Failed to opt out');
      }
    } catch (err) {
      setError('Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ backgroundColor: 'rgba(0,0,0,0.45)' }}
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="glass rounded-xl p-6 max-w-[400px] w-full mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-base font-medium text-[var(--text-primary)] mb-3">
              Opt out of TrackerX
            </h2>
            <p className="text-sm text-[var(--text-secondary)] leading-relaxed mb-6">
              This will remove your match data from TrackerX and prevent future tracking. Your profile will show as private to all visitors. This cannot be undone.
            </p>
            
            {error && (
              <p className="text-sm text-[var(--loss)] mb-4">{error}</p>
            )}
            
            <div className="flex justify-end gap-3">
              <button
                onClick={onClose}
                disabled={loading}
                className="px-4 py-2 rounded-lg border transition-colors cursor-pointer"
                style={{
                  borderColor: 'var(--border)',
                  color: 'var(--text-secondary)',
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                disabled={loading}
                className="px-4 py-2 rounded-lg transition-colors cursor-pointer flex items-center gap-2"
                style={{
                  backgroundColor: '#ef4444',
                  color: 'white',
                }}
              >
                {loading && <Loader2 size={14} className="animate-spin" />}
                Confirm opt out
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
