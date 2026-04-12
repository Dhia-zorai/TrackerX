"use client";
import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Map as MapIcon, ChevronDown } from "lucide-react";
import { extractPlayerStats, capitalizeAgent } from "@/lib/utils";
import { AgentIcon } from "@/components/ui/AgentIcon";

export default function MapAgentSynergy({ matches, puuid }) {
  const [selectedMap, setSelectedMap] = useState("All Maps");
  const [isOpen, setIsOpen] = useState(false);

  // Derive stats
  const synergyData = useMemo(() => {
    if (!matches || !matches.length) return { maps: [], stats: [] };
    
    const mapSet = new Set();
    const synergy = {};

    matches.forEach(m => {
      const s = extractPlayerStats(m, puuid);
      if (!s) return;
      const mapName = m.info?.mapId?.split("/").pop() || m.map || "Unknown";
      const agentName = s.agentId || "Unknown";
      
      mapSet.add(mapName);
      
      const key = `${mapName}_${agentName}`;
      if (!synergy[key]) {
        synergy[key] = { map: mapName, agent: agentName, games: 0, wins: 0, kills: 0, deaths: 0 };
      }
      
      synergy[key].games++;
      if (s.won && !s.drew) synergy[key].wins++;
      synergy[key].kills += s.kills;
      synergy[key].deaths += s.deaths;
    });
    
    const maps = ["All Maps", ...Array.from(mapSet).sort()];
    const stats = Object.values(synergy).map(s => ({
      ...s,
      winRate: (s.wins / s.games) * 100,
      kd: s.deaths > 0 ? s.kills / s.deaths : s.kills
    })).sort((a, b) => b.winRate - a.winRate || b.games - a.games);
    
    return { maps, stats };
  }, [matches, puuid]);

  const filteredStats = useMemo(() => {
    let result = synergyData.stats;
    if (selectedMap !== "All Maps") {
      result = result.filter(s => s.map === selectedMap);
    }
    // Aggregate by agent if "All Maps"
    if (selectedMap === "All Maps") {
      const agg = {};
      result.forEach(s => {
        if (!agg[s.agent]) agg[s.agent] = { agent: s.agent, games: 0, wins: 0, kills: 0, deaths: 0 };
        agg[s.agent].games += s.games;
        agg[s.agent].wins += s.wins;
        agg[s.agent].kills += s.kills;
        agg[s.agent].deaths += s.deaths;
      });
      result = Object.values(agg).map(s => ({
        ...s,
        winRate: (s.wins / s.games) * 100,
        kd: s.deaths > 0 ? s.kills / s.deaths : s.kills
      })).sort((a, b) => b.winRate - a.winRate || b.games - a.games);
    }
    return result;
  }, [synergyData.stats, selectedMap]);

  if (!matches || matches.length === 0) return null;

  return (
    <div className="glass-accent rounded-xl p-6">
      <div className="flex items-center justify-between mb-6 relative">
        <h3 className="text-sm font-bold text-[var(--text-primary)] uppercase tracking-wider flex items-center gap-2">
          <MapIcon size={16} className="text-[var(--accent)]" />
          Map x Agent Synergy
        </h3>
        
        {/* Dropdown */}
        <div className="relative">
          <button 
            onClick={() => setIsOpen(!isOpen)}
            className="flex items-center gap-2 text-xs font-medium bg-[var(--bg-elevated)] px-3 py-1.5 rounded-lg hover:text-[var(--accent)] transition-colors"
          >
            {selectedMap} <ChevronDown size={14} />
          </button>
          
          {isOpen && (
            <div className="absolute right-0 top-full mt-2 w-48 bg-[var(--bg-elevated)] border border-[var(--border-accent)] rounded-xl shadow-xl z-50 overflow-hidden">
              <div className="max-h-60 overflow-y-auto p-1">
                {synergyData.maps.map(mapName => (
                  <button
                    key={mapName}
                    onClick={() => { setSelectedMap(mapName); setIsOpen(false); }}
                    className={`w-full text-left px-3 py-2 text-xs rounded-lg transition-colors ${selectedMap === mapName ? 'bg-[var(--accent-dim)] text-[var(--accent)]' : 'hover:bg-[var(--bg-base)] text-[var(--text-secondary)]'}`}
                  >
                    {mapName}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {filteredStats.slice(0, 8).map((stat, i) => (
          <motion.div 
            key={`${stat.agent}_${i}`}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.05 }}
            className="flex flex-col items-center bg-[var(--bg-elevated)] rounded-xl p-4 relative overflow-hidden"
          >
            <AgentIcon agentName={stat.agent} size={48} className="rounded-xl mb-3" />
            <div className="text-center w-full">
              <div className="font-bold text-sm truncate">{capitalizeAgent(stat.agent)}</div>
              <div className="text-xs text-[var(--text-secondary)] mt-1 flex justify-between w-full px-2">
                <span>WR: <span className={stat.winRate >= 50 ? 'text-[var(--win)]' : ''}>{stat.winRate.toFixed(1)}%</span></span>
                <span>KD: {stat.kd.toFixed(2)}</span>
              </div>
              <div className="text-[10px] text-[var(--text-muted)] mt-2 uppercase tracking-wider">{stat.games} matches</div>
            </div>
          </motion.div>
        ))}
        {filteredStats.length === 0 && (
           <div className="col-span-full py-8 text-center text-sm text-[var(--text-secondary)]">No data for this map.</div>
        )}
      </div>
    </div>
  );
}
