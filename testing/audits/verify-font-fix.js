// One-off verification for the mobile font-size pass: screenshots the
// Analysis tab (Take-off Detection Module) plus Overview/Rankings, and
// checks for new horizontal overflow the font bumps might have introduced.
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { chromium, devices } = require('playwright');
const { login } = require('../lib/auth');

const BASE_URL = process.env.BASE_URL || 'http://localhost:8000';
const PAGE_PATH = process.env.PAGE || 'observatory.html';
const OUT_DIR = path.join(__dirname, '..', 'screenshots', 'font-fix-check');

(async () => {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const browser = await chromium.launch();
  const context = await browser.newContext({ ...devices['iPhone 13'] });
  const page = await context.newPage();

  await login(page, {
    baseUrl: BASE_URL, pagePath: PAGE_PATH,
    email: process.env.TEST_ACCOUNT_EMAIL, password: process.env.TEST_ACCOUNT_PASSWORD,
  });

  for (const tab of ['Overview', 'Analysis', 'Rankings']) {
    await page.getByRole('button', { name: tab, exact: true }).click();
    await page.waitForTimeout(800);
    if (tab === 'Analysis') {
      // Need a country selected to populate the Take-off Detection Module
      await page.fill('#global-search', 'India');
      await page.waitForTimeout(500);
      await page.locator('#search-results').locator('*').first().click().catch(() => {});
      await page.waitForTimeout(1000);
    }
    const overflow = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
    }));
    console.log(tab, 'overflow:', overflow.scrollWidth > overflow.clientWidth, overflow);
    // fullPage screenshots have been timing out here (likely a continuously
    // redrawing chart) — viewport-only is enough to check text sizing.
    await page.screenshot({ path: path.join(OUT_DIR, `${tab.toLowerCase()}.png`), fullPage: false, timeout: 10000 }).catch(e => console.log(`  (screenshot skipped: ${e.message})`));
    if (tab === 'Analysis') {
      const tdm = page.locator('#tdm-panel');
      if (await tdm.count()) {
        await tdm.scrollIntoViewIfNeeded().catch(() => {});
        await tdm.screenshot({ path: path.join(OUT_DIR, 'tdm-panel.png'), timeout: 10000 }).catch(e => console.log(`  (tdm screenshot skipped: ${e.message})`));
      }
    }
  }

  await context.close();
  await browser.close();
})();
