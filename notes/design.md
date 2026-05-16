# GSU Design System

Design reference extracted from `index.html`, `dashboard.html`, and `admin.html`.

---

## Color Palette

### Base Colors
| Token | Value | Usage |
|---|---|---|
| `--primary-bg` | `#192030` | Page background |
| `--secondary-bg` | `#1f283b` | Card/panel backgrounds |
| `--tertiary-bg` | `#232d44` | Nested panels, table headers |
| `--accent-gold` | `#cba84e` (index) / `#C2A56D` (dashboard, admin) | Primary accent |

### Text
| Context | Value |
|---|---|
| Index page | `#ffffff` |
| Dashboard / Admin | `#eeeae0` |
| Muted (dark theme) | `rgba(238,234,224,.70)` |
| Muted (light theme) | `rgba(26,31,46,.55)` |
| Faint | `rgba(26,31,46,.35)` |

### Semantic / Data Colors
| Name | Hex | Meaning |
|---|---|---|
| Green | `#5d8a72` | Positive, excellent, strength |
| Lime | `#7a8e62` | Good, above average |
| Amber | `#c4a060` | Caution, moderate |
| Orange | `#a87a5e` | Weak, concerning |
| Red | `#966060` | Critical, poor, danger |
| Blue | `#607c98` | Stable, informational |

### Tier Mapping
| Tier | Color |
|---|---|
| Excellent | `--accent-green` `#5d8a72` |
| Good | `--accent-lime` `#7a8e62` |
| Moderate | `--accent-amber` `#c4a060` |
| Concerning | `--accent-orange` `#a87a5e` |
| Critical | `--accent-red` `#966060` |

### Admin Light Theme
The admin panel uses an inverted light palette:
- Background: `#f5f1ea` (warm beige)
- Text: `#1a1f2e` (dark navy)
- Accent: `#C2A56D`
- Role colors — Director: `#7a5a28`, Employee: `#4a6a88`, Free: `#4a7a5e`

---

## Typography

### Font Stack
| Role | Family | Usage |
|---|---|---|
| Heading serif | `Playfair Display` | `index.html` headings |
| Heading serif | `Copernicus` → `EB Garamond` | Dashboard / admin headings |
| Body serif | `EB Garamond` | `index.html` body |
| Body sans | `StyreneB` → `EB Garamond` | Dashboard / admin body |
| UI / labels | `Montserrat` | Small caps, filters, nav |
| Monospace | `JetBrains Mono` | Data values, code |

### Size Scale
| Element | Size |
|---|---|
| h1 | `3.8rem` → `3rem` mobile |
| h2 | `2.5rem` |
| h3 | `1.5rem` (index) / `1.05rem` (admin) |
| h4 / eyebrow | `0.62rem – 0.75rem` uppercase |
| Body | `1.15rem` (index) / `0.95rem – 1rem` (dashboard, admin) |
| Labels | `0.62rem – 0.7rem` uppercase |

### Weight & Spacing
- Regular: `400`, Medium: `500–600`, Bold: `700`
- h1 letter-spacing: `-0.01em`
- Uppercase labels: `0.1em – 0.28em`

---

## Spacing & Layout

### Container
- Max-width: `1280px`
- Side padding: `2rem` (index) / `2.5rem` (admin)
- Header offset: `90px` (dashboard) / `62px` (admin)

### Section Padding
- Marketing sections: `7rem` vertical
- Dashboard panels: `1.75rem 2rem`

### Grid Classes
| Class | Columns | Gap |
|---|---|---|
| `.grid-2` | `1fr 1fr` | `5rem` |
| `.grid-3` | `repeat(3, 1fr)` | `2rem` |
| `.grid-4` | `repeat(4, 1fr)` | `2rem` |
| `.kpi-grid` | `repeat(auto-fit, minmax(170px, 1fr))` | — |
| `.bento-grid` | `repeat(3, 1fr)` | `12px` |
| `.stats-row` | `repeat(4, 1fr)` → `repeat(2, 1fr)` mobile | `1rem` |

---

## Borders

### Subtle (default)
```
1px solid rgba(255,255,255,.05 – .07)
```

### Gold-accented (hover / active)
```
1px solid rgba(194,165,109,0.3 – 0.45)
```

### Gradient dividers
```
1px solid linear-gradient(90deg, transparent 0%, rgba(...) 30%, rgba(...) 70%, transparent 100%)
```

Border-radius is consistently `3px` on cards, inputs, and modals across dashboard and admin.

---

## Shadows

| Level | Value |
|---|---|
| Subtle | `0 1px 4px rgba(0,0,0,.07), 0 0 0 1px rgba(0,0,0,.04)` |
| Medium | `0 4px 16px rgba(0,0,0,.09)` |
| Card | `0 2px 14px rgba(0,0,0,.22), 0 1px 0 rgba(255,255,255,.04) inset` |
| Card hover | `0 6px 24px rgba(0,0,0,.3), 0 0 16px rgba(194,165,109,.04), 0 1px 0 rgba(255,255,255,.05) inset` |
| Large | `0 12px 40px rgba(0,0,0,.14)` |

---

## Glass / Backdrop Effect

```css
background: rgba(31, 40, 59, 0.65);
backdrop-filter: blur(10px – 16px);
border: 1px solid rgba(255, 255, 255, 0.07);
```

Used for fixed navbars, overlays, and floating panels.

---

## Animations

### Easing
All transitions use a single shared easing curve:
```css
--easing: cubic-bezier(0.23, 1, 0.32, 1)
```

### Keyframes
| Name | Effect | Duration |
|---|---|---|
| `fadeIn` | opacity 0→1 | `0.4s` |
| `fadeOut` | opacity 1→0 | `0.2s ease-out` |
| `fadeInUp` | opacity 0→1 + translateY(30px→0) | `0.6s` |
| `slideIn` | opacity 0→1 + translateY(8px→0) | `0.25s` |
| `slideDown` | opacity 0→1 + translateY(-10px→0) | `0.3s` |
| `pulse` | scale(1→1.02→1) | `2s ease-in-out infinite` |
| `successPop` | scale(0.8→1.1→1) + opacity | `0.4s` |
| `barGrow` | scaleY(0→1) from bottom | `0.6s` |
| `tosGlow` | border/shadow pulse | `2.6s ease-in-out infinite` |
| `expandDetail` | opacity 0→1 + translateY(-20px→0) | `0.4s` |

### Transition Speeds
- Instant/fast: `0.15s – 0.2s ease`
- Standard: `0.3s – 0.4s var(--easing)`
- Slow/reveal: `0.6s – 0.8s var(--easing)`

### Hover Transforms
- Cards: `translateY(-5px)`
- Buttons: `translateY(-2px)`
- Icons: `scale(1.1)`

---

## Components

### Button (`.btn`)
```
display: inline-flex
padding: 1rem 2.5rem
border: 1px solid rgba(255,255,255,0.3)
background: transparent
text-transform: uppercase
font-size: 0.85rem
letter-spacing: 0.15em
transition: 0.4s var(--easing)
```
Hover: gold border, `rgba(203,168,78,0.1)` fill, `translateY(-2px)`.  
Primary variant: gold background, dark text.

### Card (`.service-card`, `.team-card`)
```
padding: 2.5rem
background: rgba(255,255,255,0.02)
border: 1px solid rgba(255,255,255,0.05)
border-radius: 3px
```
Hover: `translateY(-5px)`, gold border.  
Team card: `border-top: 3px solid var(--accent-gold); width: 320px`.

### KPI Card (`.kpi-card`)
```
padding: 16px 18px
background: var(--card-bg)
border: 1px solid var(--border-subtle)
```
Value: `JetBrains Mono, 1.75rem, accent-gold`.  
Label: `0.62rem, uppercase, letter-spacing: 0.14em`.

### Navigation (`.nav-menu`)
```
background: rgba(255,255,255,0.03)
padding: 5px
border-radius: 50px
```
Item: `padding: 10px 20px; border-radius: 40px`.  
Active: `background: var(--accent-gold); color: var(--primary-bg); box-shadow: 0 4px 14px rgba(194,165,109,0.28)`.

### Table
- Header: `--tertiary-bg` background, `0.6rem – 0.7rem` uppercase, `letter-spacing: 0.16em – 0.18em`
- Row padding: `0.85rem 1rem` (dashboard) / `0.65rem 1rem` (admin)
- Row hover: `background: var(--tertiary-bg)`
- Pending rows: `border-left: 3px solid var(--accent-gold)`

### Modal / Dialog
```
background: var(--bg-card)
border: 1px solid var(--border)
border-radius: 2px – 4px
padding: 2.5rem – 3rem
```
Overlay: `position:fixed; inset:0; background: rgba(10,14,24,0.85)`.

### Badge / Role Label
```
padding: 0.18rem 0.55rem
border-radius: 2px
font-size: 0.57rem
text-transform: uppercase
letter-spacing: 0.1em
```

### Icon Button
```
width: 36px – 40px
height: 36px – 40px
border-radius: 50%
border: 1px solid var(--border-subtle)
background: var(--w04)
```
Hover: gold border, gold icon color, soft gold background gradient.

### Avatar / Initials
```
size: 32px – 36px circle
background: linear-gradient(135deg, #c2a56d, #7a6030)
font-size: 0.58rem – 0.6rem uppercase
border: 1.5px solid rgba(194,165,109,0.5)
```

### Eyebrow / Section Label
```
font-size: 0.62rem
letter-spacing: 0.26em
text-transform: uppercase
color: var(--accent-gold)
font-weight: 600
```

### h2 Underline Accent
```css
h2::after {
  content: '';
  background: var(--accent-gold);
  width: 40px;
  height: 1px;
  transition: width 0.6s var(--easing);
}
h2:hover::after { width: 100%; }
```

---

## Responsive Breakpoints

| Breakpoint | Behavior |
|---|---|
| `max-width: 900px` | Main mobile threshold — grids collapse to `1fr`, hero stacks, nav links hidden |
| `max-width: 600px` | Tablet — further padding reduction, 2-column stats, hidden table columns |

---

## State Classes

| Class | Meaning |
|---|---|
| `.visible` | `opacity: 1; transform: translateY(0)` — scroll-reveal complete |
| `.active` | Gold color, enhanced border and shadow |
| `.pending` | Gold `border-left: 3px` — awaiting action |
| `.expanded` | `max-height` open, chevron rotated |
| `.kb-active` | `outline: 1px solid gold` — keyboard navigation focus |

---

## Page-Specific Notes

### index.html — Marketing Site
- Hero: 50% text / 50% Three.js WebGL globe
- Alternating section backgrounds on odd/even sections
- Service cards in `.grid-3`
- Team carousel: horizontal scroll-snap, prev/next controls
- Fade-up scroll reveal via `IntersectionObserver`
- Client logos: grayscale filter removed on hover

### dashboard.html — Analytics Dashboard
- Fixed header; content offset by `90px`
- Tab-based content switching with `fadeIn` / `fadeOut`
- KPI strip → bento grid → regional map → anomaly alerts
- Country deep-dive: radar, timeseries, TDM waterfall, peer comparison
- 22×22 correlation heatmap
- Chart instances managed in a registry (`_chartInstances`); rebuilt on tab switch

### admin.html — User Management
- Light theme (inverted from dark site palette)
- Gate overlay until authenticated
- Stats row (4 → 2 columns on mobile)
- User table with inline `<select>` for role / level editing
- Confirm dialogs for destructive actions
- Toast notifications for success / error
- Saving spinner indicator
- Read-only mode enforced for non-director users
