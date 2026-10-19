# Playwright testing tools

Browser-automation tooling for visually auditing `dashboard.html` / `observatory.html`
(mobile responsiveness, touch targets, console errors). Not part of the deployed
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

Anything captured after sign-in can show real RAO9 panel data rendered in the
UI — the same proprietary dataset `rao9.csv` is deliberately kept out of this
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
