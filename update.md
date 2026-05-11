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

- **Compare, Rankings, Analytics, Insights tabs** — not fully reviewed for all layout/chart issues
- **CSS/HTML split** — dashboard.html is 11,700+ lines; splitting into separate CSS file deferred

---
---

# GSU Site — Update Log (2026-05-10)

This document records all changes made to `dashboard.html` during the 2026-05-10 work session. All changes are in `dashboard.html` only (no structural file moves this session).

---

## 1. Overview Tab — Year-Aware Data

### Top 10 / Bottom 10 (`_renderTop10Bottom10`)
- Changed `rawData` → `getSlice(_landscapeYear)` so the top/bottom country lists update when the year slider is changed
- Added call to `_renderTop10Bottom10()` inside `setLandscapeYear()` so it re-renders on every year change

### Regional Breakdown (`renderRegionalSection`)
- Changed `rawData` → `getSlice(_landscapeYear)` stored as `yearSlice`
- Added call to `renderRegionalSection()` inside `setLandscapeYear()`

---

## 2. Analysis Tab — Search Box & Country Dropdown

### Dropdown Clipping (portal pattern)
- Root cause: `.tab-content.active` has a `fadeIn` CSS animation using `transform: translateY()`, which creates a CSS containing block — making `position:fixed` children behave like `position:absolute` during the animation, causing the dropdown to be clipped by `overflow:hidden` ancestors
- Fix: moved `#search-results` div to a direct child of `<body>` (standard portal pattern); JS positions it with `getBoundingClientRect()` on the `.search-box`
- `_positionSearchResults()` measures `.search-box` bounding rect and applies `top`/`left`/`width` to the fixed-position portal
- Scroll listener repositions results when page is scrolled while dropdown is open

### Search Box Width
- `.search-box` changed from `width: 300px` to `width: 100%` so it fills the flex row

### Analysis section container
- Added `overflow:visible` to the glow-section container wrapping the search bar (was `overflow:hidden`, clipping the dropdown)

### Media query fix
- `.search-box { display:none }` → `.header .search-box { display:none }` so analysis search input is not hidden on mobile

### Keyboard Navigation for Country Search
- Added `onkeydown="handleSearchKeydown(event)"` to the search input
- New `handleSearchKeydown()`: ArrowDown/Up moves highlight, Enter selects, Escape closes
- New `_setSearchKbIndex()`: manages `kb-active` CSS class on result items
- New `_closeSearch()`: centralised close + reset helper used by document click and keyboard Escape
- `.search-result-item.kb-active` CSS rule added: `background: var(--tertiary-bg); outline: 1px solid rgba(194,165,109,0.35)`

### Browser Autocomplete Suppression
- Added `autocomplete="off" autocorrect="off" spellcheck="false"` to the search input — prevents browser address autofill from hijacking keyboard arrow keys

---

## 3. Rankings Tab

### Stats Defaulting to 0 on Load
- `initializeRankingsTab()` was calling `updateRankingsTable()` directly, which does not update quick-stats
- Fixed by calling `filterRankings()` instead — the orchestrating function that calls both `updateRankingsTable()` and `updateQuickStats()`

### Score Mini-Bar Gradient Overlapping Text
- `.score-with-bar` changed from relative-position container to `display:flex; flex-direction:column; gap:3px`
- `.score-mini-bar` changed from `position:absolute; z-index:-1` (which overlapped score text) to a plain block element in the column flow
- Score number and bar now stack vertically with no overlap

### Star / Favourites — Dedicated Column
- Moved `<span class="favorite-star">` out of the Country name `<td>` — star was inline with the country name and could wrap to a new line on narrow columns
- Added new `<th>` header (36 px wide, star icon, no sort action) between Country and RAO Score
- Added matching `<td>` (36 px, centred, click triggers `toggleFavorite`) for each row
- Country name cell now only contains the name and the data-completeness warning icon

---

## 4. Compare Tab — Pre-Populate on "Compare Countries"

### `compareSelectedCountries()` Rewrite
- Previous version used wrong element IDs (`country1-select` etc.) and called non-existent `runComparison()`
- Rewrote to use correct IDs (`compare-country-1`, `compare-country-2`, `compare-country-3`) and `updateComparison()`
- `switchTab('compare')` is called first; country selects are set after a 300 ms delay to let the tab render

---

## 5. Score Distribution Chart — Canvas Reuse Bug

- Added `canvas._chartInst` destroy-before-recreate pattern to `renderScoreDistributionChart()`
- Previously the chart was not destroyed before re-creation on year change, causing Chart.js to throw a canvas-already-in-use error and silently fail

---

## 6. Lock Screen (Analytics & Insights Tabs)

### Position Fix — Always Visible Without Scrolling
- `.tab-lock` changed from `position: absolute; inset: 0` to `position: fixed; inset: 0`
- Previous: overlay spanned the full height of tab content (potentially thousands of pixels); `justify-content: center` placed the message far below the viewport requiring scroll to see it
- Fixed: overlay now covers the viewport regardless of content height

### Z-index — Tab Bar Remains Accessible
- `.tab-lock` `z-index` set to `999` (below the fixed header at `z-index: 1000`)
- The navigation tab bar floats above the lock blur, so users can switch to an accessible tab without being stuck

---

## 7. Auth Modal — Keyboard Navigation

- `onkeydown="handleAuthKeydown(event)"` added to all auth form inputs: `login-email`, `login-password`, `reg-name`, `reg-email`, `reg-password`, `reset-email`
- New `handleAuthKeydown(event)`: if Enter pressed, detects which form is currently visible and calls `handleEmailLogin()`, `handleEmailRegister()`, or `handlePasswordReset()` accordingly
- Global `document.addEventListener('keydown')`: Escape key closes the auth modal when it is open

---

## 8. Registration — Smart Email-Already-Exists Detection

Previous behaviour: `auth/email-already-in-use` always showed "That email is already registered." regardless of whether the existing account was verified or not — causing silent double-submissions when the user re-clicked.

New `handleEmailRegister()` logic:

| Scenario | What happens |
|----------|-------------|
| New email | Account created → success toast → verify panel shown |
| Email exists, same password entered, account **unverified** | Verification email resent → toast → verify panel shown |
| Email exists, same password entered, account **verified** | Inline error: "This email already has a verified account. Please sign in instead." |
| Email exists, **different** password | Inline error: "An account with this email exists. Sign in or reset your password." |

Implementation: on `auth/email-already-in-use`, attempts `signInWithEmail(email, password)` with the credentials already typed; branches on `cred.user.emailVerified` and on sign-in error codes.

---

## 9. Registration — Success Toast

- New `showAuthToast(msg)` function: creates a floating bar fixed at `bottom: 2rem`, gold border, fades out after 3.5 s
- Called on first successful registration ("Verification email sent — check your inbox.")
- Called when verification email is resent to an unverified account ("Verification email resent — check your inbox.")

---

## 10. Auth UI — Unverified User Showing Avatar

- Firebase signs users in immediately after `createUserWithEmailAndPassword`, even before email verification
- Previously `onAuthReady(user)` showed the user avatar/menu for any non-null user, so a freshly registered but unverified user would see "Free" in the avatar spot
- Fix: added `const isUnverified = user && !user.emailVerified && user.providerData[0]?.providerId === 'password'`; the avatar block only runs for `user && !isUnverified`
- Unverified email/password users now see the Sign In button, not the avatar
- Google OAuth users are unaffected (their `providerId` is `'google.com'` and they are always verified)

---

## 11. Files Changed Summary

| File | Type of change |
|------|---------------|
| `dashboard.html` | All changes above — UI fixes, auth flow, keyboard nav, lock screen, rankings star column |

---

## 12. Deferred / Not Yet Done

- **Analytics tab** — charts and layout not fully reviewed
- **Insights tab** — brief grid and chatbot not reviewed for layout issues
- **CSS/HTML split** — dashboard.html is 11,800+ lines; deferred
