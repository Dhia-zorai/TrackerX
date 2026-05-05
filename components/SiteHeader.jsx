"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, Clock, Crosshair, Search, X } from "lucide-react";
import ThemeToggle from "@/components/ui/ThemeToggle";
import { usePlayerStore } from "@/store/playerStore";
import { encodeRiotIdForUrl, parseRiotId } from "@/lib/utils";

function RecentSearchesDropdown({ searchFocused, recentSearches, clearRecentSearches, removeRecentSearch, goToPlayer }) {
  if (!searchFocused || recentSearches.length === 0) return null;

  return (
    <div className="mt-2 rounded-xl overflow-hidden z-50 border border-[var(--border-accent)] bg-[var(--bg-elevated)]">
      <div className="flex items-center justify-between px-4 py-2 border-b border-[var(--border)]">
        <span className="text-xs font-medium text-[var(--text-secondary)]">Recent Searches</span>
        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            clearRecentSearches();
          }}
          className="text-xs text-[var(--text-secondary)] hover:text-[var(--loss)] transition-colors"
        >
          Clear all
        </button>
      </div>

      {recentSearches.slice(0, 4).map((s) => (
        <div
          key={s.riotId}
          className="flex items-center gap-3 px-4 py-2.5 hover:bg-[var(--accent-dim)] transition-colors group cursor-pointer"
          onMouseDown={() => goToPlayer(s.riotId)}
        >
          <Clock size={12} className="text-[var(--text-secondary)] shrink-0" />
          <span className="flex-1 text-sm text-[var(--text-primary)]">
            {s.riotId} <span className="ml-2 text-xs text-[var(--text-secondary)]">{s.region.toUpperCase()}</span>
          </span>
          <button
            type="button"
            onMouseDown={(e) => {
              e.stopPropagation();
              removeRecentSearch(s.riotId);
            }}
            className="opacity-0 group-hover:opacity-100 text-[var(--text-secondary)] hover:text-[var(--loss)] transition-all"
          >
            <X size={12} />
          </button>
        </div>
      ))}
    </div>
  );
}

export default function SiteHeader({
  showBack = false,
  region,
  isAdmin = false,
  showSearch = true,
  enableSpotlight = false,
  className = "",
}) {
  const router = useRouter();
  const rootRef = useRef(null);
  const spotlightInputRef = useRef(null);
  const [input, setInput] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [spotlightOpen, setSpotlightOpen] = useState(false);
  const [isShaking, setIsShaking] = useState(false);
  const {
    recentSearches,
    addRecentSearch,
    removeRecentSearch,
    clearRecentSearches,
    region: storeRegion,
    initializeRegion,
  } = usePlayerStore();

  useEffect(() => {
    initializeRegion();
  }, [initializeRegion]);

  useEffect(() => {
    function onDocMouseDown(e) {
      if (rootRef.current && !rootRef.current.contains(e.target)) {
        setSearchFocused(false);
        setMobileOpen(false);
        setSpotlightOpen(false);
      }
    }
    function onDocKeyDown(e) {
      if (e.key === "Escape") {
        setSearchFocused(false);
        setMobileOpen(false);
        setSpotlightOpen(false);
      }
    }
    document.addEventListener("mousedown", onDocMouseDown);
    document.addEventListener("keydown", onDocKeyDown);
    return () => {
      document.removeEventListener("mousedown", onDocMouseDown);
      document.removeEventListener("keydown", onDocKeyDown);
    };
  }, []);

  useEffect(() => {
    if (spotlightOpen) {
      const prevOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prevOverflow;
      };
    }
  }, [spotlightOpen]);

  useEffect(() => {
    if (spotlightOpen) {
      setTimeout(() => spotlightInputRef.current?.focus(), 60);
    }
  }, [spotlightOpen]);

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

  function openFocusedSearch() {
    if (enableSpotlight) {
      setSearchFocused(true);
      setSpotlightOpen(true);
      return;
    }
    setSearchFocused(true);
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
        {showSearch && (
          <>
            <form onSubmit={handleSubmit} className="hidden md:block relative">
              <motion.div
                layoutId={enableSpotlight ? "header-search-shell" : undefined}
                animate={isShaking ? { x: [0, -6, 6, -4, 4, 0] } : { x: 0 }}
                transition={{ duration: 0.3 }}
                className="h-10 w-[220px] rounded-xl border border-[var(--border-tertiary)] focus-within:border-[var(--border-secondary)] bg-[var(--bg-secondary)] flex items-center"
              >
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onFocus={openFocusedSearch}
                  placeholder="Search player..."
                  className="h-full w-full px-3 pr-9 bg-transparent text-[13px] text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] outline-none"
                />
                <button type="submit" className="absolute right-3 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
                  <Search size={14} />
                </button>
              </motion.div>

              {!enableSpotlight && <RecentSearchesDropdown searchFocused={searchFocused} recentSearches={recentSearches} clearRecentSearches={clearRecentSearches} removeRecentSearch={removeRecentSearch} goToPlayer={goToPlayer} />}
            </form>

            <button
              type="button"
              onClick={() => {
                if (enableSpotlight) {
                  openFocusedSearch();
                } else {
                  setMobileOpen((v) => !v);
                }
              }}
              className="md:hidden p-2 rounded-lg border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
            >
              <Search size={16} />
            </button>
          </>
        )}

        <ThemeToggle />
      </div>

      <AnimatePresence>
        {showSearch && mobileOpen && !enableSpotlight && (
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
                className="h-10 w-full rounded-xl border border-[var(--border-tertiary)] focus-within:border-[var(--border-secondary)] bg-[var(--bg-secondary)] flex items-center"
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
                <button type="submit" className="absolute right-3 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
                  <Search size={14} />
                </button>
              </motion.div>
            </form>

            <RecentSearchesDropdown searchFocused={searchFocused} recentSearches={recentSearches} clearRecentSearches={clearRecentSearches} removeRecentSearch={removeRecentSearch} goToPlayer={goToPlayer} />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showSearch && spotlightOpen && enableSpotlight && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[80]"
          >
            <div
              className="absolute inset-0 w-full h-full bg-black/25 backdrop-blur-sm"
              onMouseDown={() => {
                setSpotlightOpen(false);
                setSearchFocused(false);
              }}
            />

            <div className="absolute inset-0 flex items-center justify-center px-4 pointer-events-none">
              <motion.form
                onSubmit={handleSubmit}
                onMouseDown={(e) => e.stopPropagation()}
                layoutId="header-search-shell"
                initial={{ scale: 0.96, opacity: 0.92 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.98, opacity: 0.96 }}
                transition={{ duration: 0.22, ease: "easeOut" }}
                className="relative w-[min(92vw,560px)] pointer-events-auto"
              >
                <motion.div
                  animate={isShaking ? { x: [0, -6, 6, -4, 4, 0] } : { x: 0 }}
                  transition={{ duration: 0.3 }}
                  className="h-11 rounded-xl border border-[var(--border-tertiary)] focus-within:border-[var(--border-secondary)] bg-[var(--bg-secondary)] flex items-center"
                >
                  <input
                    ref={spotlightInputRef}
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onFocus={() => setSearchFocused(true)}
                    placeholder="Search player..."
                    className="h-full w-full px-4 pr-10 bg-transparent text-[13px] text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] outline-none"
                  />
                  <button type="submit" className="absolute right-3 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
                    <Search size={15} />
                  </button>
                </motion.div>

                <RecentSearchesDropdown searchFocused={searchFocused} recentSearches={recentSearches} clearRecentSearches={clearRecentSearches} removeRecentSearch={removeRecentSearch} goToPlayer={goToPlayer} />
              </motion.form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
