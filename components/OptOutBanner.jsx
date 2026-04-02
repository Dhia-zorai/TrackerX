"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { OptOutModal } from "./OptOutModal";

export function OptOutBanner({ puuid, riotId }) {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2 }}
        className="w-full py-2 px-4 flex items-center justify-between"
        style={{
          backgroundColor: 'var(--bg-secondary)',
          borderBottom: '0.5px solid var(--border-subtle)',
        }}
      >
        <span className="text-xs text-[var(--text-muted)]">
          Not your profile? Data is public. Are you this player?
        </span>
        <button
          onClick={() => setShowModal(true)}
          className="text-xs px-3 py-1.5 rounded-md border transition-colors cursor-pointer"
          style={{
            borderColor: 'var(--border)',
            color: 'var(--text-secondary)',
          }}
        >
          Opt out of TrackerX
        </button>
      </motion.div>

      <OptOutModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        puuid={puuid}
        riotId={riotId}
      />
    </>
  );
}
