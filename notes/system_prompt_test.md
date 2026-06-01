# System Prompt A/B/C Test — RAO Intelligence Assistant

**Date:** 1 June 2026
**Model:** gemini-3.1-flash-lite
**Prompt:** "Give me a RAO analysis of Vietnam."

---

## Variant A: Current (no baked-in output format)

**Time:** 9.3s

### Agent Trace
- `→ get_country_profile({"include_history": true, "countries": ["Vietnam"]})`
- `← [
  {
    "country": "VNM",
    "country_name": "Vietnam",
    "year": 2025,
    "rao_score": 8.14,
    "rao_pre_overlay": 7.28,
    "volatility_band": 0.099,
    "pillars": {
      "opportunity": 0.6…`
- `✓ Response: 3166 chars`

### Response

### Strategic Analysis: Vietnam (VNM)

Vietnam currently occupies a **Robust Opportunity (RO)** regime, characterized by a high RAO score of 8.14 and a strengthening **TOS (Takeoff Signal) of 0.59**, which qualifies as a "Pre-Breakout Signal." The country has successfully navigated the post-pandemic volatility that depressed its scores in 2021–2022, returning to a trajectory of structural expansion.

The core of Vietnam's investment appeal lies in its high-performing Opportunity pillar (0.66) and strong macroeconomic stability (0.63). The country remains a primary beneficiary of global supply chain diversification, evidenced by high gross capital formation (0.86) and robust export growth (0.78). However, the "Absorptive Capacity" pillar (0.55) reveals a critical bottleneck: while GDP per capita growth and youth unemployment metrics are strong, the "vulnerable employment" indicator (0.25) and "regulatory quality" (0.41) suggest that the economy is still struggling to transition from low-value manufacturing to higher-productivity, formal-sector employment.

#### Historical RAO Performance (Selected Years)

| Year | RAO | Regime | TOS | Opportunity | Stability | Absorptive Capacity | Trajectory |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| 2010 | 6.74 | SL | 0.50 | 0.56 | 0.44 | 0.43 | - |
| 2015 | 7.48 | RO | 0.54 | 0.65 | 0.54 | 0.51 | 0.63 |
| 2020 | 8.06 | RO | 0.50 | 0.58 | 0.57 | 0.51 | 0.65 |
| 2022 | 6.67 | RO | 0.36 | 0.65 | 0.58 | 0.55 | 0.47 |
| 2024 | 7.39 | RO | 0.41 | 0.66 | 0.62 | 0.55 | 0.47 |
| 2025 | 8.14 | RO | 0.59 | 0.66 | 0.63 | 0.55 | 0.57 |

#### Strategic Considerations
*   **The TOS Inflection:** The jump in the TOS score from 0.41 in 2024 to 0.59 in 2025 is driven by a significant improvement in the SIS (S-curve Inflection Score), suggesting that Vietnam is entering a phase of non-linear growth. This is a critical signal for investors to increase exposure, provided the regulatory environment continues to stabilize.
*   **Governance & Reform:** The Reform Velocity Score (RVS) of 0.62 indicates that while governance is improving, it remains a moderate constraint. Investors should monitor the "Rule of Law" (0.45) and "Control of Corruption" (0.46) metrics closely; these are the primary risks to the sustainability of the current RO regime.
*   **Absorptive Capacity:** While no sub-indicator has hit the "collapse" threshold (<0.15), the low score for "vulnerable employment" (0.25) indicates that a large portion of the workforce remains in informal or precarious roles. This limits the domestic consumption multiplier and suggests that long-term growth is heavily dependent on external demand.

### Bottom Line
Vietnam is currently in a "Pre-Breakout" phase (TOS 0.59). The combination of high capital formation and strong export growth makes it a compelling candidate for long-term industrial and infrastructure exposure. Investors should prioritize entry into sectors that benefit from the formalization of the economy and the ongoing supply chain shift, while maintaining a risk-mitigation strategy focused on the potential for regulatory volatility and governance-related bottlenecks.

---

## Variant B: Current + explicit output template

**Time:** 6.9s

### Agent Trace
- `→ get_country_profile({"include_history": true, "countries": ["Vietnam"]})`
- `← [
  {
    "country": "VNM",
    "country_name": "Vietnam",
    "year": 2025,
    "rao_score": 8.14,
    "rao_pre_overlay": 7.28,
    "volatility_band": 0.099,
    "pillars": {
      "opportunity": 0.6…`
- `✓ Response: 4182 chars`

### Response

Vietnam currently presents as a **Robust Opportunity (RO)**, characterized by a strong rebound in its structural growth trajectory and a re-emergence of pre-breakout signals. The economy has successfully navigated the post-pandemic volatility, leveraging its position as a primary beneficiary of global supply chain diversification.

### 1. Four-Pillar Breakdown with Sub-Indicator Root Causes

*   **Opportunity (0.66):** Driven by high `norm_gdp_growth` (0.84) and `norm_gross_capital_formation` (0.86). Vietnam’s ability to attract sustained FDI for manufacturing expansion remains the primary engine of its economic momentum.
*   **Stability (0.63):** Anchored by strong `norm_current_account_pct_gdp` (0.84) and `norm_government_debt_pct_gdp` (0.82). The country maintains a disciplined fiscal stance, though `norm_rule_of_law` (0.45) and `norm_control_of_corruption` (0.46) remain moderate, acting as a ceiling on institutional stability.
*   **Absorptive Capacity (0.55):** Supported by strong `norm_gdp_per_capita_growth` (0.88) and `norm_youth_unemployment` (0.82). However, the `norm_vulnerable_employment` (0.25) and `norm_regulatory_quality` (0.41) indicate that while the economy is growing, the labor market remains informal and the regulatory environment is still maturing.
*   **Trajectory (0.57):** Reflects a recovery in OLS trends for GDP and governance. The recent uptick in trajectory suggests that the structural reforms initiated in 2024 are beginning to yield measurable improvements in economic efficiency.

### 2. TOS Component Breakdown

*   **SIS (0.54):** Indicates a moderate proximity to a structural growth inflection. The score has improved significantly from 2024, suggesting that Vietnam is entering a phase where previous investments in infrastructure and human capital are beginning to compound.
*   **DGI (0.62):** Reflects a healthy gap between fundamental quality and market recognition. The market remains undervalued relative to its structural growth potential, providing a compelling entry point for long-term capital.
*   **RVS (0.62):** Captures the momentum of recent governance and reform efforts. The score indicates that the government is actively pursuing policies to improve the business environment, which is critical for sustaining the current RO regime.

### 3. Full Year-by-Year Time-Series Table (2015–2025)

| Year | RAO | Regime | TOS | Opportunity | Stability | Absorptive Capacity | Trajectory |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| 2015 | 7.48 | RO | 0.54 | 0.65 | 0.54 | 0.51 | 0.63 |
| 2016 | 7.70 | RO | 0.60 | 0.64 | 0.54 | 0.52 | 0.66 |
| 2017 | 7.86 | RO | 0.64 | 0.67 | 0.53 | 0.53 | 0.71 |
| 2018 | 8.10 | RO | 0.65 | 0.67 | 0.54 | 0.54 | 0.70 |
| 2019 | 8.14 | RO | 0.68 | 0.65 | 0.56 | 0.55 | 0.54 |
| 2020 | 8.06 | RO | 0.50 | 0.58 | 0.57 | 0.51 | 0.65 |
| 2021 | 6.37 | RO | 0.52 | 0.61 | 0.55 | 0.49 | 0.47 |
| 2022 | 6.67 | RO | 0.36 | 0.65 | 0.58 | 0.55 | 0.47 |
| 2023 | 6.90 | RO | 0.36 | 0.60 | 0.61 | 0.53 | 0.48 |
| 2024 | 7.39 | RO | 0.41 | 0.66 | 0.62 | 0.55 | 0.47 |
| 2025 | 8.14 | RO | 0.59 | 0.66 | 0.63 | 0.55 | 0.57 |

### 4. Key Values Table (2025)

| Metric | Value |
| :--- | :--- |
| RAO Score | 8.14 |
| Regime | RO |
| TOS | 0.59 |
| SIS | 0.54 |
| DGI | 0.62 |
| RVS | 0.62 |
| Opportunity | 0.66 |
| Stability | 0.63 |
| Absorptive Capacity | 0.55 |
| Trajectory | 0.57 |

### 5. Scenario Matrix

| Scenario | Catalyst | RAO/TOS Threshold | Investor Action |
| :--- | :--- | :--- | :--- |
| **Base** | Continued FDI inflow & steady reform | RAO 8.0+ / TOS 0.55+ | Maintain overweight position. |
| **Upside** | Accelerated regulatory reform & digital transition | RAO 8.5+ / TOS 0.70+ | Increase exposure; target high-tech manufacturing. |
| **Downside** | External trade shock or institutional stagnation | RAO < 7.0 / TOS < 0.40 | Reduce exposure; hedge currency risk. |

**Bottom Line:** Vietnam is currently in a "Pre-Breakout" phase. Investors should prioritize sectors benefiting from the ongoing manufacturing shift, while closely monitoring the `norm_regulatory_quality` and `norm_rule_of_law` indicators as key triggers for potential institutional risk.

---

## Variant C: Current + output template + chain-of-thought discipline

**Time:** 7.0s

### Agent Trace
- `→ get_country_profile({"include_history": true, "countries": ["Vietnam"]})`
- `← [
  {
    "country": "VNM",
    "country_name": "Vietnam",
    "year": 2025,
    "rao_score": 8.14,
    "rao_pre_overlay": 7.28,
    "volatility_band": 0.099,
    "pillars": {
      "opportunity": 0.6…`
- `✓ Response: 4239 chars`

### Response

Vietnam currently presents as a **Robust Opportunity (RO)**, with its RAO score reaching a multi-year high of 8.14 in 2025. The country has successfully transitioned from a period of moderate potential (2022–2024) back into a **Pre-Breakout Signal (TOS 0.59)**. This shift is driven by a resurgence in structural growth indicators and improved reform velocity.

### 1. Four-Pillar Breakdown
*   **Opportunity (0.66):** Driven by high `norm_gdp_growth` (0.84) and `norm_gross_capital_formation` (0.86). Vietnam remains a primary beneficiary of global supply chain diversification, with capital formation consistently outpacing regional peers.
*   **Stability (0.63):** Anchored by strong `norm_current_account` (0.84) and `norm_government_debt` (0.82) management. The transmission mechanism here is fiscal discipline providing a buffer against external shocks, though `norm_rule_of_law` (0.45) remains a persistent drag.
*   **Absorptive Capacity (0.55):** While `norm_gdp_per_capita_growth` (0.88) is excellent, the pillar is constrained by `norm_vulnerable_employment` (0.25) and `norm_regulatory_quality` (0.41). The economy is highly productive but struggles to transition labor into high-value-added formal roles.
*   **Trajectory (0.57):** Reflects a recovery in momentum after a stagnation period (2022–2024). The improvement in the OLS trend for FDI and governance suggests that recent policy efforts to streamline administrative processes are beginning to yield measurable results.

### 2. TOS Component Breakdown
*   **SIS (0.54):** Indicates that Vietnam is nearing a structural growth inflection. The jump from 0.20 in 2024 to 0.54 in 2025 suggests that the economy is successfully moving up the value chain in electronics and manufacturing.
*   **DGI (0.62):** Reflects that the market is currently undervalued relative to its fundamental growth trajectory. Investors are not yet fully pricing in the long-term benefits of Vietnam’s integration into global trade agreements.
*   **RVS (0.62):** Shows solid reform momentum. The government’s focus on infrastructure and digital transformation is being captured by positive event data, signaling a proactive regulatory environment.

### 3. Full Year-by-Year Time-Series Table (2015–2025)

| Year | RAO | Regime | TOS | Opportunity | Stability | Absorptive Capacity | Trajectory |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| 2015 | 7.48 | RO | 0.54 | 0.65 | 0.54 | 0.51 | 0.63 |
| 2016 | 7.70 | RO | 0.60 | 0.64 | 0.54 | 0.52 | 0.66 |
| 2017 | 7.86 | RO | 0.64 | 0.67 | 0.53 | 0.53 | 0.71 |
| 2018 | 8.10 | RO | 0.65 | 0.67 | 0.54 | 0.54 | 0.70 |
| 2019 | 8.14 | RO | 0.68 | 0.65 | 0.56 | 0.55 | 0.54 |
| 2020 | 8.06 | RO | 0.50 | 0.58 | 0.57 | 0.51 | 0.65 |
| 2021 | 6.37 | RO | 0.52 | 0.61 | 0.55 | 0.49 | 0.47 |
| 2022 | 6.67 | RO | 0.36 | 0.65 | 0.58 | 0.55 | 0.47 |
| 2023 | 6.90 | RO | 0.36 | 0.60 | 0.61 | 0.53 | 0.48 |
| 2024 | 7.39 | RO | 0.41 | 0.66 | 0.62 | 0.55 | 0.47 |
| 2025 | 8.14 | RO | 0.59 | 0.66 | 0.63 | 0.55 | 0.57 |

### 4. Key Values Table (2025)

| Metric | Value | Metric | Value |
| :--- | :--- | :--- | :--- |
| **RAO Score** | 8.14 | **SIS** | 0.54 |
| **Regime** | RO | **DGI** | 0.62 |
| **TOS** | 0.59 | **RVS** | 0.62 |
| **Opportunity** | 0.66 | **Stability** | 0.63 |
| **Absorptive Capacity** | 0.55 | **Trajectory** | 0.57 |

### 5. Scenario Matrix

| Scenario | Catalyst | RAO/TOS Threshold | Investor Action |
| :--- | :--- | :--- | :--- |
| **Base** | Continued FDI inflow & supply chain shift | RAO > 8.0, TOS > 0.55 | Maintain overweight position; focus on industrial real estate. |
| **Upside** | Significant improvement in Rule of Law/Corruption | RAO > 8.5, TOS > 0.70 | Aggressive capital deployment; target financial/tech sectors. |
| **Downside** | External demand shock or regulatory gridlock | RAO < 7.0, TOS < 0.40 | Defensive rotation; hedge currency exposure. |

**Bottom Line:** Vietnam is currently in a high-conviction "Pre-Breakout" phase. Investors should prioritize entry into sectors benefiting from structural manufacturing shifts, while closely monitoring the `norm_rule_of_law` and `norm_regulatory_quality` indicators as the primary triggers for a potential transition to a higher-tier growth regime.

---

