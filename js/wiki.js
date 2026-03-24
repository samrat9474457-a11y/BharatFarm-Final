// js/wiki.js
// Crop Health Wiki — Disease Encyclopedia

let wikiData = [];
let currentWikiFilter = 'all';
const wikiGrid = document.getElementById('wikiGrid');

// Fetch Wiki Data from Backend (uses relative URL for portability)
async function fetchWikiData() {
    try {
        const response = await fetch('/api/wiki');
        if (!response.ok) throw new Error('Network response was not ok');
        const data = await response.json();
        
        if (data.success) {
            wikiData = data.data;
            renderWikiGrid(wikiData);
        } else {
            console.error("Failed to load wiki data:", data.error);
            wikiGrid.innerHTML = '<div class="wiki-loading" style="color:var(--danger)">Failed to load data. Please try again later.</div>';
        }
    } catch (error) {
        console.error("Error fetching wiki data:", error);
        wikiGrid.innerHTML = '<div class="wiki-loading" style="color:var(--danger)">Error connecting to server.</div>';
    }
}

// Render the grid of disease cards
function renderWikiGrid(dataToRender) {
    if (!wikiGrid) return;
    
    wikiGrid.innerHTML = '';
    
    if (dataToRender.length === 0) {
        wikiGrid.innerHTML = '<div class="wiki-loading">No results found for your search.</div>';
        return;
    }
    
    dataToRender.forEach(disease => {
        const card = document.createElement('div');
        card.className = 'disease-card';
        card.onclick = () => openWikiModal(disease.id);
        
        let catBadge = '';
        if (disease.category === 'plant') catBadge = '<i class="fas fa-seedling"></i> Plant';
        else if (disease.category === 'pest') catBadge = '<i class="fas fa-bug"></i> Pest';
        else if (disease.category === 'soil') catBadge = '<i class="fas fa-water"></i> Soil';
        else if (disease.category === 'food') catBadge = '<i class="fas fa-box-open"></i> Storage';

        card.innerHTML = `
            <div class="dc-content">
                <div class="dc-badges">
                    <span class="dc-badge severity-${disease.severity}">${disease.severity.toUpperCase()} Priority</span>
                    <span class="dc-badge">${catBadge}</span>
                    <span class="dc-badge"><i class="fas fa-tractor"></i> ${disease.crop}</span>
                </div>
                <h3 class="dc-title">${disease.name_en}</h3>
                <div class="dc-title-bn">${disease.name_bn || ''}</div>
                <div class="dc-desc">${disease.description}</div>
            </div>
        `;
        wikiGrid.appendChild(card);
    });
}

// Search functionality
function searchWiki(query) {
    query = query.toLowerCase().trim();
    
    let filtered = wikiData.filter(d => {
        const matchName = d.name_en.toLowerCase().includes(query) || (d.name_bn && d.name_bn.includes(query));
        const matchCrop = d.crop.toLowerCase().includes(query);
        const matchDesc = d.description.toLowerCase().includes(query);
        
        const textMatch = matchName || matchCrop || matchDesc;
        const catMatch = currentWikiFilter === 'all' || d.category === currentWikiFilter;
        
        return textMatch && catMatch;
    });
    
    renderWikiGrid(filtered);
}

// Category filter
function filterWiki(category, el) {
    currentWikiFilter = category;
    
    // Update active chip
    const chips = document.querySelectorAll('#wikiCategories .chip');
    chips.forEach(c => c.classList.remove('active'));
    if (el) el.classList.add('active');
    
    // Re-run search text filter
    const query = document.getElementById('wikiSearch').value;
    searchWiki(query);
}

// Create and handle the Disease Modal dynamically
function openWikiModal(diseaseId) {
    const disease = wikiData.find(d => d.id === diseaseId);
    if (!disease) return;

    let modalOverlay = document.getElementById('wikiModalOverlay');
    if (!modalOverlay) {
        modalOverlay = document.createElement('div');
        modalOverlay.id = 'wikiModalOverlay';
        modalOverlay.className = 'wiki-modal-overlay';
        modalOverlay.innerHTML = `
            <div class="wiki-modal">
                <div class="wm-header">
                    <div class="wm-title-group">
                        <h2 id="wmTitleEn"></h2>
                        <h3 id="wmTitleBn"></h3>
                        <span id="wmScientific" style="font-style: italic; color: var(--text-muted); font-size: 0.9rem;"></span>
                    </div>
                    <button class="wm-close" onclick="closeWikiModal()"><i class="fas fa-times"></i></button>
                </div>
                <div class="wm-body" id="wmBody">
                    <!-- Content injected here -->
                </div>
            </div>
        `;
        document.body.appendChild(modalOverlay);
        
        // Close on clicking outside
        modalOverlay.addEventListener('click', (e) => {
            if (e.target === modalOverlay) closeWikiModal();
        });
    }

    // Populate Data
    document.getElementById('wmTitleEn').textContent = disease.name_en;
    document.getElementById('wmTitleBn').textContent = disease.name_bn || '';
    document.getElementById('wmScientific').textContent = disease.scientific_name ? `(${disease.scientific_name})` : '';

    const bodyHtml = `
        <div class="wm-section">
            <h4><i class="fas fa-info-circle"></i> Overview</h4>
            <p style="color:var(--text-secondary); line-height:1.6;">${disease.description}</p>
        </div>
        
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; margin-bottom: 1.8rem;">
            <div class="wm-section" style="margin-bottom:0;">
                <h4><i class="fas fa-search-plus"></i> Symptoms</h4>
                <ul class="wm-list">
                    ${disease.symptoms.map(s => `<li>${s}</li>`).join('')}
                </ul>
            </div>
            <div class="wm-section" style="margin-bottom:0;">
                <h4><i class="fas fa-biohazard"></i> Causes</h4>
                <ul class="wm-list">
                    ${disease.causes.map(c => `<li>${c}</li>`).join('')}
                </ul>
            </div>
        </div>

        <div class="wm-section">
            <h4><i class="fas fa-shield-alt"></i> Prevention</h4>
            <ul class="wm-list">
                ${disease.prevention.map(p => `<li>${p}</li>`).join('')}
            </ul>
        </div>

        <div class="wm-section">
            <h4><i class="fas fa-flask"></i> Treatments & Solutions</h4>
            ${disease.solutions.biological && disease.solutions.biological.length > 0 ? 
                `<h5>Biological / Organic</h5>
                <ul class="wm-list" style="margin-bottom: 1rem;">
                    ${disease.solutions.biological.map(b => `<li>${b}</li>`).join('')}
                </ul>` : ''
            }
            ${disease.solutions.home_remedies && disease.solutions.home_remedies.length > 0 ? 
                `<h5>Farmer Home Remedies</h5>
                <ul class="wm-list" style="margin-bottom: 1rem;">
                    ${disease.solutions.home_remedies.map(h => `<li>${h}</li>`).join('')}
                </ul>` : ''
            }
            ${disease.solutions.chemical && disease.solutions.chemical.length > 0 ? 
                `<h5>Chemical Treatments</h5>
                <table class="wm-table">
                    <tr><th>Chemical / Fertilizer</th><th>Dosage & Usage</th></tr>
                    ${disease.solutions.chemical.map(c => `<tr><td>${c.fertilizer_or_pesticide}</td><td>${c.usage} - ${c.dosage}</td></tr>`).join('')}
                </table>` : ''
            }
        </div>

        ${disease.fertilizers_recommended && disease.fertilizers_recommended.length > 0 ? 
            `<div class="wm-section">
                <h4><i class="fas fa-seedling"></i> Fertilizer Recommendations</h4>
                <table class="wm-table">
                    <tr><th>Name</th><th>Type</th><th>Purpose</th></tr>
                    ${disease.fertilizers_recommended.map(f => `<tr><td>${f.name}</td><td><span class="dc-badge">${f.type}</span></td><td>${f.purpose}</td></tr>`).join('')}
                </table>
            </div>` : ''
        }

    `;

    document.getElementById('wmBody').innerHTML = bodyHtml;
    modalOverlay.style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

function closeWikiModal() {
    const modalOverlay = document.getElementById('wikiModalOverlay');
    if (modalOverlay) {
        modalOverlay.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
}

// Load data immediately on page load to be ready
document.addEventListener('DOMContentLoaded', () => {
    fetchWikiData();
});
