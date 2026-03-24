// js/schemes.js
// ============================================================
// AI-Powered Government Scheme Matchmaker
// Uses Gemini (via backend /api/schemes) for real-time,
// state-specific scheme matching with official portal links.
// ============================================================

let currentWizardStep = 1;
const BACKEND_URL = '';

// ── Wizard Navigation ─────────────────────────────────────────

function setSchemesStep(step) {
    if (step > currentWizardStep) {
        if (currentWizardStep === 1) {
            const ls = document.getElementById('schemeLandSize').value;
            if (!ls || isNaN(ls) || parseFloat(ls) < 0) {
                showToast('Please enter a valid land size (0 or more acres).', 'warning');
                return;
            }
        } else if (currentWizardStep === 2) {
            const st = document.getElementById('schemeStateSelect').value;
            if (!st) {
                showToast('Please select your state.', 'warning');
                return;
            }
        }
    }

    currentWizardStep = step;

    document.querySelectorAll('.wizard-progress .progress-step').forEach((el, index) => {
        const stepNum = index + 1;
        el.classList.remove('active', 'completed');
        if (stepNum < step) {
            el.classList.add('completed');
            el.innerHTML = '<i class="fas fa-check"></i>';
        } else if (stepNum === step) {
            el.classList.add('active');
            el.innerHTML = stepNum;
        } else {
            el.innerHTML = stepNum;
        }
    });

    document.querySelectorAll('.wizard-step').forEach(el => el.classList.remove('active'));
    const stepEl = document.getElementById(`schemeStep${step}`);
    if (stepEl) stepEl.classList.add('active');
}

function nextSchemesStep() {
    if (currentWizardStep < 3) setSchemesStep(currentWizardStep + 1);
}

function prevSchemesStep() {
    if (currentWizardStep > 1) setSchemesStep(currentWizardStep - 1);
}

// ── Submit Form & Call AI Backend ───────────────────────────

async function submitSchemesForm() {
    const landSize = parseFloat(document.getElementById('schemeLandSize').value) || 0;
    const state    = document.getElementById('schemeStateSelect').value;
    const crop     = document.getElementById('schemeCropSelect').value.trim();

    if (!state) {
        showToast('Please select your state first.', 'warning');
        setSchemesStep(2);
        return;
    }

    // Hide wizard, show loader
    document.getElementById('schemesWizard').style.display = 'none';
    document.getElementById('schemesResults').classList.remove('active');
    const loader = document.getElementById('schemesLoader');
    loader.classList.add('active');

    // Update loader text
    const loaderTitle = document.getElementById('schemesLoaderTitle');
    const loaderMsg   = document.getElementById('schemesLoaderMsg');
    
    if (loaderTitle) loaderTitle.textContent = currentLanguage === 'bn' ? 'সন্ধান চলছে...' : (currentLanguage === 'hi' ? 'खोज रहे हैं...' : 'Searching...');
    if (loaderMsg) loaderMsg.style.display = 'none';

    try {
        const response = await fetch(`${BACKEND_URL}/api/schemes`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ landSize, state, crop })
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
            throw new Error(data.error || 'Failed to fetch schemes from server.');
        }

        loader.classList.remove('active');
        renderMatchedSchemes(data.schemes, state, landSize, crop);
        document.getElementById('schemesResults').classList.add('active');

    } catch (err) {
        console.error('[Schemes] Error fetching AI schemes:', err);
        loader.classList.remove('active');

        // Fallback to local JSON data
        console.warn('[Schemes] Falling back to local JSON data...');
        try {
            const fallbackRes = await fetch('js/schemesData.json');
            const allSchemes  = await fallbackRes.json();
            const matched = filterLocalSchemes(allSchemes, landSize, state, crop);
            renderMatchedSchemes(matched, state, landSize, crop, true);
            document.getElementById('schemesResults').classList.add('active');
        } catch (fallbackErr) {
            renderError('Could not load scheme data. Please check your connection.');
            document.getElementById('schemesResults').classList.add('active');
        }
    }
}

// ── Local Fallback Filter ────────────────────────────────────

function filterLocalSchemes(allSchemes, landSize, state, crop) {
    return allSchemes.filter(scheme => {
        const landMatch  = landSize >= scheme.eligibility.minLandSize && landSize <= scheme.eligibility.maxLandSize;
        const stateMatch = scheme.eligibility.states.includes('All') || scheme.eligibility.states.includes(state);
        let cropMatch    = scheme.eligibility.crops.includes('All');
        if (!cropMatch && crop) {
            cropMatch = scheme.eligibility.crops.some(c =>
                c.toLowerCase().includes(crop.toLowerCase()) || crop.toLowerCase().includes(c.toLowerCase())
            );
        }
        return landMatch && stateMatch && cropMatch;
    });
}

// ── Reset Form ────────────────────────────────────────────────

function resetSchemesForm() {
    document.getElementById('schemesResults').classList.remove('active');
    document.getElementById('schemesWizard').style.display = 'block';
    document.getElementById('schemeLandSize').value = '';
    document.getElementById('schemeStateSelect').value = '';
    document.getElementById('schemeCropSelect').value = '';
    setSchemesStep(1);
}

// ── Render Matched Schemes ────────────────────────────────────

function renderMatchedSchemes(schemes, state, landSize, crop, isFallback = false) {
    const grid   = document.getElementById('schemesGrid');
    const header = document.getElementById('matchedCount');

    if (!grid) return;
    grid.innerHTML = '';

    if (!schemes || schemes.length === 0) {
        header.textContent = '0 matches found';
        grid.innerHTML = `
            <div class="schemes-empty">
                <i class="fas fa-search-minus"></i>
                <h4>No Schemes Found</h4>
                <p>We couldn't find schemes matching your profile right now. Try adjusting your inputs or check back later.</p>
                <button class="btn btn-primary" style="margin-top: 15px;" onclick="resetSchemesForm()">Try Again</button>
            </div>`;
        return;
    }

    const fallbackBadge = isFallback
        ? `<div style="grid-column: 1 / -1; background: rgba(76,175,80,0.08); color: #2e7d32; border: 1px solid rgba(76,175,80,0.2); border-radius: 10px; padding: 12px 18px; margin-bottom: 24px; font-size: 0.95rem; display: flex; align-items: center; gap: 10px; font-weight: 500;">
               <i class="fas fa-info-circle" style="color: var(--primary);"></i> Based on your profile, here are the applicable government schemes.
           </div>`
        : `<div style="grid-column: 1 / -1; background: linear-gradient(90deg, rgba(76,175,80,0.1), rgba(33,150,243,0.1)); border: 1px solid rgba(76,175,80,0.25); border-radius: 12px; padding: 12px 18px; margin-bottom: 24px; font-size: 0.95rem; display: flex; align-items: center; gap: 12px; color: #1b5e20; font-weight: 500;">
               <i class="fas fa-magic" style="color: #2196f3;"></i> Smart-Matched schemes specifically for <strong style="margin: 0 4px; color: #2e7d32;">${state}</strong> farmers.
           </div>`;

    header.textContent = `${schemes.length} Scheme${schemes.length > 1 ? 's' : ''} Matched`;

    grid.insertAdjacentHTML('beforeend', fallbackBadge);

    schemes.forEach(sc => {
        const benefitsHtml = (sc.benefits || [])
            .map(b => `<span class="benefit-tag"><i class="fas fa-check"></i> ${b}</span>`)
            .join('');

        const stepsHtml = (sc.applySteps || [])
            .map((s, i) => `<div class="apply-step"><span class="step-num">${i + 1}</span><span>${s}</span></div>`)
            .join('');

        const landLabel = sc.eligibility && sc.eligibility.maxLandSize >= 9999
            ? (sc.eligibility.minLandSize === 0 ? 'Any Size' : `${sc.eligibility.minLandSize}+ acres`)
            : (sc.eligibility ? `${sc.eligibility.minLandSize}–${sc.eligibility.maxLandSize} acres` : 'Any');

        const statesLabel = sc.eligibility && sc.eligibility.states
            ? (sc.eligibility.states.includes('All') ? 'All States' : sc.eligibility.states.join(', '))
            : state;

        const cropsLabel = sc.eligibility && sc.eligibility.crops
            ? (sc.eligibility.crops.includes('All') ? 'All Crops' : sc.eligibility.crops.join(', '))
            : 'All Crops';

        const shareText = encodeURIComponent(
            `*${sc.name}*\n${sc.description}\n\nApply here: ${sc.link}\n\nShared via BharatFarm 🌱`
        );

        const typeColor = {
            'Central': '#1565c0',
            'State': '#2e7d32',
            'Central/State': '#6a1b9a'
        }[sc.type] || '#555';

        const card = document.createElement('div');
        card.className = 'scheme-card';
        card.innerHTML = `
            <div class="scheme-badge-type" style="background: ${typeColor}15; color: ${typeColor}; border: 1px solid ${typeColor}30;">${sc.type}</div>
            <h4>${sc.name}</h4>
            <p class="scheme-desc">${sc.description}</p>

            <div class="scheme-info-section">
                <div class="scheme-info-title">
                    <i class="fas fa-user-check"></i> Eligibility
                </div>
                <div class="scheme-eligibility-tags">
                    <span class="eligibility-tag"><i class="fas fa-ruler-combined"></i> ${landLabel}</span>
                    <span class="eligibility-tag"><i class="fas fa-map-marker-alt"></i> ${statesLabel}</span>
                    <span class="eligibility-tag"><i class="fas fa-seedling"></i> ${cropsLabel}</span>
                </div>
            </div>

            <div class="scheme-info-section">
                <div class="scheme-info-title">
                    <i class="fas fa-gift"></i> Benefits
                </div>
                <div class="scheme-benefits">
                    ${benefitsHtml}
                </div>
            </div>

            ${stepsHtml ? `
            <div class="scheme-info-section">
                <div class="scheme-info-title">
                    <i class="fas fa-list-ol"></i> How to Apply
                </div>
                <div class="scheme-apply-steps">
                    ${stepsHtml}
                </div>
            </div>` : ''}

            <div class="scheme-actions">
                <a href="${sc.link}" target="_blank" rel="noopener noreferrer" class="btn-apply-scheme"
                   onclick="trackSchemeApply('${sc.id}', '${sc.name}')">
                   Apply Now <i class="fas fa-external-link-alt"></i>
                </a>
                <button class="btn-share" onclick="window.open('https://wa.me/?text=${shareText}', '_blank')" title="Share on WhatsApp">
                    <i class="fab fa-whatsapp"></i>
                </button>
            </div>
        `;
        grid.appendChild(card);
    });
}

// ── Error Render ─────────────────────────────────────────────

function renderError(message) {
    const grid = document.getElementById('schemesGrid');
    const header = document.getElementById('matchedCount');
    if (header) header.textContent = 'Error';
    if (grid) {
        grid.innerHTML = `
            <div class="schemes-empty">
                <i class="fas fa-exclamation-circle" style="color: var(--danger);"></i>
                <h4>Something Went Wrong</h4>
                <p>${message}</p>
                <button class="btn btn-primary" style="margin-top: 15px;" onclick="resetSchemesForm()">Try Again</button>
            </div>`;
    }
}

// ── Track Apply Click (Analytics) ───────────────────────────

function trackSchemeApply(id, name) {

    
    // Save to local analytics
    try {
        let appliedSchemes = JSON.parse(localStorage.getItem('appliedSchemes') || '[]');
        
        // Prevent duplicate entries for the exact same scheme click today
        const today = new Date().toISOString().split('T')[0];
        const existing = appliedSchemes.find(s => s.id === id && s.date === today);
        
        if (!existing) {
            appliedSchemes.push({
                id: id,
                name: name,
                date: today,
                timestamp: new Date().toISOString()
            });
            localStorage.setItem('appliedSchemes', JSON.stringify(appliedSchemes));

        }
    } catch(e) {
        console.error('[Analytics] Error saving scheme application data:', e);
    }
}

// ── Toast Helper ─────────────────────────────────────────────

function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    const colors = {
        warning: '#e65100',
        info: '#1565c0',
        success: 'var(--primary)'
    };
    toast.style.cssText = `
        position: fixed; bottom: 90px; left: 50%; transform: translateX(-50%);
        background: ${colors[type] || '#333'}; color: white;
        padding: 12px 24px; border-radius: 30px; font-weight: 600;
        font-size: 0.9rem; z-index: 99999; box-shadow: 0 4px 20px rgba(0,0,0,0.3);
        display: flex; align-items: center; gap: 8px; white-space: nowrap;
    `;
    toast.innerHTML = `<i class="fas fa-${type === 'warning' ? 'exclamation-triangle' : 'info-circle'}"></i> ${message}`;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3500);
}

// ── Compatibility stubs ──────────────────────────────────────
function matchSchemes() { submitSchemesForm(); }
