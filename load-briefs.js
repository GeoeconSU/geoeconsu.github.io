/**
 * Strategic Briefs Dynamic Loader
 * Latest 3 in featured grid + horizontal carousel for the rest
 */

async function loadStrategicBriefs() {
    const container = document.getElementById('strategic-briefs-grid');
    if (!container) return;

    try {
        const response = await fetch('briefs.json');
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        const briefs = data.briefs;

        container.innerHTML = '';

        if (!briefs || briefs.length === 0) {
            container.innerHTML = '<p style="opacity:0.6;text-align:center;">No briefs available.</p>';
            return;
        }

        // --- Featured grid: latest 3 ---
        const featuredGrid = document.createElement('div');
        featuredGrid.className = 'brief-featured-grid';
        briefs.slice(0, 3).forEach(brief => {
            featuredGrid.appendChild(createFeaturedCard(brief));
        });
        container.appendChild(featuredGrid);

        // --- Carousel for the rest ---
        if (briefs.length > 3) {
            const carouselSection = document.createElement('div');
            carouselSection.style.marginTop = '2.5rem';

            const controls = document.createElement('div');
            controls.className = 'carousel-controls';
            controls.innerHTML = `
                <button class="control-btn" id="briefPrevBtn">&#8592;</button>
                <button class="control-btn" id="briefNextBtn">&#8594;</button>
            `;

            const carouselWrapper = document.createElement('div');
            carouselWrapper.className = 'carousel-wrapper';

            const carousel = document.createElement('div');
            carousel.className = 'carousel';
            carousel.id = 'briefsCarousel';

            briefs.slice(3).forEach(brief => {
                carousel.appendChild(createBriefCard(brief));
            });

            carouselWrapper.appendChild(carousel);
            carouselSection.appendChild(controls);
            carouselSection.appendChild(carouselWrapper);
            container.appendChild(carouselSection);

            // Wire up controls after DOM insertion
            setTimeout(() => {
                const c = document.getElementById('briefsCarousel');
                document.getElementById('briefNextBtn').addEventListener('click', () => c.scrollBy({ left: 310, behavior: 'smooth' }));
                document.getElementById('briefPrevBtn').addEventListener('click', () => c.scrollBy({ left: -310, behavior: 'smooth' }));
            }, 0);
        }

        console.log(`✅ Loaded ${briefs.length} strategic briefs`);

    } catch (error) {
        console.error('Error loading strategic briefs:', error);
        document.getElementById('strategic-briefs-grid').innerHTML =
            '<p style="opacity:0.6;text-align:center;">Unable to load strategic briefs.</p>';
    }
}

function createFeaturedCard(brief) {
    const anchor = document.createElement('a');
    anchor.href = brief.href;
    anchor.target = '_blank';
    anchor.className = 'brief-featured';
    anchor.innerHTML = `
        <span class="brief-category">${escapeHtml(brief.category)}</span>
        <h3 class="brief-featured-title">${escapeHtml(brief.title)}</h3>
        <p class="brief-featured-subtitle">${escapeHtml(brief.subtitle)}</p>
        <span class="brief-author">By ${escapeHtml(brief.author)}</span>
        <span class="brief-read-link">Read Brief &rarr;</span>
    `;
    return anchor;
}

function createBriefCard(brief) {
    // Apply brief-card class directly to anchor so carousel flex sizing works
    const anchor = document.createElement('a');
    anchor.href = brief.href;
    anchor.target = '_blank';
    anchor.style.textDecoration = 'none';
    anchor.className = 'brief-card';
    anchor.innerHTML = `
        <span class="brief-category">${escapeHtml(brief.category)}</span>
        <h3 class="brief-card-title">${escapeHtml(brief.title)}</h3>
        <p class="brief-card-subtitle">${escapeHtml(brief.subtitle)}</p>
        <span class="brief-author">By ${escapeHtml(brief.author)}</span>
        <span class="brief-read-link">Read &rarr;</span>
    `;
    return anchor;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadStrategicBriefs);
} else {
    loadStrategicBriefs();
}
