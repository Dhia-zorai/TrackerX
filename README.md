# TrackerX

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-16.1.6-000000?style=for-the-badge&logo=nextdotjs&logoColor=white" alt="Next.js" />
  <img src="https://img.shields.io/badge/React-19.2.3-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-v4-0F172A?style=for-the-badge&logo=tailwindcss&logoColor=38BDF8" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/Type-JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=111111" alt="JavaScript" />
</p>

<p align="center">
  A high-performance VALORANT stats tracker. Deep performance analytics, visual trends, match filtering, and AI-ready data exports. All in one place.
</p>

### Hero Preview

<p align="center">
  <img src="public/screenshots/main page.png" alt="TrackerX - Main Page" width="800" />
</p>

---

## Overview

TrackerX is built for VALORANT players who want fast, accurate insight into their game. It pulls match data from the Henrik API, normalizes everything into a consistent shape, and presents it through clean charts, a live dashboard, and detailed match history with no bloat.

## Desktop App (Electron)

TrackerX is now available as a desktop app in addition to the web version.

### Download

Get the latest desktop builds from **GitHub Releases**:

- **Windows:** `.exe` (portable)
- **macOS:** `.dmg`
- **Linux:** `.AppImage` and `.deb`

### Notes

- The desktop app runs the Next.js server internally, so API routes (`pages/api/*`) and key protection still work.
- The web app continues to work exactly as before.
- Releases are built automatically with GitHub Actions on pushes to `main`.

## Features

| Feature                   | Description                                                                                                                                                               |
| :------------------------ | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Player Search**         | Look up any Riot ID across NA and EU. Recent searches are saved locally for quick access.                                                                                 |
| **Performance Dashboard** | Live snapshot of K/D, ACS, win rate, and headshot % - always calculated from the currently loaded match pool.                                                             |
| **Match History**         | Expandable match cards with full scoreboard, map, agent, and round count. Lazy-loads additional pages on demand.                                                          |
| **Match Type Filter**     | Toggle between All Modes and Competitive to isolate ranked performance. Stats and charts update instantly without refetching.                                             |
| **Performance Charts**    | ACS trend line, agent win rate bar chart, agent distribution pie chart, and a performance radar benchmarked against your rank tier.                                       |
| **AI-Ready JSON Export**  | Exports a single structured JSON covering overall stats, per-agent breakdown, per-map breakdown, and full match history. Formatted for direct use with AI analysis tools. |
| **Share Card**            | Generates a downloadable PNG stat card with your top 6 stats and top agent spotlight. Always reflects the current match pool.                                             |
| **Dark / Light Mode**     | Full theme support. Preference is persistent across sessions.                                                                                                             |
| **Account Cache**         | Account lookups are cached in localStorage with an 8-hour TTL to avoid redundant network requests.                                                                        |

---

## Feature Showcase

### Performance Dashboard

<p align="center">
  <img src="public/screenshots/quick player stats1.png" alt="Performance Dashboard - K/D, ACS, Win Rate, Headshot %" width="600" />
</p>

Live snapshot of your stats: K/D, ACS, win rate, headshot %, and more. Always calculated from the currently loaded match pool.

---

### Performance Charts & Analytics

<p align="center">
  <img src="public/screenshots/recharts graphs.png" alt="Performance Charts - ACS Trend, Agent Analytics, Performance Radar" width="600" />
</p>

Visual analytics including ACS trend line, agent win rate distribution, agent playtime pie chart, and a performance radar benchmarked against your rank tier.

---

### Match History

<p align="center">
  <img src="public/screenshots/match history.png" alt="Match History - Expandable Match Cards with Full Details" width="600" />
</p>

Expandable match cards showing full scoreboard, map, agent played, and round count. Lazy-loads additional pages on demand via Load More button.

---

### Data Export

<p align="center">
  <img src="public/screenshots/Export json.png" alt="Data Export - JSON Download with Filter Options" width="600" />
</p>

Export your match data as structured JSON with clear filter options. Choose between All Modes or Competitive-only exports, with live statistics preview showing exactly what will be exported.

---

### Share Card

<p align="center">
  <img src="public/screenshots/share stats.png" alt="Share Card - Downloadable PNG Stat Card" width="600" />
</p>

Generate a downloadable PNG stat card showcasing your top 6 stats and top agent spotlight. Perfect for sharing on socials or analyzing offline.

---

## Tech Stack

### Frontend

- **Framework:** Next.js 16 (App Router for pages, Pages Router for API routes)
- **Styling:** Tailwind CSS v4
- **Animations:** Framer Motion v12
- **Icons:** Lucide React

### Data & State

- **Data Fetching:** TanStack React Query v5
- **State:** Zustand v5
- **Charts:** Recharts v3

### Utilities

- **Image Export:** html-to-image

---

## Project Structure

```text
app/
  ├── page.js                   # Home / search page
  ├── layout.js                 # Root layout, theme provider
  └── player/[riotId]/
      └── page.js               # Player stats page

components/
  ├── Dashboard/                # Player banner + stat cards
  ├── MatchHistory/             # Match list + expandable cards
  ├── Charts/                   # ACS line, radar, agent pie/bar charts
  ├── ShareCard/                # PNG export card
  └── ui/                       # Toast, Skeleton, ErrorState, ThemeToggle

hooks/
  ├── usePlayer.js              # fetch player + localStorage cache
  ├── useMatches.js             # Match list + lazy load pagination
  ├── useMMR.js                 # Rank / MMR data
  └── useRankHistory.js         # Rank progression

lib/
  ├── utils.js                  #stats aggregation + helper functions (agents/maps/export etc.)
  └── exportData.js             # export data in JSON format

pages/api/riot/
  ├── account.js                # Riot ID → PUUID lookup
  ├── matches.js                # Match list (Henrik)
  ├── match.js                  # Single match detail
  └── mmr.js                    # MMR / rank data
```

---

## Export Format

The "Export JSON" button produces file covering everything TrackerX has loaded for that session:

```json
{
  "exportedAt": "2026-03-16T00:00:00.000Z",
  "player": "Name#TAG",
  "region": "na",
  "matchesAnalyzed": 20,
  "overallStats": {
    "kd": 1.32,
    "winRate": 58.0,
    "hsPct": 23.1,
    "acs": 218,
    "kills": 264,
    "deaths": 200,
    "assists": 74,
    "avgKills": 13.2,
    "avgDeaths": 10.0,
    "avgAssists": 3.7,
    "damagePerRound": null,
    "firstBloods": null,
    "firstDeaths": null,
    "clutchSuccessRate": null,
    "kastPct": null
  },
  "agents": [
    {
      "agent": "Jett",
      "games": 9,
      "winRate": 66.7,
      "acs": 241,
      "kd": 1.51,
      "hsPct": 26.2,
      "firstBloodRate": null
    }
  ],
  "maps": [
    {
      "map": "Ascent",
      "games": 5,
      "winRate": 60.0,
      "acs": 225,
      "kd": 1.4,
      "attackWinPct": null,
      "defenseWinPct": null,
      "firstDeaths": null
    }
  ],
  "roundImpact": {
    "openingDuelSuccessRate": null,
    "tradeKills": null,
    "tradedDeaths": null,
    "multiKillRounds": null,
    "ecoPerformance": null,
    "antiEcoPerformance": null
  },
  "weapons": [],
  "teamImpact": {
    "spikePlants": null,
    "spikeDefuses": null,
    "clutchAttempts": null,
    "clutchWins": null
  },
  "matches": [
    {
      "date": "2026-03-10",
      "map": "Ascent",
      "agent": "Jett",
      "score": "13–7",
      "result": "Win",
      "kills": 18,
      "deaths": 11,
      "assists": 3,
      "kd": 1.64,
      "acs": 267,
      "hsPct": 28.6,
      "damage": null,
      "durationSeconds": 2340
    }
  ]
}
```

Fields marked `null` are structurally reserved. The Henrik API doesn't expose per-round damage, clutch data, or weapon breakdowns at the match detail level. The schema stays consistent so any tooling built on top of this format won't break if those fields get populated later.

---

## Performance Notes

- Initial load fetches 10 matches. Additional pages load on demand via the "Load More" button with no unnecessary upfront requests.
- All API calls are proxied through Next.js API routes. No keys are exposed to the client.
- Match data from Henrik is normalized in `lib/utils.js` (`normalizeHenrikMatch`) into the same shape as the Riot API fallback, so every consumer downstream is API-source agnostic.
- The match type filter (`All Modes` / `Competitive`) runs entirely client-side on the already-fetched data with no refetch triggered.
- The share card and all stat computations derive from the same `matchStats` memo, so loading more matches automatically affects every display and export without any manual refresh.
