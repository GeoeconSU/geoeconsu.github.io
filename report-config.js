// ═══════════════════════════════════════════════════════════════════════════
// Country Report (PDF export) — format & content config
//
// This is the one file to edit when iterating on the Analysis-tab "Export
// Country Report" PDF (dashboard.html → exportCountryReport()). It does not
// touch any other part of the dashboard.
//
//   REPORT_THEME    — colors used throughout the report. Change a value here
//                      and it updates everywhere that color is used.
//   REPORT_SECTIONS — which sections appear, in what order, and where page
//                      breaks fall. Reorder the array, flip `enabled` to drop
//                      a section, or set `newPage` to start a fresh page.
//   REPORT_COPY     — editable text: headings, the "prepared by" line, the
//                      footer disclaimer, etc. {tokens} are filled in at
//                      render time (see each entry's comment for which).
//
// Adding a genuinely new section (not just reordering/retitling an existing
// one) still requires a developer to write its builder function in
// dashboard.html's SECTION_BUILDERS registry — this file only controls
// which registered sections render and how they're labelled/themed.
// ═══════════════════════════════════════════════════════════════════════════

const REPORT_THEME = {
    ink:         '#192030', // headings, borders, primary print text
    accent:      '#C2A56D', // GSU gold — subtitle, RAO score, highlights
    muted:       '#8a8578', // kpi labels, table headers, secondary text
    mutedLight:  '#9a968a', // footer text
    metaText:    '#6b7280', // header "prepared by / date" block
    positive:    '#4a7a5c', // "above average" indicator values
    negative:    '#9c4a4a', // "below average" indicator values
    stability:   '#607c98', // Stability / Absorptive Capacity pillar figures
    trajectory:  '#5d8a72', // Trajectory pillar figures
    border:      '#e5e2da', // kpi box borders
    borderMid:   '#ccc',    // table header rule
    borderLight: '#ddd',    // section-title / footer rules
    borderFaint: '#eee',    // table row rules
    rowSelfTint: 'rgba(194,165,109,0.1)', // "this market" row highlight
};

// `newPage: true` starts a new printed page before that section; the first
// enabled section always begins page 1 regardless of its own flag.
const REPORT_SECTIONS = [
    { id: 'header',              enabled: true, newPage: true  },
    { id: 'kpiRow',              enabled: true, newPage: false },
    { id: 'contextLine',         enabled: true, newPage: false },
    { id: 'scoreDecomposition',  enabled: true, newPage: false, title: 'Score Decomposition' },
    { id: 'pillarProfile',       enabled: true, newPage: false, title: 'Four-Pillar Profile' },
    { id: 'trajectory',          enabled: true, newPage: true,  title: 'RAO Score Trajectory (2010–{year})' },
    { id: 'regimeHistory',       enabled: true, newPage: false, title: 'Regime History' },
    { id: 'strengthsWeaknesses', enabled: true, newPage: false, strengthsTitle: 'Top Strengths', weaknessesTitle: 'Key Weaknesses' },
    { id: 'peerComparison',      enabled: true, newPage: false, title: 'Archetype Peer Comparison — {archetype}' },
    { id: 'footer',              enabled: true, newPage: false },
];

const REPORT_COPY = {
    logoSrc:      'assets/GSU_Navy_Transparent.png',
    subtitle:     'RAO Country Briefing · Confidential',
    preparedBy:   'Prepared by the Geoeconomic Strategy Unit', // header, next to the date
    noHistoryMsg: 'No historical data available.',             // trajectory section, no chart image
    noRegimeMsg:  'No regime transitions recorded.',
    noPeersMsg:   'No archetype peers found.',
    selfRowLabel: '{countryName} (this market)',                // peer comparison table
    // {marketCount} and {year} are filled from the report's own data.
    footerLegal:
        "The RAO (Risk-Adjusted Opportunity) Score is the Geoeconomic Strategy Unit's proprietary composite index, " +
        "combining 22 macro, governance and trajectory indicators across four pillars — Opportunity, Stability, " +
        "Absorptive Capacity and Trajectory — into a single comparable measure across {marketCount} markets. This " +
        "document reflects data as of {year}, is provided for informational purposes only, and does not constitute " +
        "investment advice.",
    // {yr} is the current year at export time.
    footerContact: '© {yr} The Sixteenth Council / Geoeconomic Strategy Unit · geoecon@16thcouncil.uk · www.16thcouncil.uk',
};

// Pushes REPORT_THEME's colors into CSS as custom properties so the print
// stylesheet (dashboard.html's @media print rules) and the report's own
// inline styles both read from one place. Runs once, on load.
(function applyReportTheme() {
    const root = document.documentElement.style;
    Object.entries(REPORT_THEME).forEach(([key, value]) => {
        root.setProperty(`--ir-${key}`, value);
    });
})();
