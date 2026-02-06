/**
 * Strategic Briefs Dynamic Loader
 * Fetches briefs.json and generates matching UI cards
 */

async function loadStrategicBriefs() {
    const container = document.getElementById('strategic-briefs-grid');

    if (!container) {
        console.error('Strategic briefs container not found');
        return;
    }

    try {
        // Fetch briefs.json
        const response = await fetch('briefs.json');

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        // Clear existing content (loading state)
        container.innerHTML = '';

        // Generate cards for each brief
        data.briefs.forEach(brief => {
            const card = createBriefCard(brief);
            container.appendChild(card);
        });

        console.log(`✅ Loaded ${data.briefs.length} strategic briefs`);

    } catch (error) {
        console.error('Error loading strategic briefs:', error);
        container.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; padding: 2rem; opacity: 0.6;">
                <p>Unable to load strategic briefs. Please try again later.</p>
            </div>
        `;
    }
}

function createBriefCard(brief) {
    // Create anchor element
    const anchor = document.createElement('a');
    anchor.href = brief.href;
    anchor.target = '_blank';
    anchor.style.textDecoration = 'none';

    // Create card div
    const card = document.createElement('div');
    card.className = 'card';
    card.style.height = '100%';
    card.style.transition = 'all 0.3s ease';
    card.style.cursor = 'pointer';

    // Build card HTML
    card.innerHTML = `
        <h4 style="margin-bottom: 0.5rem; font-size: 0.9rem;">${escapeHtml(brief.category)}</h4>
        <h3 style="color: var(--accent-gold); margin-bottom: 0.5rem; font-size: 1.8rem;">${escapeHtml(brief.title)}</h3>
        <p style="font-style: italic; opacity: 0.8; margin-bottom: 0.5rem;">${escapeHtml(brief.subtitle)}</p>
        <span style="display:block; font-size: 0.85rem; color: var(--accent-gold); margin-bottom: 1rem; text-transform: uppercase; letter-spacing: 0.5px;">By ${escapeHtml(brief.author)}</span>
        <p style="font-size: 0.95rem;">${escapeHtml(brief.description)}</p>
        <span style="color: var(--accent-gold); font-size: 0.9rem; margin-top: 1rem; display: inline-block;">Read Brief &rarr;</span>
    `;

    anchor.appendChild(card);
    return anchor;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Load briefs when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadStrategicBriefs);
} else {
    // DOM already loaded
    loadStrategicBriefs();
}
