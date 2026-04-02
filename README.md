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

TrackerX is built for VALORANT players who want fast, accurate insight into their game. It pulls match data from the Henrik API, normalizes everything into a consistent shape, caches it aggressively using Supabase to prevent rate limiting, and presents it through clean charts, a live dashboard, and detailed match history with no bloat.

## Desktop App (Electron)

TrackerX is now available as a desktop app in addition to the web version.

### Download

Get the latest desktop builds from **GitHub Releases**:

- **Windows:** `.exe` (portable)
- **macOS:** `.dmg`
- **Linux:** `.AppImage` and `.deb`

### Notes

- The desktop app runs the Next.js server internally, so API routes and key protection still work seamlessly.
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
| **Data Export**           | Exports a structured JSON covering overall stats, per-agent breakdown, per-map breakdown, and full match history including **Advanced Stats** (KAST%, First Bloods, Damage Per Round). Formatted for direct use with AI analysis tools. |
| **Share Card**            | Generates a downloadable PNG stat card with your top 6 stats and top agent spotlight. Always reflects the current match pool.                                             |
| **Dark / Light Mode**     | Full theme support. Preference is persistent across sessions.                                                                                                             |
| **Advanced Caching**      | Uses **Supabase** as a robust, permanent caching layer for match histories and raw API payloads, heavily mitigating API rate limits and providing instantaneous load times. |

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
- **Database/Cache:** Supabase

### Utilities

- **Image Export:** html-to-image