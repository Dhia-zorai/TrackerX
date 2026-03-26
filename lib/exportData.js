import { buildExportPayload } from './utils';

/**
 * Master export — one structured JSON file suitable for AI analysis.
 * Replaces the separate JSON + CSV buttons with a single comprehensive export.
 */
export function exportFullJSON(account, region, matches, puuid, aggregated, agentStats, filename) {
  const payload = buildExportPayload(account, region, matches, puuid, aggregated, agentStats);
  const fname = filename || `${account?.gameName || 'player'}-trackerx.json`;
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fname;
  a.click();
  URL.revokeObjectURL(url);
}
