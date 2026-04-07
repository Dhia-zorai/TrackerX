"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, Crosshair, Search } from "lucide-react";
import ThemeToggle from "@/components/ui/ThemeToggle";
import { usePlayerStore } from "@/store/playerStore";
import { encodeRiotIdForUrl, parseRiotId } from "@/lib/utils";

export default function SiteHeader({ showBack = false, region, isAdmin = false, className = "" }) {
  const router = useRouter();
  const rootRef = useRef(null);
  const [input, setInput] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isShaking, setIsShaking] = useState(false);
  const { recentSearches, addRecentSearch, region: storeRegion, initializeRegion } = usePlayerStore();

  useEffect(() => {
    initializeRegion();
  }, [initializeRegion]);

  useEffect(() => {
    function onDocMouseDown(e) {
      if (rootRef.current && !rootRef.current.contains(e.target)) {
        setSearchFocused(false);
        setMobileOpen(false);
      }
    }
    function onDocKeyDown(e) {
      if (e.key === "Escape") {
        setSearchFocused(false);
        setMobileOpen(false);
      }
    }
    document.addEventListener("mousedown", onDocMouseDown);
    document.addEventListener("keydown", onDocKeyDown);
    return () => {
      document.removeEventListener("mousedown", onDocMouseDown);
      document.removeEventListener("keydown", onDocKeyDown);
    };
  }, []);

  const effectiveRegion = region || storeRegion || "eu";

  function goToPlayer(riotId) {
    const parsed = parseRiotId(riotId);
    if (!parsed) return false;
    addRecentSearch(`${parsed.gameName}#${parsed.tagLine}`, effectiveRegion);
    router.push(`/player/${encodeRiotIdForUrl(parsed.gameName, parsed.tagLine)}?region=${effectiveRegion}`);
    setInput("");
    setSearchFocused(false);
    setMobileOpen(false);
    return true;
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (goToPlayer(input)) return;
    setIsShaking(true);
    setTimeout(() => setIsShaking(false), 300);
    setInput("");
  }

  return (
    <div ref={rootRef} className={`relative flex items-center justify-between ${className}`}>
      <div className="flex items-center gap-2 min-w-0">
        {showBack && (
          <Link href="/" className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
            <ArrowLeft size={14} />
          </Link>
        )}
        <Link href="/" className="flex items-center gap-1.5 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
          <div className="w-5 h-5 bg-[var(--accent)] rounded flex items-center justify-center">
            <Crosshair size={11} className="text-white" strokeWidth={2.5} />
          </div>
          <span className="font-semibold text-[var(--text-primary)]">Tracker<span className="text-[var(--accent)]">X</span></span>
        </Link>
        {isAdmin && (
          <span className="text-[10px] px-2 py-0.5 rounded border border-[var(--border-accent)] text-[var(--accent)] bg-[var(--accent-dim)]">
            admin
          </span>
        )}
      </div>

      <div className="flex items-center gap-2">
        <form onSubmit={handleSubmit} className="hidden md:block relative">
          <motion.div
            animate={isShaking ? { x: [0, -6, 6, -4, 4, 0] } : { x: 0 }}
            transition={{ duration: 0.3 }}
            className="h-9 w-[200px] rounded-md border border-[var(--border-tertiary)] focus-within:border-[var(--border-secondary)] bg-[var(--bg-secondary)] flex items-center"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              placeholder="Search player..."
              className="h-full w-full px-3 pr-9 bg-transparent text-[13px] text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] outline-none"
            />
            <button type="submit" className="absolute right-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
              <Search size={14} />
            </button>
          </motion.div>

          {searchFocused && recentSearches.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-2 rounded-lg overflow-hidden z-50 border border-[var(--border-accent)] bg-[var(--bg-elevated)]">
              {recentSearches.slice(0, 4).map((s) => (
                <button
                  key={s.riotId}
                  type="button"
                  onMouseDown={() => goToPlayer(s.riotId)}
                  className="w-full px-3 py-2 text-sm text-[var(--text-primary)] hover:bg-[var(--accent-dim)] transition-colors cursor-pointer flex items-center justify-between"
                >
                  <span>{s.riotId}</span>
                  <span className="text-xs text-[var(--text-secondary)]">{s.region.toUpperCase()}</span>
                </button>
              ))}
            </div>
          )}
        </form>

        <button
          type="button"
          onClick={() => setMobileOpen((v) => !v)}
          className="md:hidden p-2 rounded-lg border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
        >
          <Search size={16} />
        </button>

        <ThemeToggle />
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: "100%", opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="md:hidden absolute right-0 top-full mt-2 overflow-hidden"
          >
            <form onSubmit={handleSubmit} className="relative">
              <motion.div
                animate={isShaking ? { x: [0, -6, 6, -4, 4, 0] } : { x: 0 }}
                transition={{ duration: 0.3 }}
                className="h-9 w-full rounded-md border border-[var(--border-tertiary)] focus-within:border-[var(--border-secondary)] bg-[var(--bg-secondary)] flex items-center"
              >
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onFocus={() => setSearchFocused(true)}
                  autoFocus
                  placeholder="Search player..."
                  className="h-full w-full px-3 pr-9 bg-transparent text-[13px] text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] outline-none"
                />
                <button type="submit" className="absolute right-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
                  <Search size={14} />
                </button>
              </motion.div>
            </form>

            {searchFocused && recentSearches.length > 0 && (
              <div className="mt-2 rounded-lg overflow-hidden border border-[var(--border-accent)] bg-[var(--bg-elevated)]">
                {recentSearches.slice(0, 4).map((s) => (
                  <button
                    key={s.riotId}
                    type="button"
                    onMouseDown={() => goToPlayer(s.riotId)}
                    className="w-full px-3 py-2 text-sm text-[var(--text-primary)] hover:bg-[var(--accent-dim)] transition-colors cursor-pointer flex items-center justify-between"
                  >
                    <span>{s.riotId}</span>
                    <span className="text-xs text-[var(--text-secondary)]">{s.region.toUpperCase()}</span>
                  </button>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
