// Mobile/responsive visual audit for observatory.html (and, with PAGE=dashboard.html,
// dashboard.html). Logs in once per device profile, visits every main tab, and
// records a screenshot + horizontal-overflow check + console errors for each.
//
// Usage:
//   cd testing && npm install && npm run install-browser
//   cp .env.example .env   # fill in a dedicated test account — see README.md
//   npm run audit:mobile
//
// Start the site locally first (from the repo root): python -m http.server 8000
//
// Output: testing/screenshots/<device>/<tab>.png + testing/screenshots/report.json
// (both gitignored — screenshots can show real RAO9 panel data).

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { chromium, devices } = require('playwright');
const { login } = require('../lib/auth');

const BASE_URL = process.env.BASE_URL || 'http://localhost:8000';
const PAGE_PATH = process.env.PAGE || 'observatory.html';
const OUT_DIR = path.join(__dirname, '..', 'screenshots');

// A deliberately small, representative set — not every device, just the
// widths that matter: the smallest common phone, a typical modern phone,
// a typical Android, and a tablet. Add more here if a specific bug report
// names a narrower/wider device.
const DEVICE_PROFILES = [
  { name: 'iphone-se', ...devices['iPhone SE'] },
  { name: 'iphone-13', ...devices['iPhone 13'] },
  { name: 'pixel-7', ...devices['Pixel 7'] },
  { name: 'ipad-mini', ...devices['iPad Mini'] },
];

const TABS = ['Overview', 'Analysis', 'Compare', 'Rankings', 'Analytics', 'Pulse'];

async function auditTab(page, tabName) {
  await page.getByRole('button', { name: tabName, exact: true }).click();
  await page.waitForTimeout(600); // tab-switch animation + chart re-render

  const overflow = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }));

  const smallTouchTargets = await page.evaluate(() => {
    const MIN = 44;
    const sel = 'button, .icon-btn, .nav-item, a[onclick], [role="button"]';
    return Array.from(document.querySelectorAll(sel))
      .map(el => {
        const r = el.getBoundingClientRect();
        return { cls: (el.className || '').toString().slice(0, 60), w: Math.round(r.width), h: Math.round(r.height) };
      })
      .filter(t => t.w > 0 && t.h > 0 && (t.w < MIN || t.h < MIN));
  });

  return {
    overflowsViewport: overflow.scrollWidth > overflow.clientWidth,
    scrollWidth: overflow.scrollWidth,
    clientWidth: overflow.clientWidth,
    smallTouchTargetCount: smallTouchTargets.length,
    smallTouchTargets: smallTouchTargets.slice(0, 10), // first 10 is plenty to act on
  };
}

async function main() {
  const email = process.env.TEST_ACCOUNT_EMAIL;
  const password = process.env.TEST_ACCOUNT_PASSWORD;

  fs.mkdirSync(OUT_DIR, { recursive: true });
  const browser = await chromium.launch();
  const report = { baseUrl: BASE_URL, page: PAGE_PATH, generatedAt: new Date().toISOString(), devices: {} };

  for (const device of DEVICE_PROFILES) {
    console.log(`\n=== ${device.name} (${device.viewport.width}x${device.viewport.height}) ===`);
    const deviceDir = path.join(OUT_DIR, device.name);
    fs.mkdirSync(deviceDir, { recursive: true });

    const context = await browser.newContext({ ...device });
    const page = await context.newPage();
    const consoleErrors = [];
    page.on('console', msg => { if (msg.type() === 'error') consoleErrors.push(msg.text()); });
    page.on('pageerror', err => consoleErrors.push('pageerror: ' + err.message));

    report.devices[device.name] = { tabs: {}, consoleErrorsAtLogin: [] };

    try {
      await login(page, { baseUrl: BASE_URL, pagePath: PAGE_PATH, email, password });
    } catch (e) {
      console.error(`  Login failed: ${e.message}`);
      report.devices[device.name].loginError = e.message;
      await context.close();
      continue;
    }
    report.devices[device.name].consoleErrorsAtLogin = [...consoleErrors];

    for (const tab of TABS) {
      try {
        const result = await auditTab(page, tab);
        await page.screenshot({ path: path.join(deviceDir, `${tab.toLowerCase()}.png`), fullPage: true });
        report.devices[device.name].tabs[tab] = result;
        const flag = result.overflowsViewport ? ' ⚠ horizontal overflow' : '';
        console.log(`  ${tab}: ${result.smallTouchTargetCount} small touch targets${flag}`);
      } catch (e) {
        report.devices[device.name].tabs[tab] = { error: e.message };
        console.error(`  ${tab}: failed — ${e.message}`);
      }
    }

    await context.close();
  }

  await browser.close();
  fs.writeFileSync(path.join(OUT_DIR, 'report.json'), JSON.stringify(report, null, 2));
  console.log(`\nDone. Screenshots + report.json in ${OUT_DIR}`);
}

main().catch(err => { console.error(err); process.exit(1); });
