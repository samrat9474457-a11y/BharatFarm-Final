// ============================================
// CROPS FUNCTIONS (BharatFarm Real Crop Database)
// ============================================
// Uses local CROPS_DATABASE with image fetching from Unsplash/Pexels

let cropState = {
    results: [],
    filteredResults: [],
    query: '',
    category: 'all',
    page: 1,
    pageSize: 12,
    loading: false,
    imageCache: {} // Cache fetched images to avoid duplicate API calls
};

// No hardcoded static images — all images fetched from Unsplash API search
// using the imageKeywords defined in cropsData.js
const STATIC_IMAGES = {};

let debounceTimer;

function initCropGrid() {
    // Initial fetch for all crops
    fetchCrops();
}

/**
 * Fetch crop image from Unsplash API
 * @param {string} keywords - Search keywords for the crop
 * @param {string} cropId - Crop ID for caching
 */
async function fetchCropImageFromUnsplash(keywords, cropId) {
    // Return cached image if available
    if (cropState.imageCache[cropId]) {
        return cropState.imageCache[cropId];
    }

    // Use fallback image if no API enabled
    if (!USE_UNSPLASH) {
        const fallbackUrl = `https://placehold.co/400x300/e0f2f1/004d40?text=${encodeURIComponent(cropId)}`; // Generic crop image
        cropState.imageCache[cropId] = fallbackUrl;
        return fallbackUrl;
    }

    try {
        let imageUrl;
        // first attempt with provided keywords
        // Use serverless function proxy to hide API key
        let response = await fetch(
            `/api/unsplash?query=${encodeURIComponent(keywords)}`
        );
        if (!response.ok) throw new Error('Unsplash API error');
        let data = await response.json();
        if (data.results && data.results.length > 0) {
            imageUrl = data.results[0].urls.small;
        } else {
            console.warn(`Unsplash returned no image for query "${keywords}" (crop ${cropId})`);
            // try again using cropId or common name alone through proxy
            response = await fetch(
                `/api/unsplash?query=${encodeURIComponent(cropId)}`
            );
            if (response.ok) {
                data = await response.json();
                if (data.results && data.results.length > 0) {
                    imageUrl = data.results[0].urls.small;
                }
            }
        }
        if (imageUrl) {
            cropState.imageCache[cropId] = imageUrl;
            return imageUrl;
        }
    } catch (error) {
        console.warn(`Image fetch failed for ${cropId}:`, error);
    }

    // try static override if available before generic fallback
    if (STATIC_IMAGES[cropId]) {
        console.info(`Using static override for ${cropId} after API failure`);
        cropState.imageCache[cropId] = STATIC_IMAGES[cropId];
        return STATIC_IMAGES[cropId];
    }

    // Fallback to generic crop image
    console.info(`No image found; using generic fallback for ${cropId}`);
    const fallbackUrl = `https://placehold.co/400x300/e0f2f1/004d40?text=${encodeURIComponent(cropId)}`;
    cropState.imageCache[cropId] = fallbackUrl;
    return fallbackUrl;
}

/**
 * Fetch crop image from Pexels API (alternative)
 * @param {string} keywords - Search keywords for the crop
 * @param {string} cropId - Crop ID for caching
 */
async function fetchCropImageFromPexels(keywords, cropId) {
    // Return cached image if available
    if (cropState.imageCache[cropId]) {
        return cropState.imageCache[cropId];
    }

    // Use fallback image if no API enabled
    if (!USE_PEXELS) {
        const fallbackUrl = `https://placehold.co/400x300/e0f2f1/004d40?text=${encodeURIComponent(cropId)}`;
        cropState.imageCache[cropId] = fallbackUrl;
        return fallbackUrl;
    }

    try {
        // Use serverless function proxy
        const response = await fetch(`/api/pexels?query=${encodeURIComponent(keywords)}`);
        
        if (!response.ok) throw new Error('Pexels API error');
        
        const data = await response.json();
        if (data.photos && data.photos.length > 0) {
            const imageUrl = data.photos[0].src.small;
            cropState.imageCache[cropId] = imageUrl;
            return imageUrl;
        }
    } catch (error) {
        console.warn(`Pexels image fetch failed for ${cropId}:`, error);
    }

    // Fallback to generic crop image
    const fallbackUrl = `https://placehold.co/400x300/e0f2f1/004d40?text=${encodeURIComponent(cropId)}`;
    cropState.imageCache[cropId] = fallbackUrl;
    return fallbackUrl;
}

/**
 * Debounce search input to avoid excessive API calls
 */
function debounceSearch() {
    const input = document.getElementById('cropSearchInput');
    cropState.query = input.value.trim();
    cropState.page = 1;

    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
        fetchCrops();
    }, 300);
}

/**
 * Filter crops by category
 */
function filterCrops(category) {
    cropState.category = category;
    cropState.page = 1;

    // UI Update
    document.querySelectorAll('.category-filters .filter-btn').forEach(btn => {
        btn.classList.toggle('active', btn.getAttribute('data-category') === category);
    });

    fetchCrops();
}

/**
 * Main function to fetch crops from local database
 */
async function fetchCrops() {
    const grid = document.getElementById('cropGrid');
    const loading = document.getElementById('cropLoading');
    const empty = document.getElementById('cropEmptyState');
    const pagination = document.getElementById('cropPagination');

    cropState.loading = true;
    loading.classList.remove('hidden');
    empty.classList.add('hidden');
    grid.innerHTML = '';
    pagination.classList.add('hidden');

    try {
        // Get filtered results from local database
        let results = [];
        
        if (cropState.query) {
            // Search by query
            results = searchCrops(cropState.query);
        } else {
            // Get by category
            results = getCropsByCategory(cropState.category);
        }

        // Apply category filter to search results if category is selected
        if (cropState.category !== 'all' && cropState.query) {
            results = results.filter(c => c.category === cropState.category);
        }

        cropState.filteredResults = results;
        cropState.loading = false;
        loading.classList.add('hidden');

        if (results.length === 0) {
            if (cropState.query) {
                // Not found locally. Try AI!
                const loadingText = document.querySelector('#cropLoading p');
                if (loadingText) loadingText.textContent = "Searching using OpenRouter Gemini API...";
                
                // Call AI logic
                fetchAICropMetadata(cropState.query);
                return;
            } else {
                empty.classList.remove('hidden');
                return;
            }
        }

        // Pagination
        const totalPages = Math.ceil(results.length / cropState.pageSize);
        const startIdx = (cropState.page - 1) * cropState.pageSize;
        const endIdx = startIdx + cropState.pageSize;
        const paginatedResults = results.slice(startIdx, endIdx);

        // Render crop cards with lazy loading
        for (const crop of paginatedResults) {
            const card = createCropCard(crop);
            grid.appendChild(card);
            
            // Fetch image asynchronously (non-blocking)
            loadCropImage(crop, card);
        }

        // Show pagination if needed
        if (totalPages > 1) {
            pagination.classList.remove('hidden');
            document.getElementById('currentPage').textContent = `Page ${cropState.page} of ${totalPages}`;
            
            // Disable prev/next buttons if at boundary
            document.getElementById('prevPageBtn').disabled = cropState.page === 1;
            document.getElementById('nextPageBtn').disabled = cropState.page === totalPages;
        }

    } catch (error) {
        console.error('Fetch error:', error);
        loading.classList.add('hidden');
        empty.classList.remove('hidden');
    }
}

/**
 * Fetch a real image from Wikimedia Commons
 */
async function fetchRealCropImage(cropName, scientificName) {
    try {
        const getImageFromWikiData = (data) => {
            if (data && data.query && data.query.pages) {
                const pages = data.query.pages;
                const pageId = Object.keys(pages)[0];
                if (pageId && pageId !== "-1" && pages[pageId].original) {
                    return pages[pageId].original.source;
                }
            }
            return null;
        };

        let searchTerm = scientificName ? scientificName : cropName;
        let url = `https://en.wikipedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(searchTerm)}&gsrlimit=1&prop=pageimages&format=json&piprop=original&origin=*`;
        let response = await fetch(url);
        let data = await response.json();
        
        let source = getImageFromWikiData(data);
        if (source && !source.toLowerCase().endsWith('.svg')) {
            return source;
        }

        // Fallback: search by common name + plant
        url = `https://en.wikipedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(cropName + " plant")}&gsrlimit=1&prop=pageimages&format=json&piprop=original&origin=*`;
        response = await fetch(url);
        data = await response.json();
        
        source = getImageFromWikiData(data);
        if (source && !source.toLowerCase().endsWith('.svg')) {
            return source;
        }

        return null;
    } catch (e) {
        console.warn("Wikimedia image fetch failed:", e);
        return null;
    }
}

/**
 * Fetch missing crop from OpenRouter AI Database dynamically
 */
async function fetchAICropMetadata(cropName) {
    try {
        const prompt = `
Analyze the search term: "${cropName}".
Is this term (including local/regional names in any language, slang, or alternative spellings like "Alu", "Bhindi", etc.) a real farming crop, vegetable, fruit, seed, or spice? 
If it is a local or regional name, identify the standard English common name for it.
It MUST be an authentic plant-based agricultural product that farmers grow. 
If it is NOT a crop, fruit, vegetable, seed, or spice (e.g., if it is an animal, machinery, car, phone, tool, person, or any non-plant item), you MUST reply STRICTLY and ONLY with {"error": "not_a_crop"}.
If it IS a valid crop, seed, vegetable, fruit, or spice, act as an expert agricultural AI. Provide data for this crop in JSON format matching this exact structure:
{
    "commonName": "Standard English common name (e.g., Potato if search was Alu)",
    "scientificName": "Scientific name",
    "category": "vegetable" or "fruit" or "cereal" or "oilseed" or "spice/seed",
    "climate": "Short climate requirement description",
    "soil": "Short soil requirement description",
    "duration": "Total duration (e.g. 60-80 days)",
    "wateringFrequency": "Watering frequency description",
    "harvesting": "Harvesting period description",
    "imageKeywords": "2 or 3 keywords to find its image using standard english name"
}
Reply ONLY with the raw JSON object. Do not include markdown formatting or backticks.
`;
        const messages = [{ role: "user", content: prompt }];
        const responseText = await aiCall({ messages, model: "google/gemini-2.0-flash-001" }); // aiCall is in config.js
        const cleanJson = responseText.replace(/\`\`\`json/g, '').replace(/\`\`\`/g, '').trim();
        const data = JSON.parse(cleanJson);

        if (data.error) {
            const loadingEl = document.getElementById('cropLoading');
            const emptyEl = document.getElementById('cropEmptyState');
            if (loadingEl) loadingEl.classList.add('hidden');
            if (emptyEl) emptyEl.classList.remove('hidden');
            return null;
        }

        // Fetch clear real image
        const imageUrl = await fetchRealCropImage(data.commonName, data.scientificName);
        if (imageUrl) {
            data.imageUrl = imageUrl;
        } else {
            // Delete it so it falls back to Unsplash/Pexels or Placeholder in loadCropImage
            delete data.imageUrl;
        }

        // Ensure category is lowercase and a fallback exists
        data.category = (data.category || 'vegetable').toLowerCase();
        if (!['vegetable', 'fruit', 'cereal', 'oilseed', 'spice/seed', 'spice', 'seed'].includes(data.category)) {
            data.category = 'vegetable';
        }

        // Add to our runtime databases
        const newId = data.commonName.toLowerCase().replace(/\s+/g, '_');
        
        data.searchAlias = cropName.toLowerCase();

        // Ensure local datasets are loaded/updated globally
        if (typeof CROPS_DATABASE !== 'undefined') {
            // Keep existing data if present to avoid losing hardcoded image URLs, but merge new data
            if (CROPS_DATABASE[newId]) {
                CROPS_DATABASE[newId].searchAlias = cropName.toLowerCase();
            } else {
                CROPS_DATABASE[newId] = data;
            }
        }

        // Trigger the search again to show it
        fetchCrops();
        
        return data;

    } catch (error) {
        console.error("AI crop fetch failed:", error);
        const loadingEl = document.getElementById('cropLoading');
        const emptyEl = document.getElementById('cropEmptyState');
        if (loadingEl) loadingEl.classList.add('hidden');
        if (emptyEl) emptyEl.classList.remove('hidden');
        return null;
    }
}

/**
 * Create crop card element
 */
function createCropCard(crop) {
    const card = document.createElement('div');
    card.className = 'crop-card';
    card.setAttribute('data-crop-id', crop.id);
    card.onclick = () => selectCrop(crop);
    
    // Get translated crop name and category
    const lang = window.currentLanguage || 'en';
    const t = (window.translations && window.translations[lang]) || {};
    const translatedName = (t.cropNames && t.cropNames[crop.id]) || crop.commonName;
    const translatedCategory = (t.categoryNames && t.categoryNames[crop.category]) || crop.category.toUpperCase();
    
    card.innerHTML = `
        <div class="crop-card-image-container">
            <div class="crop-image" id="crop-image-${crop.id}" style="background-image: url('data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22200%22 height=%22200%22%3E%3Crect fill=%23e0e0e0 width=%22200%22 height=%22200%22/%3E%3Ctext x=%2250%25%22 y=%2250%25%22 font-size=%2220%22 text-anchor=%22middle%22 dy=%22.3em%22 fill=%23999%3ELoading...%3C/text%3E%3C/svg%3E')"></div>
            <div class="crop-badge">${translatedCategory}</div>
        </div>
        <div class="crop-card-content">
            <h3>${translatedName}</h3>
            <p class="scientific-name">${crop.scientificName}</p>
        </div>
    `;
    return card;
}

/**
 * Load crop image asynchronously
 */
async function loadCropImage(crop, cardElement) {
    const imageElem = cardElement.querySelector(`#crop-image-${crop.id}`);
    if (!imageElem) return;
    imageElem.classList.add('loading');

    try {
        let imageUrl;

        // Use hardcoded imageUrl first (no API call needed)
        if (crop.imageUrl) {
            imageUrl = crop.imageUrl;
        } else if (USE_UNSPLASH) {
            imageUrl = await fetchCropImageFromUnsplash(crop.imageKeywords, crop.id);
        } else if (USE_PEXELS) {
            imageUrl = await fetchCropImageFromPexels(crop.imageKeywords, crop.id);
        } else {
            imageUrl = `https://placehold.co/400x300/e0f2f1/004d40?text=${encodeURIComponent(crop.commonName || crop.id)}`;
        }

        const testImg = new Image();
        testImg.onload = () => {
            imageElem.classList.remove('loading');
            imageElem.style.backgroundImage = `url('${imageUrl}')`;
        };
        testImg.onerror = () => {
            imageElem.classList.remove('loading');
            imageElem.style.backgroundImage = `url('https://placehold.co/400x300/e0f2f1/004d40?text=${encodeURIComponent(crop.commonName || crop.id)}')`;
        };
        testImg.src = imageUrl;
    } catch (error) {
        console.warn(`Failed to load image for ${crop.commonName}:`, error);
        imageElem.classList.remove('loading');
    }
}


/**
 * Handle Pagination
 */
function changePage(dir) {
    if (cropState.loading) return;
    cropState.page += dir;
    if (cropState.page < 1) cropState.page = 1;
    const totalPages = Math.ceil(cropState.filteredResults.length / cropState.pageSize);
    if (cropState.page > totalPages) cropState.page = totalPages;
    fetchCrops();
}

/**
 * Select a crop to view details — uses unified AI API call
 */
const cropFullDataCache = {};

async function selectCrop(crop) {
    // Show info section
    const infoSection = document.getElementById('cropInfo');
    if (infoSection) {
        infoSection.classList.add('visible');
        infoSection.scrollIntoView({ behavior: 'smooth' });
    }

    // Highlight selected card
    document.querySelectorAll('.crop-card').forEach(card => {
        card.classList.remove('selected');
    });
    document.querySelector(`[data-crop-id="${crop.id}"]`)?.classList.add('selected');

    // Set initial values from local database immediately (with null-safety)
    const setField = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
    setField('selectedCropName', crop.commonName);
    setField('cropScientificName', crop.scientificName);
    setField('cropClimate', crop.climate);
    setField('cropSoil', crop.soil);
    setField('cropDuration', crop.duration);
    setField('cropWatering', crop.wateringFrequency);
    setField('cropHarvesting', crop.harvesting);

    // Show AI insights panel
    const aiInsightsPanel = document.getElementById('cropAIInsights');
    const aiTextEl = document.getElementById('cropAIText');
    if (aiInsightsPanel && aiTextEl) {
        aiInsightsPanel.style.display = 'block';
        aiTextEl.innerHTML = `<span style="color:var(--text-muted);"><i class="fas fa-spinner fa-spin"></i> Fetching AI-powered crop details for ${crop.commonName}...</span>`;
    }

    // Fetch unified crop data from AI (single API call)
    try {
        const fullData = await fetchUnifiedCropData(crop);

        // Update crop info fields with AI response
        if (fullData.scientific_name) setField('cropScientificName', fullData.scientific_name);
        if (fullData.climate_requirement) setField('cropClimate', fullData.climate_requirement);
        if (fullData.soil_type) setField('cropSoil', fullData.soil_type);
        if (fullData.total_duration) setField('cropDuration', fullData.total_duration);
        if (fullData.water_requirement) setField('cropWatering', fullData.water_requirement);
        if (fullData.harvesting_period) setField('cropHarvesting', fullData.harvesting_period);

        // Render roadmap from unified response
        if (fullData.roadmap && fullData.roadmap.length > 0 && window.renderRoadmapStages) {
            renderRoadmapStages(fullData.roadmap, fullData.crop_name || crop.commonName, fullData.total_duration || crop.duration);
        }

        // Build AI insights HTML from roadmap stages
        if (aiInsightsPanel && aiTextEl && fullData.roadmap) {
            aiTextEl.innerHTML = buildRoadmapInsightsHTML(fullData);
        }

        if (typeof logActivity === 'function') {
            logActivity('crop', 'Researched crop: ' + crop.commonName);
            updateUserStatistic('cropsTracked');
        }
    } catch (err) {
        console.warn('Unified crop data fetch failed:', err);
        if (aiInsightsPanel) aiInsightsPanel.style.display = 'none';
        // Fallback: generate roadmap with old method
        if (window.generateRoadmap) generateRoadmap(crop.id);
        
        if (typeof logActivity === 'function') {
            logActivity('crop', 'Researched crop: ' + crop.commonName);
            updateUserStatistic('cropsTracked');
        }
    }

    // Update calculator
    const calc = document.getElementById('calcCrop');
    if (calc) {
        const options = Array.from(calc.options).map(o => o.value.toLowerCase());
        const match = options.find(opt => opt.includes(crop.id)) || 'rice';
        calc.value = match;
    }

    if (window.generateNotifications && typeof generateNotifications === 'function') {
        generateNotifications(crop.id);
    }
    if (window.updateDashboard && typeof updateDashboard === 'function') {
        updateDashboard();
    }
}

/**
 * Fetch unified crop data from OpenRouter using the structured BharatFarm prompt.
 * Returns JSON with all crop info + 10-stage roadmap in one call.
 */
async function fetchUnifiedCropData(crop) {
    if (cropFullDataCache[crop.id]) return cropFullDataCache[crop.id];

    const prompt = `You are an agricultural expert AI helping power a smart farming website called "BharatFarm".

Your task is to generate accurate and structured crop information for farmers.

Return the response ONLY in valid JSON format. No markdown, no extra text.

Crop Name: ${crop.commonName}

Return data in this JSON structure:

{
  "crop_name": "",
  "scientific_name": "",
  "climate_requirement": "",
  "soil_type": "",
  "total_duration": "",
  "water_requirement": "",
  "harvesting_period": "",
  "roadmap": [
    {"stage": "Land Preparation", "details": ""},
    {"stage": "Seed Selection", "details": ""},
    {"stage": "Sowing", "details": ""},
    {"stage": "Irrigation", "details": ""},
    {"stage": "Fertilization", "details": ""},
    {"stage": "Weed Management", "details": ""},
    {"stage": "Pest & Disease Control", "details": ""},
    {"stage": "Growth Monitoring", "details": ""},
    {"stage": "Harvesting", "details": ""},
    {"stage": "Storage", "details": ""}
  ]
}

Guidelines:
- Information should be suitable for farmers in India.
- Keep explanations simple and practical.
- Mention common farming practices used in India.
- Include approximate durations where possible.
- Avoid unnecessary long text.`;

    const raw = await aiCall({
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
        max_tokens: 1200
    });

    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No JSON found');

    const parsed = JSON.parse(jsonMatch[0]);
    cropFullDataCache[crop.id] = parsed;
    return parsed;
}

/**
 * Build a nicely formatted HTML summary from the unified crop data roadmap.
 */
function buildRoadmapInsightsHTML(data) {
    if (!data.roadmap || data.roadmap.length === 0) return '';

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

    const stagesHTML = data.roadmap.map(item => {
        const icon = stageIcons[item.stage] || 'fa-tasks';
        const color = stageColors[item.stage] || 'var(--primary)';
        return `
            <div style="display:flex; gap:10px; align-items:flex-start; margin-bottom:10px; padding:8px 12px; background:rgba(255,255,255,0.03); border-radius:8px; border-left:3px solid ${color};">
                <i class="fas ${icon}" style="color:${color}; margin-top:3px; min-width:16px;"></i>
                <div>
                    <strong style="color:${color};">${item.stage}</strong>
                    <div style="font-size:0.82rem; color:var(--text-secondary); margin-top:2px;">${item.details}</div>
                </div>
            </div>`;
    }).join('');

    return `
        <div style="display:grid; gap:4px;">
            ${stagesHTML}
        </div>
        <div style="margin-top:12px; padding:8px 12px; background:rgba(0,168,255,0.08); border-radius:8px; font-size:0.8rem; color:var(--text-muted);">
            <i class="fas fa-info-circle"></i> Data generated by AI for Indian farming conditions. Click <strong>View Roadmap</strong> for the full timeline.
        </div>`;
}

