// ============================================
// WEATHER FUNCTIONS
// Uses: Open-Meteo (free, no key) for real data 
//       Nominatim for village-level geocoding
//       OpenRouter AI for farming advice
// ============================================

let isAPIOnline = false;
let currentWeather = {
    temp: 32,
    humidity: 45,
    windSpeed: 12,
    visibility: 10,
    rainProbability: 25,
    condition: 'Clear Sky',
    icon: 'fa-sun'
};

let userLocation = { lat: 21.0667, lon: 88.0667 };
let userLocationName = 'Haldia';

async function checkAPIStatus() {
    // Check by key presence instead of hitting /api/health (which doesn't exist on localhost)
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

    updateDashboard();

    // Trigger AI advice (non-blocking)
    getAIWeatherAdvice(location);
}

// ── Auto-detect location ─────────────────────
function autoDetectLocation() {
    if (navigator.geolocation) {
        document.getElementById('weatherLoading').classList.remove('hidden');
        document.getElementById('weatherContent').style.display = 'none';
        document.getElementById('locationInput').value = 'Detecting location...';

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const lat = position.coords.latitude;
                const lon = position.coords.longitude;
                userLocation = { lat, lon };
                await reverseGeocode(lat, lon);
                fetchWeatherByCoords(lat, lon, userLocationName);
            },
            (error) => {
                console.log('Geolocation error:', error.message);
                document.getElementById('locationInput').value = '';
                document.getElementById('weatherLoading').classList.add('hidden');
                document.getElementById('weatherContent').style.display = 'block';
                alert('Please enable location access to get accurate weather data for your area.');
            }
        );
    } else {
        alert('Geolocation is not supported by your browser. Please enter your location manually.');
        document.getElementById('weatherLoading').classList.add('hidden');
        document.getElementById('weatherContent').style.display = 'block';
    }
}

// ── Precise Reverse geocode (Villages/Towns) ──
async function reverseGeocode(lat, lon) {
    try {
        // BigDataCloud is very fast and precise for Indian villages and local areas (free, no key needed for client-side)
        const url = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`;
        const response = await fetch(url);
        
        if (response.ok) {
            const data = await response.json();
            
            // Try to get the most specific locality available (village -> suburb -> city)
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
        console.log('Reverse geocoding error:', err);
    }
}

// ── Fetch weather by city/village name ───────
async function fetchWeatherByLocation(locationName) {
    document.getElementById('weatherLoading').classList.remove('hidden');
    document.getElementById('weatherContent').style.display = 'none';

    try {
        // Geocode name -> coordinates using Nominatim (better for villages than standard OpenMeteo)
        const geoUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(locationName)}&format=json&limit=1`;
        const geoRes = await fetch(geoUrl, { headers: { 'Accept-Language': 'en' } });

        if (!geoRes.ok) throw new Error('Geocoding failed');
        const geoData = await geoRes.json();

        if (!geoData || geoData.length === 0) {
            document.getElementById('weatherLoading').classList.add('hidden');
            document.getElementById('weatherContent').style.display = 'block';
            alert('Location not found. Please try adding your district or state name (e.g., "Malandighi, West Bengal").');
            return;
        }

        const place = geoData[0];
        const lat = parseFloat(place.lat);
        const lon = parseFloat(place.lon);
        
        // Clean up the display name (e.g. "Malandighi, Kanksa CD Block, Paschim Bardhaman...")
        let resolvedName = place.display_name.split(',').slice(0, 2).join(',').trim();

        userLocation = { lat, lon };
        userLocationName = resolvedName;
        document.getElementById('locationInput').value = resolvedName;

        // Fetch weather using resolved coordinates
        await fetchWeatherByCoords(lat, lon, resolvedName);

    } catch (error) {
        console.log('Weather fetch error:', error);
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
        const url = `https://api.open-meteo.com/v1/forecast` +
            `?latitude=${lat}&longitude=${lon}` +
            `&current=temperature_2m,relative_humidity_2m,wind_speed_10m,` +
            `precipitation_probability,weather_code,visibility` +
            `&wind_speed_unit=kmh&timezone=auto`;

        const res = await fetch(url);
        if (!res.ok) throw new Error(`Open-Meteo error ${res.status}`);

        const data = await res.json();
        processOpenMeteoData(data, locationName || userLocationName || `${lat.toFixed(2)}, ${lon.toFixed(2)}`);

    } catch (error) {
        console.log('Open-Meteo error:', error);
        document.getElementById('weatherLoading').classList.add('hidden');
        document.getElementById('weatherContent').style.display = 'block';
        alert('Unable to fetch weather data. Please check your internet connection.');
    }
}

// ── Parse Open-Meteo response ────────────────
function processOpenMeteoData(data, locationName) {
    const c = data.current;

    currentWeather = {
        temp: Math.round(c.temperature_2m),
        humidity: Math.round(c.relative_humidity_2m),
        windSpeed: Math.round(c.wind_speed_10m),
        visibility: c.visibility != null ? Math.round(c.visibility / 1000) : 10, // m → km
        rainProbability: Math.round(c.precipitation_probability || 0),
        condition: weatherCodeToCondition(c.weather_code),
        icon: weatherCodeToIcon(c.weather_code)
    };

    updateWeatherUI(locationName);
    document.getElementById('weatherLoading').classList.add('hidden');
    document.getElementById('weatherContent').style.display = 'block';
}

// ── WMO weather code → readable condition ────
function weatherCodeToCondition(code) {
    if (code === 0) return 'Clear Sky';
    if (code <= 2) return 'Partly Cloudy';
    if (code === 3) return 'Overcast';
    if (code <= 49) return 'Foggy / Hazy';
    if (code <= 59) return 'Drizzle';
    if (code <= 69) return 'Rain';
    if (code <= 79) return 'Snow / Sleet';
    if (code <= 84) return 'Rain Showers';
    if (code <= 94) return 'Thunderstorm';
    return 'Severe Thunderstorm';
}

// ── WMO weather code → Font Awesome icon ─────
function weatherCodeToIcon(code) {
    if (code === 0) return 'fa-sun';
    if (code <= 2) return 'fa-cloud-sun';
    if (code === 3) return 'fa-cloud';
    if (code <= 49) return 'fa-smog';
    if (code <= 67) return 'fa-cloud-showers-heavy';
    if (code <= 77) return 'fa-snowflake';
    if (code <= 82) return 'fa-cloud-rain';
    if (code <= 99) return 'fa-bolt';
    return 'fa-cloud-sun';
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
