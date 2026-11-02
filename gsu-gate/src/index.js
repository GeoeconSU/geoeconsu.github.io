const ALLOWED_ORIGINS = [
  'https://geoecon.solutions',
  'http://localhost:8000',
  'http://127.0.0.1:8000',
];

// Only these filenames can be requested — prevents arbitrary URL fetch
const ALLOWED_PDFS = {
  'GRB Q2 2026.pdf': 'docs/GRB Q2 2026.pdf',
  'GRB Q1 2026.pdf': 'docs/GRB Q1 2026.pdf',
  'GRB Q4 2025.pdf': 'docs/GRB Q4 2025.pdf',
};

const SITE_BASE = 'https://geoecon.solutions';

export default {
  async fetch(request, env, ctx) {
    const origin = request.headers.get('Origin') || '';
    const corsOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
    const cors = {
      'Access-Control-Allow-Origin': corsOrigin,
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Content-Type': 'application/json',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: cors });
    }

    const url = new URL(request.url);

    try {
      if (url.pathname === '/send-report' && request.method === 'POST') {
        return await handleSendReport(request, env, cors);
      }
      if (url.pathname === '/track' && request.method === 'POST') {
        return await handleTrack(request, env, cors);
      }
      if (url.pathname === '/track-email' && request.method === 'GET') {
        return handleTrackEmail(request, env, ctx);
      }
      if (url.pathname === '/track-open' && request.method === 'GET') {
        return handleTrackOpen(request, env, ctx);
      }
      if (url.pathname === '/search' && request.method === 'POST') {
        return await handleSearch(request, env, cors);
      }
      if (url.pathname === '/gemini-chat' && request.method === 'POST') {
        return await handleGeminiChat(request, env, cors);
      }
      if (url.pathname === '/gemini-stream' && request.method === 'POST') {
        return await handleGeminiStream(request, env, cors);
      }
      if (url.pathname === '/hku-chat' && request.method === 'POST') {
        return await handleHkuChat(request, env, cors);
      }
      if (url.pathname === '/get-leads' && request.method === 'GET') {
        return await handleGetLeads(request, env, cors);
      }
      if (url.pathname === '/send-cold-email' && request.method === 'POST') {
        return await handleSendColdEmail(request, env, cors);
      }
      if (url.pathname === '/contact' && request.method === 'POST') {
        return await handleContact(request, env, cors);
      }
      return respond({ error: 'Not found' }, 404, cors);
    } catch (err) {
      console.error(err);
      return respond({ error: 'Internal error.' }, 500, cors);
    }
  },
};

// ── Handler ───────────────────────────────────────────────────────────────────

async function handleSendReport(request, env, cors) {
  const { name, email, pdf } = await request.json();

  if (!name || name.trim().length < 2) {
    return respond({ error: 'Please enter your full name.' }, 400, cors);
  }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return respond({ error: 'Please enter a valid email address.' }, 400, cors);
  }
  if (!ALLOWED_PDFS[pdf]) {
    return respond({ error: 'Invalid report requested.' }, 400, cors);
  }

  const pdfPath = ALLOWED_PDFS[pdf];
  const pdfUrl = SITE_BASE + '/' + pdfPath.split('/').map(encodeURIComponent).join('/');

  // Send email with download link
  const sent = await sendReportEmail(env, email, name.trim(), pdf, pdfUrl);
  if (!sent) {
    return respond({ error: 'Failed to send email. Please try again.' }, 500, cors);
  }

  // Store lead in Firebase Realtime DB
  await dbWrite(env, `gate_leads/${emailKey(email)}`, {
    name: name.trim(),
    email: email.toLowerCase(),
    report: pdf,
    sentAt: new Date().toISOString(),
  });

  return respond({ ok: true }, 200, cors);
}

// ── Tracking ──────────────────────────────────────────────────────────────────

async function handleTrack(request, env, cors) {
  const body = await request.json().catch(() => ({}));
  const { event, pdf, referrer } = body;
  if (!event || typeof event !== 'string') return respond({ ok: false }, 400, cors);
  await dbWrite(env, `barometer_events/${Date.now()}`, {
    event,
    pdf: pdf || null,
    referrer: referrer || null,
    ts: new Date().toISOString(),
  });
  return respond({ ok: true }, 200, cors);
}

// ── Email click & open tracking ───────────────────────────────────────────────

// GET /track-email?campaign=grb_q2_2026&to=EMAIL
// Logs the click to RTDB then redirects to the PDF immediately.
function handleTrackEmail(request, env, ctx) {
  const url = new URL(request.url);
  const campaign = url.searchParams.get('campaign') || 'unknown';
  const to       = url.searchParams.get('to')       || null;

  ctx.waitUntil(dbWrite(env, `email_clicks/${Date.now()}`, {
    event:    'email_click',
    campaign,
    to,
    ts: new Date().toISOString(),
    ua: request.headers.get('User-Agent') || null,
  }));

  return Response.redirect('https://geoecon.solutions/docs/GRB%20Q2%202026.pdf', 302);
}

// GET /track-open?campaign=grb_q2_2026&to=EMAIL
// Returns a 1×1 transparent GIF and logs the open to RTDB.
// Note: Apple Mail Privacy Protection pre-fetches pixels — open counts are approximate.
function handleTrackOpen(request, env, ctx) {
  const url = new URL(request.url);
  const campaign = url.searchParams.get('campaign') || 'unknown';
  const to       = url.searchParams.get('to')       || null;

  ctx.waitUntil(dbWrite(env, `email_opens/${Date.now()}`, {
    event:    'email_open',
    campaign,
    to,
    ts: new Date().toISOString(),
    ua: request.headers.get('User-Agent') || null,
  }));

  // Minimal 1×1 transparent GIF (43 bytes)
  const gif = new Uint8Array([
    0x47,0x49,0x46,0x38,0x39,0x61,0x01,0x00,0x01,0x00,
    0x80,0x00,0x00,0x00,0x00,0x00,0xFF,0xFF,0xFF,0x21,
    0xF9,0x04,0x01,0x0A,0x00,0x01,0x00,0x2C,0x00,0x00,
    0x00,0x00,0x01,0x00,0x01,0x00,0x00,0x02,0x02,0x4C,
    0x01,0x00,0x3B,
  ]);

  return new Response(gif, {
    status: 200,
    headers: {
      'Content-Type':  'image/gif',
      'Cache-Control': 'no-store, no-cache, must-revalidate',
      'Pragma':        'no-cache',
      'Expires':       '0',
    },
  });
}

// ── Contact form ─────────────────────────────────────────────────────────────

// POST /contact
// Body: { name, email, organisation, role, message }
async function handleContact(request, env, cors) {
  const { name, email, organisation, role, message } = await request.json();

  if (!name || name.trim().length < 2)
    return respond({ error: 'Please enter your full name.' }, 400, cors);
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    return respond({ error: 'Please enter a valid email address.' }, 400, cors);
  if (!message || message.trim().length < 10)
    return respond({ error: 'Please add a brief message.' }, 400, cors);

  const html = `
    <div style="font-family:Georgia,serif;max-width:560px;margin:0 auto;color:#192030;">
      <div style="padding:24px 32px 18px;border-bottom:2px solid #cba84e;">
        <img src="https://geoecon.solutions/assets/GSU_Navy_Transparent.png" alt="GSU" style="height:30px;width:auto;">
      </div>
      <div style="padding:28px 32px;">
        <p style="font-size:11px;letter-spacing:3px;text-transform:uppercase;color:#cba84e;margin:0 0 20px;">New Contact Request</p>
        <table cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;margin-bottom:24px;">
          <tr><td style="padding:8px 0;border-bottom:1px solid #eee;font-size:13px;color:#888;width:120px;">Name</td>
              <td style="padding:8px 0;border-bottom:1px solid #eee;font-size:15px;font-weight:600;">${name.trim()}</td></tr>
          <tr><td style="padding:8px 0;border-bottom:1px solid #eee;font-size:13px;color:#888;">Email</td>
              <td style="padding:8px 0;border-bottom:1px solid #eee;font-size:15px;"><a href="mailto:${email}" style="color:#192030;">${email}</a></td></tr>
          ${organisation ? `<tr><td style="padding:8px 0;border-bottom:1px solid #eee;font-size:13px;color:#888;">Organisation</td>
              <td style="padding:8px 0;border-bottom:1px solid #eee;font-size:15px;">${organisation.trim()}</td></tr>` : ''}
          ${role ? `<tr><td style="padding:8px 0;border-bottom:1px solid #eee;font-size:13px;color:#888;">Role</td>
              <td style="padding:8px 0;border-bottom:1px solid #eee;font-size:15px;">${role.trim()}</td></tr>` : ''}
        </table>
        <p style="font-size:11px;letter-spacing:3px;text-transform:uppercase;color:#cba84e;margin:0 0 10px;">Message</p>
        <p style="font-size:15px;line-height:1.7;color:#333;background:#f9f7f4;padding:16px;border-left:2px solid #cba84e;margin:0;">${message.trim().replace(/\n/g, '<br>')}</p>
      </div>
    </div>`;

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: 'research@geoecon.solutions',
      to: ['nir.b@geoecon.solutions'],
      reply_to: email,
      subject: `Contact Request — ${name.trim()}${organisation ? ' · ' + organisation.trim() : ''}`,
      html,
    }),
  });

  if (!res.ok) {
    console.error('Resend contact error:', await res.text());
    return respond({ error: 'Failed to send. Please try again.' }, 500, cors);
  }
  return respond({ ok: true }, 200, cors);
}

// ── Cold email ────────────────────────────────────────────────────────────────

// POST /send-cold-email
// Body: { authKey, to, recipientCompany, senderName, senderTitle }
async function handleSendColdEmail(request, env, cors) {
  const { authKey, to, recipientCompany, senderName, senderTitle } = await request.json();

  if (authKey !== env.FIREBASE_API_KEY) {
    return respond({ error: 'Unauthorized' }, 401, cors);
  }
  if (!to || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) {
    return respond({ error: 'Invalid recipient email' }, 400, cors);
  }

  // Fetch the live template and fill merge fields
  const templateRes = await fetch('https://geoecon.solutions/email_grb_q2_2026.html');
  if (!templateRes.ok) return respond({ error: 'Could not fetch template' }, 500, cors);

  let html = await templateRes.text();
  html = html.replace(/\[Email\]/g, encodeURIComponent(to));
  html = html.replace(/\[Name\]/g, senderName || 'Nir Bhattacharjee');
  html = html.replace(/\[Title\]/g, senderTitle || 'Chief Strategy Officer');
  html = html.replace(/\[Company Name\]/g, recipientCompany || 'your organisation');
  // Strip the preview-page banner (not relevant in a real inbox)
  html = html.replace(/<div class="preview-label">[\s\S]*?<\/div>/, '');

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'nir.b@geoecon.solutions',
      to: [to],
      subject: 'Q2 2026 Geoeconomic Risk Barometer — Geoeconomic Strategy Unit',
      html,
    }),
  });

  if (!res.ok) {
    console.error('Resend cold email error:', await res.text());
    return respond({ error: 'Failed to send email' }, 500, cors);
  }
  return respond({ ok: true }, 200, cors);
}

// ── Resend ────────────────────────────────────────────────────────────────────

async function sendReportEmail(env, to, name, filename, pdfUrl) {
  const qNum = filename.match(/Q\d/)?.[0];
  const year = filename.match(/\d{4}/)?.[0];
  const quarter = (qNum && year) ? `${qNum} ${year}` : filename.replace(/^GRB /, '').replace(/\.pdf$/, '');

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'research@geoecon.solutions',
      to: [to],
      subject: `Geoeconomic Risk Barometer — ${quarter}`,
      html: `
        <div style="font-family:Georgia,serif;max-width:560px;margin:0 auto;background:#ffffff;color:#192030;">

          <div style="padding:28px 40px 22px;border-bottom:2px solid #cba84e;">
            <img src="https://geoecon.solutions/assets/GSU_Navy_Transparent.png" alt="Geoeconomic Strategy Unit" style="height:34px;width:auto;display:block;">
          </div>

          <div style="padding:36px 40px 36px;">
            <p style="font-size:11px;letter-spacing:3px;text-transform:uppercase;color:#cba84e;margin:0 0 24px;">Geoeconomic Risk Barometer &mdash; ${quarter}</p>

            <p style="font-size:15px;color:#333;line-height:1.7;margin:0 0 6px;">Dear ${name},</p>
            <p style="font-size:15px;color:#444;line-height:1.7;margin:0 0 28px;">
              Thank you for your interest in the Geoeconomic Risk Barometer. Here is your copy of the <strong style="color:#192030;">${quarter} edition</strong>:
            </p>

            <a href="${pdfUrl}" style="display:inline-block;background:#192030;color:#cba84e;font-family:Georgia,serif;font-size:14px;letter-spacing:0.3px;text-decoration:none;padding:13px 28px;border-radius:2px;margin-bottom:40px;">Download Report &rarr;</a>

            <hr style="border:none;border-top:1px solid #eee;margin:0 0 24px;">

            <p style="font-size:13px;color:#888;line-height:1.6;margin:0 0 20px;">
              For any questions on the report, contact us at <a href="mailto:geoecon@16thcouncil.uk" style="color:#888;">geoecon@16thcouncil.uk</a>
            </p>

            <table cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin-bottom:20px;">
              <tr>
                <td style="padding-right:12px;">
                  <a href="https://www.linkedin.com/company/geoeconomic-strategy-unit/" style="text-decoration:none;display:inline-block;">
                    <img src="https://img.icons8.com/color/32/linkedin.png" width="26" height="26" alt="LinkedIn" style="border:0;display:block;">
                  </a>
                </td>
                <td style="padding-right:12px;">
                  <a href="https://www.instagram.com/geoeconomicstrategyunit" style="text-decoration:none;display:inline-block;">
                    <img src="https://img.icons8.com/color/32/instagram-new.png" width="26" height="26" alt="Instagram" style="border:0;display:block;">
                  </a>
                </td>
                <td>
                  <a href="https://www.youtube.com/watch?v=HGa1Xbx7IjQ" style="text-decoration:none;display:inline-block;">
                    <img src="https://img.icons8.com/color/32/youtube-play.png" width="26" height="26" alt="YouTube" style="border:0;display:block;">
                  </a>
                </td>
              </tr>
            </table>

            <p style="font-size:11px;color:#bbb;margin:0;">geoecon.solutions &nbsp;&middot;&nbsp; The Sixteenth Council &nbsp;&middot;&nbsp; London</p>
          </div>

        </div>
      `,
    }),
  });

  if (!res.ok) {
    console.error('Resend error:', await res.text());
  }
  return res.ok;
}

// ── Leads Console ─────────────────────────────────────────────────────────────

// Verifies the request carries a valid Firebase ID token for a real
// gsu-members user (FIREBASE_API_KEY is that project's Web API key — same
// one firebase-config.js embeds client-side, since this call is itself
// public; the project's RTDB/Firestore rules are the real access boundary).
// Returns the matching user record, or null if missing/invalid/expired.
async function verifyFirebaseIdToken(request, env) {
  const idToken = (request.headers.get('Authorization') || '').replace('Bearer ', '').trim();
  if (!idToken) return null;
  const verify = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${env.FIREBASE_API_KEY}`,
    { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ idToken }) }
  );
  if (!verify.ok) return null;
  const { users } = await verify.json();
  return (users && users.length) ? users[0] : null;
}

async function handleGetLeads(request, env, cors) {
  const user = await verifyFirebaseIdToken(request, env);
  if (!user) return respond({ error: 'Unauthorized' }, 401, cors);

  if (!env.FIREBASE_DB_SECRET) {
    return respond({ error: 'FIREBASE_DB_SECRET not configured on worker.' }, 503, cors);
  }

  // Read all collections from Firebase Realtime DB using legacy secret
  const [leadsRes, eventsRes, clicksRes, opensRes] = await Promise.all([
    fetch(`${env.FIREBASE_DB_URL}/gate_leads.json?auth=${env.FIREBASE_DB_SECRET}`),
    fetch(`${env.FIREBASE_DB_URL}/barometer_events.json?auth=${env.FIREBASE_DB_SECRET}`),
    fetch(`${env.FIREBASE_DB_URL}/email_clicks.json?auth=${env.FIREBASE_DB_SECRET}`),
    fetch(`${env.FIREBASE_DB_URL}/email_opens.json?auth=${env.FIREBASE_DB_SECRET}`),
  ]);

  if (!leadsRes.ok || !eventsRes.ok) {
    const body = await (!leadsRes.ok ? leadsRes : eventsRes).text();
    console.error('RTDB read failed:', body);
    return respond({ error: 'Failed to read from database.' }, 502, cors);
  }

  const leads       = await leadsRes.json();
  const events      = await eventsRes.json();
  const emailClicks = clicksRes.ok  ? await clicksRes.json()  : null;
  const emailOpens  = opensRes.ok   ? await opensRes.json()   : null;

  // Catch Firebase permission-denied errors returned as 200 with an error body
  if (leads?.error || events?.error) {
    console.error('RTDB permission error:', leads?.error || events?.error);
    return respond({ error: 'Database permission denied. Check FIREBASE_DB_SECRET.' }, 403, cors);
  }

  return respond({ leads, events, emailClicks, emailOpens }, 200, cors);
}

// ── Firebase Realtime Database (REST) ─────────────────────────────────────────

function emailKey(email) {
  return btoa(email.toLowerCase()).replace(/[^a-zA-Z0-9]/g, '_');
}

async function dbWrite(env, path, data) {
  const res = await fetch(`${env.FIREBASE_DB_URL}/${path}.json`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) console.error(`dbWrite failed [${res.status}] at ${path}:`, await res.text());
}

function respond(body, status, headers) {
  return new Response(JSON.stringify(body), { status, headers });
}

// Upstream time limits. Without them a stalled Gemini request held the
// caller for ~2 minutes before Cloudflare gave up with a bare 502 (seen
// 2026-11-02 on gemini-3.7/3.8-flash). These bound the wait for response
// *headers* only — once a stream has started, its body is never cut off.
const GEMINI_ATTEMPT_TIMEOUT_MS = 45000;
const GEMINI_TOTAL_BUDGET_MS = 60000;
// HKU's routes don't stream, so headers only arrive once the whole answer is
// written — Claude Opus 4.6 took 30-55s on typical chatbot payloads and
// exceeded 60s on a real one (2026-11-02).
const HKU_TIMEOUT_MS = 150000;

// fetch() that aborts if no response headers arrive within `ms`. Throws an
// Error named 'TimeoutError' on expiry.
async function fetchWithTimeout(url, init, ms) {
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), ms);
  try {
    return await fetch(url, { ...init, signal: ctl.signal });
  } catch (err) {
    if (ctl.signal.aborted) {
      const e = new Error(`No response within ${Math.round(ms / 1000)}s`);
      e.name = 'TimeoutError';
      throw e;
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

// One JSON line per upstream call, so `wrangler tail` / Workers Logs can be
// filtered by evt, model or status.
function logUpstream(fields) {
  const line = JSON.stringify({ evt: 'upstream', ...fields });
  if (fields.ok) console.log(line); else console.error(line);
}

// Uniform error body. `error.message` is what the chatbot shows the user;
// the rest is there for debugging from the browser's network tab.
function upstreamError(failure, cors) {
  const headers = { ...cors };
  if (failure.retryAfterS) headers['Retry-After'] = String(failure.retryAfterS);
  return new Response(JSON.stringify({
    error: {
      message: failure.message,
      type: failure.kind,
      model: failure.model,
      upstream_status: failure.upstreamStatus ?? null,
      quota_id: failure.quotaId ?? null,
      retry_after_s: failure.retryAfterS ?? null,
      elapsed_ms: failure.elapsedMs,
    },
  }), { status: failure.status, headers });
}

// Turns a non-OK Gemini response into something actionable. The free tier's
// per-model daily cap (20 requests/day on the Flash models, 2026-11-02) is
// the usual cause of "only flash-lite works", so 429s name the exact quota.
function describeGeminiFailure(model, status, errorInfo, rawText) {
  const base = { model, upstreamStatus: status };
  if (status === 429 || errorInfo?.status === 'RESOURCE_EXHAUSTED') {
    const details = errorInfo?.details || [];
    const violation = details.flatMap(d => d.violations || [])[0];
    const delay = details.find(d => d.retryDelay)?.retryDelay; // e.g. "72226s"
    const retryAfterS = delay ? parseInt(delay, 10) || null : null;
    const quotaId = violation?.quotaId || null;
    const perDay = /PerDay/.test(quotaId || '');
    const limit = violation?.quotaValue ? ` (limit ${violation.quotaValue})` : '';
    const wait = retryAfterS
      ? (retryAfterS >= 3600 ? ` Resets in ~${Math.round(retryAfterS / 3600)}h.` : ` Retry in ~${retryAfterS}s.`)
      : '';
    return {
      ...base, status: 429, kind: 'quota', quotaId, retryAfterS,
      message: `${model} has hit its ${perDay ? 'daily' : 'rate'} limit${limit}${/FreeTier/.test(quotaId || '') ? ' on the Gemini free tier' : ''}.${wait} Try another model.`,
    };
  }
  if (status === 503 || errorInfo?.status === 'UNAVAILABLE') {
    return { ...base, status: 503, kind: 'overloaded', message: `${model} is overloaded right now — please try again in a moment or switch model.` };
  }
  if (status === 404) {
    return { ...base, status: 502, kind: 'model_not_found', message: `${model} is not available to this API key.` };
  }
  const detail = errorInfo?.message || (rawText || '').slice(0, 200) || `HTTP ${status}`;
  return { ...base, status: 502, kind: 'upstream_error', message: `Gemini error (${model}): ${detail}` };
}

// Gemini occasionally returns a transient 503 "UNAVAILABLE" under demand
// spikes (confirmed 2026-09-28 — retrying the identical request immediately
// afterward succeeded). Retry once if the time budget allows; otherwise hand
// back a described failure — used by both handleGeminiChat and
// handleGeminiStream below.
async function fetchGeminiWithRetry(url, body, ctx) {
  const started = Date.now();
  for (let attempt = 1; attempt <= 2; attempt++) {
    const remaining = GEMINI_TOTAL_BUDGET_MS - (Date.now() - started);
    const attemptStart = Date.now();
    let res;
    try {
      res = await fetchWithTimeout(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }, Math.min(GEMINI_ATTEMPT_TIMEOUT_MS, remaining));
    } catch (err) {
      const timedOut = err.name === 'TimeoutError';
      const failure = {
        model: ctx.model, status: timedOut ? 504 : 502, kind: timedOut ? 'timeout' : 'network',
        message: timedOut
          ? `${ctx.model} did not respond within ${Math.round((Date.now() - started) / 1000)}s — please try again or switch model.`
          : `Could not reach Gemini (${err.message}).`,
        elapsedMs: Date.now() - started,
      };
      logUpstream({ ...ctx, attempt, ok: false, kind: failure.kind, ms: Date.now() - attemptStart, error: err.message });
      return { res: null, failure };
    }

    if (res.ok) {
      logUpstream({ ...ctx, attempt, ok: true, status: res.status, ms: Date.now() - attemptStart });
      return { res, failure: null };
    }

    const rawText = await res.text();
    let errorInfo = null;
    try { errorInfo = JSON.parse(rawText)?.error || null; } catch {}
    const failure = { ...describeGeminiFailure(ctx.model, res.status, errorInfo, rawText), elapsedMs: Date.now() - started };
    logUpstream({ ...ctx, attempt, ok: false, status: res.status, kind: failure.kind, quotaId: failure.quotaId, ms: Date.now() - attemptStart, error: (errorInfo?.message || rawText || '').slice(0, 300) });

    const timeLeft = GEMINI_TOTAL_BUDGET_MS - (Date.now() - started);
    if (failure.kind === 'overloaded' && attempt === 1 && timeLeft > 5000) {
      await new Promise(r => setTimeout(r, 600));
      continue;
    }
    return { res, failure };
  }
}

// ── Gemini Chat (OpenAI-format ↔ Gemini API conversion) ──────────────────────

const ALLOWED_GEMINI_MODELS = new Set(['gemini-3.5-flash-lite', 'gemini-3.8-flash', 'gemini-3.7-flash', 'gemini-3.6-flash', 'gemini-3.5-flash']);

async function handleGeminiChat(request, env, cors) {
  // Was unauthenticated — anyone with the URL could spend the Gemini quota
  // (GSU-Web TODO.md item 1 / RAO-News reports/CLOUD_AUTOMATION_PLAN.md §6).
  // Both real callers already hold a gsu-members ID token: a signed-in
  // dashboard/observatory user, or the RAO-News pipeline's own sync account.
  const user = await verifyFirebaseIdToken(request, env);
  if (!user) return respond({ error: 'Unauthorized' }, 401, cors);

  const { messages, tools, max_tokens, temperature, model } = await request.json();
  const safeModel = ALLOWED_GEMINI_MODELS.has(model) ? model : 'gemini-3.5-flash-lite';
  if (!messages || !Array.isArray(messages)) {
    return respond({ error: 'messages required.' }, 400, cors);
  }
  if (!env.GEMINI_API_KEY) {
    return respond({ error: 'Gemini not configured.' }, 503, cors);
  }

  const systemMsg = messages.find(m => m.role === 'system');
  const otherMessages = messages.filter(m => m.role !== 'system');

  // Build tool_call_id → function name map (needed for functionResponse)
  const toolCallMap = {};
  for (const msg of otherMessages) {
    if (msg.role === 'assistant' && msg.tool_calls) {
      for (const tc of msg.tool_calls) toolCallMap[tc.id] = tc.function.name;
    }
  }

  // Convert OpenAI messages → Gemini contents
  const contents = [];
  for (const msg of otherMessages) {
    if (msg.role === 'user') {
      contents.push({ role: 'user', parts: [{ text: msg.content || '' }] });
    } else if (msg.role === 'assistant') {
      const parts = [];
      if (msg.content) parts.push({ text: msg.content });
      if (msg.tool_calls) {
        for (const tc of msg.tool_calls) {
          let args = {};
          try { args = JSON.parse(tc.function.arguments); } catch {}
          const fc = { name: tc.function.name, args };
          if (tc.id) fc.id = tc.id;
          const part = { functionCall: fc };
          if (msg._thought_signatures?.[tc.id]) part.thoughtSignature = msg._thought_signatures[tc.id];
          parts.push(part);
        }
      }
      if (parts.length > 0) contents.push({ role: 'model', parts });
    } else if (msg.role === 'tool') {
      const fnName = toolCallMap[msg.tool_call_id] || 'unknown';
      const fr = { name: fnName, response: { output: msg.content || '' } };
      if (msg.tool_call_id) fr.id = msg.tool_call_id;
      contents.push({
        role: 'user',
        parts: [{ functionResponse: fr }]
      });
    }
  }

  // Convert OpenAI tools → Gemini functionDeclarations
  const geminiTools = tools && tools.length
    ? [{ functionDeclarations: tools.map(t => ({
        name: t.function.name,
        description: t.function.description,
        parameters: t.function.parameters
      })) }]
    : undefined;

  const body = {
    contents,
    generationConfig: { temperature: temperature ?? 0.2, maxOutputTokens: max_tokens ?? 2500 }
  };
  if (systemMsg) body.systemInstruction = { parts: [{ text: systemMsg.content }] };
  if (geminiTools) body.tools = geminiTools;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${safeModel}:generateContent?key=${env.GEMINI_API_KEY}`;
  const { res, failure } = await fetchGeminiWithRetry(url, body, { route: 'gemini-chat', model: safeModel, uid: user.localId });
  if (failure) return upstreamError(failure, cors);

  const data = await res.json();
  const parts = data.candidates?.[0]?.content?.parts || [];
  const textParts = parts.filter(p => p.text);
  const fnCallParts = parts.filter(p => p.functionCall);

  let message;
  if (fnCallParts.length > 0) {
    const ts = Date.now();
    const toolCalls = fnCallParts.map((p, i) => ({
      id: `call_${ts}_${i}`,
      type: 'function',
      function: { name: p.functionCall.name, arguments: JSON.stringify(p.functionCall.args || {}) }
    }));
    // Preserve thoughtSignatures so the next turn can round-trip them back to Gemini
    const signatures = {};
    fnCallParts.forEach((p, i) => { if (p.thoughtSignature) signatures[`call_${ts}_${i}`] = p.thoughtSignature; });
    message = {
      role: 'assistant',
      content: textParts.map(p => p.text).join('') || null,
      tool_calls: toolCalls,
      ...(Object.keys(signatures).length && { _thought_signatures: signatures })
    };
  } else {
    message = {
      role: 'assistant',
      content: textParts.map(p => p.text).join('') || '',
      tool_calls: null
    };
  }

  return respond({ choices: [{ message }] }, 200, cors);
}

// ── Gemini Streaming (SSE passthrough) ───────────────────────────────────────

async function handleGeminiStream(request, env, cors) {
  const user = await verifyFirebaseIdToken(request, env);
  if (!user) return respond({ error: 'Unauthorized' }, 401, cors);

  const { messages, tools, max_tokens, temperature, model } = await request.json();
  const safeModel = ALLOWED_GEMINI_MODELS.has(model) ? model : 'gemini-3.5-flash-lite';
  if (!messages || !Array.isArray(messages)) return respond({ error: 'messages required.' }, 400, cors);
  if (!env.GEMINI_API_KEY) return respond({ error: 'Gemini not configured.' }, 503, cors);

  const systemMsg = messages.find(m => m.role === 'system');
  const otherMessages = messages.filter(m => m.role !== 'system');

  const toolCallMap = {};
  for (const msg of otherMessages) {
    if (msg.role === 'assistant' && msg.tool_calls) {
      for (const tc of msg.tool_calls) toolCallMap[tc.id] = tc.function.name;
    }
  }

  const contents = [];
  for (const msg of otherMessages) {
    if (msg.role === 'user') {
      contents.push({ role: 'user', parts: [{ text: msg.content || '' }] });
    } else if (msg.role === 'assistant') {
      const parts = [];
      if (msg.content) parts.push({ text: msg.content });
      if (msg.tool_calls) {
        for (const tc of msg.tool_calls) {
          let args = {};
          try { args = JSON.parse(tc.function.arguments); } catch {}
          const fc = { name: tc.function.name, args };
          if (tc.id) fc.id = tc.id;
          const part = { functionCall: fc };
          if (msg._thought_signatures?.[tc.id]) part.thoughtSignature = msg._thought_signatures[tc.id];
          parts.push(part);
        }
      }
      if (parts.length > 0) contents.push({ role: 'model', parts });
    } else if (msg.role === 'tool') {
      const fnName = toolCallMap[msg.tool_call_id] || 'unknown';
      const fr = { name: fnName, response: { output: msg.content || '' } };
      if (msg.tool_call_id) fr.id = msg.tool_call_id;
      contents.push({ role: 'user', parts: [{ functionResponse: fr }] });
    }
  }

  const geminiTools = tools && tools.length
    ? [{ functionDeclarations: tools.map(t => ({ name: t.function.name, description: t.function.description, parameters: t.function.parameters })) }]
    : undefined;

  const body = { contents, generationConfig: { temperature: temperature ?? 0.2, maxOutputTokens: max_tokens ?? 8000 } };
  if (systemMsg) body.systemInstruction = { parts: [{ text: systemMsg.content }] };
  if (geminiTools) body.tools = geminiTools;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${safeModel}:streamGenerateContent?alt=sse&key=${env.GEMINI_API_KEY}`;
  const { res, failure } = await fetchGeminiWithRetry(url, body, { route: 'gemini-stream', model: safeModel, uid: user.localId });
  if (failure) return upstreamError(failure, cors);

  return new Response(res.body, {
    headers: {
      'Access-Control-Allow-Origin': cors['Access-Control-Allow-Origin'],
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'X-Accel-Buffering': 'no',
    },
  });
}

// ── HKU ITS GenAI Gateway (Azure OpenAI + AWS Bedrock Claude, student sandbox) ──
// See HKU_API_SETUP.md at the repo root for how these endpoints were found.
// Only ever called as a final, no-more-tools answer step — the tool-calling
// loop itself stays on Gemini/Groq, so neither branch here needs to translate
// tool *definitions*, only past tool-call history already in the messages.

const HKU_BASE = 'https://api.hku.hk';
const HKU_GPT_MODELS = new Set(['gpt-5-mini', 'gpt-5.5']);
const HKU_CLAUDE_MODELS = new Set(['claude-sonnet-5', 'claude-opus-4.6']);

async function handleHkuChat(request, env, cors) {
  const { messages, model, max_tokens, temperature } = await request.json();
  if (!messages || !Array.isArray(messages)) {
    return respond({ error: 'messages required.' }, 400, cors);
  }
  if (!env.HKU_API_KEY) {
    return respond({ error: 'HKU API not configured on server.' }, 503, cors);
  }

  if (HKU_GPT_MODELS.has(model)) {
    return await callHkuOpenAI(env, model, messages, max_tokens, cors);
  }
  if (HKU_CLAUDE_MODELS.has(model)) {
    return await callHkuClaude(env, model, messages, max_tokens, temperature, cors);
  }
  return respond({ error: `Unsupported HKU model: ${model}` }, 400, cors);
}

// HKU's gateway is genuinely Azure OpenAI underneath, so the OpenAI-shaped
// history the chatbot already built (system/user/assistant/tool roles,
// assistant.tool_calls) passes straight through — only strip bookkeeping
// fields (e.g. Gemini's _thought_signatures) the upstream API doesn't expect.
//
// gpt-5.x/o4-mini are reasoning-tier models, which on Azure OpenAI:
// NOTE 1: reject `temperature` entirely — bare 500 if present at all, even
// the default 1. Never forward it here regardless of what the caller passed.
// NOTE 2: reject the (deprecated, for this model family) `max_tokens` field
// with the same bare 500 — must be sent as `max_completion_tokens` instead.
// Reasoning tokens are billed out of that same budget, so give it room:
// too low a value burns the whole budget on reasoning and returns empty
// content with finish_reason "length".
// NOTE 3: without a `Cache-Control: no-cache` request header, this endpoint
// can get stuck returning a bare 500 for a given deployment for an extended
// period (looks like an APIM response-cache policy caching an error
// response). Matches HKU's own portal-generated code sample, which always
// sends it.
// (All three confirmed by direct testing against gpt-5-mini/gpt-5.5, 2026-09-28.)
// Shared HKU fetch: applies HKU_TIMEOUT_MS and logs every call. On failure
// returns an error Response ready to hand back to the client; on success
// returns a plain { json() } wrapper, so callers branch on `instanceof Response`.
async function fetchHku(url, init, model, label, cors) {
  const started = Date.now();
  let res;
  try {
    res = await fetchWithTimeout(url, init, HKU_TIMEOUT_MS);
  } catch (err) {
    const timedOut = err.name === 'TimeoutError';
    logUpstream({ route: 'hku-chat', model, ok: false, kind: timedOut ? 'timeout' : 'network', ms: Date.now() - started, error: err.message });
    return upstreamError({
      model, status: timedOut ? 504 : 502, kind: timedOut ? 'timeout' : 'network', elapsedMs: Date.now() - started,
      message: timedOut ? `${label} (${model}) did not respond within ${HKU_TIMEOUT_MS / 1000}s.` : `Could not reach ${label} (${err.message}).`,
    }, cors);
  }
  if (res.ok) {
    logUpstream({ route: 'hku-chat', model, ok: true, status: res.status, ms: Date.now() - started });
    return { json: () => res.json() };
  }
  const rawText = await res.text();
  let detail = rawText.slice(0, 200);
  try { const j = JSON.parse(rawText); detail = j?.error?.message || j?.message || detail; } catch {}
  logUpstream({ route: 'hku-chat', model, ok: false, status: res.status, ms: Date.now() - started, error: rawText.slice(0, 300) });
  return upstreamError({
    model, upstreamStatus: res.status, elapsedMs: Date.now() - started,
    status: res.status === 429 ? 429 : 502, kind: res.status === 429 ? 'quota' : 'upstream_error',
    message: res.status === 429
      ? `${label} (${model}) rate limit reached — wait a minute or switch model.`
      : `${label} error (${model}, HTTP ${res.status}): ${detail || 'no details'}`,
  }, cors);
}

async function callHkuOpenAI(env, model, messages, max_tokens, cors) {
  const url = `${HKU_BASE}/openai/student/deployments/${model}/chat/completions?api-version=2025-04-01-preview`;
  const body = {
    messages: messages.map(({ _thought_signatures, ...rest }) => rest),
    max_completion_tokens: Math.max(max_tokens ?? 2000, 2000),
  };

  const res = await fetchHku(url, {
    method: 'POST',
    headers: { 'api-key': env.HKU_API_KEY, 'Content-Type': 'application/json', 'Cache-Control': 'no-cache' },
    body: JSON.stringify(body),
  }, model, 'HKU OpenAI', cors);
  if (res instanceof Response) return res;
  const data = await res.json();
  return respond(data, 200, cors); // already {choices:[{message:{...}}], usage:{...}}
}

async function callHkuClaude(env, model, messages, max_tokens, temperature, cors) {
  const url = `${HKU_BASE}/claude/student/model/${model}/converse`;
  const { system, converseMessages } = toBedrockConverse(messages);
  const body = {
    messages: converseMessages,
    max_tokens: max_tokens ?? 2000,
    temperature: temperature ?? 0.3,
  };
  if (system) body.system = system;

  const res = await fetchHku(url, {
    method: 'POST',
    headers: { 'api-key': env.HKU_API_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }, model, 'HKU Claude', cors);
  if (res instanceof Response) return res;
  const data = await res.json();
  const text = (data.output?.message?.content || []).map(c => c.text || '').join('');
  return respond({
    choices: [{ message: { role: 'assistant', content: text, tool_calls: null } }],
    usage: {
      prompt_tokens: data.usage?.inputTokens,
      completion_tokens: data.usage?.outputTokens,
      total_tokens: data.usage?.totalTokens,
    },
  }, 200, cors);
}

// Bedrock's Converse API requires strictly alternating user/assistant turns
// and (for our purposes) text-only content blocks — this endpoint is only
// ever asked for a final answer, never to make new tool calls itself, so
// past tool_calls/tool-result history is flattened into plain text turns
// rather than translated into Bedrock's native toolUse/toolResult blocks.
//
// The calls themselves are NOT written into assistant turns: an earlier
// version did ("[Called tool(s): render_chart(...)]") and Claude Opus copied
// the pattern, replying with "[Calling tool(s): ...]" lines instead of an
// answer (2026-11-02). Each result is instead handed over in the user turn
// as labelled data, so there is no assistant-side tool syntax to imitate.
function toBedrockConverse(messages) {
  let system = null;
  const flat = []; // { role: 'user'|'assistant', text }
  const callLabel = {}; // tool_call_id → "name(args)"

  for (const msg of messages) {
    if (msg.role === 'system' && flat.length === 0) {
      system = system ? system + '\n\n' + msg.content : msg.content;
    } else if (msg.role === 'system') {
      // A system message after the conversation has started (the chatbot's
      // "tools are done — write the final answer now" note) must stay where
      // it is. Folding it into the top-level system prompt buried it under
      // ~26 KB of instructions and Opus kept asking for more tools.
      flat.push({ role: 'user', text: `[Instruction] ${msg.content || ''}` });
    } else if (msg.role === 'user') {
      flat.push({ role: 'user', text: msg.content || '' });
    } else if (msg.role === 'assistant') {
      for (const tc of msg.tool_calls || []) callLabel[tc.id] = `${tc.function.name}(${tc.function.arguments})`;
      if (msg.content) flat.push({ role: 'assistant', text: msg.content });
    } else if (msg.role === 'tool') {
      const label = callLabel[msg.tool_call_id] || 'a data lookup';
      flat.push({ role: 'user', text: `Data already retrieved via ${label}:\n${msg.content || ''}` });
    }
  }

  // Merge consecutive same-role turns into one (Converse requires strict
  // user/assistant alternation; our tool-call/tool-result runs collapse to
  // several consecutive 'user' turns otherwise).
  const merged = [];
  for (const turn of flat) {
    const last = merged[merged.length - 1];
    if (last && last.role === turn.role) last.text += '\n\n' + turn.text;
    else merged.push({ ...turn });
  }
  // Converse also requires the conversation to start on a 'user' turn.
  while (merged.length && merged[0].role !== 'user') merged.shift();

  return {
    system: system ? [{ text: system }] : null,
    converseMessages: merged.map(t => ({ role: t.role, content: [{ text: t.text }] })),
  };
}

// ── Tavily Web Search ─────────────────────────────────────────────────────────

async function handleSearch(request, env, cors) {
  const { query } = await request.json();
  if (!query || typeof query !== 'string' || query.trim().length < 2) {
    return respond({ error: 'Invalid query.' }, 400, cors);
  }
  if (!env.TAVILY_API_KEY) {
    return respond({ error: 'Search not configured on server.' }, 503, cors);
  }
  const res = await fetch('https://api.tavily.com/search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      api_key: env.TAVILY_API_KEY,
      query: query.trim().slice(0, 400),
      search_depth: 'advanced',
      max_results: 5,
      include_answer: true
    })
  });
  if (!res.ok) {
    console.error('Tavily error:', await res.text());
    return respond({ error: 'Search upstream failed.' }, 502, cors);
  }
  const data = await res.json();
  return respond({
    answer: data.answer || null,
    results: (data.results || []).map(r => ({
      title: r.title,
      url: r.url,
      content: (r.content || '').slice(0, 2000),
      score: r.score
    }))
  }, 200, cors);
}
