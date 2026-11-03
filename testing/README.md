# Playwright testing tools

Browser-automation tooling for visually auditing `rao.html` (formerly `observatory.html`;
the retired `dashboard.html` now lives at `archive/dashboard.html`) and its
`observatory_dev.html` dev sandbox (mobile responsiveness, touch targets, console
errors). Not part of the deployed
site — GitHub Pages ignores this directory entirely since nothing links to it.

## Setup

```bash
cd testing
npm install
npm run install-browser     # downloads a Chromium binary (~200MB, one-time)
cp .env.example .env        # then fill in .env — see "Test account" below
```

Start the site locally first, from the repo root:

```bash
python -m http.server 8000
```

Then run an audit:

```bash
npm run audit:mobile
```

Screenshots and a `report.json` land in `testing/screenshots/` (gitignored — see
"Why screenshots aren't committed" below).

## Running the test suite

`tests/rao.spec.js` is a `@playwright/test` suite (separate from the ad-hoc
audit scripts above) covering the unauthenticated gate, authenticated sign-in,
each nav tab rendering without console errors, the `#search-results` portal
gotcha, `.tab-lock` z-index, the renamed `rao_csv` dataset actually loading,
and a mobile-viewport smoke check. With the site already running locally and
`.env` filled in:

```bash
npm test
```

No CI wiring or `webServer` auto-start — start `python -m http.server 8000`
yourself first, same as for the audits above.

## Test account

Use a **dedicated, low-privilege `gsu-members` account created specifically for
this** — not a teammate's real account, and not a director/founder-level one.
It must be email-verified (Firebase Console → Authentication) or the app will
treat it as signed out. Put its credentials in `testing/.env` (gitignored,
never committed) as `TEST_ACCOUNT_EMAIL` / `TEST_ACCOUNT_PASSWORD`.

Share the actual credential value with teammates out-of-band (not in a commit
message, a PR description, or Slack with link previews on) — treat it the same
as any other password, even though its blast radius is intentionally small.

## Why screenshots aren't committed

Anything captured after sign-in can show real RAO panel data rendered in the
UI — the same proprietary dataset `rao.csv` is deliberately kept out of this
repo for (see root `CLAUDE.md`'s Data Files section). A screenshot is just
another way that same data could leak into a public repo. `testing/.gitignore`
excludes `screenshots/`, `test-results/`, and `playwright-report/` for this
reason — if you add a new audit script, keep its output under one of those
paths (or extend the ignore list) rather than writing anywhere else.

## Adding a new audit

Put it in `audits/`, following `mobile-audit.js`'s shape: `require('../lib/auth')`
for sign-in, read config from `process.env` (with `require('dotenv').config()`
at the top), write output under `screenshots/`. Add an npm script for it in
`package.json` so it's discoverable.
