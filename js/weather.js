// ============================================
// WEATHER FUNCTIONS
// ============================================

const CONFIG = {
    WEATHER_API_BASE: 'https://api.open-meteo.com/v1/forecast',
    GEOCODING_API_BASE: 'https://geocoding-api.open-meteo.com/v1/search',
    DEFAULT_LOCATION: { lat: 22.0605, lon: 88.1098, name: 'Haldia' } // Updated precision coordinates
    // Future API keys can be added here securely when moving to a paid plan.
};

let isAPIOnline = false;
let currentWeather = {
    temp: '--',
    humidity: '--',
    windSpeed: '--',
    visibility: 10,
    rainProbability: 0,
    condition: 'Loading...',
    icon: 'fa-sun'
};

let userLocation = { lat: CONFIG.DEFAULT_LOCATION.lat, lon: CONFIG.DEFAULT_LOCATION.lon };
let userLocationName = '';

async function checkAPIStatus() {
    isAPIOnline = typeof OPENROUTER_API_KEY !== 'undefined' && OPENROUTER_API_KEY.length > 10;
}

// ── Entry point ─────────────────────────────
function fetchWeather() {
    const locationInput = document.getElementById('locationInput').value.trim();

    if (locationInput && locationInput !== userLocationName && locationInput !== 'Detecting location...') {
        fetchWeatherByLocation(locationInput);
    } else if (userLocation) {
        fetchWeatherByCoords(userLocation.lat, userLocation.lon, userLocationName);
    } else {
        autoDetectLocation();
    }
}

// ── Update weather UI ────────────────────────
function updateWeatherUI(location) {
    try {
        const tempEl = document.getElementById('temperature');
        const humidEl = document.getElementById('humidity');
        const windEl = document.getElementById('windSpeed');
        const visEl = document.getElementById('visibility');
        const rainEl = document.getElementById('rainProbability');
        const condEl = document.getElementById('weatherCondition');
        const locEl = document.getElementById('weatherLocation');
        const iconEl = document.getElementById('weatherIcon');

        if (tempEl) tempEl.textContent = currentWeather.temp;
        if (humidEl) humidEl.textContent = currentWeather.humidity;
        if (windEl) windEl.textContent = currentWeather.windSpeed;
        if (visEl) visEl.textContent = currentWeather.visibility;
        if (rainEl) rainEl.textContent = currentWeather.rainProbability;
        if (condEl) condEl.textContent = currentWeather.condition;
        if (locEl) locEl.textContent = location;
        
        if (iconEl) {
            iconEl.className = 'fas ' + (currentWeather.icon || 'fa-sun');
        }

        const alertDiv = document.getElementById('weatherAlert');
        if (alertDiv) { // Added check for alertDiv
            if (currentWeather.rainProbability >= 70) {
                alertDiv.className = 'weather-alert unsafe';
                alertDiv.innerHTML = `<i class="fas fa-exclamation-triangle"></i><div><h3>NOT SAFE for Farming</h3><p>High rain chance (${currentWeather.rainProbability}%). Avoid fertilizer/seeds today.</p></div>`;
            } else {
                alertDiv.className = 'weather-alert safe';
                alertDiv.innerHTML = `<i class="fas fa-check-circle"></i><div><h3>SAFE for Farming Activities</h3><p>Weather conditions are suitable for farming.</p></div>`;
            }
        }

        window.lastWeatherLogged = window.lastWeatherLogged || 0;
        if (typeof logActivity === 'function' && (!window.lastWeatherLogged || Date.now() - window.lastWeatherLogged > 60000)) {
            try {
                logActivity('weather', 'Checked weather for ' + location);
                if (typeof updateUserStatistic === 'function') {
                    updateUserStatistic('weatherChecks');
                }
            } catch (e) {
                console.warn('Logging activity failed:', e);
            }
            window.lastWeatherLogged = Date.now();
        }

        if (typeof updateDashboard === 'function') {
            updateDashboard();
        }
    } catch (err) {
        console.error('Error updating weather UI:', err);
    }

    updateFarmingTips();

    // Trigger AI advice (non-blocking)
    getAIWeatherAdvice(location);
}

// ── Farming Tips Logic ───────────────────────
function updateFarmingTips() {
    let dos = [];
    let donts = [];

    // Rain logic
    if (currentWeather.rainProbability >= 70) {
        dos.push('Ensure proper drainage in fields to prevent waterlogging.');
        dos.push('Protect harvested crops or sensitive seedlings with covers.');
        donts.push('Do not apply fertilizers or pesticides, as they will wash away.');
        donts.push('Avoid sowing seeds until the heavy rain stops.');
    } else if (currentWeather.rainProbability > 30) {
        dos.push('Light rain expected; plan your irrigation accordingly.');
        donts.push('Delay spraying chemicals if possible.');
    } else {
        dos.push('Good time to apply standard fertilizers or pesticides.');
    }

    // Temperature logic
    if (currentWeather.temp > 38) {
        dos.push('Irrigate early in the morning or late in the evening.');
        dos.push('Provide shade for young, sensitive plants if possible.');
        donts.push('Do not perform heavy field work during peak afternoon hours.');
    } else if (currentWeather.temp < 10) {
        dos.push('Protect crops from frost using covers or light evening irrigation.');
        donts.push('Avoid late evening irrigation which might freeze overnight.');
    }

    // Wind logic
    if (currentWeather.windSpeed > 25) {
        dos.push('Secure tall plants and small temporary structures.');
        donts.push('Do not spray chemicals; the wind will cause drift and waste.');
    }
    
    // Humidity logic
    if (currentWeather.humidity > 80 && currentWeather.temp > 25 && currentWeather.rainProbability < 70) {
         dos.push('Monitor closely for fungal diseases and pests which thrive in low rain, high humidity.');
         donts.push('Avoid dense planting to allow air circulation.');
    }

    // Defaults if conditions are perfect
    if (dos.length === 0) {
        dos.push('Weather is optimal. Proceed with regular farming activities.');
    }
    if (donts.length === 0) {
        donts.push('No severe weather restrictions today. Keep regular monitoring.');
    }

    const doHTML = dos.map(item => `<li>${item}</li>`).join('');
    const dontHTML = donts.map(item => `<li>${item}</li>`).join('');

    const elDo = document.getElementById('whatToDoList');
    const elDont = document.getElementById('whatNotToDoList');
    if (elDo) elDo.innerHTML = doHTML;
    if (elDont) elDont.innerHTML = dontHTML;
}

// ── Auto-detect location ─────────────────────
function autoDetectLocation() {
    if (navigator.geolocation) {
        document.getElementById('weatherLoading').classList.remove('hidden');
        document.getElementById('weatherContent').style.display = 'none';
        
        const locInput = document.getElementById('locationInput');
        if (locInput) locInput.value = 'Detecting location...';

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const lat = position.coords.latitude;
                const lon = position.coords.longitude;
                userLocation = { lat, lon };
                await reverseGeocode(lat, lon);
                fetchWeatherByCoords(lat, lon, userLocationName);
            },
            (error) => {
                console.error('Geolocation error:', error.message);
                // On error or denied, use default
                fetchWeatherByCoords(CONFIG.DEFAULT_LOCATION.lat, CONFIG.DEFAULT_LOCATION.lon, CONFIG.DEFAULT_LOCATION.name);
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
        );
    } else {
        fetchWeatherByCoords(CONFIG.DEFAULT_LOCATION.lat, CONFIG.DEFAULT_LOCATION.lon, CONFIG.DEFAULT_LOCATION.name);
    }
}

// ── Precise Reverse geocode (Villages/Towns) ──
async function reverseGeocode(lat, lon) {
    try {
        const url = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`;
        const response = await fetch(url);
        
        if (response.ok) {
            const data = await response.json();
            
            const locality = data.locality || data.city || data.principalSubdivision;
            const state = data.principalSubdivision;
            
            if (locality && state && locality !== state) {
                userLocationName = `${locality}, ${state}`;
            } else if (locality) {
                userLocationName = locality;
            } else {
                userLocationName = "Your Location";
            }
            
            document.getElementById('locationInput').value = userLocationName;
        }
    } catch (err) {
        console.error('Reverse geocoding error:', err);
    }
}

// ── Fetch weather by city/village name ───────
async function fetchWeatherByLocation(locationName) {
    document.getElementById('weatherLoading').classList.remove('hidden');
    document.getElementById('weatherContent').style.display = 'none';

    try {
        let searchQuery = locationName;
        let geoUrl = `${CONFIG.GEOCODING_API_BASE}?name=${encodeURIComponent(searchQuery)}&count=1&language=en&format=json`;
        let geoRes = await fetch(geoUrl);
        let geoData = await geoRes.json();

        // If not found and the name contains commas (e.g. "Village, District"), try searching for just the first part
        if ((!geoData || !geoData.results || geoData.results.length === 0) && locationName.includes(',')) {
            const firstPart = locationName.split(',')[0].trim();
            if (firstPart.length > 2) {
                console.log(`[Weather] Full location not found, retrying with: ${firstPart}`);
                geoUrl = `${CONFIG.GEOCODING_API_BASE}?name=${encodeURIComponent(firstPart)}&count=1&language=en&format=json`;
                geoRes = await fetch(geoUrl);
                geoData = await geoRes.json();
            }
        }

        if (!geoData || !geoData.results || geoData.results.length === 0) {
            document.getElementById('weatherLoading').classList.add('hidden');
            document.getElementById('weatherContent').style.display = 'block';
            alert('Location not found in database. Please try a different name (e.g. use just the city name).');
            return;
        }

        const place = geoData.results[0];
        const lat = parseFloat(place.latitude);
        const lon = parseFloat(place.longitude);
        
        let resolvedName = place.name;
        if (place.admin1) resolvedName += `, ${place.admin1}`;
        if (place.country && !place.admin1) resolvedName += `, ${place.country}`;

        userLocation = { lat, lon };
        userLocationName = resolvedName;
        document.getElementById('locationInput').value = resolvedName;

        await fetchWeatherByCoords(lat, lon, resolvedName);

    } catch (error) {
        console.error('Weather fetch error:', error);
        document.getElementById('weatherLoading').classList.add('hidden');
        document.getElementById('weatherContent').style.display = 'block';
        alert('Unable to fetch weather. Please check your internet connection.');
    }
}

// ── Fetch weather by coordinates (Open-Meteo) ─
async function fetchWeatherByCoords(lat, lon, locationName) {
    document.getElementById('weatherLoading').classList.remove('hidden');
    document.getElementById('weatherContent').style.display = 'none';

    try {
        // Optimized query with specific farming metrics (soil moisture, temperature at heights, etc.)
        const url = `${CONFIG.WEATHER_API_BASE}?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,rain,weather_code,wind_speed_10m,is_day,apparent_temperature&hourly=temperature_2m,rain,temperature_80m,weather_code,visibility,relative_humidity_2m,precipitation,precipitation_probability,soil_moisture_9_to_27cm,soil_moisture_0_to_1cm,soil_temperature_18cm,soil_temperature_6cm,wind_speed_10m&timezone=auto`;

        const res = await fetch(url);
        if (!res.ok) throw new Error(`Open-Meteo error ${res.status}`);

        const data = await res.json();
        
        // Update marketplace location map link only if it is currently empty
        const mapInput = document.getElementById('locationMapInput');
        if (mapInput && !mapInput.value.trim()) {
            mapInput.value = `https://www.google.com/maps?q=${lat},${lon}`;
        }
        
        let finalDecidedName = locationName || userLocationName;
        if (!finalDecidedName || finalDecidedName === 'Loading...') {
            finalDecidedName = `${lat.toFixed(2)}, ${lon.toFixed(2)}`;
        }
        
        processOpenMeteoData(data, finalDecidedName);

    } catch (error) {
        console.error('Open-Meteo error:', error);
        document.getElementById('weatherLoading').classList.add('hidden');
        document.getElementById('weatherContent').style.display = 'block';
        alert('Unable to fetch weather data. Please check your internet connection.');
    }
}

// ── Parse Open-Meteo response ────────────────
function processOpenMeteoData(data, locationName) {
    const c = data.current;
    
    let rainProb = 0;
    if (data.hourly && data.hourly.precipitation_probability) {
        const next24h = data.hourly.precipitation_probability.slice(0, 12);
        rainProb = Math.max(...next24h);
    }

    let avgVisibility = 10;
    if (data.hourly && data.hourly.visibility) {
        avgVisibility = (data.hourly.visibility[0] / 1000).toFixed(1); // Convert meters to km
    }

    let soilMoisture = 'N/A';
    if (data.hourly && data.hourly.soil_moisture_9_to_27cm) {
        soilMoisture = (data.hourly.soil_moisture_9_to_27cm[0] * 100).toFixed(1) + '%';
    }

    let soilTemp = 'N/A';
    if (data.hourly && data.hourly.soil_temperature_6cm) {
        soilTemp = Math.round(data.hourly.soil_temperature_6cm[0]) + '°C';
    }

    currentWeather = {
        temp: Math.round(c.temperature_2m),
        humidity: Math.round(c.relative_humidity_2m),
        windSpeed: Math.round(c.wind_speed_10m),
        visibility: avgVisibility,
        rainProbability: Math.round(rainProb),
        soilMoisture: soilMoisture,
        soilTemp: soilTemp,
        condition: weatherCodeToCondition(c.weather_code),
        icon: weatherCodeToIcon(c.weather_code, c.is_day)
    };

    updateWeatherUI(locationName);
    document.getElementById('weatherLoading').classList.add('hidden');
    document.getElementById('weatherContent').style.display = 'block';
}

// ── WMO weather code → readable condition ────
function weatherCodeToCondition(code) {
    if (code === 0) return 'Clear Sky';
    if (code >= 1 && code <= 3) return 'Partly Cloudy';
    if (code >= 45 && code <= 48) return 'Foggy / Hazy';
    if (code >= 51 && code <= 55) return 'Drizzle';
    if (code >= 56 && code <= 57) return 'Freezing Drizzle';
    if (code >= 61 && code <= 65) return 'Rain';
    if (code >= 66 && code <= 67) return 'Freezing Rain';
    if (code >= 71 && code <= 77) return 'SnowFall';
    if (code >= 80 && code <= 82) return 'Rain Showers';
    if (code >= 85 && code <= 86) return 'Snow Showers';
    if (code >= 95 && code <= 99) return 'Thunderstorm';
    return 'Unknown Weather';
}

// ── WMO weather code → Font Awesome icon ─────
function weatherCodeToIcon(code, isDay = 1) {
    const timeSuffix = isDay ? 'sun' : 'moon';
    
    if (code === 0) return isDay ? 'fa-sun' : 'fa-moon';
    if (code >= 1 && code <= 3) return `fa-cloud-${timeSuffix}`;
    if (code >= 45 && code <= 48) return 'fa-smog';
    if (code >= 51 && code <= 57) return 'fa-cloud-rain';
    if (code >= 61 && code <= 67) return 'fa-cloud-showers-heavy';
    if (code >= 71 && code <= 77) return 'fa-snowflake';
    if (code >= 80 && code <= 82) return 'fa-cloud-meatball';
    if (code >= 85 && code <= 86) return 'fa-snowflake';
    if (code >= 95 && code <= 99) return 'fa-bolt';
    return 'fa-cloud';
}

// ── OpenRouter AI advice for farmers ─────────
async function getAIWeatherAdvice(location) {
    const summaryDiv = document.getElementById('weatherAISummary');
    const textDiv = document.getElementById('weatherAIText');
    if (!summaryDiv || !textDiv) return;

    summaryDiv.style.display = 'block';
    textDiv.innerHTML = '<span style="color:#999"><i class="fas fa-spinner fa-spin"></i> Generating advice...</span>';

    try {
        const prompt = `You are a crop weather expert. Today's weather in ${location}: 
        Temperature ${currentWeather.temp}°C, Humidity ${currentWeather.humidity}%, Rain probability ${currentWeather.rainProbability}%, Visibility ${currentWeather.visibility}km.
        Soil Moisture (9-27cm): ${currentWeather.soilMoisture}, Soil Temp (6cm): ${currentWeather.soilTemp}.
        Condition: ${currentWeather.condition}. 
        Provide a 2-sentence farming advice (focus on soil moisture for seed sowing or irrigation, and whether conditions are safe).`;

        const advice = await aiCall({
            messages: [{ role: 'user', content: prompt }],
            max_tokens: 200,
            temperature: 0.6
        });
        if (advice) { textDiv.textContent = advice; return; }
    } catch (err) {
        console.warn('[Weather AI] failed:', err.message);
    }

    // All failed — show a fallback tip based on the data
    let fallback = '';
    if (currentWeather.rainProbability >= 70) {
        fallback = '🌧 High rain expected. Avoid sowing or fertilizer application today. Ensure proper drainage in your fields.';
    } else if (currentWeather.temp > 38) {
        fallback = '🌡 Very hot day. Water your crops early morning or late evening. Avoid heavy field work in the afternoon.';
    } else if (currentWeather.humidity > 80) {
        fallback = '💧 High humidity today. Watch out for fungal diseases. Ensure good air circulation between plants.';
    } else {
        fallback = '✅ Weather looks good for farming today! Good conditions for irrigation, spraying, or field preparation.';
    }
    textDiv.textContent = fallback;
}
