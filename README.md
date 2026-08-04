# Pin2Area - Bangalore Pincode Directory

A modern, fast, and feature-rich web directory to explore Bangalore pincodes, post office coverage, sub-localities, and geographical map coordinates.

Built by **Rudra Patel**. Data sourced from official **India Post** records (112+ locations indexed).

## Tech Stack

- **Frontend Framework:** React 19 (Vite)
- **Database & SQL:** MySQL 8.0+ Relational Database (`database/schema.sql` & `database/seed.sql`)
- **Mapping Engine:** Leaflet & React-Leaflet
- **Design System:** Custom Material You (Material 3) Expressive System with CSS Tokens & Micro-animations
- **Iconography:** Lucide Icons
- **Data & Search Engine:** Client-side scoring fuzzy search with MySQL relational schema mapping

## Data Architecture & Pincode Fetching Pipeline

### 1. Data Source & Structuring
Pincode data is curated from official **India Post** records and structured in `client/src/data/pincodes.js`. Each entry contains:
- `pincode`: 6-digit Bangalore postal code (e.g. `560092`).
- `area`: Main locality name (e.g. `Sahakaranagar`).
- `subAreas`: Array of mapped post offices and sub-localities (e.g. `Amrutahalli`, `Byatarayanapura`).
- `lat` & `lng`: Geographical map coordinates for Leaflet rendering.

### 2. Search & Fetching Scoring Algorithm (`searchPincodes`)
When a user searches by pincode or locality name, `searchPincodes(query)` executes a zero-latency client-side scoring search algorithm:
- **Exact Pincode Match:** Priority score `100`
- **Exact Locality Match:** Priority score `95`
- **Exact Sub-locality Match:** Priority score `90`
- **Pincode Prefix Match (e.g. "5600"):** Priority score `80`
- **Locality Prefix Match (e.g. "Kora"):** Priority score `75`
- **Sub-locality Prefix Match:** Priority score `70`
- **Substring Keyword Match:** Priority score `25 - 60`

Matching records are filtered (`score > 0`), sorted descending by relevance, and capped to top 20 instant results.

### 3. MySQL Database Synchronization Pipeline
The `database/generate-seed.js` script converts `pincodes.js` into relational SQL statements, producing `database/seed.sql` for MySQL deployment with foreign key constraints and B-Tree indexing.

## Key Features

- **Instant Search with Autocomplete Overlay:** Search by 6-digit pincodes (e.g. `560092`) or locality names (e.g. `Koramangala`, `Sahakaranagar`).
- **Keyboard Navigation Support:** Use `ArrowUp`, `ArrowDown`, `Enter`, and `Escape` keys to navigate search autocomplete suggestions with auto-scrolling into view.
- **Result Not Found State (404 Handling):** Dedicated empty state handling when no matching pincode or area exists, with clear search action.
- **Material 3 Expressive Result Cards:**
  - Signature organic cookie pincode badges.
  - Direct quick actions for Copy pincode, Save location, and Google Maps directions.
  - Tactile micro-animation feedback on click/tap.
- **Collapsible Sub-localities Accordion:** Expandable dropdown trigger to view post office coverage and sub-localities without cluttering vertical layout space.
- **Top Appbar Saved Locations Dropdown:** Quick access menu next to theme toggle with counter badges, search-result style items, and fast bookmark removal.
- **Interactive Squircle Map:** Dark mode Leaflet tile filtering, custom glowing markers, and location popups.
- **Responsive 2-column & Mobile Layout:** 2-row button grid, left-right key-value pair metadata grids, and full-width dropdown menus.
- **Theme Support:** Dark, Light, and System theme switching.
- **Issue Reporting:** Direct mailto integration for feedback (`patelrudrahn676@gmail.com`).

## Database Setup (MySQL)

Import the provided SQL schema and seed data into your MySQL database:

```bash
mysql -u root -p < database/schema.sql
mysql -u root -p < database/seed.sql
```

## Local Setup (Frontend)

```bash
cd client
npm install
npm run dev
```

The application will launch locally at `http://localhost:5173`.

## Deployment (Vercel)

```bash
git add .
git commit -m "Deploy Pin2Area app"
git push origin main
```

1. Import project in Vercel dashboard.
2. Vercel auto-detects Vite and builds the project.

## Author & Data Attribution

- **Creator:** Rudra Patel
- **Data Source:** India Post (Updated August 2026)
- **Directory Scope:** 112 locations indexed
- **Disclaimer:** Not affiliated with India Post
