# GSU Site — Update Log (2026-05-09)

This document records all changes made to the repository during the 2026-05-09 work session.

---

## 1. Documentation

### CLAUDE.md — Updated
- Corrected active CSV: dashboard.html uses `rao8.csv` (was incorrectly listed as `rao4.csv`)
- Added all 8 CSV files with active/archive status
- Added `firebase-config.js` section (Firebase Auth, Firestore, Analytics)
- Added `gsu-gate/` Cloudflare Worker documentation
- Added both Cloudflare Worker endpoints: `gsu-gate.guduruadip.workers.dev` and `rao-dashboard-proxy.guduruadip.workers.dev`
- Added full 6-tab dashboard structure (Overview, Analysis, Compare, Rankings, Analytics, Insights)
- Added external services: Resend, Groq AI, Gemini AI
- Added typography: StyreneB (dashboard body), Copernicus (dashboard headings)
- Added dev/ folder and 3 new gotchas

### structure.md — Created (new file)
- Full directory tree with one-line description for every file and folder
- Page inventory table: URL, auth status, purpose for each HTML page
- Per-page dependency map (which JS, CSS, data files each page loads)
- Data file status table (active vs archive, size, who uses it)
- External services table
- Active vs dev/archive classification

---

## 2. Directory Restructuring

### /frames/ — Deleted
- 82 orphaned JPG frames (6.5 MB), no references anywhere in codebase

### dev/ — Created (gitignored)
- Moved `dashboard_test.html` → `dev/dashboard_test.html`
- Moved `test.html` → `dev/test.html`
- Moved `tracker.html` → `dev/tracker.html`
- Added `dev/` to `.gitignore` so dev files are not deployed to GitHub Pages
- Updated link in `dashboard.html`: `tracker.html` → `dev/tracker.html`

### assets/ — Created
- Moved `gsu.png` → `assets/gsu.png` (GSU logo, used in all navbars)
- Moved `gsu.ico` → `assets/gsu.ico` (favicon, used in all pages)
- Moved `world_alpha_mini.jpg` → `assets/world_alpha_mini.jpg` (3D globe texture)
- Moved `angelone.png` → `assets/angelone.png`
- Updated all references across `index.html`, `dashboard.html`, `map.html`, `rao.html`, `console.html`, `igpl.html`, `igplscroll.html`, `angelone.html`, and `dev/` pages

### docs/ — Created
- Moved `GRB Q1 2026.pdf` → `docs/GRB Q1 2026.pdf`
- Moved `GRB Q4 2025.pdf` → `docs/GRB Q4 2025.pdf`
- Moved `Thinking Geopolitically.pdf` → `docs/Thinking Geopolitically.pdf`
- Moved `PDF_PIPELINE_README.md` → `docs/PDF_PIPELINE_README.md`
- Updated PDF download links in `index.html`
- Updated `gsu-gate/src/index.js` ALLOWED_PDFS paths to `docs/GRB Q1 2026.pdf` / `docs/GRB Q4 2025.pdf`
- Fixed URL encoding in `gsu-gate/src/index.js`: encode each path segment separately so the `/` is not percent-encoded

### igpl/ — Reorganised
- Moved `igpl.png` → `igpl/igpl.png` (was in root, now co-located with company pages that reference it)
- Updated `igplscroll.html` to reference `igpl/igpl.png`

---

## 3. Dashboard UI Fixes (dashboard.html)

### Sign-in Button
- Applied Copernicus font (`var(--font-head)`)
- Gold border: `1px solid rgba(194,165,109,0.55)`
- Glass background: `rgba(194,165,109,0.07)` with `backdrop-filter: blur(8px)`
- Gold text: `color: var(--accent-gold)`

### Overview Tab — Map Controls
- Moved RAO Score / Pillar A–D / TOS / Regime buttons + Year dropdown from inside the map (overlapping) to a dedicated `.map-controls` bar above the map section
- Changed from `position:absolute` overlay to a regular flex bar with `border-bottom`

### Overview Tab — Global RAO Trends Chart
- Bolder, more distinct region colours: Africa `#E8943A`, Americas `#2DC87A`, Asia-Pacific `#4B96E8`, Europe `#E05B7A`, Middle East `#A96EDB`
- Restored dotted lines: `borderDash: [5, 3]` on all regional series
- `borderWidth: 2` for regional lines

### Overview Tab — Score Distribution Chart
- Tooltip mode changed to `index` / `intersect:false` (shows all regime counts on hover, not just hovered bar)
- Zero-count regimes filtered from tooltip labels
- Fixed chart sizing: `maintainAspectRatio: false` + flex layout on wrapper (`flex:1; min-height:260px`)
- Fixed chart re-creation bug: added `canvas._chartInst` destroy-before-recreate pattern so the chart updates correctly when the year changes

### Overview Tab — Map
- Removed built-in GeoChart colour-axis legend on the left side (`legend: 'none'`): the custom bottom-right overlay already explains the colours
- Removed extra padding added in a prior fix; restored `padding-top: 0`

### Overview Tab — Year-Aware Stats
- `_renderTop10Bottom10()` now uses `getSlice(_landscapeYear)` instead of the static 2024 `rawData`
- `renderRegionalSection()` (the large regional breakdown cards) now uses `getSlice(_landscapeYear)` instead of `rawData`
- Both functions added to `setLandscapeYear()` so they re-render on every year change alongside the map and charts
- Dropdown option colours added: dark background (`#1f283b`) / light text (`#e8e8e8`) for `landscape-year-select` and `analysis-year-select`

### Analysis Tab — Layout
- Year dropdown moved to sit beside the country search (flex row), not below it
- Search box width changed from fixed `300px` to `width: 100%` so it fills its flex parent
- Removed `max-width: 520px` cap from the search column so it expands to fill available width
- Fixed mobile media query: `.search-box { display:none }` → `.header .search-box { display:none }` so the analysis search input is no longer hidden on narrow screens
- Fixed dropdown clipping: added `overflow:visible` to the section container wrapping the search bar (was `overflow:hidden` from `.glow-section`, which clipped the search-results dropdown and made only the first result clickable)

### Analysis Tab — Score Decomposition
- "After Overlay" pill now shows the adjusted overall value (`pre_overlay + overlay_adjustment`) instead of the raw delta

### Analysis Tab — RAO Score Trajectory Chart
- Global Mean reference line: darker dotted style (`opacity: 0.65`)
- Archetype mean reference line: uses full hex colour (not broken rgba conversion) with `borderDash: [4,4]`
- Added 4 pillar fill areas as stacked transparent bands under the country RAO line (pillar_opportunity, pillar_fragility inverted, pillar_absorptive_capacity, pillar_trajectory); hidden from legend and tooltip

### Dropdown Option Colours (all dropdowns)
- Added CSS for `option` elements across all dashboard selects: `background: #1f283b; color: #e8e8e8`
- Year selects forced to `color: var(--text-white)` for the selected value

---

## 4. Files Changed Summary

| File | Type of change |
|------|---------------|
| `CLAUDE.md` | Updated — added missing services, correct CSV, new structure |
| `structure.md` | Created — full project structure document |
| `.gitignore` | Added `dev/` entry |
| `dashboard.html` | Multiple UI/chart/layout fixes (see §3) |
| `index.html` | Asset path updates (`gsu.png` → `assets/gsu.png`, etc.) |
| `map.html` | Asset path updates |
| `rao.html` | Asset path updates |
| `console.html` | Asset path updates |
| `igpl.html` | Asset path updates |
| `igplscroll.html` | Asset path updates; `igpl.png` → `igpl/igpl.png` |
| `angelone.html` | Asset path updates |
| `dev/dashboard_test.html` | Moved from root; asset paths updated to `../assets/` prefix |
| `dev/test.html` | Moved from root |
| `dev/tracker.html` | Moved from root |
| `gsu-gate/src/index.js` | PDF paths updated to `docs/`; URL encoding fixed |
| `assets/` | New folder — gsu.png, gsu.ico, world_alpha_mini.jpg, angelone.png |
| `docs/` | New folder — GRB PDFs, Thinking Geopolitically.pdf, PDF_PIPELINE_README.md |
| `igpl/igpl.png` | Moved from root |

---

## 5. Deferred / Not Yet Done

- **Login/signup fixes** — deferred to a later session (Firebase auth flow errors)
- **Compare, Rankings, Analytics, Insights tabs** — not yet reviewed for layout/chart issues
- **CSS/HTML split** — dashboard.html is 11,700+ lines; splitting into separate CSS file deferred
