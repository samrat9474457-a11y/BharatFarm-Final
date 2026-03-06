// ============================================
// ROADMAP FUNCTIONS – AI-Powered via OpenRouter
// ============================================

// Cache to avoid regenerating the same roadmap multiple times in one session
const roadmapCache = {};

/**
 * Main entry: generate roadmap for any crop.
 * Tries OpenRouter AI first; falls back to static cropData if AI fails.
 */
async function generateRoadmap(cropKey) {
    const timeline = document.getElementById('roadmapTimeline');
    const noRoadmap = document.getElementById('noRoadmap');
    const cropNameEl = document.getElementById('roadmapCropName');

    if (!timeline || !noRoadmap || !cropNameEl) return; // Prevent crashes if elements don't exist

    noRoadmap.style.display = 'none';
    timeline.style.display = 'block';

    // Get crop details from our local database
    const localCrop = CROPS_DATABASE[cropKey];
    const cropDisplayName = localCrop ? localCrop.commonName : cropKey;
    const cropDuration = localCrop ? localCrop.duration : '';

    // Show loading state
    cropNameEl.textContent = `Generating AI Roadmap for ${cropDisplayName}...`;
    timeline.innerHTML = `
        <div style="text-align:center; padding: 2rem;">
            <div class="spinner"></div>
            <p style="margin-top:1rem; color:var(--text-muted);">
                <i class="fas fa-robot"></i> AI is creating your personalized ${cropDisplayName} farming schedule...
            </p>
        </div>`;

    // Check cache first
    if (roadmapCache[cropKey]) {
        renderRoadmap(roadmapCache[cropKey], cropDisplayName, cropDuration);
        return;
    }

    // Check static data first for the 6 pre-defined crops
    const staticCrop = cropData[cropKey];
    if (staticCrop && staticCrop.roadmap && staticCrop.roadmap.length > 0) {
        roadmapCache[cropKey] = staticCrop.roadmap;
        renderRoadmap(staticCrop.roadmap, staticCrop.name, staticCrop.duration);
        return;
    }

    // Use OpenRouter AI to generate a roadmap
    try {
        const aiRoadmap = await fetchAIRoadmap(cropKey, localCrop);
        if (aiRoadmap && aiRoadmap.length > 0) {
            roadmapCache[cropKey] = aiRoadmap;
            renderRoadmap(aiRoadmap, cropDisplayName, cropDuration);
            return;
        }
    } catch (err) {
        console.warn('AI roadmap generation failed, using generic fallback:', err);
    }

    // Ultimate fallback: minimal generic roadmap
    const genericRoadmap = buildGenericRoadmap(localCrop);
    roadmapCache[cropKey] = genericRoadmap;
    renderRoadmap(genericRoadmap, cropDisplayName, cropDuration);
}

/**
 * Call OpenRouter API to generate a structured farming roadmap JSON.
 */
async function fetchAIRoadmap(cropKey, localCrop) {
    const cropName = localCrop ? localCrop.commonName : cropKey;
    const duration = localCrop ? localCrop.duration : '90-120 days';
    const climate = localCrop ? localCrop.climate : 'tropical';
    const soil = localCrop ? localCrop.soil : 'loamy';

    const prompt = `You are an expert Indian agricultural advisor. Generate a detailed farming activity roadmap for ${cropName} (${cropKey}).

Crop details:
- Duration: ${duration}
- Climate: ${climate}
- Soil: ${soil}

Return ONLY a valid JSON array (no markdown, no extra text) with 6-10 timeline items in this exact format:
[
  {"day": 1, "activity": "Land Preparation", "desc": "Brief description of activity.", "type": "prep"},
  {"day": 5, "activity": "Seed Sowing", "desc": "How to sow seeds for this crop.", "type": "seed"},
  ...
]

The "type" field must be one of: "prep", "seed", "water", "fertilizer", "harvest", "pest", "general"
Include: land prep, sowing/planting, first irrigation, 2-3 fertilizer applications (with specific fertilizer names), pest/disease check, and final harvest.
Make day numbers realistic for the crop duration. Keep descriptions concise and specific to ${cropName}.`;

    const raw = await aiCall({
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
        max_tokens: 1000
    });

    // Extract JSON from response (handle if AI wraps in markdown code block)
    const jsonMatch = raw.match(/\[[\s\S]*\]/);
    if (!jsonMatch) throw new Error('No JSON array found in AI response');

    return JSON.parse(jsonMatch[0]);
}

/**
 * Build a minimal generic roadmap from local crop data as last resort.
 */
function buildGenericRoadmap(localCrop) {
    return [
        { day: 1,   activity: 'Land Preparation',   desc: 'Plough and level the field. Add organic compost.', type: 'prep' },
        { day: 3,   activity: 'Sowing / Planting',   desc: localCrop ? `Plant ${localCrop.commonName} at recommended spacing.` : 'Sow seeds at proper depth.', type: 'seed' },
        { day: 7,   activity: 'First Irrigation',    desc: 'Light watering to ensure germination.', type: 'water' },
        { day: 20,  activity: 'Apply Urea',           desc: 'First nitrogen dose to promote vegetative growth.', type: 'fertilizer' },
        { day: 45,  activity: 'Apply DAP & Potash',  desc: 'Ensure root development and stress resistance.', type: 'fertilizer' },
        { day: 60,  activity: 'Pest/Disease Check',  desc: 'Inspect leaves and stems. Apply pesticide if needed.', type: 'pest' },
        { day: 90,  activity: 'Harvest',              desc: localCrop ? `Harvest ${localCrop.commonName} at maturity.` : 'Harvest when crop reaches maturity.', type: 'harvest' }
    ];
}

/**
 * Render day-based roadmap items into the timeline DOM element.
 */
function renderRoadmap(roadmapItems, cropName, duration) {
    const timeline = document.getElementById('roadmapTimeline');
    const cropNameEl = document.getElementById('roadmapCropName');

    cropNameEl.textContent = `Activity Schedule for ${cropName}${duration ? ' (' + duration + ')' : ''}`;

    const typeConfig = {
        prep:       { class: '',           icon: 'fa-tractor',      label: 'Preparation' },
        seed:       { class: '',           icon: 'fa-seedling',     label: 'Sowing'      },
        water:      { class: 'water',      icon: 'fa-tint',         label: 'Irrigation'  },
        fertilizer: { class: 'fertilizer', icon: 'fa-flask',        label: 'Fertilizer'  },
        harvest:    { class: 'harvest',    icon: 'fa-cut',          label: 'Harvest'     },
        pest:       { class: 'fertilizer', icon: 'fa-bug',          label: 'Pest Check'  },
        general:    { class: '',           icon: 'fa-tasks',        label: 'Activity'    }
    };

    timeline.innerHTML = roadmapItems.map(item => {
        const cfg = typeConfig[item.type] || typeConfig.general;
        return `
            <div class="timeline-item ${cfg.class}">
                <span class="day-badge">Day ${item.day}</span>
                <h3><i class="fas ${cfg.icon}" style="margin-right:6px;opacity:0.8;"></i>${item.activity}</h3>
                <p>${item.desc}</p>
            </div>`;
    }).join('');
}

/**
 * Render the 10-stage roadmap format from the unified API response.
 * Called by selectCrop when the unified API call succeeds.
 */
function renderRoadmapStages(roadmapStages, cropName, duration) {
    const timeline = document.getElementById('roadmapTimeline');
    const noRoadmap = document.getElementById('noRoadmap');
    const cropNameEl = document.getElementById('roadmapCropName');

    noRoadmap.style.display = 'none';
    timeline.style.display = 'block';
    cropNameEl.textContent = `Farming Roadmap for ${cropName}${duration ? ' (' + duration + ')' : ''}`;

    const stageIcons = {
        'Land Preparation': 'fa-tractor',
        'Seed Selection': 'fa-seedling',
        'Sowing': 'fa-seedling',
        'Irrigation': 'fa-tint',
        'Fertilization': 'fa-flask',
        'Weed Management': 'fa-leaf',
        'Pest & Disease Control': 'fa-bug',
        'Growth Monitoring': 'fa-chart-line',
        'Harvesting': 'fa-cut',
        'Storage': 'fa-warehouse'
    };

    const stageColors = {
        'Land Preparation': '#3498db',
        'Seed Selection': '#27ae60',
        'Sowing': '#2ecc71',
        'Irrigation': '#00bcd4',
        'Fertilization': '#f39c12',
        'Weed Management': '#8bc34a',
        'Pest & Disease Control': '#e74c3c',
        'Growth Monitoring': '#9b59b6',
        'Harvesting': '#ff9800',
        'Storage': '#607d8b'
    };

    timeline.innerHTML = roadmapStages.map((item, index) => {
        const icon = stageIcons[item.stage] || 'fa-tasks';
        const color = stageColors[item.stage] || 'var(--primary)';
        const stageNum = index + 1;
        return `
            <div class="timeline-item" style="border-left-color: ${color};">
                <span class="day-badge" style="background: ${color};">Stage ${stageNum}</span>
                <h3><i class="fas ${icon}" style="margin-right:6px; color:${color};"></i>${item.stage}</h3>
                <p>${item.details}</p>
            </div>`;
    }).join('');
}
