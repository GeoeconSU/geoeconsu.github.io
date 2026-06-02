# Streaming Test Results

**Date:** 2 June 2026

---

## single-country [lite]

**Prompt:** "Analyze Vietnam."
**Time:** 8.1s | **Length:** 2612 chars

### Chart Checklist
- ✅ `render_dual_line`
- ✅ `render_line_chart`
- ✅ `render_radar_chart`

### Content Checklist
- ✅ Pillar table
- ✅ TOS components
- ❌ Year-by-year table
- ❌ Scenario matrix

### Trace
- `→ get_country_profile({"countries": ["Vietnam"], "include_history": true})`
- `← [
  {
    "country": "VNM",
    "country_name": "Vietnam",
    "year": 2025,
    "rao_score": 8.14,
`
- `→ render_line_chart({"countries": ["Vietnam"], "title": "Vietnam RAO Score (2010\u20132025)", "metri)`
- `← render_line_chart rendered.`
- `→ render_dual_line({"country": "Vietnam", "title": "Vietnam: RAO Score vs. TOS Signal (2010\u201320)`
- `← render_dual_line rendered.`
- `→ render_radar_chart({"title": "Vietnam Pillar Performance (2025)", "countries": ["Vietnam"]})`
- `← render_radar_chart rendered.`
- `✓ Response: 2612 chars | 35 SSE chunks`

### Response

As of June 2, 2026, Vietnam maintains a **Robust Opportunity (RO)** regime with an RAO score of **8.14**. The country is currently signaling a **Pre-Breakout** status (TOS: 0.59), reflecting a strong recovery in its structural indicators following a period of volatility in 2022–2024.

### 1. Pillar Performance (2025)
Vietnam’s growth model is anchored by high capital formation and export-oriented industrialization.

| Pillar | Score | Root Causes / Observations |
| :--- | :--- | :--- |
| **Opportunity** | 0.66 | Driven by high GDP per capita growth (0.88) and strong export growth (0.78). |
| **Stability** | 0.63 | Supported by strong current account (0.84) and manageable debt levels (0.82). |
| **Absorptive Capacity** | 0.55 | Moderate; constrained by lower regulatory quality (0.41) and rule of law (0.45). |
| **Trajectory** | 0.57 | Improving; recovery in investment momentum post-2024. |

*Note: No sub-indicators are currently below the 0.15 "collapse risk" threshold.*

### 2. TOS Component Breakdown
The Takeoff Signal (TOS) is the geometric mean of SIS, DGI, and RVS. The 2025 recovery is primarily driven by a rebound in the Structural Integration Score (SIS).

| Component | Score | Trend |
| :--- | :--- | :--- |
| **SIS (Structural Integration)** | 0.54 | Significant recovery from 0.20 (2024). |
| **DGI (Dynamic Growth)** | 0.62 | Consistent performance in capital formation. |
| **RVS (Relative Value)** | 0.62 | Stable; reflecting competitive export positioning. |
| **TOS (Geometric Mean)** | **0.59** | **Pre-Breakout Signal** |

### 3. Historical Context (2015–2025)
Vietnam has demonstrated resilience, navigating the 2020–2021 pandemic period while maintaining its RO regime. The dip in TOS during 2022–2024 was largely a function of external demand shocks affecting the SIS component, which has now corrected.

### 4. Scenario Matrix
| Scenario | Probability | RAO Impact | Key Driver |
| :--- | :--- | :--- | :--- |
| **Breakout** | Moderate | 8.5+ | Sustained FDI inflow + Regulatory reform. |
| **Stagnation** | Low | 7.0–7.5 | External trade slowdown + Institutional bottlenecks. |
| **Correction** | Very Low | < 6.5 | Sharp decline in global export demand. |

**Strategic Assessment:** Vietnam is currently in a "Pre-Breakout" phase. The primary risk to the current trajectory is the "Absorptive Capacity" ceiling—specifically, the need for continued improvements in regulatory quality and the rule of law to sustain long-term capital efficiency. Investors should monitor the SIS component closely; any sustained decline below 0.40 would signal a potential loss of momentum.

---

## single-country [3.5]

**ERROR:** 502 Server Error: Bad Gateway for url: https://gsu-gate.guduruadip.workers.dev/gemini-stream

---

## comparison [3.5]

**ERROR:** 502 Server Error: Bad Gateway for url: https://gsu-gate.guduruadip.workers.dev/gemini-stream

---

