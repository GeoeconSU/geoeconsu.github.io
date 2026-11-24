/**
 * GRB Report Buttons Dynamic Loader
 *
 * Replaces the old hardcoded "GRB Q2 2026 / Q1 2026 / Q4 2025" buttons with
 * ones generated from the Firestore `sections/barometer/events`
 * subcollection (admin.html's Documents tab — Sections → Events → Files),
 * newest first. Each release is one Event nested under the 'barometer'
 * section — the admin console's section must be named exactly "Barometer"
 * so it slugifies to this doc ID. The button opens the gate for that
 * event's *active* file's title — see gsu-gate's lookupApprovedGrbReport,
 * which resolves that exact title back to a downloadURL via the same
 * approved+visible condition. Clicking a button still calls the same
 * openGate(title) the lead-capture modal already uses (see the <script>
 * block right after #gateOverlay) — only how the button list itself is
 * built has changed, not the gate/email flow.
 */

async function loadGrbReportButtons() {
    const container = document.getElementById('grb-report-buttons');
    if (!container) return;

    try {
        const snap = await db.collection('sections').doc('barometer').collection('events')
            .where('status', '==', 'approved')
            .where('visible', '==', true)
            .get();

        const reports = snap.docs
            .map(d => {
                const data = d.data();
                return {
                    title: data.title || '',
                    quarterLabel: data.topicTag || data.title || '',
                    hasActiveFile: !!data.activeFileURL,
                    createdAt: data.createdAt && data.createdAt.toMillis ? data.createdAt.toMillis() : 0
                };
            })
            .filter(r => r.hasActiveFile)
            .sort((a, b) => b.createdAt - a.createdAt);

        if (!reports.length) {
            container.innerHTML = '';
            return;
        }

        container.innerHTML = reports.map((r, i) => {
            const style = i === 0 ? '' : i === 1 ? 'margin-left:1rem;opacity:0.7;' : 'margin-left:0.5rem;opacity:0.5;';
            const label = i === 0 ? `Download ${escapeGrbHtml(r.quarterLabel)} Report (PDF)` : escapeGrbHtml(r.quarterLabel);
            return `<button class="btn" style="${style}" onclick="openGate('${escapeGrbAttr(r.title)}')">${label}</button>`;
        }).join('');

    } catch (error) {
        console.error('Error loading GRB reports:', error);
    }
}

function escapeGrbHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
function escapeGrbAttr(text) {
    return String(text).replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadGrbReportButtons);
} else {
    loadGrbReportButtons();
}
