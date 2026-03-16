"use client";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Search, X, Clock, ChevronDown, Loader2 } from "lucide-react";
import { usePlayerStore } from "@/store/playerStore";
import { parseRiotId, encodeRiotIdForUrl } from "@/lib/utils";

const REGIONS = [
  { value: "na", label: "NA" },
  { value: "eu", label: "EU" },
];

export default function PlayerSearch({ compact = false }) {
  const router = useRouter();
  const [input, setInput] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showRegion, setShowRegion] = useState(false);
  const inputRef = useRef(null);
  const dropdownRef = useRef(null);
  const { recentSearches, addRecentSearch, removeRecentSearch, region, setRegion } = usePlayerStore();

  useEffect(() => {
    function handleClick(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false);
        setShowRegion(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  async function handleSearch(searchInput, searchRegion) {
    const val = searchInput !== undefined ? searchInput : input;
    const reg = searchRegion || region;
    const parsed = parseRiotId(val);
    if (!parsed) { setError("Enter a valid Riot ID (e.g. TenZ#NA1)"); return; }
    setError(""); setLoading(true); setShowDropdown(false);
    try {
      const params = new URLSearchParams({ gameName: parsed.gameName, tagLine: parsed.tagLine, region: reg });
      const res = await fetch("/api/riot/account?" + params);
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Player not found"); setLoading(false); return; }
      addRecentSearch(parsed.gameName + "#" + parsed.tagLine, reg);
      router.push("/player/" + encodeRiotIdForUrl(parsed.gameName, parsed.tagLine) + "?region=" + reg);
    } catch (e) {
      setError("Connection error. Please try again.");
      setLoading(false);
    }
  }

  function handleKeyDown(e) {
    if (e.key === "Enter") handleSearch();
    if (e.key === "Escape") setShowDropdown(false);
  }

  const outerCls = "flex items-center gap-2 glass-accent rounded-xl p-1 transition-all duration-200 focus-within:border-[var(--accent)] " + (compact ? "h-10" : "h-14");
  const inputCls = "flex-1 bg-transparent outline-none text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] " + (compact ? "text-sm" : "text-base");
  const btnCls = "px-4 py-2 rounded-lg font-semibold text-sm bg-[var(--accent)] text-white hover:brightness-110 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-150 " + (compact ? "px-3 text-xs" : "");

  return (
    <div className="relative w-full max-w-2xl" ref={dropdownRef}>
      <div className={outerCls}>
        {/* Region selector */}
        <div className="relative">
          <button onClick={() => setShowRegion(r => !r)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium bg-[var(--accent-dim)] text-[var(--accent)] hover:bg-[var(--accent)] hover:text-white transition-colors duration-150 shrink-0">
            {region.toUpperCase()} <ChevronDown size={12} />
          </button>
          <AnimatePresence>
            {showRegion && (
              <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
                className="absolute top-full left-0 mt-1 glass-accent rounded-lg overflow-hidden z-50 min-w-[80px]">
                {REGIONS.map(r => {
                  const cls = "w-full px-4 py-2 text-sm text-left hover:bg-[var(--accent-dim)] transition-colors " + (r.value === region ? "text-[var(--accent)] font-medium" : "text-[var(--text-secondary)]");
                  return (
                    <button key={r.value} onClick={() => { setRegion(r.value); setShowRegion(false); }} className={cls}>
                      {r.label}
                    </button>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Input */}
        <div className="flex-1 flex items-center gap-2">
          <Search size={16} className="text-[var(--text-secondary)] shrink-0" />
          <input ref={inputRef} type="text" placeholder="Search Riot ID (e.g. TenZ#NA1)" value={input}
            onChange={e => { setInput(e.target.value); setError(""); }}
            onFocus={() => setShowDropdown(true)} onKeyDown={handleKeyDown}
            className={inputCls} />
          {input && (
            <button onClick={() => { setInput(""); setError(""); inputRef.current?.focus(); }}
              className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
              <X size={14} />
            </button>
          )}
        </div>

        {/* Search button */}
        <button onClick={() => handleSearch()} disabled={loading || !input.trim()} className={btnCls}>
          {loading ? <Loader2 size={14} className="animate-spin" /> : "Search"}
        </button>
      </div>

      {/* Error */}
      <AnimatePresence>
        {error && (
          <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="mt-2 text-sm text-[var(--loss)] flex items-center gap-1">
            <X size={12} /> {error}
          </motion.p>
        )}
      </AnimatePresence>

      {/* Recent searches */}
      <AnimatePresence>
        {showDropdown && recentSearches.length > 0 && !compact && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            className="absolute top-full left-0 right-0 mt-2 glass-accent rounded-xl overflow-hidden z-40">
            <div className="flex items-center justify-between px-4 py-2 border-b border-[var(--border)]">
              <span className="text-xs font-medium text-[var(--text-secondary)]">Recent Searches</span>
              <button onClick={() => usePlayerStore.getState().clearRecentSearches()}
                className="text-xs text-[var(--text-secondary)] hover:text-[var(--loss)] transition-colors">Clear all</button>
            </div>
            {recentSearches.map(s => (
              <div key={s.riotId}
                className="flex items-center gap-3 px-4 py-2.5 hover:bg-[var(--accent-dim)] transition-colors group cursor-pointer"
                onClick={() => { setInput(s.riotId); handleSearch(s.riotId, s.region); }}>
                <Clock size={12} className="text-[var(--text-secondary)] shrink-0" />
                <span className="flex-1 text-sm text-[var(--text-primary)]">
                  {s.riotId} <span className="ml-2 text-xs text-[var(--text-secondary)]">{s.region.toUpperCase()}</span>
                </span>
                <button onClick={e => { e.stopPropagation(); removeRecentSearch(s.riotId); }}
                  className="opacity-0 group-hover:opacity-100 text-[var(--text-secondary)] hover:text-[var(--loss)] transition-all">
                  <X size={12} />
                </button>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}