// End-to-end checks for rao.html (formerly observatory.html). Run with
// `npm test` from testing/ while the site is served locally (see README.md).
const { test, expect } = require('@playwright/test');
const { login } = require('../lib/auth');

const PAGE_PATH = 'rao.html';

const TABS = [
  { label: 'Overview', id: 'tab-overview' },
  { label: 'Analysis', id: 'tab-analysis' },
  { label: 'Compare', id: 'tab-compare' },
  { label: 'Rankings', id: 'tab-rankings' },
  { label: 'Analytics', id: 'tab-analytics' },
  { label: 'Pulse', id: 'tab-pulse' },
  { label: 'Insights', id: 'tab-insights' },
];

// Known pre-existing noise, unrelated to the rao9→rao_csv / observatory→rao
// rename, that isn't an application bug:
// - "Failed to load resource" for the licensed Copernicus/StyreneB fonts,
//   which aren't shipped in this repo (see CLAUDE.md's Typography section).
// - The Google Maps Geocoding Service warning about a missing API key.
const IGNORED_CONSOLE_PATTERNS = [
  /^Failed to load resource/,
  /Geocoding Service: You must use an API key/,
];
function trackConsoleErrors(page) {
  const errors = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error' && !IGNORED_CONSOLE_PATTERNS.some((re) => re.test(msg.text()))) errors.push(msg.text());
  });
  page.on('pageerror', (err) => errors.push(err.message));
  return errors;
}

test.describe('rao.html — unauthenticated', () => {
  test('shows the auth gate, not the dashboard', async ({ page, baseURL }) => {
    const errors = trackConsoleErrors(page);
    await page.goto(`${baseURL}/${PAGE_PATH}`, { waitUntil: 'load' });

    const gate = page.locator('#app-gate');
    await expect(gate).toBeVisible();
    await expect(gate).not.toHaveClass(/gate-hidden/);
    await expect(page.locator('#login-email')).toBeVisible();

    expect(errors, `console errors on unauthenticated load:\n${errors.join('\n')}`).toEqual([]);
  });
});

test.describe('rao.html — authenticated', () => {
  test.beforeEach(async ({ page, baseURL }) => {
    await login(page, {
      baseUrl: baseURL,
      pagePath: PAGE_PATH,
      email: process.env.TEST_ACCOUNT_EMAIL,
      password: process.env.TEST_ACCOUNT_PASSWORD,
    });
  });

  test('reaches the dashboard after sign-in', async ({ page }) => {
    await expect(page.locator('#app-gate')).toHaveClass(/gate-hidden/);
  });

  for (const tab of TABS) {
    test(`"${tab.label}" tab renders without console errors`, async ({ page }) => {
      const errors = trackConsoleErrors(page);
      await page.locator(`.nav-item[aria-label="${tab.label}"]`).click();
      await expect(page.locator(`#${tab.id}`)).toHaveClass(/active/);
      await page.waitForTimeout(500); // let async tab-render settle before checking errors
      expect(errors, `console errors on ${tab.label} tab:\n${errors.join('\n')}`).toEqual([]);
    });
  }

  test('country search dropdown opens with results', async ({ page }) => {
    // rao.html's search (unlike the retired dashboard.html's — see CLAUDE.md
    // gotcha #11) keeps #search-results nested in .search-box using plain
    // position:absolute, not a body-portaled position:fixed, so it isn't
    // subject to the old containing-block clipping bug. rawData is populated
    // lazily, so visit Rankings first.
    await page.locator('.nav-item[aria-label="Rankings"]').click();
    await expect(page.locator('.rankings-table tbody tr').first()).toBeVisible({ timeout: 20000 });
    await page.locator('.nav-item[aria-label="Analysis"]').click();
    await expect(page.locator('#tab-analysis')).toHaveClass(/active/);
    await page.click('#global-search');
    await page.type('#global-search', 'india', { delay: 30 });
    await expect(page.locator('#search-results')).toBeVisible();
    expect(await page.locator('#search-results .search-result-item').count()).toBeGreaterThan(0);
  });

  test('.tab-lock stays below the fixed header\'s z-index (CLAUDE.md gotcha #12)', async ({ page }) => {
    const lock = page.locator('.tab-lock').first();
    if (await lock.count() === 0) test.skip(true, 'no tab-lock panel present for this account tier');
    const z = await lock.evaluate((el) => parseInt(getComputedStyle(el).zIndex, 10));
    expect(z).toBeLessThan(1000);
  });

  test('RAO panel dataset loads after the rao9→rao_csv rename (no Firebase fetch error)', async ({ page }) => {
    await page.locator('.nav-item[aria-label="Rankings"]').click();
    await expect(page.locator('#tab-rankings')).toHaveClass(/active/);
    // Rankings lists every country once panelData has loaded from
    // protected-data/rao_csv — a non-empty table is a direct sign the
    // renamed Firebase fetch actually resolved.
    await expect(page.locator('.rankings-table tbody tr').first()).toBeVisible({ timeout: 20000 });
    expect(await page.locator('.rankings-table tbody tr').count()).toBeGreaterThan(10);
  });
});

test.describe('rao.html — mobile', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('signs in and renders the Overview tab without console errors at 390px', async ({ page, baseURL }) => {
    const errors = trackConsoleErrors(page);
    await login(page, {
      baseUrl: baseURL,
      pagePath: PAGE_PATH,
      email: process.env.TEST_ACCOUNT_EMAIL,
      password: process.env.TEST_ACCOUNT_PASSWORD,
    });
    await expect(page.locator('#tab-overview')).toHaveClass(/active/);
    expect(errors, `console errors on mobile load:\n${errors.join('\n')}`).toEqual([]);
  });
});
