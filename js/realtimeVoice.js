// ============================================
// BHARATFARM ROBUST VOICE ASSISTANT (STT -> LLM -> TTS)
// ============================================

(function () {
    // ---- STATE ----
    let state = 'idle'; // 'idle' | 'listening' | 'thinking' | 'speaking' | 'error'
    let recognition = null;
    let synth = window.speechSynthesis;
    let currentUtterance = null;
    let isDebugMode = window.location.search.includes('debug=1');
    let conversationHistory = [];

    // ---- UI Elements ----
    let overlay, statusText, startStopBtn, avatar, debugPanel, debugLogArea;
    let transcriptArea, userTextSpan, aiTextSpan;

    function initUI() {
        // 1. Create Floating Toggle Button
        const talkBtn = document.createElement("button");
        talkBtn.id = "talkToAIBtn";
        talkBtn.innerHTML = '<i class="fas fa-microphone"></i> Talk to AI';
        talkBtn.className = "btn btn-primary voice-fab";
        talkBtn.style.position = "fixed";
        talkBtn.style.zIndex = "999";
        talkBtn.style.padding = "10px 20px";
        talkBtn.style.borderRadius = "30px";
        talkBtn.style.boxShadow = "0 4px 15px rgba(0,0,0,0.2)";
        talkBtn.style.fontSize = "1rem";
        talkBtn.style.display = "flex";
        talkBtn.style.alignItems = "center";
        talkBtn.style.gap = "8px";
        document.body.appendChild(talkBtn);

        // 2. Create the Modal Overlay
        overlay = document.createElement("div");
        overlay.id = "voiceOverlay";
        overlay.innerHTML = `
            <div class="voice-modal">
                <button class="voice-close-btn" id="voiceCloseBtn"><i class="fas fa-times"></i></button>
                
                <div class="voice-header">
                    <div class="voice-avatar" id="voiceAvatar"><i class="fas fa-robot"></i></div>
                    <h3>KrishiBot Voice</h3>
                </div>
                
                <div class="voice-status-badge" id="voiceStatusBadge">Idle</div>

                <div class="voice-transcript-area" id="voiceTranscriptArea" style="display:none;">
                    <div class="bubble user-bubble" id="userBubble"><i class="fas fa-user-circle"></i> <span id="userText">...</span></div>
                    <div class="bubble ai-bubble" id="aiBubble" style="display:none;"><i class="fas fa-robot"></i> <span id="aiText">...</span></div>
                </div>

                <div class="voice-controls">
                    <button class="btn btn-primary voice-start-btn" id="voiceStartStopBtn">
                        <i class="fas fa-microphone"></i> Start Conversation
                    </button>
                </div>
                
                ${isDebugMode ? `
                <div class="voice-debug-panel" id="voiceDebugPanel">
                    <div class="debug-header">Debug Logs <button id="clearDebugLog" style="font-size:0.7rem;">Clear</button></div>
                    <div class="debug-logs" id="debugLogs"></div>
                </div>` : ''}
            </div>
        `;

        // 3. CSS Styles for Animations and Layout
        const style = document.createElement('style');
        style.textContent = `
            #voiceOverlay {
                display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%;
                background: rgba(0,0,0,0.6); z-index: 10000; align-items: center; justify-content: center;
                backdrop-filter: blur(5px);
            }
            .voice-modal {
                background: white; border-radius: 20px; width: 90%; max-width: 420px;
                padding: 30px 20px; text-align: center; position: relative; box-shadow: 0 10px 30px rgba(0,0,0,0.2);
                display: flex; flex-direction: column; align-items: center;
            }
            .voice-close-btn {
                position: absolute; top: 15px; right: 15px; background: none; border: none; font-size: 1.2rem; cursor: pointer; color: #888;
            }
            .voice-header { display: flex; flex-direction: column; align-items: center; gap: 15px; margin-bottom: 15px; width: 100%; }
            .voice-header h3 { margin: 0; font-size: 1.3rem; color: #333; }
            
            /* Avatar Animations */
            .voice-avatar {
                width: 70px; height: 70px; border-radius: 50%; background: #e0f2f1; color: var(--primary);
                display: flex; align-items: center; justify-content: center; font-size: 2rem; transition: all 0.3s ease;
                position: relative;
            }
            /* Ripple Effect when Listening */
            .avatar-listening {
                background: var(--primary); color: white;
                box-shadow: 0 0 0 0 rgba(76, 175, 80, 0.7);
                animation: pulse-ripple 1.5s infinite;
            }
            @keyframes pulse-ripple {
                0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(76, 175, 80, 0.7); }
                70% { transform: scale(1.05); box-shadow: 0 0 0 20px rgba(76, 175, 80, 0); }
                100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(76, 175, 80, 0); }
            }
            /* Spin Effect when Thinking */
            .avatar-thinking {
                background: #ff9800; color: white;
                animation: spin-thinking 2s linear infinite;
            }
            @keyframes spin-thinking { 100% { transform: rotate(360deg); } }
            /* Bounce Effect when Speaking */
            .avatar-speaking {
                background: #2196f3; color: white;
                animation: bounce-speak 0.8s infinite alternate;
            }
            @keyframes bounce-speak { 0% { transform: translateY(0); } 100% { transform: translateY(-10px); } }

            /* Status Text Badge */
            .voice-status-badge {
                padding: 5px 15px; border-radius: 20px; font-size: 0.85rem; font-weight: 600; text-transform: uppercase;
                margin-bottom: 20px; background: #eee; color: #666; transition: background 0.3s, color 0.3s;
            }
            .status-listening { background: #e8f5e9; color: #2e7d32; }
            .status-thinking { background: #fff3e0; color: #e65100; }
            .status-speaking { background: #e3f2fd; color: #1565c0; }
            .status-error { background: #ffebee; color: #c62828; }

            /* Transcript Area */
            .voice-transcript-area {
                width: 100%; background: #fdfdfd; border-radius: 12px; padding: 15px; 
                min-height: 80px; max-height: 200px; overflow-y: auto; text-align: left; 
                margin-bottom: 20px; border: 1px solid #eee; display: flex; flex-direction: column; gap: 10px;
            }
            .bubble { display: flex; gap: 8px; line-height: 1.4; font-size: 0.95rem; }
            .user-bubble { color: #555; }
            .ai-bubble { color: #111; font-weight: 500; }
            .bubble i { margin-top: 3px; }

            /* Controls */
            .voice-controls { width: 100%; }
            .voice-controls .btn { width: 100%; padding: 12px; font-size: 1.1rem; display:flex; align-items:center; justify-content:center; gap:10px; border-radius:30px; transition: all 0.2s;}
            .btn-danger { background: #f44336; color: white; border:none;}
            .btn-danger:hover { background: #d32f2f;}

            /* Debug Panel */
            .voice-debug-panel {
                width: 100%; margin-top: 20px; border-top: 2px dashed #ccc; padding-top: 10px; text-align: left;
            }
            .debug-header { font-size: 0.8rem; font-weight: bold; color: #888; display:flex; justify-content:space-between; margin-bottom:5px; }
            .debug-logs { background: #111; color: #0f0; font-family: monospace; font-size: 0.75rem; padding: 10px; border-radius: 8px; height: 100px; overflow-y: auto; }
        `;
        document.head.appendChild(style);
        document.body.appendChild(overlay);

        // Map DOM Elements
        statusText = document.getElementById("voiceStatusBadge");
        startStopBtn = document.getElementById("voiceStartStopBtn");
        avatar = document.getElementById("voiceAvatar");
        transcriptArea = document.getElementById("voiceTranscriptArea");
        userTextSpan = document.getElementById("userText");
        aiTextSpan = document.getElementById("aiText");
        debugLogArea = document.getElementById("debugLogs");

        // Bind Events
        talkBtn.addEventListener("click", () => overlay.style.display = "flex");
        document.getElementById("voiceCloseBtn").addEventListener("click", stopAndClose);
        startStopBtn.addEventListener("click", () => {
            if (state === 'idle' || state === 'error') {
                startListening();
            } else {
                stopAndReset();
            }
        });

        if (isDebugMode) {
            document.getElementById("clearDebugLog").addEventListener("click", () => debugLogArea.innerHTML = '');
            logDebug("UI Initialized. Waiting for start.");
        }
    }

    // ==========================================
    // SPEECH RECOGNITION (Browser STT)
    // ==========================================
    function setupRecognition() {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            alert("Your browser does not support Voice Recognition. Please use Chrome.");
            return false;
        }

        recognition = new SpeechRecognition();
        recognition.continuous = false; // Stop listening automatically when the user pauses
        recognition.interimResults = true; // Show text as they speak

        // Detect language from app if available, else English
        const uiLang = localStorage.getItem("selectedLanguage") || "en";
        const langMap = { "en": "en-IN", "hi": "hi-IN", "bn": "bn-IN" };
        recognition.lang = langMap[uiLang] || "en-US";

        recognition.onstart = () => {
            updateState('listening');
            logDebug(`Microphone started (Lang: ${recognition.lang})`);
            transcriptArea.style.display = 'flex';
            document.getElementById("aiBubble").style.display = 'none';
            userTextSpan.innerHTML = '<i style="color:#aaa;">Listening...</i>';
        };

        recognition.onresult = (event) => {
            let interimTranscript = '';
            let finalTranscript = '';

            for (let i = event.resultIndex; i < event.results.length; ++i) {
                if (event.results[i].isFinal) {
                    finalTranscript += event.results[i][0].transcript;
                } else {
                    interimTranscript += event.results[i][0].transcript;
                }
            }

            userTextSpan.innerHTML = finalTranscript || interimTranscript;
            transcriptArea.scrollTop = transcriptArea.scrollHeight;
        };

        recognition.onerror = (event) => {
            console.error("Speech Recognition Error:", event.error);
            logDebug(`Speech Error: ${event.error}`, true);
            if (event.error !== 'no-speech') {
                updateState('error');
            } else {
                stopAndReset(); // Just timed out quietly
            }
        };

        recognition.onend = () => {
            logDebug("Microphone stopped.");
            const transcript = userTextSpan.innerText;
            if (state === 'listening' && transcript && transcript.length > 2 && !transcript.includes("Listening...")) {
                sendToBackend(transcript);
            } else if (state === 'listening') {
                logDebug("Silence detected, restarting listening...");
                setTimeout(() => startListening(), 300); // Continuous conversation loop
            }
        };

        return true;
    }

    // ==========================================
    // BACKEND COMMUNICATION (Node.js Proxy → Gemini)
    // ==========================================
    async function sendToBackend(text) {
        updateState('thinking');
        logDebug(`Sending to AI: "${text}"`);

        // The proxy runs on port 5000 (node server.js)
        // Make sure to run: node server.js  before using KrishiBot
        const PROXY_URL = '/api/chat';
        const currentLang = localStorage.getItem('selectedLanguage') || 'en';

        const payload = {
            text: text,
            language: currentLang,
            history: conversationHistory.slice(-6)
        };

        console.log('[KrishiBot] → Calling proxy:', PROXY_URL);
        console.log('[KrishiBot] → Payload:', JSON.stringify(payload));

        try {
            const response = await fetch(PROXY_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            console.log('[KrishiBot] ← Proxy status:', response.status);

            conversationHistory.push({ role: 'user', text: text });

            if (!response.ok) {
                const errTxt = await response.text();
                console.error('[KrishiBot] ← Error body:', errTxt);
                throw new Error(`Proxy Error ${response.status}: ${errTxt}`);
            }

            const data = await response.json();
            const aiResponseText = data.response || "I'm sorry, I couldn't process that.";

            console.log('[KrishiBot] ← AI said:', aiResponseText.substring(0, 80));
            logDebug(`AI Response received.`);
            conversationHistory.push({ role: 'ai', text: aiResponseText });
            speakResponse(aiResponseText);

        } catch (error) {
            console.error('[KrishiBot] ❌ Error:', error.message);
            logDebug(`API Error: ${error.message}`, true);
            updateState('error');
            document.getElementById('aiBubble').style.display = 'flex';
            const hint = error.message.includes('Failed to fetch')
                ? 'Cannot connect to server. Open a terminal and run: <b>node server.js</b>'
                : error.message;
            aiTextSpan.innerHTML = `<span style='color:red;'>❌ ${hint}</span>`;
        }
    }

    // ==========================================
    // SPEECH SYNTHESIS (Browser TTS)
    // ==========================================
    function speakResponse(text) {
        updateState('speaking');

        document.getElementById("aiBubble").style.display = 'flex';
        aiTextSpan.innerHTML = text;
        transcriptArea.scrollTop = transcriptArea.scrollHeight;

        if (synth.speaking) {
            synth.cancel();
        }

        currentUtterance = new SpeechSynthesisUtterance(text);

        // Select Voice based on Lang
        const uiLang = localStorage.getItem("selectedLanguage") || "en";
        const voices = synth.getVoices();

        if (uiLang === "hi") {
            currentUtterance.lang = 'hi-IN';
            const hindiVoice = voices.find(v => v.lang === 'hi-IN' || v.lang.startsWith('hi'));
            if (hindiVoice) currentUtterance.voice = hindiVoice;
            currentUtterance.rate = 1.0;
            currentUtterance.pitch = 1.0;
        } else if (uiLang === "bn") {
            currentUtterance.lang = 'bn-IN';
            const bengaliVoice = voices.find(v => v.lang === 'bn-IN' || v.lang === 'bn-BD' || v.lang.startsWith('bn'));
            if (bengaliVoice) {
                currentUtterance.voice = bengaliVoice;
            } else {
                if (!sessionStorage.getItem('bnVoiceAlertShownRT')) {
                    alert("A native Bengali voice is not installed on your system. Pronunciation may sound unnatural. For the best experience, please install a Bengali voice pack in your device settings.");
                    sessionStorage.setItem('bnVoiceAlertShownRT', 'true');
                }
            }
            currentUtterance.rate = 1.0;
            currentUtterance.pitch = 1.0;
        } else {
            currentUtterance.lang = 'en-IN';
            currentUtterance.rate = 1.0;
            currentUtterance.pitch = 1.0;
        }

        currentUtterance.onerror = (e) => {
            logDebug(`TTS Error: ${e.error}`, true);
            stopAndReset();
        };

        currentUtterance.onend = () => {
            logDebug("Playback finished. Restarting listening automatically...");
            // Instead of stopAndReset(), automatically begin listening again for the user's next response
            if (state !== 'error') {
                setTimeout(() => {
                    // Small delay to prevent the mic from picking up the very end of its own speaker echo
                    if (document.getElementById("voiceOverlay").style.display !== "none") {
                        startListening();
                    }
                }, 800);
            } else {
                stopAndReset();
            }
        };

        logDebug("Speaking text aloud...");
        synth.speak(currentUtterance);
    }

    // ==========================================
    // UTILS & STATE MANAGEMENT
    // ==========================================
    function startListening() {
        if (!recognition) {
            if (!setupRecognition()) return;
        }
        if (synth.speaking) synth.cancel(); // Stop AI if it's currently talking

        try {
            recognition.start();
        } catch (e) {
            logDebug("Recognition already started or blocked.");
        }
    }

    function stopAndReset() {
        state = 'idle';
        if (recognition) recognition.stop();
        if (synth.speaking) synth.cancel();
        updateUI();
    }

    function stopAndClose() {
        conversationHistory = []; // Reset memory when completely closed
        stopAndReset();
        overlay.style.display = "none";
    }

    function updateState(newState) {
        state = newState;
        updateUI();
    }

    function updateUI() {
        // Reset old classes
        avatar.className = "voice-avatar";
        statusText.className = "voice-status-badge";
        startStopBtn.disabled = false;

        switch (state) {
            case 'idle':
                statusText.innerText = "Idle";
                startStopBtn.innerHTML = '<i class="fas fa-microphone"></i> Start Conversation';
                startStopBtn.className = "btn btn-primary";
                break;
            case 'listening':
                statusText.innerText = "Listening...";
                statusText.classList.add("status-listening");
                avatar.classList.add("avatar-listening");
                startStopBtn.innerHTML = '<i class="fas fa-stop"></i> Stop Listening';
                startStopBtn.className = "btn btn-danger";
                break;
            case 'thinking':
                statusText.innerText = "Thinking...";
                statusText.classList.add("status-thinking");
                avatar.classList.add("avatar-thinking");
                startStopBtn.disabled = false;
                startStopBtn.innerHTML = '<i class="fas fa-stop"></i> Stop';
                startStopBtn.className = "btn btn-danger";
                break;
            case 'speaking':
                statusText.innerText = "Speaking...";
                statusText.classList.add("status-speaking");
                avatar.classList.add("avatar-speaking");
                startStopBtn.innerHTML = '<i class="fas fa-stop"></i> Stop';
                startStopBtn.className = "btn btn-danger";
                break;
            case 'error':
                statusText.innerText = "Error: Try Again";
                statusText.classList.add("status-error");
                startStopBtn.innerHTML = '<i class="fas fa-redo"></i> Retry';
                startStopBtn.className = "btn btn-primary";
                break;
        }
    }

    function logDebug(message, isError = false) {
        if (!isDebugMode || !debugLogArea) return;
        const div = document.createElement("div");
        div.innerText = `[${new Date().toLocaleTimeString()}] ${message}`;
        if (isError) div.style.color = "red";
        debugLogArea.appendChild(div);
        debugLogArea.scrollTop = debugLogArea.scrollHeight;
    }

    // Initialize on load
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", initUI);
    } else {
        initUI();
    }
})();
