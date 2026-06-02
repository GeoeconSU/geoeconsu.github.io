const ALLOWED_ORIGINS = [
  'https://geoecon.solutions',
  'http://localhost:8000',
  'http://127.0.0.1:8000',
];

// Only these filenames can be requested — prevents arbitrary URL fetch
const ALLOWED_PDFS = {
  'GRB Q1 2026.pdf': 'docs/GRB Q1 2026.pdf',
  'GRB Q4 2025.pdf': 'docs/GRB Q4 2025.pdf',
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
      if (url.pathname === '/search' && request.method === 'POST') {
        return await handleSearch(request, env, cors);
      }
      if (url.pathname === '/gemini-chat' && request.method === 'POST') {
        return await handleGeminiChat(request, env, cors);
      }
      if (url.pathname === '/gemini-stream' && request.method === 'POST') {
        return await handleGeminiStream(request, env, cors);
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

// ── Gemini Chat (OpenAI-format ↔ Gemini API conversion) ──────────────────────

const ALLOWED_GEMINI_MODELS = new Set(['gemini-3.1-flash-lite', 'gemini-3.5-flash', 'gemini-2.5-flash', 'gemini-2.0-flash-lite']);

async function handleGeminiChat(request, env, cors) {
  const { messages, tools, max_tokens, temperature, model } = await request.json();
  const safeModel = ALLOWED_GEMINI_MODELS.has(model) ? model : 'gemini-3.1-flash-lite';
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
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });

  if (!res.ok) {
    console.error('Gemini error:', await res.text());
    return respond({ error: 'Gemini upstream failed.' }, 502, cors);
  }

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
  const { messages, tools, max_tokens, temperature, model } = await request.json();
  const safeModel = ALLOWED_GEMINI_MODELS.has(model) ? model : 'gemini-3.1-flash-lite';
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
  const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });

  if (!res.ok) {
    console.error('Gemini stream error:', await res.text());
    return respond({ error: 'Gemini upstream failed.' }, 502, cors);
  }

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
