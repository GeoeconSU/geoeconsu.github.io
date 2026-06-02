"""Test Gemini streaming endpoint — verify SSE chunks and no timeout."""
import requests, json, time, csv

STREAM_URL = 'https://gsu-gate.guduruadip.workers.dev/gemini-stream'
CHAT_URL   = 'https://gsu-gate.guduruadip.workers.dev/gemini-chat'
MODEL_LITE = 'gemini-3.1-flash-lite'
MODEL_35   = 'gemini-3.5-flash'
CSV_PATH   = 'data/rao9.csv'
OUTPUT     = 'notes/chat_test_results.md'

# ── Minimal data loader ───────────────────────────────────────────────────────
def safe(v, d=0):
    try: return float(v) if v not in (None,'','nan') else d
    except: return d

panel = []
with open(CSV_PATH, newline='', encoding='utf-8') as f:
    for row in csv.DictReader(f):
        row['year'] = int(safe(row.get('year', 0)))
        panel.append(row)

country_history = {}
for r in panel:
    iso = r.get('country') or r.get('country_iso', '')
    country_history.setdefault(iso, []).append(r)
latest_year = max(r['year'] for r in panel)

NORM_FIELDS = [
    'norm_gdp_growth','norm_export_growth','norm_net_fdi_pct_gdp',
    'norm_gross_capital_formation','norm_secondary_school_enrolment',
    'norm_cpi_inflation','norm_government_debt_pct_gdp',
    'norm_current_account_pct_gdp','norm_external_debt_pct_gni',
    'norm_political_stability','norm_rule_of_law','norm_control_of_corruption',
    'norm_natural_resource_rents_pct_gdp','norm_gdp_per_capita_growth',
    'norm_youth_unemployment','norm_vulnerable_employment','norm_regulatory_quality',
]

def fmt(v, d=2):
    try: return round(float(v), d) if v not in (None,'','nan') else None
    except: return None

def resolve_iso(name):
    name = name.upper().strip()
    for iso, rows in country_history.items():
        if iso.upper() == name: return iso
        if rows and rows[0].get('country_name','').upper() == name: return iso
    for iso, rows in country_history.items():
        cn = rows[0].get('country_name','').upper() if rows else ''
        if name in cn or cn in name: return iso
    return None

def row_summary(r, include_vars=False):
    d = {
        'country': r.get('country') or r.get('country_iso',''),
        'country_name': r.get('country_name',''),
        'year': r['year'],
        'rao_score': fmt(r.get('rao_score')),
        'rao_pre_overlay': fmt(r.get('rao_score_pre_overlay')),
        'volatility_band': fmt(r.get('volatility_band'), 3),
        'pillars': {
            'opportunity':         fmt(r.get('pillar_opportunity')),
            'stability':           fmt(r.get('pillar_stability')),
            'absorptive_capacity': fmt(r.get('pillar_absorptive_capacity')),
            'trajectory':          fmt(r.get('pillar_trajectory')),
        },
        'tos_score': fmt(r.get('tos_score')),
        'tos_signal': r.get('tos_signal_label',''),
        'sis_score': fmt(r.get('sis_score')),
        'dgi_score': fmt(r.get('dgi_score')),
        'rvs_score': fmt(r.get('rvs_score')),
        'regime': r.get('regime',''),
        'regime_label': r.get('regime_label',''),
    }
    if include_vars:
        d['normalized_indicators'] = {f: fmt(r.get(f), 2) for f in NORM_FIELDS}
    return d

def tool_get_country_profile(countries, include_history=False):
    results = []
    for name in countries:
        iso = resolve_iso(name)
        if not iso:
            results.append({'error': f'Country not found: {name}'}); continue
        rows = sorted(country_history.get(iso, []), key=lambda r: r['year'])
        latest = next((r for r in reversed(rows) if r['year'] == latest_year), rows[-1] if rows else None)
        if not latest:
            results.append({'error': f'No data for {name}'}); continue
        entry = row_summary(latest, include_vars=True)
        if include_history:
            entry['history'] = [row_summary(r) for r in rows if r['year'] >= 2010]
        results.append(entry)
    return json.dumps(results, indent=2)

CHART_TOOLS = {'render_line_chart','render_dual_line','render_radar_chart',
               'render_pillar_bar','render_bar_chart','render_scatter_plot','render_regime_matrix'}

def execute_tool(name, args):
    if name == 'get_country_profile':
        return tool_get_country_profile(args.get('countries',[]), args.get('include_history',False))
    if name in CHART_TOOLS:
        return f'{name} rendered.'
    return 'Tool not available.'

# ── Streaming SSE parser ──────────────────────────────────────────────────────
def call_streaming(messages, tools, max_tokens, model, retries=3):
    """Call /gemini-stream and return (full_text, tool_calls, chunk_count, elapsed)."""
    body = {'model': model, 'messages': messages, 'temperature': 0.2, 'max_tokens': max_tokens}
    if tools: body['tools'] = tools
    t0 = time.time()
    for attempt in range(retries):
        try:
            resp = requests.post(STREAM_URL, json=body, stream=True, timeout=120)
            resp.raise_for_status()
            break
        except Exception as e:
            print(f'    attempt {attempt+1} failed: {e}')
            if attempt < retries - 1: time.sleep(15)
            else: raise

    full_text = ''
    tool_calls = []
    chunk_count = 0
    buffer = ''

    for raw_bytes in resp.iter_content(chunk_size=None):
        buffer += raw_bytes.decode('utf-8')
        while '\n' in buffer:
            line, buffer = buffer.split('\n', 1)
            if not line.startswith('data: '): continue
            data = line[6:].strip()
            if not data or data == '[DONE]': continue
            try: chunk = json.loads(data)
            except: continue
            parts = chunk.get('candidates', [{}])[0].get('content', {}).get('parts', [])
            for part in parts:
                if 'text' in part:
                    full_text += part['text']
                    chunk_count += 1
                if 'functionCall' in part:
                    fc = part['functionCall']
                    tool_calls.append({'name': fc['name'], 'args': fc.get('args', {}), 'id': fc.get('id', ''), 'thought_sig': part.get('thoughtSignature', '')})

    elapsed = round(time.time() - t0, 1)
    return full_text, tool_calls, chunk_count, elapsed

# ── System prompt (same as chat.html) ────────────────────────────────────────
SYSPROMPT = """Today's date: 2 June 2026. The RAO dataset covers through 2024.

You are the RAO Intelligence Assistant — a senior investment strategist at the Sixteenth Council.

THE RAO FRAMEWORK:
RAO Score (1–10): Bayesian CVaR₂₅. 4 Pillars (0–1): Opportunity, Stability, Absorptive Capacity, Trajectory.
Regimes: RO · FO · SL · SR. TOS = geometric mean of SIS × DGI × RVS.
TOS ≥ 0.70 = Strong Pre-Breakout. TOS ≥ 0.55 = Pre-Breakout. TOS 0.35–0.55 = Moderate Potential.
ALL norm_ values: HIGHER IS ALWAYS BETTER (negatives are inverted).
Absorptive Capacity collapse risk: if ANY sub-indicator < 0.15, flag it.

ADAPTIVE OUTPUT STANDARDS:
For single-country deep-dives: pillar table with sub-indicator root causes, TOS component table (SIS/DGI/RVS), full year-by-year time-series (2015–present), key values summary, scenario matrix.
For comparison queries: side-by-side table, TOS component breakdown for each, full year-by-year time-series for EACH country.

TOOL USE PROTOCOL:
1. For any named country: call get_country_profile with include_history=true.
2. For comparisons: call get_country_profile(include_history=true) for EACH country.
6. CHART TOOLS — call these as part of your response:
   Single-country: ALWAYS call render_line_chart, render_dual_line, render_radar_chart.
   Comparison: ALWAYS call render_radar_chart, render_pillar_bar, render_line_chart.
7. Execute all tool calls, then synthesize.
"""

TOOLS = [
    {'type':'function','function':{'name':'get_country_profile',
        'parameters':{'type':'object','required':['countries'],'properties':{
            'countries':{'type':'array','items':{'type':'string'}},
            'include_history':{'type':'boolean'}}}}},
    {'type':'function','function':{'name':'render_line_chart',
        'parameters':{'type':'object','required':['countries'],'properties':{
            'countries':{'type':'array','items':{'type':'string'}},
            'metric':{'type':'string'},'title':{'type':'string'}}}}},
    {'type':'function','function':{'name':'render_dual_line',
        'parameters':{'type':'object','required':['country'],'properties':{
            'country':{'type':'string'},'title':{'type':'string'}}}}},
    {'type':'function','function':{'name':'render_radar_chart',
        'parameters':{'type':'object','required':['countries'],'properties':{
            'countries':{'type':'array','items':{'type':'string'}},'title':{'type':'string'}}}}},
    {'type':'function','function':{'name':'render_pillar_bar',
        'parameters':{'type':'object','required':['countries'],'properties':{
            'countries':{'type':'array','items':{'type':'string'}},'title':{'type':'string'}}}}},
]

# ── Full agentic loop using streaming ────────────────────────────────────────
MAX_STEPS = 10

def run_agent_streaming(user_prompt, model):
    messages = [{'role':'system','content':SYSPROMPT},{'role':'user','content':user_prompt}]
    trace = []
    charts_called = []
    total_chunks = 0
    t0 = time.time()

    for step in range(MAX_STEPS):
        max_tok = 500 if step == 0 else 8000
        full_text, tool_calls, chunk_count, elapsed = call_streaming(messages, TOOLS, max_tok, model)
        total_chunks += chunk_count

        if tool_calls:
            tool_results = []
            for tc in tool_calls:
                fn, args = tc['name'], tc['args']
                trace.append(f'→ {fn}({json.dumps(args)[:80]})')
                if fn in CHART_TOOLS:
                    charts_called.append(fn)
                result = execute_tool(fn, args)
                trace.append(f'← {result[:100]}')
                # Build OpenAI-format tool result message
                tc_id = tc.get('id') or f'call_{step}_{fn}'
                tool_results.append({'role':'tool','tool_call_id':tc_id,'content':result})
            # Rebuild assistant message with tool_calls in OpenAI format
            sigs = {tc.get('id') or f'call_{step}_{tc["name"]}': tc['thought_sig'] for tc in tool_calls if tc.get('thought_sig')}
            asst_msg = {
                'role':'assistant','content': full_text or None,
                'tool_calls':[{
                    'id': tc.get('id') or f'call_{step}_{tc["name"]}','type':'function',
                    'function':{'name':tc['name'],'arguments':json.dumps(tc['args'])}
                } for tc in tool_calls],
                **({'_thought_signatures': sigs} if sigs else {})
            }
            messages = [*messages, asst_msg, *tool_results]
        else:
            trace.append(f'✓ Response: {len(full_text)} chars | {total_chunks} SSE chunks')
            return full_text, trace, charts_called, round(time.time()-t0,1)

    # Fallback
    full_text, _, chunk_count, _ = call_streaming(messages, None, 8000, model)
    trace.append(f'✓ Fallback: {len(full_text)} chars')
    return full_text, trace, charts_called, round(time.time()-t0,1)

# ── Tests ─────────────────────────────────────────────────────────────────────
TESTS = [
    ('single-country [lite]',  'gemini-3.1-flash-lite', 'Analyze Vietnam.'),
    ('single-country [3.5]',   'gemini-3.5-flash',      'Analyze Vietnam.'),
    ('comparison [3.5]',       'gemini-3.5-flash',      'Compare India and Mexico as investment destinations.'),
]

EXPECTED_CHARTS = {
    'single-country': {'render_line_chart','render_dual_line','render_radar_chart'},
    'comparison':     {'render_radar_chart','render_pillar_bar','render_line_chart'},
}

CONTENT_CHECKS = [
    ('Pillar table',       lambda r: '|' in r and any(p in r for p in ['Opportunity','Stability','Absorptive'])),
    ('TOS components',     lambda r: 'SIS' in r and 'DGI' in r and 'RVS' in r),
    ('Year-by-year table', lambda r: r.count('|') > 80),
    ('Scenario matrix',    lambda r: 'Scenario' in r and ('Upside' in r or 'Downside' in r)),
]

with open(OUTPUT, 'w', encoding='utf-8') as f:
    f.write(f'# Streaming Test Results\n\n**Date:** 2 June 2026\n\n---\n\n')

for label, model, prompt in TESTS:
    query_type = 'comparison' if 'Compare' in prompt else 'single-country'
    print(f'\nRunning [{label}]: "{prompt}"')
    try:
        reply, trace, charts_called, elapsed = run_agent_streaming(prompt, model)
    except Exception as e:
        print(f'  ERROR: {e}')
        with open(OUTPUT, 'a', encoding='utf-8') as f:
            f.write(f'## {label}\n\n**ERROR:** {e}\n\n---\n\n')
        continue

    charts_set = set(charts_called)
    expected_set = EXPECTED_CHARTS.get(query_type, set())
    hits   = expected_set & charts_set
    misses = expected_set - charts_set

    print(f'  {elapsed}s | {len(reply)} chars')
    print(f'  Charts: {sorted(charts_called)}')
    print(f'  ✅ Hit: {sorted(hits)}  ❌ Miss: {sorted(misses)}')

    # Content checks
    content_results = [(name, ok(reply)) for name, ok in CONTENT_CHECKS]
    for name, ok in content_results:
        print(f'  {"✅" if ok else "❌"} {name}')

    chart_md = ''.join(f'- {"✅" if c in charts_set else "❌"} `{c}`\n' for c in sorted(expected_set))
    content_md = ''.join(f'- {"✅" if ok else "❌"} {name}\n' for name, ok in content_results)
    trace_md = '\n'.join(f'- `{t}`' for t in trace)

    block  = f'## {label}\n\n'
    block += f'**Prompt:** "{prompt}"\n'
    block += f'**Time:** {elapsed}s | **Length:** {len(reply)} chars\n\n'
    block += f'### Chart Checklist\n{chart_md}\n'
    block += f'### Content Checklist\n{content_md}\n'
    block += f'### Trace\n{trace_md}\n\n'
    block += f'### Response\n\n{reply}\n\n---\n\n'

    with open(OUTPUT, 'a', encoding='utf-8') as f:
        f.write(block)
    print(f'  Saved.')
    time.sleep(4)

print('\nDone.')
