# TrackerX

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-16.1.6-000000?style=for-the-badge&logo=nextdotjs&logoColor=white" alt="Next.js" />
  <img src="https://img.shields.io/badge/React-19.2.3-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-v4-0F172A?style=for-the-badge&logo=tailwindcss&logoColor=38BDF8" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/Type-JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=111111" alt="JavaScript" />
</p>

<p align="center">
  A premium, high-performance VALORANT stats tracker. Get deep insights into your competitive performance with clean analytics, visual trends, and shareable highlights.
</p>

---

## 🚀 Overview

TrackerX is a modern web application designed for VALORANT players who want a fast, lightweight, and visually stunning way to track their progress. By aggregating data from unofficial and official sources, it provides a comprehensive breakdown of your matches, agent mastery, and seasonal rank progression.

## ✨ Core Features

| Feature | Description |
| :--- | :--- |
| **Instant Player Search** | Look up any Riot ID across NA and EU regions with zero latency. |
| **Competitive Dashboard** | Real-time snapshot of your K/D ratio, ACS, win rates, and headshot accuracy. |
| **Rank & MMR Tracking** | View your current rank, RR progress, and seasonal peak tiers. |
| **Advanced Match History** | Expandable match cards showing full scoreboards, map details, and individual performance. |
| **Data Visualization** | Interactive charts for ACS trends, agent win rates, and performance radar profiles. |
| **Analytics Export** | Download your complete match history and player stats in JSON or CSV formats. |
| **Social Share Cards** | Generate and download custom PNG stat cards to showcase your performance on social media. |
| **Dark Mode Architecture** | A sleek, Valorant-inspired interface with full dark/light mode support. |

## 🛠️ Tech Stack

### Frontend & Core
- **Framework:** Next.js 16 (App Router)
- **Styling:** Tailwind CSS v4 (Modern JIT engine)
- **Animations:** Framer Motion (Smooth layout transitions)
- **Icons:** Lucide React

### Data & State
- **Data Fetching:** TanStack React Query v5 (Optimized caching & revalidation)
- **State Management:** Zustand (Lightweight global store)
- **Charts:** Recharts (Responsive SVG analytics)

### Utilities
- **Data Export:** PapaParse (CSV)
- **Image Generation:** html-to-image (Stat card snapshots)
- **Date Handling:** Custom time-ago utilities

---

## 📂 Project Structure

```text
app/                    # Next.js App Router (Pages & Layouts)
components/             # React components organized by feature
  ├── Dashboard/        # Player overview & Stat banners
  ├── MatchHistory/     # Recent games & Scoreboards
  ├── Charts/           # Recharts implementations
  ├── ShareCard/        # Social media image generator
  └── ui/               # Reusable primitive components
hooks/                  # Custom React hooks for API & State
lib/                    # Core logic: API clients, caching, & utils
store/                  # Zustand store definitions
public/                 # Static assets & placeholders
```

## 📝 Performance & Design Notes

- **Optimized for Speed:** Uses a hybrid API approach to ensure fast data retrieval even with standard API limitations.
- **Mobile First:** Every chart and dashboard element is fully responsive and touch-optimized.
- **Server-Side Security:** All external API calls are proxied through internal Next.js API routes to protect sensitive integration logic.
- **Persistent UX:** User preferences for theme and region are automatically saved for returning visits.
