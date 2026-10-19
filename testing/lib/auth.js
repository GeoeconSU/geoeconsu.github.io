// Shared Firebase email/password sign-in for observatory.html / dashboard.html.
// Both pages use the same #app-gate markup (id="login-email"/"login-password",
// a single submit button inside #auth-login-form) and the same post-login
// signal: #app-gate gains the "gate-hidden" class once Fieldnotes.login()
// resolves successfully.

async function login(page, { baseUrl, pagePath, email, password }) {
  if (!email || !password) {
    throw new Error(
      'TEST_ACCOUNT_EMAIL / TEST_ACCOUNT_PASSWORD not set — copy testing/.env.example ' +
      'to testing/.env and fill in a dedicated test account (see testing/README.md).'
    );
  }

  // 'load' rather than 'networkidle': the app opens a persistent Firebase
  // RTDB connection, which can keep the network "busy" indefinitely and
  // make networkidle an unreliable wait condition here.
  await page.goto(`${baseUrl}/${pagePath}`, { waitUntil: 'load', timeout: 30000 });
  await page.waitForSelector('#login-email', { timeout: 15000 });
  await page.fill('#login-email', email);
  await page.fill('#login-password', password);
  await page.click('#auth-login-form button[type="submit"]');

  try {
    // state:'attached', not the default 'visible' — gate-hidden's whole job
    // is to make #app-gate invisible, so waiting for it to be "visible"
    // can never succeed. Generous timeout: a real Firebase sign-in + RAO9
    // panel fetch against production (not localhost) is slower than a dev
    // server.
    await page.waitForSelector('#app-gate.gate-hidden', { timeout: 40000, state: 'attached' });
  } catch {
    const err = await page.locator('#login-error').textContent().catch(() => null);
    throw new Error(`Sign-in did not complete within 40s.${err ? ` Gate error: "${err.trim()}"` : ''}`);
  }
}

module.exports = { login };
