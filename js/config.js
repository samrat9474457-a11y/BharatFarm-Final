// ============================================
// CONFIGURATION & CONSTANTS
// ============================================

const API_BASE_URL = '/api';

// ── OpenRouter AI Chat Assistant ─────────────────
// API key is kept server-side in .env for security — do NOT put it here.
const OPENROUTER_API_KEY = '';

// ── WebRTC Voice Assistant ─────────────────
const OPENAI_API_KEY = '';

// ── Unsplash API Configuration ─────────────────
const UNSPLASH_API_KEY = '';
const USE_UNSPLASH = true;

// ── Pexels API Configuration ─────────────────
const PEXELS_API_KEY = '';
const USE_PEXELS = true;

// Land conversion rates
const LAND_CONVERSIONS = {
    kathaPerBigha: 20,
    acrePerBigha: 0.62,
    kathaPerAcre: 32.26,
    bighaPerAcre: 1.61
};

// ── Shared AI helper ─────────────────────────────
// All AI calls are routed through the backend proxy (/api/chat).
// The API key is stored securely in the server's .env file — never exposed here.
const FREE_MODELS = [
    'openrouter/free',
    'meta-llama/llama-3.3-70b-instruct:free',
    'google/gemini-2.0-flash-exp:free',
    'nvidia/llama-3.1-nemotron-nano-12b-v1:free'
];

async function aiCall({ messages, model, temperature = 0.7, max_tokens = 800 }) {

    // Helper to make one fetch attempt
    async function attempt(url, headers, body) {
        const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...headers },
            body: JSON.stringify(body)
        });
        return res;
    }

    let lastErr = '';
    for (const m of (model ? [model] : FREE_MODELS)) {
        try {
            // Always use backend proxy — API key lives securely in server .env
            const res = await attempt('/api/chat', { 'X-Title': 'BharatFarm' }, { model: m, messages, temperature, max_tokens });

            if (res.status === 429) { lastErr = 'rate_limit'; continue; }
            if (!res.ok) { lastErr = `HTTP ${res.status}`; continue; }

            const data = await res.json();
            const content = data?.choices?.[0]?.message?.content?.trim();
            if (content) return content;
        } catch (e) {
            lastErr = e.message;
            continue;
        }
    }
    throw new Error(`AI call failed: ${lastErr}`);
}
