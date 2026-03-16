# TrackerX

<p align="center">
	<img src="https://img.shields.io/badge/Next.js-16.1.6-000000?style=for-the-badge&logo=nextdotjs&logoColor=white" alt="Next.js" />
	<img src="https://img.shields.io/badge/React-19.2.3-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React" />
	<img src="https://img.shields.io/badge/Tailwind_CSS-v4-0F172A?style=for-the-badge&logo=tailwindcss&logoColor=38BDF8" alt="Tailwind CSS" />
	<img src="https://img.shields.io/badge/Type-JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=111111" alt="JavaScript" />
</p>

<p align="center">
	Production-ready VALORANT stats tracker with rich player insights, chart-driven analytics, exports, and shareable stat cards.
</p>

---

## Table of Contents

- [Overview](#overview)
- [Core Features](#core-features)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Deployment](#deployment)
- [Project Structure](#project-structure)
- [Notes](#notes)
- [License](#license)

## Overview

TrackerX is a production-ready VALORANT stats app built with Next.js and Tailwind CSS. Search any player by Riot ID, inspect recent matches, track performance trends, break down agent usage, and export data for analysis.

Built for speed, clarity, and shareability across desktop and mobile.

## Core Features

| Feature            | What You Get                                                  |
| ------------------ | ------------------------------------------------------------- |
| Player Search      | Look up players by `Name#TAG` with NA and EU support          |
| Dashboard          | Snapshot view of K/D, ACS, win rate, HS%, and top agent       |
| Match History      | Last 20 matches with expandable scoreboards and load-more UX  |
| Performance Charts | ACS trend line, agent usage pie, win-rate bars, radar profile |
| Leaderboard Widget | Top 10 ranked players by region                               |
| Export Tools       | Download stats as JSON or CSV                                 |
| Share Card         | Generate PNG stat cards for social sharing                    |
| Theme Toggle       | Persistent dark/light mode via `localStorage`                 |
| Responsive UI      | Mobile-friendly layouts with desktop-first polish             |

## Tech Stack

| Layer         | Library / Tool                             |
| ------------- | ------------------------------------------ |
| Framework     | Next.js 16 (App Router + API Routes)       |
| UI Styling    | Tailwind CSS v4                            |
| Animation     | Framer Motion                              |
| Data Fetching | TanStack React Query (5-minute stale time) |
| State         | Zustand (theme, region, recent searches)   |
| Charts        | Recharts                                   |
| Icons         | Lucide React                               |
| CSV Export    | PapaParse                                  |
| PNG Export    | html-to-image                              |

## Getting Started

### 1. Clone and Install

```bash
git clone https://github.com/USERNAME/TrackerX.git
cd TrackerX
npm install
```

### 2. Configure Environment

```bash
cp .env.local.example .env.local
```

Then edit `.env.local` with one of the following:

```bash
RIOT_API_KEY=RGAPI-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx

# or

RIOT_API_URL=https://your-api-host.vercel.app/api/riot
```

### 3. Start Development Server

```bash
npm run dev
```

Open `http://localhost:3000` in your browser.

## Environment Variables

| Variable       | Required   | Description                                  |
| -------------- | ---------- | -------------------------------------------- |
| `RIOT_API_KEY` | Optional\* | Direct Riot API key for server-side requests |
| `RIOT_API_URL` | Optional\* | Hosted proxy API endpoint                    |

`*` Provide either `RIOT_API_KEY` or `RIOT_API_URL`.

## Deployment

Deploying on Vercel:

1. Push the repository to GitHub.
2. Import the project in `vercel.com`.
3. Add `RIOT_API_KEY` or `RIOT_API_URL` in project environment variables.
4. Deploy.

Security note: API keys are only used server-side and are never exposed to the client.

## Project Structure

```text
app/
	globals.css
	layout.js
	page.js
	player/[riotId]/page.js

components/
	PlayerSearch/
	Dashboard/
	MatchHistory/
	Charts/
	StatCard/
	Leaderboard/
	ShareCard/
	ui/

lib/
	riotApi.js
	cache.js
	utils.js
	exportData.js

hooks/
	usePlayer.js
	useMatches.js
	useRankHistory.js

store/
	playerStore.js
```

## Notes

- Fully responsive: optimized for mobile and desktop.
- Stats and charts are derived from recent match history.
- Theme preference is persisted across sessions.
- Server-only API integration for safe key handling.

## License

MIT
