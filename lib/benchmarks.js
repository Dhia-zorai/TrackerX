export const RANK_BENCHMARKS = {
  "Iron": { kd: 0.85, acs: 180, hsPct: 12, kpr: 0.65 },
  "Bronze": { kd: 0.90, acs: 190, hsPct: 14, kpr: 0.70 },
  "Silver": { kd: 0.95, acs: 200, hsPct: 16, kpr: 0.75 },
  "Gold": { kd: 1.00, acs: 210, hsPct: 19, kpr: 0.78 },
  "Platinum": { kd: 1.05, acs: 220, hsPct: 22, kpr: 0.80 },
  "Diamond": { kd: 1.08, acs: 230, hsPct: 25, kpr: 0.82 },
  "Ascendant": { kd: 1.10, acs: 235, hsPct: 28, kpr: 0.84 },
  "Immortal": { kd: 1.12, acs: 240, hsPct: 30, kpr: 0.85 },
  "Radiant": { kd: 1.15, acs: 250, hsPct: 32, kpr: 0.88 },
};

export function getBenchmarkForTier(tierName) {
  if (!tierName) return RANK_BENCHMARKS["Gold"]; // default fallback
  const tier = tierName.split(' ')[0]; // "Gold 3" -> "Gold"
  return RANK_BENCHMARKS[tier] || RANK_BENCHMARKS["Gold"];
}
