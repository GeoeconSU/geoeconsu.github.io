const ALLOWED_ORIGINS = [
  'https://geoecon.solutions',
  'http://localhost:8000',
  'http://127.0.0.1:8000',
];

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

    if (request.method === 'OPTIONS') return new Response(null, { headers: cors });

    const url = new URL(request.url);
    try {
      if (url.pathname === '/verify' && request.method === 'POST') {
        return await handleVerify(request, env, cors);
      }
      return respond({ error: 'Not found' }, 404, cors);
    } catch (err) {
      console.error(err);
      return respond({ error: 'Internal error.' }, 500, cors);
    }
  },
};

// POST /verify   body: { code }
//
// Gate for the "RAO Lite" student teaching demo (rao-lite.html). This is
// deliberately NOT a real account system — a single shared event passcode,
// checked here so the full historical RAO panel (proprietary data, normally
// reachable only by authenticated gsu-members users via Firebase) never has
// to sit in the public GitHub repo or ship to the browser unconditionally.
//
// access_enabled is a manual on/off switch in KV, flipped by hand after the
// event:
//   wrangler kv:key put --binding=RAO_LITE_KV access_enabled false
// No redeploy needed, and it fails closed even if someone still has the
// correct passcode.
async function handleVerify(request, env, cors) {
  const { code } = await request.json().catch(() => ({}));
  if (!code || typeof code !== 'string') {
    return respond({ error: 'Code required.' }, 400, cors);
  }

  const enabled = await env.RAO_LITE_KV.get('access_enabled');
  if (enabled !== 'true') {
    return respond({ error: 'This demo has ended.' }, 403, cors);
  }

  if (!env.EVENT_PASSCODE || code.trim() !== env.EVENT_PASSCODE) {
    return respond({ error: 'Incorrect code.' }, 401, cors);
  }

  const csv = await env.RAO_LITE_KV.get('data');
  if (!csv) {
    return respond({ error: 'Data not configured on server.' }, 503, cors);
  }

  return respond({ csv }, 200, cors);
}

function respond(body, status, headers) {
  return new Response(JSON.stringify(body), { status, headers });
}
