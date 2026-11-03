// Start the site first (from the repo root): python -m http.server 8000
// No webServer auto-start here on purpose — see testing/README.md.
require('dotenv').config();
const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests',
  timeout: 60000,
  // python -m http.server is single-threaded and the test account can only
  // hold one Firebase session at a time — serialize instead of parallelizing.
  fullyParallel: false,
  workers: 1,
  reporter: 'list',
  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:8000',
    trace: 'retain-on-failure',
  },
  projects: [
    { name: 'desktop-chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile', use: { viewport: { width: 390, height: 844 }, userAgent: devices['iPhone 13'].userAgent } },
  ],
});
