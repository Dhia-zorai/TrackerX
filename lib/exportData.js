import Papa from 'papaparse';

export function exportJSON(data, filename = 'trackerx-export.json') {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function exportCSV(matches, filename = 'match-history.csv') {
  const rows = matches
    .filter(Boolean)
    .map(m => ({
      matchId: m?.matchInfo?.matchId || '',
      map: m?.info?.mapId?.split('/').pop() || '',
      mode: m?.info?.gameMode || '',
      result: '',
      kills: '',
      deaths: '',
      assists: '',
      acs: '',
      hsPct: '',
    }));

  const csv = Papa.unparse(rows);
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function exportMatchCSV(matches, puuid, gameName, filename) {
  const { extractPlayerStats } = require('./utils');
  const fname = filename || (gameName || 'player') + '-matches.csv';

  const rows = matches
    .filter(Boolean)
    .map(m => {
      const s = extractPlayerStats(m, puuid);
      const info = m?.info || {};
      return {
        map: info.mapId?.split('/').pop() || '',
        mode: info.gameMode || '',
        result: s ? (s.drew ? 'Draw' : s.won ? 'Win' : 'Loss') : '',
        agent: s?.agentId || '',
        kills: s?.kills ?? '',
        deaths: s?.deaths ?? '',
        assists: s?.assists ?? '',
        kd: s?.kd ?? '',
        acs: s?.acs ?? '',
        hsPct: s?.hsPct ?? '',
        date: info.gameStartMillis ? new Date(info.gameStartMillis).toLocaleDateString() : '',
      };
    });

  const csv = Papa.unparse(rows);
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fname;
  a.click();
  URL.revokeObjectURL(url);
}