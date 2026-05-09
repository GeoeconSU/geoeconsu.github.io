# GSU Site — Project Structure

This document describes every file and folder in the repository, what each one does, and how files relate to one another.

---

## Directory Tree

```
geoeconsu.github.io/
│
├── HTML Pages (root — production)
│   ├── index.html
│   ├── dashboard.html
│   ├── map.html
│   ├── rao.html
│   ├── console.html
│   ├── igpl.html
│   ├── igplscroll.html
│   └── angelone.html
│
├── dev/                          ← gitignored; not deployed
│   ├── dashboard_test.html
│   ├── test.html
│   └── tracker.html
│
├── data/                         ← RAO scoring CSV datasets
│   ├── rao.csv
│   ├── rao2.csv
│   ├── rao3.csv
│   ├── rao4.csv
│   ├── rao5.csv
│   ├── rao6.csv
│   ├── rao7.csv
│   └── rao8.csv
│
├── insights/                     ← Strategic brief PDFs (11 files)
│   ├── davos.pdf
│   ├── SaudiArabiaForeignInvestment.pdf
│   ├── Venezuela Crisis 2026.pdf
│   ├── Rare Earth Chokepoint.pdf
│   ├── The Tale of Two Giants.pdf
│   ├── GSU Executive Note - China Shock 2.0.pdf
│   ├── Iran at the Inflection Point - Escalation Risk in the Middle East .pdf
│   ├── Irish Support for Farmers Cannot Fully Mitigate Price Shocks .pdf
│   ├── Oil Price Shocks and Financial Stability in Import-Dependent Economies - A Case Study on South Korea.pdf
│   ├── US-India Deal Announcement- Tariff De-Escalation and Economic Rapprochement .pdf
│   └── West Asia Conflict Pushes Oil Prices Higher Is Fuel Hike Approaching India Post-Elections.pdf
│
├── logos/                        ← Client logos
│   ├── ksr-logo.svg
│   ├── tca-logo.png
│   ├── altmin1.avif
│   └── altmin.avif
│
├── team/                         ← Team member photos (12 files)
│   ├── brian.png
│   ├── ishan.png
│   ├── adip.png
│   ├── pranoy.png
│   ├── lauren.png
│   ├── niamh.png
│   ├── liliya.png
│   ├── sreemayukha.png
│   ├── hillary.png
│   ├── bhuvanya.jpeg
│   └── shubhangi.jpeg
│
├── igpl/                         ← IGPL client assets (~46 files)
│   ├── template.html
│   └── [45 individual company pages: abc-banking.html, abd.html, ...]
│
├── gsu-gate/                     ← Cloudflare Worker (PDF gate)
│   ├── wrangler.toml
│   └── src/
│       └── index.js
│
├── assets/                       ← Static images and icons
│   ├── gsu.png                   ← GSU logo (all navbars)
│   ├── gsu.ico                   ← Favicon (all pages)
│   ├── world_alpha_mini.jpg      ← 3D globe texture (index.html)
│   └── angelone.png              ← Angel One client asset
│
├── docs/                         ← PDF documents and pipeline documentation
│   ├── GRB Q1 2026.pdf           ← Latest Risk Barometer (gated download)
│   ├── GRB Q4 2025.pdf           ← Previous Risk Barometer (gated download)
│   ├── Thinking Geopolitically.pdf ← GSU whitepaper (direct link)
│   └── PDF_PIPELINE_README.md    ← Brief pipeline documentation
│
├── .github/
│   └── workflows/
│       └── update_briefs.yml     ← GitHub Actions: PDF → briefs.json pipeline
│
├── JavaScript files
│   ├── firebase-config.js
│   ├── load-briefs.js
│   └── igpl-config.js
│
├── Pipeline scripts
│   ├── process_pdf.py
│   └── requirements.txt
│
├── Data/Config files
│   └── briefs.json
│
└── Config
    ├── CNAME
    ├── .gitignore
    ├── CLAUDE.md
    └── structure.md
```

---

## Page Inventory

| Page | URL | Auth | Purpose |
|------|-----|------|---------|
| `index.html` | `geoecon.solutions/` | Public | Landing page: hero section, 3D globe, team carousel, services, brief highlights, client logos, PDF gate |
| `dashboard.html` | `/dashboard.html` | Firebase login required | Full RAO analytics dashboard with 6 tabs |
| `map.html` | `/map.html` | Public | Interactive global RAO heatmap (Google GeoChart) |
| `rao.html` | `/rao.html` | Public | RAO scoring methodology explanation and visualization |
| `console.html` | `/console.html` | Public | Developer/internal data console |
| `igpl.html` | `/igpl.html` | Public | IGPL partnership opportunity page with video |
| `igplscroll.html` | `/igplscroll.html` | Public | Alternate scrollable version of igpl.html |
| `angelone.html` | `/angelone.html` | Public | Client proposal for Angel One India expansion |
| `dev/dashboard_test.html` | Not deployed | N/A | Development test copy of dashboard |
| `dev/test.html` | Not deployed | N/A | General test/debug page |
| `dev/tracker.html` | Not deployed | N/A | Data tracking/monitoring page |

---

## Dependency Map

### index.html
**Loads from external CDN:**
- Three.js v0.128.0 (via Skypack) — 3D globe
- OrbitControls (via Skypack) — globe camera interaction
- Google Fonts — Playfair Display, EB Garamond

**Loads local JS:**
- `load-briefs.js` — renders strategic brief cards from `briefs.json`

**Loads local assets:**
- `assets/world_alpha_mini.jpg` — 3D globe texture
- `assets/gsu.png` — logo in navbar
- `team/[name].png|jpeg` — team member photos
- `logos/ksr-logo.svg`, `logos/tca-logo.png`, `logos/altmin1.avif`, `logos/altmin.avif` — client logos

**Links to local docs:**
- `docs/Thinking Geopolitically.pdf` — direct whitepaper download
- `docs/GRB Q1 2026.pdf` / `docs/GRB Q4 2025.pdf` — gated via Cloudflare Worker

**Calls external API:**
- `gsu-gate.guduruadip.workers.dev/send-report` — PDF gate (name/email capture → sends GRB download link)

**Derives content from:**
- `briefs.json` (via `load-briefs.js`) — brief cards section

---

### dashboard.html
**Loads from external CDN:**
- Firebase SDK compat v10.7.1 (app, auth, firestore, analytics)
- Google Charts loader — GeoChart
- Google Fonts — EB Garamond, Montserrat, JetBrains Mono
- Remix Icon v3.5.0

**Loads local JS:**
- `firebase-config.js` — Firebase init, auth handlers, user role management
- `load-briefs.js` — briefs grid in the Insights tab

**Loads local data:**
- `data/rao8.csv` — primary panel dataset (2010–2024, 46 columns)

**Calls external APIs:**
- `rao-dashboard-proxy.guduruadip.workers.dev` — AI chatbot (proxies to Groq)

**Derives content from:**
- `data/rao8.csv` — all country scores, pillars, regimes, archetypes
- `briefs.json` (via `load-briefs.js`) — Insights tab brief grid
- Firebase Firestore — user role and access level

---

### map.html
**Loads from external CDN:**
- Google Charts API

**Loads local data:**
- `data/rao2.csv` — country scores for GeoChart coloring

---

### console.html
**Loads local data:**
- `data/rao3.csv` — 33-column detailed pillar data

---

### igpl.html / igplscroll.html
**Loads local JS:**
- `igpl-config.js` — event video timeline configuration

---

### load-briefs.js
**Fetches:**
- `briefs.json` — reads all brief entries and renders them as cards

**Used by:**
- `index.html` (brief highlights section)
- `dashboard.html` (Insights tab brief grid)

---

### firebase-config.js
**Initializes:**
- Firebase project `gsu-members` (Auth, Firestore, Analytics)

**Used by:**
- `dashboard.html` only

**Writes to / reads from:**
- Firestore: `users/{uid}/` — user profile, role, level
- Firebase Analytics: logs tab views, logins, country selections, comparisons

---

### briefs.json
**Generated by:**
- `process_pdf.py` (run via GitHub Actions `update_briefs.yml`)

**Contains:**
- 14 brief entries with fields: category, title, subtitle, author, description, filename, href, processed_date

**Note:** 3 of the 14 entries reference PDFs not yet present in `insights/` — those links will 404.

**Consumed by:**
- `load-briefs.js`

---

### gsu-gate/src/index.js (Cloudflare Worker)
**Deployed at:** `gsu-gate.guduruadip.workers.dev`

**Called by:**
- `index.html` PDF download buttons

**Calls:**
- Resend API — sends PDF download email to user
- Firebase Realtime Database — logs lead (name, email, timestamp)

---

### process_pdf.py
**Triggered by:**
- `.github/workflows/update_briefs.yml` (on push with new files in `insights/`)

**Reads:**
- PDFs from `insights/` directory
- `.processed_pdfs.json` (tracks already-processed files; gitignored)

**Calls:**
- Gemini 2.5 Flash AI — generates brief metadata from PDF text

**Writes:**
- `briefs.json` — adds new entries
- `.processed_pdfs.json` — marks PDF as processed

---

## Data Files

| File | Size | Format | Active? | Used by |
|------|------|--------|---------|---------|
| `data/rao.csv` | 6.7 KB | country, score, regime | Archive | Nothing |
| `data/rao2.csv` | 8.1 KB | country, score, regime | Active | `map.html` |
| `data/rao3.csv` | 60 KB | 33-column pillar data | Active | `console.html` |
| `data/rao4.csv` | 61 KB | enhanced pillar data | Archive | Nothing |
| `data/rao5.csv` | 89 KB | scaled components | Archive | Nothing |
| `data/rao6.csv` | 47 KB | RAO 4.0 | Archive | Nothing |
| `data/rao7.csv` | 51 KB | RAO 5.0 + trajectory | Archive | Nothing |
| `data/rao8.csv` | 871 KB | panel data 2010–2024, 46 cols | Active | `dashboard.html` |
| `briefs.json` | 9.5 KB | JSON array of 14 brief objects | Active | `load-briefs.js` |

---

## External Services

| Service | Provider | Used for | Called from |
|---------|----------|----------|-------------|
| Firebase Auth | Google | User login (email + Google OAuth) | `firebase-config.js` |
| Firebase Firestore | Google | User role storage | `firebase-config.js` |
| Firebase Realtime DB | Google | PDF gate lead logging | `gsu-gate/src/index.js` |
| Firebase Analytics | Google | User behaviour tracking | `firebase-config.js` |
| Cloudflare Workers | Cloudflare | PDF gate + chatbot proxy | `index.html`, `dashboard.html` |
| Resend | Resend | Transactional email (PDF links) | `gsu-gate/src/index.js` |
| Groq AI | Groq | Dashboard chatbot LLM | Via Cloudflare Worker proxy |
| Gemini 2.5 Flash | Google | PDF metadata extraction | `process_pdf.py` |
| Google Charts | Google | GeoChart heatmap | `map.html` |
| Three.js (Skypack) | CDN | 3D globe | `index.html` |
| Google Fonts | Google | Typography | All pages |
| Remix Icon | jsDelivr CDN | Icons | `dashboard.html` |

---

## Active vs. Dev/Archive Files

### Production (deployed to geoecon.solutions)
- `index.html`, `dashboard.html`, `map.html`, `rao.html`, `console.html`, `igpl.html`, `igplscroll.html`, `angelone.html`
- All files in `data/`, `insights/`, `logos/`, `team/`, `igpl/`, `assets/`
- `firebase-config.js`, `load-briefs.js`, `igpl-config.js`
- `briefs.json`
- All files in `docs/` (PDFs and pipeline readme)

### Dev/Test (gitignored — not deployed)
- `dev/dashboard_test.html`, `dev/test.html`, `dev/tracker.html`
- `commit.sh`, `.processed_pdfs.json`, `.claude/`

### Infrastructure/Pipeline (not served directly)
- `gsu-gate/` — deployed separately to Cloudflare
- `process_pdf.py`, `requirements.txt` — run by GitHub Actions
- `.github/workflows/update_briefs.yml` — GitHub Actions config
