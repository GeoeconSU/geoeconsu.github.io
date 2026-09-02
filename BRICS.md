# BRICS Conference — QR-Triggered Temporary Dashboard Access

## Context

GSU is exhibiting at a BRICS conference and wants printed QR codes / links on mementos that let attendees register (name, email, designation, organization) via a dedicated registration page, and get **temporary access to the RAO dashboard, scoped to BRICS + partner countries, for ~2 weeks**. The goals are (1) showcase the quality of GSU's work to a high-value audience with a demo tailored to the region they actually care about, and (2) capture the registrants' designation/organization as valuable leads permanently, since these are likely senior/important contacts — the lead value only grows after the event, once access has lapsed.

## Design decisions (reasoned through with the user)

- **Access mechanism: `plan: 'personal'` + a fixed `allowedCountries` list, not `enterprise`.** In `firebase-config.js`, access is driven purely by `plan` + `allowedCountries` ([firebase-config.js:105-125](firebase-config.js#L105-L125)). Since access should be scoped to a *fixed* country set (BRICS + partners) rather than "everything," this reuses the existing `'personal'`-plan mechanism real paying customers already use — no enterprise grant needed.
- **Dedicated registration page, not the existing dashboard modal.** A standalone page (e.g. `brics2026.html` at the repo root, following the same self-contained pattern as `contact.html`) with its own branded copy and a form for Name, Email, Organization, Designation, plus Google-first / email-password sign-in. On success it redirects into `dashboard.html`, already signed in.
- **Single `users/{uid}` collection — no separate table.** The entire access-control pipeline (`effectivePlan()`/`canSeeCountry()` in firebase-config.js, every rule in firestore.rules) only ever reads `users/{uid}`. A second collection would mean either duplicating that pipeline everywhere it's used, or a dual-write at signup with a real consistency risk (one write succeeds, the other fails). admin.html already loads the **entire** `users` collection into memory via one listener ([admin.html:1288](admin.html#L1288)) — every view described below is just a filter over that same array, at zero extra read cost.
- **Discriminator field: `role: 'BRICS2026'`, kept permanently — never reverts to `'free'`.** This is the fix for the tension the user identified themselves: if `role` (or any marker) reverted to `'free'` once access lapsed, the lead would vanish from view right when it's most useful (post-event follow-up). Instead, only the *access* fields (`plan`, `allowedCountries`) lapse to free-tier-equivalent after 14 days — automatically, via a client-side expiry check, no write-back needed. `role` stays `'BRICS2026'` forever, so the record is always findable.
- **BRICS registrants are excluded from admin.html's existing Users tab, and shown only in a new, read-only "Custom" tab.** This was flagged as worth evaluating, and it holds up well:
  - It fully avoids a real rendering bug that would otherwise occur: `buildRoleOptions()` ([admin.html:1158-1174](admin.html#L1158-L1174)) only builds `<select>` options from the fixed `ROLE_LEVEL_MAP`/`ALL_ROLES` registry, which has no entry for a custom role — a `role:'BRICS2026'` row rendered *in the Users tab* would show "Free" in its role dropdown, misrepresenting the real value. Excluding these users from that tab entirely means that code path never sees them, so the bug can't occur — no registry changes needed anywhere.
  - Better still, "custom/campaign user" doesn't need its own registry either: since `ROLE_LEVEL_MAP` ([admin.html:1096-1110](admin.html#L1096-L1110)) is already the closed list of real org roles, the generic test **level 5 + role set + role not in `ROLE_LEVEL_MAP`** identifies a campaign user with zero maintenance — any future event's role value is automatically covered, with no per-event registration step.
  - Tradeoff, stated plainly: a read-only tab means no in-UI way to immediately revoke one specific registrant's access before their 14 days are up — a director would need the Firebase console directly for that. Given the access is temporary, region-scoped, and not sensitive, and `config/brics_event.active:false` still instantly stops *new* signups, this is an acceptable tradeoff for v1.
- **The BRICS+partner country list and "is this campaign live" flag live in Firestore, not hardcoded in code or rules.** BRICS partner-country status is fluid. The existing `config/{docId}` collection ([firestore.rules:121-125](firestore.rules#L121-L125) — readable by any registered user, writable by directors/founders) is the fit: a single `config/brics_event` doc is the source of truth for the country list, role tag, expiry window, and an `active` on/off switch, editable by a director without any redeploy.

Decisions already made with the user: Google-sign-in-first with email fallback; **14-day** access window; **one shared QR/link for launch**, with the URL scheme designed so per-momento tracked links (`&src=pen`, `&src=notebook`, …) can be added later at zero extra engineering cost.

## Approach

### 0. `config/brics_event` — the one Firestore doc that drives everything
A director/founder creates this once (Firebase console):
```
{
  role: 'BRICS2026',
  active: true,
  expiresInDays: 14,
  allowedCountries: [
    // BRICS members
    'BRA','CHN','EGY','ETH','IND','IDN','IRN','RUS','SAU','ZAF','ARE',
    // Partner countries
    'BLR','BOL','CUB','KAZ','MYS','NGA','THA','UGA','UZB','VNM'
  ]
}
```
Both the client (to know what to grant) and the Firestore rule (to validate what's being requested) read this same doc. Confirmed against `data/rao9.csv`: 20 of these 21 countries have full panel coverage (16 years each); **Cuba (`CUB`) has zero rows in the dataset** — included anyway per the founder's call, since it's still a genuine BRICS partner and the alternative (excluding a VIP guest's own country) was judged worse than a registrant seeing an empty view for that one market.

### 1. `brics2026.html` — new, dedicated registration page
- Self-contained page (loads the Firebase compat SDK + `firebase-config.js` directly, like `contact.html` does), branded for the event, with a short pitch blurb about GSU + the RAO dashboard.
- Form fields: Name, Email, Organization, Designation, Password (email path) — plus a prominent "Continue with Google" button.
- On submit, stashes `{ role: 'BRICS2026', organization, designation, src }` via an extended version of the existing stash/read pattern (`stashPlanIntent`/`readPlanIntent`, [firebase-config.js:130-154](firebase-config.js#L130-L154)) before calling `signUpWithEmail`/`signInWithGoogle` — this is the existing mechanism built for exactly this "capture extra info before the Firebase Auth popup, apply it once the doc is created" problem.
- Email/password registrants see the existing "check your inbox" verification step (unverified email/password users are treated as unauthenticated per [firebase-config.js:207-212](firebase-config.js#L207-L212) — an existing, unrelated constraint, unchanged here). Google sign-ins are considered pre-verified and go straight through — this is why Google-first was chosen: most booth registrants get instant access.
- On successful, verified sign-in, redirect to `dashboard.html`.
- The printed QR/link becomes `https://geoecon.solutions/brics2026.html` (future per-momento variant, same mechanism, zero rework: `...?src=pen`).

### 2. `firebase-config.js` — intent shape, doc creation, expiry
- Extend the stash/read pair ([firebase-config.js:130-154](firebase-config.js#L130-L154)) to also carry `organization`, `designation`, `role`, `src` (additive — existing plan/countries intent still works unchanged).
- In the doc-creation block inside `auth.onAuthStateChanged` ([firebase-config.js:217-236](firebase-config.js#L217-L236)): branch on `intent.role` being set. If present, read `config/brics_event`, and write directly (no pending-approval step):
  ```
  role: 'BRICS2026', level: 5,
  plan: 'personal',
  allowedCountries: <config.allowedCountries>,
  countryQuota: <config.allowedCountries.length>,
  planExpiresAt: <server time + config.expiresInDays>,
  organization, designation, signupSource: src || null,
  requestedPlan: null, planStatus: 'none'
  ```
  Otherwise, existing default (`role:'free'`) behavior for normal signups and pending Personal/Enterprise purchase inquiries is untouched.
- Extend `_applyUserDoc` ([firebase-config.js:179-187](firebase-config.js#L179-L187)) to also read `organization`, `designation`, `planExpiresAt` into new state vars.
- Extend `effectivePlan()` ([firebase-config.js:105-109](firebase-config.js#L105-L109)): if `planExpiresAt` is set on the doc **and** `Date.now()` is past it, return `'free'` regardless of the stored `plan` value. Everything downstream (`canSeeCountry`, `planAtLeast`, every existing gate call site) inherits correct expiry behavior with this one change. `role` is untouched by this check — it stays `'BRICS2026'` forever, only the effective plan lapses.

### 3. `firestore.rules` — narrow, config-driven create rule
Add one new `allow create` clause under `match /users/{userId}` (alongside the existing free-tier self-registration rule at [firestore.rules:62-68](firestore.rules#L62-L68)), plus a small helper that reads the config doc the same way `callerLevel()` already reads the caller's own doc ([firestore.rules:13-17](firestore.rules#L13-L17)):
- Requires `bricsConfig().active == true`, submitted `role == bricsConfig().role`, `level >= 5`, `plan == 'personal'`.
- Requires the submitted `allowedCountries` to exactly equal `bricsConfig().allowedCountries` (the client cannot request a broader list) and `countryQuota` to match its length.
- Caps `planExpiresAt` to at most `bricsConfig().expiresInDays` from `request.time`.
- Existing self-update rule ([firestore.rules:43-52](firestore.rules#L43-L52)) stays untouched — `plan`/`allowedCountries`/`level`/`role` remain immutable after creation, so nobody (including the registrant) can extend their own access or change their own role later. Combined with the `active` flag, this is what makes the grant tamper-proof, permanent-lead-record-preserving, and instantly killable for new signups without any cleanup job or rules redeploy.
- **Operational note**: `firestore.rules` deploys separately from the GitHub Pages push (via Firebase CLI/console, e.g. `firebase deploy --only firestore:rules`) — it is not picked up by `git push origin main`.

### 4. `admin.html` — Users tab exclusion + new read-only "Custom" tab
- Define one small generic test, e.g. `isCampaignUser(u) => (u.level||5)===5 && u.role && u.role!=='free' && !(u.role in ROLE_LEVEL_MAP)` — reusing the existing `ROLE_LEVEL_MAP` ([admin.html:1096-1110](admin.html#L1096-L1110)) as the implicit "known org roles" whitelist. No new registry, no per-event maintenance.
- Users tab's data source excludes `isCampaignUser(u)` rows — the existing tab, its role dropdown, its KPI stat cards (Leadership/Team/Free at [admin.html:1311-1322](admin.html#L1311-L1322)) all stay exactly as they are today, just computed over the non-campaign subset.
- New **Custom** tab, positioned between Users and Plans in the existing tab bar (`switchConsoleTab()`), filtered to `isCampaignUser(u)`:
  - Plain, read-only table — no edit dropdowns, no delete button, no staged-changes wiring. Columns: Name, Email, Organization, Designation, Campaign (`role`), Registered (`createdAt`), Status (Active/Expired, derived by comparing `planExpiresAt` to now), Expires.
  - Groups/sorts by `role` so multiple simultaneous future campaigns are visually separated, satisfying "future events land in the same Custom panel" without any code change per new event.
- This is the "save these details specifically" requirement fully realized: organization/designation live permanently on the user doc, are never touched by the automatic expiry, and are visible in one dedicated, uncluttered place indefinitely.

### 5. Forward-compatible tracking hook (documented, not built)
The `src` query param is already threaded through the stash → Firestore (`signupSource` field) end to end, but only one shared QR/link is being printed for this event. Note this in `notes/update.md` (or a short new note) so the per-momento idea isn't lost: printing `brics2026.html?src=pen` vs `?src=notebook` later requires zero code changes, just new QR images pointing at different URLs, and the Custom tab can add a `signupSource` column whenever that's wanted.

## Verification
1. Create the `config/brics_event` doc (Firebase console) with a test country list and `active: true`.
2. Serve locally (`python3 -m http.server 8000`), visit `http://localhost:8000/brics2026.html` — confirm the form renders, Organization/Designation are required, and both Google and email/password paths work.
3. Register a test account via email/password and separately via Google — confirm the created Firestore doc has `role:'BRICS2026'`, `plan:'personal'`, `allowedCountries` matching the config list, `planExpiresAt` ~14 days out, and populated `organization`/`designation`.
4. Confirm `canSeeCountry()` returns true only for the configured countries (locked for others) immediately after verified sign-in, and that the redirect into `dashboard.html` lands signed in.
5. In the Firebase console, hand-edit a test doc's `planExpiresAt` to a past timestamp and reload — confirm access falls back to free/no-countries, while `role` still reads `'BRICS2026'`.
6. Flip `config/brics_event.active` to `false` and confirm a *new* registration attempt is rejected by the rule (existing registrants already granted are unaffected, since rules only gate `create`).
7. Confirm the test registrant does **not** appear anywhere in admin.html's Users tab (table, search, role-filter, KPI stat cards), and **does** appear correctly in the new read-only Custom tab with the right Organization/Designation/Status/Expires values.
8. Confirm the **normal** dashboard registration flow (via `dashboard.html`'s existing modal) is completely unaffected — plan-picker still shows, pending-approval flow for Personal/Enterprise purchase inquiries still works exactly as before.
9. Deploy `firestore.rules` and confirm, via browser devtools console, that hand-crafting a `plan:'personal'` create request with a broader `allowedCountries` than the config list, or a mismatched `role`, is rejected (security regression check).

## Country list — finalized
BRICS members: Brazil (BRA), China (CHN), Egypt (EGY), Ethiopia (ETH), India (IND), Indonesia (IDN), Iran (IRN), Russia (RUS), Saudi Arabia (SAU), South Africa (ZAF), UAE (ARE).
Partner countries: Belarus (BLR), Bolivia (BOL), Cuba (CUB), Kazakhstan (KAZ), Malaysia (MYS), Nigeria (NGA), Thailand (THA), Uganda (UGA), Uzbekistan (UZB), Vietnam (VNM).
21 countries total. No open items remain before implementation.

## Later addition: limited variable preview for BRICS registrants
Beyond country scope, 12 specific normalized indicators are hidden from BRICS registrants specifically — a visual/UX limitation, not a data-security boundary (see the note under Tier 1 below on what this does and doesn't protect against).

- `dashboard.html`: `BRICS_BLURRED_VARS` (a `Set` of 12 `norm_*` field keys) and `isBlurredVar(varKey)` — defined right after `NORM_VAR_LABELS`. Returns true only when `currentUserRole === 'BRICS2026'` and the field is in the set.
- Applied in two render functions: `renderNormVarBreakdown()` (Analysis tab's Variable Breakdown by Pillar) and `renderAllVariablesComparison()` (Compare tab's All Variables Comparison). For a blurred variable, the real value/delta/bar-width is never put in the page at all — replaced with a fixed placeholder (`••••`, a neutral fixed-width bar) plus a small lock icon carrying a `title` tooltip ("Limited Preview: not included in BRICS Summit access...").
- The 12 hidden variables: Export Growth, Gross Capital Formation, Secondary Enrolment, Current Account (% GDP), Rule of Law, Control of Corruption, Resource Rents (% GDP), Vulnerable Employment, Regulatory Quality, FDI Trend, Governance Trend, Inflation Trend.

## Removal checklist — once the event + trial window (+ some buffer) is over

Not everything touched during this work is BRICS-specific — some of it fixed pre-existing, unrelated bugs found along the way. Removing the wrong tier would either leave BRICS code behind or reintroduce real bugs. Three tiers:

### Tier 1 — BRICS-specific, safe to delete entirely
- **Delete the file** `brics2026.html` (the whole registration page).
- **Firebase Console → Firestore → `config` collection**: delete the `brics_event` document (or just leave `active: false` permanently if you'd rather keep the historical record — either is safe, since nothing reads it once no code path creates new `role:'BRICS2026'` docs).
- **`firestore.rules`**: remove the `bricsConfig()` helper function, remove the second `allow create` clause under `match /users/{userId}` (the block commented "Campaign self-registration"), and revert the `config/{docId}` block's read rule back to `allow read: if isRegistered();` (drop the `docId == 'brics_event' ||` carve-out). **Redeploy rules after editing** — this file doesn't take effect until pushed via the Firebase Console or CLI, same as the initial setup.
- **`firebase-config.js`**: remove `_createCampaignUserDoc()` and `signUpForCampaign()`, and the `if (intent.role) { ... } else { ... }` branch inside `auth.onAuthStateChanged` (collapse back to just the `else` body, which is the original default-signup path).
- **`dashboard.html`**: remove `BRICS_BLURRED_VARS` and `isBlurredVar()`, and revert the blur-related branches inside `renderNormVarBreakdown()` and `renderAllVariablesComparison()` back to always showing the real value/bar/delta (i.e. drop the `blurred ? ... : ...` conditionals, keep the `: ...` side).
- **Reminder on what this did and didn't protect**: this was always a client-side/UI limitation, not a hard data boundary — the full dataset is fetched to every verified user's browser regardless of plan/role (see firebase-config.js's RTDB fetch), so a technically determined user could already read the real numbers via DevTools. Nothing here needs a "was it actually secure" audit before removal; it was cosmetic by design.

### Tier 2 — reusable infrastructure; keep only if you expect another campaign like this
This was deliberately built generic (not hardcoded to "BRICS"), specifically so a future event wouldn't need new code:
- `admin.html`: `isCampaignUser()`, the **Custom** tab (button, `#view-custom` markup, `renderCustom()`, `isCampaignExpired()`), and the campaign-exclusion filters inside `updateStats()`, `filterUsers()`, and `renderPlans()`.
- `firebase-config.js`: `currentUserOrganization`/`currentUserDesignation`/`currentPlanExpiresAt` state, the `effectivePlan()` expiry check, and the extended `stashPlanIntent(email, plan, countries, extra)` signature.
- If no other campaign is planned, these can be removed too, following the same "does anything still reference it" check as Tier 1. If you do plan another one, keep this tier — a future event would only need a new registration page plus a new `config/{docId}` doc and a matching `firestore.rules` create clause (`_createCampaignUserDoc()` in firebase-config.js currently hardcodes the `'brics_event'` doc path — that line would need generalizing, e.g. keyed off `intent.role`, to serve more than one campaign at a time).

### Tier 3 — do NOT remove; unrelated bug fixes made in the same period
Found and fixed while working on BRICS-related mobile testing, but these are genuine pre-existing bugs, not BRICS code:
- `dashboard.html` mobile chart-sizing fixes: the `aspectRatio:1`/wrapper-height exclusions for `#country-pillar-radar`, `#country-rao-timeseries`, `#compare-radar-chart`, `#compare-pillar-bars`, `#compare-timeseries-chart`; the `.peer-row-grid` class and its CSS exclusion from the blanket mobile grid-collapse rule; the `#peer-comparison-content` horizontal-scroll fix; the `compare-pillar-bars` tick `maxRotation`/`autoSkip` fix; and the `.variable-row.header` visibility/sticky-header fix in the Compare tab's All Variables table.
- `CLAUDE.md`'s corrected documentation of `rao9.csv` (it was already wrong before any BRICS work started — it lives in Firebase Realtime Database, not as a repo file).
