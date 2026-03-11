export default async function handler(req, res) {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    );

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed. Use POST.' });
    }

    try {
        const { text, language = "en", history = [] } = req.body;

        if (!text) {
            return res.status(400).json({ error: 'No transcript text provided.' });
        }

        // System instructions based on language
        const systemPrompt = `You are KrishiBot, a friendly conversational AI voice assistant for BharatFarm, an Indian agricultural platform. 
Keep your answers very concise (under 2-3 short sentences) because they will be read aloud. 
The user is speaking in ${language}. Reply naturally in the same language.`;

        // Strictly read from Backend Environment Variables (Vercel ENV or .env)
        const apiKey = process.env.GEMINI_API_KEY;

        if (!apiKey) {
            console.error("CRITICAL: Missing GEMINI_API_KEY inside backend environment.");
            return res.status(500).json({ error: "Server Configuration Error: API key is not set in backend environment." });
        }

        const contents = history.map(msg => ({
            role: msg.role === 'ai' ? 'model' : 'user',
            parts: [{ text: msg.text }]
        }));
        // Add current turn
        contents.push({ role: 'user', parts: [{ text: text }] });

        const fetchResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                systemInstruction: {
                    parts: [{ text: systemPrompt }]
                },
                contents: contents
            })
        });

        if (!fetchResponse.ok) {
            const err = await fetchResponse.text();
            console.error("Gemini API Failed:", fetchResponse.status, err);
            return res.status(502).json({ error: `AI Gateway Error (${fetchResponse.status})` });
        }

        const data = await fetchResponse.json();
        const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || "I'm sorry, I couldn't process that request.";

        console.log(`[Voice Assistant Backend] Responded successfully: ${aiResponse.substring(0, 50)}...`);
        return res.status(200).json({ response: aiResponse });

    } catch (error) {
        console.error("Backend Voice Request Error:", error);
        return res.status(500).json({ error: "Internal Server Error while communicating with AI." });
    }
}
