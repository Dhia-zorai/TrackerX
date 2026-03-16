TrackerX

TrackerX is a production ready Valorant stats tracker built with Next.js and Tailwind CSS. Search any player by Riot ID, view match history, performance charts, agent breakdowns, and export stats. The interface supports dark and light modes and is fully responsive.

Features

Player Search: look up any player by Name#TAG with NA or EU region support

Dashboard: K/D, ACS, win rate, headshot percentage, top agent at a glance

Match History: last 20 matches with expandable scoreboards and load more

Performance Charts: ACS over time, agent usage, win rate by agent, performance radar

Leaderboard Widget: top 10 ranked players per region

Export: download stats as JSON or CSV

Share Card: generate a PNG stat card for sharing

Theme Toggle: dark and light mode persisted to localStorage

Responsive Design: desktop first with mobile friendly layout

Tech Stack
Layer Library or Tool
Framework Next.js 16 (App Router and API Routes)
Styling Tailwind CSS v4
Animation Framer Motion
Data Fetching TanStack React Query (5 minute stale time)
State Zustand (persisted theme, region, recent searches)
Charts Recharts
Icons Lucide React
CSV Export PapaParse
PNG Export html-to-image
Getting Started

Clone the repository and install dependencies

git clone https://github.com/USERNAME/TrackerX.git
cd TrackerX
npm install

Set up environment variables by copying the example file

cp .env.local.example .env.local

Edit .env.local with your Riot API key or your hosted API URL if using a proxy

RIOT_API_KEY=RGAPI-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx

# or

RIOT_API_URL=https://your-api-host.vercel.app/api/riot

Run the development server

npm run dev

Open http://localhost:3000
in your browser.

Deployment on Vercel

Push the repository to GitHub

Import the repository at vercel.com

Add RIOT_API_KEY or RIOT_API_URL as an environment variable in the Vercel project settings

Deploy. The API key is only used server side and is never exposed to the client

Project Structure
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
Notes

Fully responsive, mobile friendly, and works on desktop

All stats and charts are derived from match history

Dark and light mode is persisted across sessions

API keys are only used server side

License

MIT
