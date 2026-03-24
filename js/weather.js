// ============================================
// WEATHER FUNCTIONS
// ============================================

const CONFIG = {
    WEATHER_API_BASE: 'https://api.open-meteo.com/v1/forecast',
    GEOCODING_API_BASE: 'https://geocoding-api.open-meteo.com/v1/search',
    DEFAULT_LOCATION: { lat: 22.0667, lon: 88.0698, name: 'Haldia' } // Default map
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
    document.getElementById('temperature').textContent = currentWeather.temp;
    document.getElementById('humidity').textContent = currentWeather.humidity;
    document.getElementById('windSpeed').textContent = currentWeather.windSpeed;
    document.getElementById('visibility').textContent = currentWeather.visibility;
    document.getElementById('rainProbability').textContent = currentWeather.rainProbability;
    document.getElementById('weatherCondition').textContent = currentWeather.condition;
    document.getElementById('weatherLocation').textContent = location;
    
    document.getElementById('weatherIcon').className = 'fas ' + currentWeather.icon;

    const alertDiv = document.getElementById('weatherAlert');
    if (currentWeather.rainProbability >= 70) {
        alertDiv.className = 'weather-alert unsafe';
        alertDiv.innerHTML = `<i class="fas fa-exclamation-triangle"></i><div><h3>NOT SAFE for Farming</h3><p>High rain chance (${currentWeather.rainProbability}%). Avoid fertilizer/seeds today.</p></div>`;
    } else {
        alertDiv.className = 'weather-alert safe';
        alertDiv.innerHTML = `<i class="fas fa-check-circle"></i><div><h3>SAFE for Farming Activities</h3><p>Weather conditions are suitable for farming.</p></div>`;
    }

    window.lastWeatherLogged = window.lastWeatherLogged || 0;
    if (typeof logActivity === 'function' && Date.now() - window.lastWeatherLogged > 60000) {
        logActivity('weather', 'Checked weather for ' + location);
        updateUserStatistic('weatherChecks');
        window.lastWeatherLogged = Date.now();
    }

    if (typeof updateDashboard === 'function') {
        updateDashboard();
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
                if (locInput) locInput.value = '';
                document.getElementById('weatherLoading').classList.add('hidden');
                document.getElementById('weatherContent').style.display = 'block';
                fetchWeatherByCoords(CONFIG.DEFAULT_LOCATION.lat, CONFIG.DEFAULT_LOCATION.lon, CONFIG.DEFAULT_LOCATION.name);
            },
            { enableHighAccuracy: true }
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
        const geoUrl = `${CONFIG.GEOCODING_API_BASE}?name=${encodeURIComponent(locationName)}&count=1&language=en&format=json`;
        const geoRes = await fetch(geoUrl);

        if (!geoRes.ok) throw new Error('Geocoding failed');
        const geoData = await geoRes.json();

        if (!geoData || !geoData.results || geoData.results.length === 0) {
            document.getElementById('weatherLoading').classList.add('hidden');
            document.getElementById('weatherContent').style.display = 'block';
            alert('Location not found in database. Please try a different name.');
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
        const url = `${CONFIG.WEATHER_API_BASE}?latitude=${lat}&longitude=${lon}&current=rain,temperature_2m,is_day,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m&hourly=temperature_2m,relative_humidity_2m,rain,soil_moisture_27_to_81cm,soil_moisture_3_to_9cm,precipitation_probability,apparent_temperature,weather_code&timezone=auto`;

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
    if (data.hourly && data.hourly.precipitation_probability && data.hourly.precipitation_probability.length > 0) {
        const next24h = data.hourly.precipitation_probability.slice(0, 24);
        rainProb = Math.max(...next24h);
    }

    currentWeather = {
        temp: Math.round(c.temperature_2m),
        humidity: Math.round(c.relative_humidity_2m),
        windSpeed: Math.round(c.wind_speed_10m),
        visibility: 10,
        rainProbability: Math.round(rainProb),
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

    const prompt = `Current weather in ${location}:
- Temperature: ${currentWeather.temp}°C
- Humidity: ${currentWeather.humidity}%
- Wind Speed: ${currentWeather.windSpeed} km/h
- Rain Probability: ${currentWeather.rainProbability}%
- Condition: ${currentWeather.condition}

In 2-3 short sentences, give a practical farming advice for today based on this weather. Be specific and helpful for an Indian farmer. Keep it concise.`;

    try {
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
