const ALLOWED_ORIGINS = [
  'https://geoecon.solutions',
  'http://localhost:8000',
  'http://127.0.0.1:8000',
];

// Only these filenames can be requested — prevents arbitrary URL fetch
const ALLOWED_PDFS = {
  'GRB Q1 2026.pdf': 'GRB Q1 2026.pdf',
  'GRB Q4 2025.pdf': 'GRB Q4 2025.pdf',
};

const SITE_BASE = 'https://geoecon.solutions';

export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin') || '';
    const corsOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
    const cors = {
      'Access-Control-Allow-Origin': corsOrigin,
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
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

  const pdfUrl = `${SITE_BASE}/${encodeURIComponent(pdf)}`;

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

// ── Resend ────────────────────────────────────────────────────────────────────

async function sendReportEmail(env, to, name, filename, pdfUrl) {
  const quarter = filename.includes('Q1 2026') ? 'Q1 2026' : 'Q4 2025';

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'research@geoecon.solutions',
      to: [to],
      subject: `GSU Geoeconomic Risk Barometer — ${quarter}`,
      html: `
        <div style="font-family:Georgia,serif;max-width:560px;margin:0 auto;padding:48px 24px;background:#ffffff;color:#192030;">
          <p style="font-size:11px;letter-spacing:3px;text-transform:uppercase;color:#888;margin:0 0 32px;">Geoeconomic Strategy Unit</p>
          <h2 style="font-size:22px;font-weight:400;margin:0 0 20px;color:#192030;">Geoeconomic Risk Barometer — ${quarter}</h2>
          <p style="font-size:15px;color:#444;line-height:1.7;margin:0 0 20px;">Hello ${name},</p>
          <p style="font-size:15px;color:#444;line-height:1.7;margin:0 0 28px;">
            Thank you for your interest in GSU's flagship research. Your copy of the <strong>${quarter} Geoeconomic Risk Barometer</strong> is ready to download:
          </p>
          <a href="${pdfUrl}" style="display:inline-block;background:#192030;color:#cba84e;font-family:Georgia,serif;font-size:15px;text-decoration:none;padding:14px 28px;border-radius:3px;margin-bottom:32px;">Download the Barometer →</a>
          <p style="font-size:15px;color:#444;line-height:1.7;margin:0 0 28px;">
            The Barometer maps the next moves of capital and power — blending hard indicators with regional intelligence and corridor-level analysis to support decision-making at the highest levels.
          </p>
          <hr style="border:none;border-top:1px solid #eee;margin:32px 0;">
          <p style="font-size:13px;color:#888;line-height:1.6;margin:0 0 8px;">
            If you have questions or would like to discuss the findings, reply directly to this email.
          </p>
          <p style="font-size:11px;color:#bbb;margin:24px 0 0;">geoecon.solutions &nbsp;·&nbsp; The Sixteenth Council &nbsp;·&nbsp; London</p>
        </div>
      `,
    }),
  });

  if (!res.ok) {
    console.error('Resend error:', await res.text());
  }
  return res.ok;
}

// ── Firebase Realtime Database (REST) ─────────────────────────────────────────

function emailKey(email) {
  return btoa(email.toLowerCase()).replace(/[^a-zA-Z0-9]/g, '_');
}

async function dbWrite(env, path, data) {
  await fetch(`${env.FIREBASE_DB_URL}/${path}.json`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
}

function respond(body, status, headers) {
  return new Response(JSON.stringify(body), { status, headers });
}
