# Serpulo Command — Mindustry Campaign Tracker

## Original problem statement
Clone of the Mindustry Campaign Tracker. "Import Save" reads campaign data from `settings.bin` (and `saves/*.msav`)
inside the exported game-data zip. Supports numbered sectors, exports/storage stats, accurate v8 threat + status logic.

## Architecture
- Frontend: React + Tailwind + shadcn (`/app/frontend/src`)
  - `lib/mindustryParser.js` — UBJSON settings.bin parser, .msav meta reader, Saves.load() remap logic
  - `lib/sectorData.js` — v8 preset/graph dataset (272 Serpulo, 92 Erekir) extracted from the real server
  - `lib/planetGeo.js` — real PlanetGrid tile corner geometry (unit sphere) for both planets
  - `lib/presets.js` — threat formula, preset lookups, status/difficulty meta
  - `components/tracker/*` — Header, StatCards, SectorsTab (+resource filter), SectorCard, PlanetTab/PlanetGlobe,
    AnalyticsTab, DataTab, EditSectorDialog, MobileNav
- Backend: FastAPI + Mongo (`/app/backend/server.py`): GET/PUT/DELETE /api/sectors, POST /api/sectors/import, GET /api/planets
- Dev-only tooling: `/root/mserver` headless Mindustry server (geometry/threat dumps), `/app/tests/*` zip generators + node parser runner

## Implemented (chronological)
- Initial full-stack clone, parser, numbered sectors, exports/storage stats, status-first sorting
- Game-accurate threat + sector dataset, dedup of legacy IDs, power stat removed
- 2026-09-30 (this session):
  - Fix: legacy saves without `sectorPreset` tag remapped via preset `originalPosition` (Stained Mountains 20→223 now Captured)
  - Save-driven info remaps mirror Saves.load(); backup saves ignored
  - Unclaimed sectors removed everywhere (filtered on import + load; pills/edit options/legend updated)
  - Resource Finder dropdown in Sectors tab (map resources + core storage), highlights on cards
  - Compact cards, 5-per-row grid at xl (4 lg / 3 md / 2 sm / 1 mobile)
  - Planet tab: drag-to-rotate SVG globe with real hex tiles coloured by status, click tile → detail panel + Edit

## Rules / gotchas
- Do NOT change threat logic (verified 364/364 against the game)
- Import uses replace=true per planet; tests that import zips wipe existing planet data
- Node parser test: `cd /app/tests/node && node run.mjs <zip>` (regenerate *.mjs copies from src/lib first)

## Backlog
- P1: Resource icons/sprites on cards; planet auto-rotate idle animation
- P2: Erekir-specific globe palette tweaks; export CSV
