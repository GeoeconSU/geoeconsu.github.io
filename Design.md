# GSU Design System

Design reference for `index.html`, `dashboard.html`, `admin.html`, and `chat.html`.

---

## Color Tokens

### Core Palette
| Token | Value | Usage |
|---|---|---|
| `--primary-bg` | `#192030` | Page / app background |
| `--secondary-bg` | `#1f283b` | Cards, panels |
| `--tertiary-bg` | `#232d44` | Nested surfaces, table headers |
| `--bg-raised` | `#232d44` | Elevated panels (chat.html) |
| `--text-white` | `#eeeae0` | Primary text |
| `--text-muted` | `rgba(238,234,224,.70)` | Secondary text |
| `--w45` | `rgba(238,234,224,.45)` | Disabled / placeholder |
| `--w20` | `rgba(238,234,224,.20)` | Borders on dark surfaces |
| `--w08` | `rgba(238,234,224,.08)` | Subtle fills |
| `--w04` | `rgba(238,234,224,.04)` | Ghost backgrounds |

### Accent
| Token | Value | Usage |
|---|---|---|
| `--accent-gold` | `#C2A56D` | Primary brand accent |
| `--accent-gold-dim` | `rgba(194,165,109,0.3)` | Hover borders, dividers |
| `--gold-mid` | `rgba(194,165,109,.15)` | Subtle fills |
| `--gold-faint` | `rgba(194,165,109,.07)` | Ghost fills |
| `--border-subtle` | `rgba(255,255,255,.07)` | Default card borders |
| `--border-hover` | `rgba(194,165,109,0.3)` | Hovered borders |

> `index.html` uses `--accent-gold: #cba84e` (slightly warmer variant). All other pages use `#C2A56D`.

### Data / Semantic
| Token | Value | Meaning |
|---|---|---|
| `--accent-green` / `--regime-ro` | `#5d8a72` | Excellent / Regime Opportunity |
| `--accent-lime` | `#7a8e62` | Good / above average |
| `--accent-amber` | `#c4a060` | Moderate / caution |
| `--accent-orange` | `#a87a5e` | Weak / concerning |
| `--accent-red` / `--regime-sr` | `#966060` | Critical / Regime Stress |
| `--accent-blue` / `--regime-sl` | `#607c98` | Stable / informational |
| `--regime-fo` | `#C2A56D` | Frontier Opportunity |

### Admin Light Theme (admin.html only)
- Background: `#f5f1ea` · Text: `#1a1f2e` · Accent: `#C2A56D`
- Role colors — Director: `#7a5a28` · Employee: `#4a6a88` · Free: `#4a7a5e`

---

## Typography

### Font Stack
| Variable | Family | Usage |
|---|---|---|
| `--font-head` | `Copernicus` → `EB Garamond` → Georgia, serif | Headings (dashboard, chat.html) |
| `--font-body` | `StyreneB` → `EB Garamond` → Georgia, serif | Body text (dashboard, chat.html) |
| `--font-minor` | `Montserrat`, sans-serif | Labels, nav, eyebrows, tags |
| `--font-mono` | `JetBrains Mono`, monospace | Data values, code |

> `index.html` uses `Playfair Display` for headings and `EB Garamond` for body (no CSS variable — hard-coded).

### Size Scale
| Element | Size |
|---|---|
| Hero h1 | `3.8rem` → `3rem` mobile |
| Section h2 | `2.5rem` |
| Card h3 | `1.05rem – 1.5rem` |
| Body | `1rem – 1.15rem` |
| Small label | `0.62rem – 0.75rem` uppercase |
| Eyebrow | `0.62rem`, `letter-spacing: 0.26em` |
| Data / mono | `0.7rem – 1.75rem` depending on context |

### Eyebrow Pattern
```css
font-size: 0.62rem;
letter-spacing: 0.26em;
text-transform: uppercase;
color: var(--accent-gold);
font-weight: 600;
```

---

## Spacing & Layout

### Page Structure
| Page | Header offset | Max content width |
|---|---|---|
| `index.html` | None (full-bleed hero) | `1280px` |
| `dashboard.html` | `90px` | Full-width (tabbed) |
| `admin.html` | `62px` | `1400px` |
| `chat.html` | Fixed `56px` top bar | Full-viewport flex app |

### Grid Classes
| Class | Columns | Gap |
|---|---|---|
| `.grid-2` | `1fr 1fr` | `5rem` (index) / `14px` (dashboard) |
| `.grid-3` | `repeat(3, 1fr)` | `2rem` |
| `.grid-4` | `repeat(4, 1fr)` | `2rem` |
| `.kpi-grid` | `repeat(auto-fit, minmax(170px, 1fr))` | — |
| `.bento-grid` | `repeat(3, 1fr)` | `12px` |
| `.analysis-grid` | `1fr 1fr` | `12px` |
| `.kpi-strip` | `repeat(6, 1fr)` | `0` |

### Section Padding
- Marketing sections (`index.html`): `7rem` vertical
- Dashboard panels: `1.75rem 2rem`
- Insights/briefs: `2.5rem max(1.5rem, calc(50% - 680px))`

---

## Borders & Shadows

### Borders
```css
/* Default card border */
1px solid rgba(255,255,255,.07)

/* Hover / active */
1px solid rgba(194,165,109,0.3–0.45)

/* Gradient divider */
border-bottom: 1px solid linear-gradient(90deg, transparent, rgba(194,165,109,.2), transparent)
```
Border-radius is consistently `3px` across all interactive elements (cards, inputs, modals, buttons).

### Shadow Scale
| Level | Value |
|---|---|
| Card | `0 2px 14px rgba(0,0,0,.22), 0 1px 0 rgba(255,255,255,.04) inset` |
| Card hover | `0 6px 24px rgba(0,0,0,.3), 0 0 16px rgba(194,165,109,.04), 0 1px 0 rgba(255,255,255,.05) inset` |
| Auth modal | `0 28px 72px rgba(0,0,0,.72)` |
| Dropdown | `0 12px 40px rgba(0,0,0,.65)` |

### Glass Effect
```css
background: rgba(31, 40, 59, 0.65);
backdrop-filter: blur(10px – 16px);
border: 1px solid rgba(255,255,255,.07);
```
Used for: fixed navbars, overlays, floating panels, chat input wrapper.

---

## Animations

### Easing
```css
--easing: cubic-bezier(.23, 1, .32, 1)   /* dashboard / index */
--easing: cubic-bezier(.25, 1, .35, 1)   /* chat.html — slightly springier */
```

### Keyframes
| Name | Effect | Duration |
|---|---|---|
| `fadeIn` | opacity 0→1, `translateY(10px)→0` | `0.35s – 0.4s` |
| `fadeOut` | opacity 1→0 | `0.2s ease-out` |
| `fadeInUp` | opacity 0→1, `translateY(30px)→0` | `0.6s` |
| `slideDown` | opacity 0→1, `translateY(-10px)→0` | `0.25s – 0.3s` |
| `pulse` | scale 1→1.02→1 | `2s ease-in-out infinite` |
| `typingBounce` | translateY bounce for chat dots | `1.2s infinite`, staggered |
| `tosGlow` | border/shadow pulse on regime matrix | `2.6s ease-in-out infinite` |
| `barGrow` | scaleY(0→1) for histogram bars | `0.6s` |
| `successPop` | scale 0.8→1.1→1 | `0.4s` |
| `blinkCursor` | opacity 1→0 for streaming cursor | `0.7s step-end infinite` |

### Hover Transforms
- Cards: `translateY(-5px)`
- Buttons: `translateY(-2px)` to `(-3px)`
- Icons: `scale(1.1)` or `translateY(-2px)`
- Transition speed: `0.2s – 0.4s var(--easing)`

---

## Components

### Buttons

**Base `.btn`**
```css
padding: .65rem 1.4rem;
border-radius: 3px;
font-family: var(--font-minor);
font-size: .68rem;
font-weight: 500;
letter-spacing: .1em;
text-transform: uppercase;
background: var(--w04);
border: 1px solid var(--w20);
color: var(--w45);
transition: 0.4s var(--easing);
```
Hover: `translateY(-2px)`, `var(--w08)` background, soft shadow.

**Primary `.btn-primary`**
- Background: `linear-gradient(140deg, rgba(194,165,109,.2), rgba(194,165,109,.1))`
- Border: `rgba(194,165,109,.45)` → `.7` on hover
- Color: `var(--accent-gold)`

**Icon Button `.icon-btn`**
- `36×36px`, `border-radius: 50%`
- Hover: gold border, gold icon, `translateY(-2px)`

**Rail Button `.rail-btn`** (chat.html sidebar)
- `34×34px`, no border
- Hover: `rgba(255,255,255,0.06)` background, `border-radius: 6px`

### Cards

**`.analysis-card` / `.glass-panel`**
```css
background: linear-gradient(160deg, rgba(30,40,60,.97), rgba(22,32,50,.93));
border: 1px solid var(--border-subtle);
border-radius: 3px;
```
Hover `::before`: gold gradient top border, opacity 0→1.

**`.kpi-card`**
- `padding: 16px 18px`
- Value: `JetBrains Mono`, `1.75rem`, gold
- Label: `0.62rem`, uppercase, `letter-spacing: 0.14em`

### Navigation

**Tab Nav (dashboard.html)**
```css
background: rgba(255,255,255,0.03);
border-radius: 50px;
padding: 5px;
```
Active item: gold background, dark text, `box-shadow: 0 4px 14px rgba(194,165,109,0.28)`.

**Rail Nav (chat.html)**
- Fixed left panel `54px` wide
- Rail buttons: `34px` square, rounded hover state
- Collapses/expands with `0.22s` width transition

### Tables
- `th`: `var(--tertiary-bg)` bg, gold text, `0.62rem`, uppercase, sticky
- Row hover: `rgba(194,165,109,0.15)` or `var(--tertiary-bg)`
- Active/pending row: `border-left: 3px solid var(--accent-gold)`

### Modals & Auth
- Overlay: `position:fixed; inset:0; background: rgba(8,10,18,0.8); backdrop-filter: blur(12px)`
- Modal: `width: 420px`, `background: #192030`, border: `1px solid rgba(194,165,109,0.18)`, `border-radius: 3px`
- Input focus: `border-color: rgba(194,165,109,0.45)`, `background: rgba(255,255,255,0.05)`

### Scrollbars
```css
::-webkit-scrollbar-track { background: var(--primary-bg); }
::-webkit-scrollbar-thumb { background: var(--accent-gold-dim); border-radius: 4px; }
::-webkit-scrollbar-thumb:hover { background: var(--accent-gold); }
```

---

## Chat UI

Applies to: `chat.html` (standalone app) and the Insights tab chat in `dashboard.html`.

### Layout
```
┌──────────────────────────────────────────────┐
│  Fixed top bar (56px)                        │
├─────────┬────────────────────────┬───────────┤
│  Rail   │   .chat-main (flex:1) │  Canvas   │
│  54px   │                       │  Panel    │
│  +body  │  .chat-messages       │  300px    │
│  210px  │  .chat-input-area     │           │
└─────────┴────────────────────────┴───────────┘
```
- App layer: `position: fixed; display: flex; inset: 0`
- Sidebar (`.left-panel`): collapsible, `overflow: hidden; transition: width 0.22s`
- Canvas panel: `300px`, collapses on mobile (slides from right)

### Chat Messages
```css
.chat-messages {
  flex: 1;
  overflow-y: auto;
  gap: 1.75rem;
  padding: 2rem max(1.5rem, calc(50% - 620px));
  scroll-behavior: smooth;
}
```

### Chat Bubbles

**Assistant** (left-aligned, full width)
```css
border-left: 2px solid var(--accent-gold-dim);
padding-left: 1.35rem;
background: transparent;
```

**User** (right-aligned, max 65% width)
```css
background: rgba(194,165,109,0.07);
border: 1px solid rgba(194,165,109,0.18);
border-radius: 4px;
padding: 0.75rem 1.1rem;
```
- `strong` in any bubble: `color: var(--accent-gold); font-weight: 600`
- `em` in any bubble: `color: var(--accent-gold); font-style: italic`

### Chat Input
```css
.chat-input-wrapper {
  border-radius: 999px;
  background: rgba(18, 25, 42, 0.7);
  box-shadow: 0 2px 10px rgba(0,0,0,0.3);
}
/* Focus */
.chat-input-wrapper:focus-within {
  box-shadow: 0 0 0 1.5px rgba(194,165,109,0.28), 0 4px 16px rgba(0,0,0,0.35);
}
```
- `font-size: 0.92rem`, `max-height: 140px`, auto-resizing textarea

### Send Button
- `38×38px`, `border-radius: 50%`
- `background: rgba(18,25,42,0.55)`, `color: var(--accent-gold)`
- Hover: `0 0 0 1.5px rgba(194,165,109,0.3)` ring

### Typing Indicator
- Three dots, `1.2s` bounce animation with `0s / 0.2s / 0.4s` stagger delays

### Welcome State
- Centered icon with `gentlePulse` animation (`3s ease-in-out infinite`)
- Prompt pills: `border-radius: 999px`, gold border, hover background fill

---

## Responsive Breakpoints

| Breakpoint | Key changes |
|---|---|
| `≤ 1200px` | Two-column grids collapse to single column |
| `≤ 900px` | Main mobile threshold — all grids → `1fr`, globe shrinks, canvas panel hides |
| `≤ 768px` | Header becomes 2-row; `padding-top: 125px`; KPI strip → 2 cols |
| `≤ 480px` | Nav items icon-only; `padding-top: 115px`; all stats → 1 col; iOS safe-area padding on chat input |

---

## Page-Specific Notes

### index.html
- Hero: 50% text / 50% Three.js WebGL globe
- Fonts: `Playfair Display` headings, `EB Garamond` body (unique to this page)
- Scroll reveal via `IntersectionObserver` → `.fade-up.visible`
- Client logos: `filter: grayscale(100%)` → removed on hover
- Team carousel: horizontal `scroll-snap-type: x mandatory`

### dashboard.html
- 6-tab layout; tabs switch with `fadeIn / fadeOut` (0.4s / 0.2s)
- Tab lock overlay: `position:fixed; z-index:999` (never raise above 999 — fixed header is 1000)
- Insights tab: outer div is scrollable (`overflow-y: auto`); `.insights-chat-section` holds full-height chat; briefs section below
- Country search dropdown `#search-results` is a `<body>` direct child (intentional — avoids transform clipping)
- Chart registry `_chartInstances` destroyed and rebuilt on tab switch

### chat.html
- Full-viewport app layout (no page scroll)
- Left panel: rail (54px) + collapsible body (210px)
- Right canvas panel: 300px research sidebar, mobile-slides from right
- Chat bubble design: asymmetric — assistant uses left gold border; user uses gold-tinted bubble

### admin.html
- Light/beige theme — the only page with inverted palette
- Stats row: 4 cols → 2 cols mobile
- Inline `<select>` dropdowns in user table for role / level editing
- Toast notifications for save feedback; confirm dialogs for destructive actions
