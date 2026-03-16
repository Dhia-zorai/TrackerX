# TrackerX

A production-quality Valorant stats tracker built with Next.js, Tailwind CSS, and the Riot Games API. Search any player by Riot ID, view match history, performance charts, agent breakdowns, and export stats — all in a clean dark/light UI.

## Features

- **Player Search** — Look up any player by `Name#TAG` with NA/EU region support
- **Dashboard** — K/D, ACS, win rate, headshot %, and top agent at a glance
- **Match History** — Last 20 matches with expandable scoreboards and load more
- **Performance Charts** — ACS over time, agent usage pie, win rate by agent, performance radar
- **Leaderboard Widget** — Top 10 ranked players per region
- **Export** — Download stats as JSON or match history as CSV
- **Share Card** — Export a shareable PNG stat card via html-to-image
- **Theme Toggle** — Dark (default) and light mode, persisted to localStorage

## Tech Stack

| Layer | Library |
|---|---|
| Framework | Next.js 16 (App Router + Pages API routes) |
| Styling | Tailwind CSS v4 |
| Animation | Framer Motion |
| Data fetching | TanStack React Query (5 min stale time) |
| State | Zustand (persisted: theme, region, recent searches) |
| Charts | Recharts |
| Icons | Lucide React |
| CSV export | PapaParse |
| PNG export | html-to-image |

## Getting Started

### 1. Clone and install

```bash
git clone <your-repo-url>
cd trackerx
npm install
```

### 2. Set up your Riot API key

Copy the example env file and add your key:

```bash
cp .env.local.example .env.local
```

Then edit `.env.local`:

```env
RIOT_API_KEY=RGAPI-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
```

Get a development key at https://developer.riotgames.com. Note: development keys expire every 24 hours. For production use, apply for a personal or production key.

### 3. Run the development server

```bash
npm run dev
```

Open http://localhost:3000 in your browser.

## API Routes

All Riot API calls are proxied through Next.js API routes — your key never reaches the browser.

| Route | Purpose |
|---|---|
| `GET /api/riot/account?gameName=&tagLine=&region=` | Resolve Riot ID to PUUID |
| `GET /api/riot/matches?puuid=&region=&count=` | Fetch match ID list |
| `GET /api/riot/match?matchId=&region=` | Fetch full match details |
| `GET /api/riot/leaderboard?actId=&region=&size=` | Top ranked players |

Responses are cached in-memory (5 min TTL) to avoid hitting rate limits.

## Deployment (Vercel)

1. Push to GitHub
2. Import the repo at vercel.com
3. Add `RIOT_API_KEY` as an Environment Variable in the Vercel project settings
4. Deploy

The `RIOT_API_KEY` variable is only read server-side (`pages/api/riot/*`) and is never exposed to the client bundle.

## Notes on Rank Data

The official Riot Games API does not expose rank/RR for arbitrary players without RSO (Riot Sign-On) OAuth. The rank card in the player banner displays a placeholder with a **Requires RSO** note. All other stats (kills, deaths, ACS, win rate, etc.) are derived from match data and are fully accurate.

## Project Structure

```
app/
  globals.css           # Valorant theme, CSS variables, glass/skeleton utilities
  layout.js             # Providers (Query, Theme), Inter font
  page.js               # Home — search bar + feature grid
  player/[riotId]/
    page.js             # Full player dashboard

components/
  PlayerSearch/         # Search bar with region selector + recent searches
  Dashboard/            # Stat cards grid + player banner
  MatchHistory/         # Match list, expandable scoreboards
  Charts/               # ACS line, agent pie, win rate bar, performance radar
  StatCard/             # Animated number counter card
  Leaderboard/          # Top 10 per region with act switcher
  ShareCard/            # html-to-image PNG export card
  ui/                   # Skeleton, ErrorState, ThemeToggle

lib/
  riotApi.js            # Riot API client with exponential backoff on 429
  cache.js              # In-memory TTL cache
  utils.js              # parseRiotId, extractPlayerStats, aggregateStats, getAgentStats
  exportData.js         # exportJSON, exportCSV, exportMatchCSV

hooks/
  usePlayer.js          # React Query: account lookup
  useMatches.js         # React Query: match list + batched detail fetch
  useRankHistory.js     # ACS trend from match stats (rank proxy, no RSO)

store/
  playerStore.js        # Zustand: recentSearches, region, theme (persisted)

pages/api/riot/
  account.js            # Riot account-v1
  matches.js            # val-match-v1 matchlist
  match.js              # val-match-v1 match detail
  leaderboard.js        # val-ranked-v1 leaderboard
```
