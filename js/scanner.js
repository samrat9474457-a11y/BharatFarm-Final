// ============================================
// SMART LEAF SCANNER & DISEASE DETECTOR
// ============================================

let mobileNetModel = null;
let isModelLoading = false;


// Model is loaded once from the initialization chain
// (app.js calls initScannerDragDrop, scanner loads model on demand)


async function analyzeLeaf() {
    const imgElement = document.getElementById('leafPreviewImg');
    const analyzeBtn = document.getElementById('analyzeBtn');
    const loadingEl = document.getElementById('scanLoading');
    const resultEl = document.getElementById('scanResult');

    analyzeBtn.style.display = 'none';
    loadingEl.classList.remove('hidden');
    resultEl.style.display = 'none';

    // Clear previous debug info
    const prevDebug = document.getElementById('scanDebugInfo');
    if (prevDebug) prevDebug.remove();

    try {
        console.log('Sending image to Gemini API...');

        // 1. Get Base64 image data from the UI Image Element
        const base64Image = imgElement.src;

        // Extract mimetype and base64 payload
        const mimeMatch = base64Image.match(/data:(image\/\w+);base64,/);
        const mimeType = mimeMatch ? mimeMatch[1] : 'image/jpeg';
        const cleanBase64 = base64Image.replace(/^data:image\/\w+;base64,/, "");

        // 2. Call our local Gemini endpoint
        let response;
        let retries = 1;
        while (retries >= 0) {
            try {
                // Production: Use backend proxy to protect API keys and apply verification logic
                response = await fetch('/api/analyze-leaf', {
                    method: 'POST',
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({ mimeType, base64Image: cleanBase64 })
                });
                break;
            } catch (err) {
                if (retries === 0) throw err;
                console.log("Fetch failed, retrying in 2 seconds...");
                await new Promise(r => setTimeout(r, 2000));
                retries--;
            }
        }

        if (!response.ok) {
            throw new Error(`Server returned Status: ${response.status}`);
        }

        const data = await response.json();
        console.log('Gemini Predictions:', data);

        if (!data.success) {
            showError(data.error || "Could not analyze the leaf image.");
            loadingEl.classList.add('hidden');
            analyzeBtn.style.display = 'inline-flex';
            return;
        }

        const result = data.disease;

        // Display Results
        document.getElementById('scanResult').style.display = 'block';

        const statusEl = document.getElementById('diseaseStatus');
        const isHealthy = result.status === 'healthy';

        statusEl.textContent = isHealthy ? 'Healthy Plant' : 'Issue Detected';
        statusEl.className = 'disease-badge ' + (isHealthy ? 'healthy' : 'diseased');

        document.getElementById('diseaseName').textContent = result.name;
        document.getElementById('diseaseDescription').textContent = result.description;

        const fertList = document.getElementById('fertilizerRecommendations');
        if (result.fertilizers && Array.isArray(result.fertilizers)) {
            fertList.innerHTML = result.fertilizers.map(f =>
                `<div class="recommendation-item"><i class="fas fa-check-circle"></i><span>${f}</span></div>`
            ).join('');
        } else {
            fertList.innerHTML = '';
        }

        const treatList = document.getElementById('treatmentTips');
        if (result.treatments && Array.isArray(result.treatments)) {
            treatList.innerHTML = result.treatments.map(t =>
                `<div class="recommendation-item"><i class="fas fa-check-circle"></i><span>${t}</span></div>`
            ).join('');
        } else {
            treatList.innerHTML = '';
        }

        loadingEl.classList.add('hidden');

    } catch (error) {
        console.error('Analysis error:', error);
        showError("⚠️ Network is slow, retrying connection...");
        loadingEl.classList.add('hidden');
        analyzeBtn.style.display = 'inline-flex';
    }
}

// ==========================================
// HSL COLOR ANALYSIS ALGORITHM
// ==========================================
function analyzeLeafHealthHSL(imgElement) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = imgElement.naturalWidth || imgElement.width;
    canvas.height = imgElement.naturalHeight || imgElement.height;
    ctx.drawImage(imgElement, 0, 0);

    const frame = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = frame.data;
    const length = data.length;

    let greenCount = 0;
    let yellowCount = 0;
    let brownCount = 0;
    let whiteCount = 0;
    let blackCount = 0;
    let totalPixels = 0;

    for (let i = 0; i < length; i += 4) { // i += 4 for RGBA
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];

        // Skip transparent or very whitish-gray background pixels if any (simple check)
        // But for camera photos, we count everything usually.

        const [h, s, l] = rgbToHsl(r, g, b); // H: 0-360, S: 0-100, L: 0-100

        // 1. GREEN (Healthy) - Hue 70 to 160
        if (h >= 70 && h <= 170 && s > 15 && l > 15 && l < 85) {
            greenCount++;
        }
        // 2. YELLOW (Chlorosis/Deficiency) - Hue 40 to 70
        else if (h >= 40 && h < 70 && s > 20 && l > 20) {
            yellowCount++;
        }
        // 3. BROWN/RUST (Disease) - Hue 10-40 OR Hue 340-360 (Reddish-Brown)
        // High saturation usually means fresh rust, lower means dried
        else if ((h >= 10 && h < 40) || (h >= 340 && h <= 360) || (h < 10 && s > 30)) {
            // Exclude very dark/black (handled below) or very light (handled below)
            if (l > 15 && l < 75) brownCount++;
        }
        // 4. WHITE/GRAY (Powdery Mildew) - Low Saturation, High Lightness
        else if (s < 10 && l > 50) {
            whiteCount++;
        }
        // 5. BLACK/DARK (Necrosis/Spots) - Very Low Lightness
        else if (l < 15) {
            blackCount++;
        }

        totalPixels++;
    }

    const greenRatio = greenCount / totalPixels;
    const yellowRatio = yellowCount / totalPixels;
    const brownRatio = brownCount / totalPixels;
    const whiteRatio = whiteCount / totalPixels; // Careful, this can be background
    const blackRatio = blackCount / totalPixels; // Careful, shadows

    // DEBUG STATS STRING
    const debugStats = `G:${Math.round(greenRatio * 100)}% Y:${Math.round(yellowRatio * 100)}% Br:${Math.round(brownRatio * 100)}% W:${Math.round(whiteRatio * 100)}% Bl:${Math.round(blackRatio * 100)}%`;

    // ------------------------------------------
    // DECISION LOGIC
    // ------------------------------------------

    // 1. IS IT EVEN A PLANT?
    // If less than 25% Green, and we have high White/Black (could be wall/shadow), fail it.
    // However, a completely brown leaf is still a leaf.
    const totalPlantColor = greenRatio + yellowRatio + brownRatio;
    if (totalPlantColor < 0.25) {
        return { status: 'not_plant', disease: null, debugStats, greenRatio };
    }

    // 2. IS IT HEALTHY?
    // If Green is dominant over others
    // RE-INTRODUCED SAFEGUARD: If Green is extremely high (> 60%), we are likely looking at a healthy plant with shadows.
    // Shadows often register as "Black", so we must permit higher black ratios if Green is high.
    if (greenRatio > 0.60) {
        // If mostly green, ignore "Blight" unless black is VERY dominant (shadows vs rot)
        // Allow up to 30% black/shadows if the leaf is 60%+ Green.
        if (blackRatio < 0.30 && yellowRatio < 0.15 && brownRatio < 0.15 && whiteRatio < 0.15) {
            return { status: 'plant', disease: 'healthy', debugStats, greenRatio };
        }
    }

    // Standard Healthy Check (for less green leaves)
    if (greenRatio > 0.40 && greenRatio > (yellowRatio + brownRatio + blackRatio) * 1.5) {
        return { status: 'plant', disease: 'healthy', debugStats, greenRatio };
    }

    // 3. DISEASE IDENTIFICATION
    // Normalize ratios relative to "Plant Area" (Green+Yellow+Brown) to ignore background?
    // For now, raw ratios are safer if background is busy.

    if (brownRatio > 0.15) return { status: 'plant', disease: 'rust', debugStats, greenRatio };
    if (yellowRatio > 0.15) return { status: 'plant', disease: 'nutrient_deficiency', debugStats, greenRatio };
    if (whiteRatio > 0.15 && whiteRatio < 0.5) return { status: 'plant', disease: 'powdery_mildew', debugStats, greenRatio }; // < 0.5 to usually avoid wall backgrounds
    if (blackRatio > 0.10) return { status: 'plant', disease: 'leaf_blight', debugStats, greenRatio };

    // Default to healthy if unclear but green is present
    return { status: 'plant', disease: 'healthy', debugStats, greenRatio };
}

// Helper: RGB to HSL
function rgbToHsl(r, g, b) {
    r /= 255, g /= 255, b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;

    if (max === min) {
        h = s = 0; // achromatic
    } else {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
    }

    return [h * 360, s * 100, l * 100];
}

function displayResult(diseaseKey) {
    // If null passed (e.g. from debug fallback), default to healthy
    if (!diseaseKey) diseaseKey = 'healthy';

    // If the database has it mapped, use it. If not, use the nutrient_deficiency as a "generic issue" template
    // because the name itself will be overwritten anyway.
    const result = diseaseDatabase[diseaseKey] || diseaseDatabase['nutrient_deficiency'];
    const resultSection = document.getElementById('scanResult');

    const statusEl = document.getElementById('diseaseStatus');
    const isHealthy = diseaseKey === 'healthy';

    statusEl.textContent = isHealthy ? 'Healthy Plant' : 'Issue Detected';
    statusEl.className = 'disease-badge ' + (isHealthy ? 'healthy' : 'diseased');

    document.getElementById('diseaseName').textContent = result.name;
    document.getElementById('diseaseDescription').textContent = result.description;

    const fertList = document.getElementById('fertilizerRecommendations');
    fertList.innerHTML = result.fertilizers.map(f =>
        `<div class="recommendation-item"><i class="fas fa-check-circle"></i><span>${f}</span></div>`
    ).join('');

    const treatList = document.getElementById('treatmentTips');
    treatList.innerHTML = result.treatments.map(t =>
        `<div class="recommendation-item"><i class="fas fa-check-circle"></i><span>${t}</span></div>`
    ).join('');

    resultSection.style.display = 'block';
}

function showError(message) {
    const preview = document.getElementById('scannerPreview');
    // Remove existing
    const existing = document.querySelector('.scanner-alert');
    if (existing) existing.remove();

    const div = document.createElement('div');
    div.className = 'scanner-alert';
    div.style.background = '#ffebee';
    div.style.color = '#c62828';
    div.style.padding = '10px';
    div.style.borderRadius = '8px';
    div.style.marginTop = '10px';
    div.style.fontWeight = 'bold';
    div.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${message}`;

    preview.appendChild(div);
}

function handleLeafUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (e) {
        const previewImg = document.getElementById('leafPreviewImg');
        previewImg.src = e.target.result;
        document.getElementById('scannerPreview').style.display = 'block';
        document.getElementById('analyzeBtn').style.display = 'inline-flex';

        // Clear previous results
        document.getElementById('scanResult').style.display = 'none';
        const prevDebug = document.getElementById('scanDebugInfo');
        if (prevDebug) prevDebug.remove();
        const alert = document.querySelector('.scanner-alert');
        if (alert) alert.remove();
    };
    reader.readAsDataURL(file);
}

let cameraStream = null;

async function openCamera() {
    const modal = document.getElementById('cameraModal');
    const video = document.getElementById('cameraVideo');
    const canvas = document.getElementById('cameraCanvas');
    const previewImg = document.getElementById('cameraPreviewImg');

    // Reset UI
    video.style.display = 'block';
    canvas.style.display = 'none';
    previewImg.style.display = 'none';
    document.getElementById('captureBtn').style.display = 'inline-flex';
    document.getElementById('retakeBtn').style.display = 'none';
    document.getElementById('usePhotoBtn').style.display = 'none';

    modal.style.display = 'flex';

    try {
        cameraStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        video.srcObject = cameraStream;
    } catch (err) {
        console.error("Camera access denied:", err);
        alert("Camera access was denied or is not available.");
        closeCamera();
    }
}

function closeCamera() {
    const modal = document.getElementById('cameraModal');
    modal.style.display = 'none';
    if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
        cameraStream = null;
    }
}

function capturePhoto() {
    const video = document.getElementById('cameraVideo');
    const canvas = document.getElementById('cameraCanvas');
    const previewImg = document.getElementById('cameraPreviewImg');

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);

    video.style.display = 'none';
    previewImg.src = dataUrl;
    previewImg.style.display = 'block';

    document.getElementById('captureBtn').style.display = 'none';
    document.getElementById('retakeBtn').style.display = 'inline-flex';
    document.getElementById('usePhotoBtn').style.display = 'inline-flex';

    if (cameraStream) {
        video.pause();
    }
}

function retakePhoto() {
    const video = document.getElementById('cameraVideo');
    const previewImg = document.getElementById('cameraPreviewImg');

    video.style.display = 'block';
    previewImg.style.display = 'none';

    if (cameraStream) {
        video.play();
    }

    document.getElementById('captureBtn').style.display = 'inline-flex';
    document.getElementById('retakeBtn').style.display = 'none';
    document.getElementById('usePhotoBtn').style.display = 'none';
}

function usePhoto() {
    const previewImg = document.getElementById('cameraPreviewImg');
    const mainPreviewImg = document.getElementById('leafPreviewImg');

    mainPreviewImg.src = previewImg.src;
    document.getElementById('scannerPreview').style.display = 'block';
    document.getElementById('analyzeBtn').style.display = 'inline-flex';

    document.getElementById('scanResult').style.display = 'none';
    const alert = document.querySelector('.scanner-alert');
    if (alert) alert.remove();
    const prevDebug = document.getElementById('scanDebugInfo');
    if (prevDebug) prevDebug.remove();

    closeCamera();
}

// Drag and drop setup
function initScannerDragDrop() {
    const scannerBox = document.getElementById('scannerBox');
    if (scannerBox) {
        scannerBox.addEventListener('dragover', (e) => {
            e.preventDefault();
            scannerBox.classList.add('dragover');
        });

        scannerBox.addEventListener('dragleave', () => {
            scannerBox.classList.remove('dragover');
        });

        scannerBox.addEventListener('drop', (e) => {
            e.preventDefault();
            scannerBox.classList.remove('dragover');
            const file = e.dataTransfer.files[0];
            if (file && file.type.startsWith('image/')) {
                document.getElementById('fileInput').files = e.dataTransfer.files;
                handleLeafUpload({ target: { files: [file] } });
            }
        });
    }
}