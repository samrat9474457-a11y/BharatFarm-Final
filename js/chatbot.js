// ============================================
// BHARATFARM AI CHAT ASSISTANT
// Powered by OpenRouter API
// ============================================

(function () {
  "use strict";

  // ── State ──────────────────────────────────
  let chatOpen = false;
  let selectedLang = null; // 'en' | 'hi' | 'bn'
  let conversationHistory = []; // for multi-turn context
  let isTyping = false;
  let langSelected = false;
  let apiKeyReady = false;
  let recognition = null;
  let isListening = false;
  let autoSpeakActive = false;

  // ── System Prompt ──────────────────────────
  const SYSTEM_PROMPT = `You are an AI-powered chat assistant integrated into the BharatFarm platform.

Your purpose is to STRICTLY help users (who are Farmers or Buyers) with:
- Farming and agriculture-related queries
- Crop planning and best practices
- Market prices, buying and selling crops
- Leaf disease detection assistance
- Platform feature explanations
- Technical troubleshooting

If a user asks about topics completely unrelated to agriculture, farming, or the BharatFarm marketplace, politely steer the conversation back to assisting them as a Farmer or Buyer.

Language Support (Very Important):
- The user has selected a language. Continue the ENTIRE conversation in that language.
- Do not mix languages unless the user does.

Behavior Guidelines:
- Greet users politely.
- Provide clear, simple, and practical answers.
- Use easy language so farmers, students, and general users can understand.
- Break complex topics into bullet points or step-by-step guidance.
- Ask follow-up questions only when needed for clarity.
- If unsure about something, say honestly that you are not certain.
- Never generate harmful, unsafe, or misleading information.

Agriculture-Focused Assistance:
- Be especially helpful in: crop suggestions based on season, basic farming techniques, fertilizer and irrigation guidance (general advice only), pest and disease awareness, explaining BharatFarm features clearly.

Goal: Act as a friendly, knowledgeable, and reliable digital farming assistant for BharatFarm users across India.`;

  // ── Language Config ────────────────────────
  const LANG_CONFIG = {
    en: {
      label: "English",
      flag: "🇬🇧",
      greeting:
        "Hello! 🌾 I'm **KrishiBot**, your BharatFarm AI assistant!\n\nI can help you with crop planning, disease detection, weather guidance, and much more. How can I help you today?",
      placeholder: "Ask me anything about farming...",
      systemNote: "Respond entirely in English.",
      quickReplies: [
        "Best crop for monsoon?",
        "Wheat fertilizer tips",
        "How to detect leaf disease?",
      ],
    },
    hi: {
      label: "हिन्दी",
      flag: "🇮🇳",
      greeting:
        "नमस्ते! 🌾 मैं **KrishiBot** हूँ, आपका BharatFarm AI सहायक!\n\nमैं फसल नियोजन, रोग पहचान, मौसम मार्गदर्शन और बहुत कुछ में मदद कर सकता हूँ। आज मैं आपकी कैसे सहायता कर सकता हूँ?",
      placeholder: "खेती से जुड़ा कुछ भी पूछें...",
      systemNote:
        "Respond entirely in Hindi (Devanagari script). The user speaks Hindi.",
      quickReplies: [
        "मानसून की सबसे अच्छी फसल?",
        "गेहूं के लिए खाद",
        "पत्ती की बीमारी कैसे पहचानें?",
      ],
    },
    bn: {
      label: "বাংলা",
      flag: "🇧🇩",
      greeting:
        "নমস্কার! 🌾 আমি **KrishiBot**, আপনার BharatFarm AI সহকারী!\n\nআমি ফসল পরিকল্পনা, রোগ শনাক্তকরণ, আবহাওয়া নির্দেশনা এবং আরও অনেক কিছুতে সাহায্য করতে পারি। আজ আমি আপনাকে কীভাবে সাহায্য করতে পারি?",
      placeholder: "কৃষি সম্পর্কে যেকোনো প্রশ্ন করুন...",
      systemNote:
        "Respond entirely in Bengali (Bangla script). The user speaks Bengali.",
      quickReplies: [
        "বর্ষার সেরা ফসল কী?",
        "গমের সার পরামর্শ",
        "পাতার রোগ কীভাবে চিনব?",
      ],
    },
  };

  // ── Init ───────────────────────────────────
  function init() {
    injectHTML();
    bindEvents();
    checkApiKey();
  }

  // ── Inject HTML ────────────────────────────
  function injectHTML() {
    const widget = document.createElement("div");
    widget.id = "chatbotWidget";
    widget.innerHTML = `
            <!-- Floating Toggle Button -->
            <button id="chatbotToggle" title="Chat with KrishiBot AI" aria-label="Open AI Chat">
                <i class="fas fa-robot"></i>
                <span class="chat-badge" id="chatBadge" style="display:none">1</span>
            </button>

            <!-- Chat Panel -->
            <div id="chatbotPanel" class="chat-hidden" role="dialog" aria-label="KrishiBot Chat">

                <!-- Header -->
                <div id="chatbotHeader">
                    <div class="chat-header-avatar" aria-hidden="true">🌾</div>
                    <div class="chat-header-info">
                        <h4>KrishiBot <i class="fas fa-robot" style="font-size:0.75rem;opacity:0.8"></i></h4>
                        <p><span class="chat-online-dot"></span> AI Farming Assistant</p>
                    </div>
                    <div class="chat-header-actions">
                        <button class="chat-header-btn" id="chatLangBtn" title="Change Language" onclick="chatbotChangeLang()">
                            <i class="fas fa-globe"></i>
                        </button>
                        <button class="chat-header-btn" id="chatClearBtn" title="Clear Chat" onclick="chatbotClear()">
                            <i class="fas fa-trash-alt"></i>
                        </button>
                        <button class="chat-header-btn" id="chatFullscreenBtn" title="Fullscreen" onclick="chatbotToggleFullscreen()">
                            <i class="fas fa-expand"></i>
                        </button>
                        <button class="chat-header-btn" title="Close" onclick="toggleChatbot()">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                </div>

                <!-- Messages -->
                <div id="chatbotMessages" role="log" aria-live="polite"></div>

                <!-- Input Bar -->
                <div id="chatbotInputArea">
                    <textarea
                        id="chatbotInput"
                        placeholder="Ask me anything about farming..."
                        rows="1"
                        maxlength="1000"
                        aria-label="Chat message input"
                        onkeydown="chatbotHandleKey(event)"
                        oninput="chatbotAutoResize(this)"
                    ></textarea>
                    <button class="chat-header-btn" id="chatVoiceBtn" title="Speak" onclick="chatbotToggleVoice()" style="margin-right: 5px; color: var(--text-secondary);">
                        <i class="fas fa-microphone"></i>
                    </button>
                    <button id="chatSendBtn" title="Send message" onclick="chatbotSend()" disabled>
                        <i class="fas fa-paper-plane"></i>
                    </button>
                </div>

            </div>
        `;
    document.body.appendChild(widget);
  }

  // ── Bind Events ────────────────────────────
  function bindEvents() {
    document
      .getElementById("chatbotToggle")
      .addEventListener("click", toggleChatbot);

    const input = document.getElementById("chatbotInput");
    input.addEventListener("input", () => {
      const sendBtn = document.getElementById("chatSendBtn");
      sendBtn.disabled =
        input.value.trim() === "" || isTyping || !langSelected || !apiKeyReady;
    });
  }

  // ── API Key Check ─────────────────────────
  function checkApiKey() {
    // The server handles the Gemini API key, so the frontend is always ready.
    apiKeyReady = true;
    document.getElementById("chatBadge").style.display = "flex";
  }

  // ── Toggle Chat ────────────────────────────
  function toggleChatbot() {
    chatOpen = !chatOpen;
    const panel = document.getElementById("chatbotPanel");
    const btn = document.getElementById("chatbotToggle");
    const badge = document.getElementById("chatBadge");

    if (chatOpen) {
      panel.classList.remove("chat-hidden");
      btn.style.display = "none"; // Hide toggle button when chat is open
      badge.style.display = "none";
      
      const voiceFab = document.querySelector(".voice-fab");
      if (voiceFab) voiceFab.classList.add("chat-active");

      if (document.getElementById("chatbotMessages").children.length === 0) {
        startChat();
      } else {
        scrollToBottom();
      }

      setTimeout(() => document.getElementById("chatbotInput").focus(), 300);
    } else {
      panel.classList.add("chat-hidden");
      btn.style.display = ""; // Show toggle button when chat is closed
      btn.innerHTML = '<i class="fas fa-robot"></i>';
      
      const voiceFab = document.querySelector(".voice-fab");
      if (voiceFab) voiceFab.classList.remove("chat-active");
    }
  }

  // ── Start Chat ─────────────────────────────
  function startChat() {
    clearMessages();
    langSelected = false;
    selectedLang = null;
    conversationHistory = [];
    updateSendBtn();

    if (!apiKeyReady) {
      startChat(); // Fallback just in case, but apiKeyReady is now true by default
      return;
    }

    showLangSelector();
  }

  // ── Show Language Selector ─────────────────
  function showLangSelector() {
    const msgs = document.getElementById("chatbotMessages");
    const card = document.createElement("div");
    card.className = "lang-select-card";
    card.id = "langSelectorCard";
    card.innerHTML = `
            <p><i class="fas fa-globe"></i> <strong>Welcome to KrishiBot!</strong><br>Which language would you prefer?</p>
            <div class="lang-btn-group">
                <button class="lang-pick-btn" onclick="chatbotSelectLang('en')">
                    <span class="lang-flag">🇬🇧</span>English
                </button>
                <button class="lang-pick-btn" onclick="chatbotSelectLang('hi')">
                    <span class="lang-flag">🇮🇳</span>हिन्दी
                </button>
                <button class="lang-pick-btn" onclick="chatbotSelectLang('bn')">
                    <span class="lang-flag">🇧🇩</span>বাংলা
                </button>
            </div>
        `;
    msgs.appendChild(card);
    scrollToBottom();
  }

  // ── Select Language ────────────────────────
  window.chatbotSelectLang = function (lang) {
    selectedLang = lang;
    langSelected = true;
    conversationHistory = [];

    // Remove selector card
    const card = document.getElementById("langSelectorCard");
    if (card) card.remove();

    // Show user's selection
    const langInfo = LANG_CONFIG[lang];
    appendUserMsg(`${langInfo.flag} ${langInfo.label}`);

    // Update placeholder
    document.getElementById("chatbotInput").placeholder = langInfo.placeholder;
    updateSendBtn();

    // Show greeting
    setTimeout(() => {
      appendBotMsg(langInfo.greeting, true);
      // Show quick replies
      showQuickReplies(langInfo.quickReplies);
    }, 400);
  };

  // ── Change Language ────────────────────────
  window.chatbotChangeLang = function () {
    langSelected = false;
    selectedLang = null;
    conversationHistory = [];
    clearMessages();
    updateSendBtn();
    showLangSelector();
  };

  // ── Clear Chat ────────────────────────────
  window.chatbotClear = function () {
    conversationHistory = [];
    clearMessages();
    langSelected = false;
    selectedLang = null;
    updateSendBtn();
    if (apiKeyReady) {
      showLangSelector();
    } else {
      showApiKeySetup();
    }
  };

  // ── Show Quick Replies ─────────────────────
  function showQuickReplies(replies) {
    const msgs = document.getElementById("chatbotMessages");
    const row = document.createElement("div");
    row.className = "chat-quick-replies";
    row.id = "quickRepliesRow";
    replies.forEach((r) => {
      const btn = document.createElement("button");
      btn.className = "quick-reply-btn";
      btn.textContent = r;
      btn.onclick = () => {
        row.remove();
        document.getElementById("chatbotInput").value = r;
        chatbotSend();
      };
      row.appendChild(btn);
    });
    msgs.appendChild(row);
    scrollToBottom();
  }

  // ── Send Message ───────────────────────────
  window.chatbotSend = async function () {
    const input = document.getElementById("chatbotInput");
    const text = input.value.trim();
    if (!text || isTyping || !langSelected || !apiKeyReady) return;

    // Remove quick replies
    const qr = document.getElementById("quickRepliesRow");
    if (qr) qr.remove();

    input.value = "";
    chatbotAutoResize(input);
    updateSendBtn();

    appendUserMsg(text);
    conversationHistory.push({ role: "user", content: text });

    await sendToOpenRouter(text);
  };

  // ── Model candidates to try (in order) ────
  // "openrouter/free" auto-selects the best available free model
  // Remaining entries are explicit fallbacks with verified model IDs
  const MODEL_CANDIDATES = [
    "openrouter/free",
    "meta-llama/llama-3.3-70b-instruct:free",
    "google/gemini-2.0-flash-exp:free",
    "nvidia/llama-3.1-nemotron-nano-12b-v1:free",
    "qwen/qwen3-235b-a22b:free",
    "stepfun/step-3.5-flash:free",
  ];
  let workingModel = null; // cached once found

  // ── Small delay helper (for rate-limit retries) ──
  function delay(ms) { return new Promise(r => setTimeout(r, ms)); }

  // ── OpenRouter API Call ────────────────────
  async function sendToOpenRouter(userText) {
    isTyping = true;
    updateSendBtn();
    const typingEl = showTyping();

    const langNote = LANG_CONFIG[selectedLang].systemNote;
    const fullSystemPrompt =
      SYSTEM_PROMPT + "\n\nLanguage instruction: " + langNote;

    // Build messages array (OpenAI chat format)
    const messages = [
      { role: "system", content: fullSystemPrompt },
      ...conversationHistory
    ];

    // ── Try models until one works ─────────
    // If a working model was cached but fails, fall back to full list
    const candidates = workingModel
      ? [workingModel, ...MODEL_CANDIDATES.filter(m => m !== workingModel)]
      : MODEL_CANDIDATES;
    let lastError = "";

    for (const model of candidates) {
      try {
        let res;
        try {
          // Send directly to our local proxy!
          let retries = 1;
          while (retries >= 0) {
            try {
              res = await fetch("/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  text: userText,
                  language: selectedLang,
                  history: conversationHistory
                }),
              });
              break;
            } catch (err) {
              if (retries === 0) throw err;
              console.warn("[KrishiBot] Fetch failed, retrying in 2 seconds...");
              await new Promise(r => setTimeout(r, 2000));
              retries--;
            }
          }
        } catch (networkErr) {
          console.warn("[KrishiBot] Network error:", networkErr);
          lastError = networkErr.message;
          continue;
        }

        if (!res.ok) {
          throw new Error("HTTP " + res.status);
        }

        // ── Success! ───────────────────────
        const data = await res.json();
        const replyText = data.response;

        if (!replyText) {
          typingEl.remove();
          isTyping = false;
          updateSendBtn();
          appendBotMsg("Empty response. Please try again.", false, true);
          return;
        }

        typingEl.remove();
        isTyping = false;
        updateSendBtn();
        
        // Gamification Hook
        if (window.bfGamification) {
            window.bfGamification.trackChat();
        }

        appendBotMsg(replyText);
        conversationHistory.push({ role: "assistant", content: replyText });
        if (conversationHistory.length > 20) conversationHistory = conversationHistory.slice(-20);
        return;

      } catch (err) {
        lastError = err.message;
        if (err.name === "TypeError" && err.message.includes("fetch")) {
          // Network error — no point trying other models
          typingEl.remove();
          isTyping = false;
          updateSendBtn();
          appendBotMsg("🌐 Connecting to KrishiBot... please ensure your terminal shows Server Running.", false, true);
          return;
        }
        console.warn(`[KrishiBot] Exception:`, err.message);
        continue; // Try next fallback if local fails entirely
      }
    }

    // All candidates failed
    typingEl.remove();
    isTyping = false;
    updateSendBtn();
    appendBotMsg(
      `⚠️ Network is slow, retrying connection...\n\nAll AI models are currently unavailable. Last error: ${lastError}`,
      false, true
    );
  }

  // ── Voice Assistant (Speech2Text & TTS) ────
  window.chatbotToggleVoice = function () {
    const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRec) {
      alert("Voice recognition is not supported in your browser.");
      return;
    }

    if (!recognition) {
      recognition = new SpeechRec();
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = function () {
        isListening = true;
        autoSpeakActive = true; // turn on speech response auto-read if they used mic
        const btn = document.getElementById("chatVoiceBtn");
        btn.innerHTML = '<i class="fas fa-microphone-slash"></i>';
        btn.style.color = 'var(--danger)';
      };

      recognition.onresult = function (event) {
        const transcript = event.results[0][0].transcript;
        const input = document.getElementById("chatbotInput");
        input.value += (input.value ? " " : "") + transcript;
        updateSendBtn();
        chatbotAutoResize(input);

        // Auto send after they stop speaking
        if (input.value.trim() !== '') {
          chatbotSend();
        }
      };

      recognition.onerror = function (event) {
        console.error("Speech recognition error", event.error);
        stopListening();
      };

      recognition.onend = function () {
        stopListening();
      };
    }

    if (isListening) {
      recognition.stop();
    } else {
      if (selectedLang === 'hi') recognition.lang = 'hi-IN';
      else if (selectedLang === 'bn') recognition.lang = 'bn-IN';
      else recognition.lang = 'en-IN';

      recognition.start();
    }
  };

  function stopListening() {
    isListening = false;
    const btn = document.getElementById("chatVoiceBtn");
    if (btn) {
      btn.innerHTML = '<i class="fas fa-microphone"></i>';
      btn.style.color = 'var(--text-secondary)';
    }
  }

  function speakResponse(text) {
    if (!('speechSynthesis' in window)) return;

    // Stop any current reading
    window.speechSynthesis.cancel();

    // Clean markdown before speaking
    const cleanText = text.replace(/[*_#`]/g, '');

    const utterance = new SpeechSynthesisUtterance(cleanText);
    const voices = window.speechSynthesis.getVoices();

    if (selectedLang === 'hi') {
      utterance.lang = 'hi-IN';
      const hindiVoice = voices.find(v => v.lang === 'hi-IN' || v.lang.startsWith('hi'));
      if (hindiVoice) utterance.voice = hindiVoice;
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
    } else if (selectedLang === 'bn') {
      utterance.lang = 'bn-IN';
      const bengaliVoice = voices.find(v => v.lang === 'bn-IN' || v.lang === 'bn-BD' || v.lang.startsWith('bn'));
      if (bengaliVoice) {
        utterance.voice = bengaliVoice;
      } else {
        if (!sessionStorage.getItem('bnVoiceAlertShown')) {
          alert("A native Bengali voice is not installed on your system. Pronunciation may sound unnatural. For the best experience, please install a Bengali voice pack in your device settings.");
          sessionStorage.setItem('bnVoiceAlertShown', 'true');
        }
      }
      utterance.rate = 0.9;
      utterance.pitch = 1.0;
    } else {
      utterance.lang = 'en-IN';
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
    }

    window.speechSynthesis.speak(utterance);
  }

  window.chatbotStopSpeaking = function () {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    autoSpeakActive = false;
  };

  // ── Append Bot Message ─────────────────────
  function appendBotMsg(text, isGreeting = false, isError = false) {
    const msgs = document.getElementById("chatbotMessages");
    const wrapper = document.createElement("div");
    wrapper.className = "chat-msg bot" + (isError ? " chat-msg-error" : "");

    const avatar = document.createElement("div");
    avatar.className = "msg-avatar";
    avatar.innerHTML = "🌾";

    const bubble = document.createElement("div");
    bubble.className = "msg-bubble";
    bubble.innerHTML = formatMessage(text);

    // Add speak button contextually
    if (!isError) {
      const speakBtn = document.createElement("button");
      speakBtn.className = "chat-speak-inline-btn";
      speakBtn.title = "Read aloud";
      speakBtn.innerHTML = '<i class="fas fa-volume-up" style="font-size: 0.8rem; margin-left: 8px; color: var(--primary); cursor: pointer; opacity: 0.7;"></i>';
      speakBtn.onclick = () => speakResponse(text);
      bubble.appendChild(speakBtn);
    }

    const time = document.createElement("div");
    time.className = "msg-time";
    time.textContent = getCurrentTime();

    const inner = document.createElement("div");
    inner.style.maxWidth = "76%";
    inner.appendChild(bubble);
    inner.appendChild(time);

    wrapper.appendChild(avatar);
    wrapper.appendChild(inner);
    msgs.appendChild(wrapper);
    scrollToBottom();

    if (autoSpeakActive && !isError) {
      speakResponse(text);
    }
  }

  // ── Append User Message ────────────────────
  function appendUserMsg(text) {
    const msgs = document.getElementById("chatbotMessages");
    const wrapper = document.createElement("div");
    wrapper.className = "chat-msg user";

    const bubble = document.createElement("div");
    bubble.className = "msg-bubble";
    bubble.textContent = text;

    const time = document.createElement("div");
    time.className = "msg-time";
    time.textContent = getCurrentTime();

    const inner = document.createElement("div");
    inner.style.maxWidth = "100%";
    inner.appendChild(bubble);
    inner.appendChild(time);

    wrapper.appendChild(inner);
    msgs.appendChild(wrapper);
    scrollToBottom();
  }

  // ── Show Typing Indicator ──────────────────
  function showTyping() {
    const msgs = document.getElementById("chatbotMessages");
    const wrapper = document.createElement("div");
    wrapper.className = "chat-typing";
    wrapper.id = "typingIndicator";

    const avatar = document.createElement("div");
    avatar.className = "msg-avatar";
    avatar.innerHTML = "🌾";

    const bubble = document.createElement("div");
    bubble.className = "typing-bubble";
    bubble.innerHTML =
      '<div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div>';

    wrapper.appendChild(avatar);
    wrapper.appendChild(bubble);
    msgs.appendChild(wrapper);
    scrollToBottom();
    return wrapper;
  }

  // ── Format Message (Markdown-like) ─────────
  function formatMessage(text) {
    return (
      text
        // **bold**
        .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
        // *italic*
        .replace(/\*(.*?)\*/g, "<em>$1</em>")
        // `code`
        .replace(
          /`(.*?)`/g,
          '<code style="background:rgba(0,0,0,0.08);padding:1px 4px;border-radius:3px;font-size:0.85em">$1</code>',
        )
        // bullet points starting with - or •
        .replace(/^[-•]\s(.+)$/gm, "<li>$1</li>")
        // wrap consecutive <li> in <ul>
        .replace(
          /(<li>.*<\/li>\n?)+/gs,
          (match) =>
            `<ul style="margin:4px 0 4px 16px;padding:0">${match}</ul>`,
        )
        // numbered list
        .replace(/^\d+\.\s(.+)$/gm, "<li>$1</li>")
        // newlines to <br>
        .replace(/\n/g, "<br>")
    );
  }

  // ── Helpers ────────────────────────────────
  function getCurrentTime() {
    return new Date().toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function clearMessages() {
    document.getElementById("chatbotMessages").innerHTML = "";
  }

  function scrollToBottom() {
    const msgs = document.getElementById("chatbotMessages");
    setTimeout(() => {
      msgs.scrollTop = msgs.scrollHeight;
    }, 50);
  }

  function updateSendBtn() {
    const input = document.getElementById("chatbotInput");
    const btn = document.getElementById("chatSendBtn");
    if (btn) {
      btn.disabled =
        !input ||
        input.value.trim() === "" ||
        isTyping ||
        !langSelected ||
        !apiKeyReady;
    }
  }

  // ── Key Handler ────────────────────────────
  window.chatbotHandleKey = function (e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      chatbotSend();
    }
  };

  // ── Auto Resize Textarea ───────────────────
  window.chatbotAutoResize = function (el) {
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 100) + "px";
    updateSendBtn();
  };

  // ── Fullscreen Toggle ─────────────────────
  window.chatbotToggleFullscreen = function () {
    const panel = document.getElementById("chatbotPanel");
    const btn = document.getElementById("chatFullscreenBtn");
    const isFullscreen = panel.classList.toggle("chat-fullscreen");
    btn.innerHTML = isFullscreen
      ? '<i class="fas fa-compress"></i>'
      : '<i class="fas fa-expand"></i>';
    btn.title = isFullscreen ? "Exit Fullscreen" : "Fullscreen";
    setTimeout(() => scrollToBottom(), 100);
  };

  // ── Public Toggle ─────────────────────────
  window.toggleChatbot = toggleChatbot;

  // ── Wait for DOM ───────────────────────────
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
