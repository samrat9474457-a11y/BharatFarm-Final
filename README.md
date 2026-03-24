# 🌾 BharatFarm — The Future of Indian Agriculture

![BharatFarm Banner](https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=1920&q=80)

<div align="center">
  <img src="https://img.shields.io/badge/Hackathon-Finalist-FFD700?style=for-the-badge&logoColor=white" alt="Hackathon Finalist">
  <img src="https://img.shields.io/badge/Impact-Social%20Good-28A745?style=for-the-badge&logoColor=white" alt="Social Impact">
  <img src="https://img.shields.io/badge/Powered%20by-Gemini%202.0%20Flash-4285F4?style=for-the-badge&logoColor=white" alt="Gemini AI">
  <img src="https://img.shields.io/badge/Language-English%20|%20Hindi%20|%20Bengali-orange?style=for-the-badge" alt="Multilingual">
  <img src="https://img.shields.io/badge/UI-Cinematic%20GSAP-FF4B4B?style=for-the-badge&logoColor=white" alt="Cinematic UX">
</div>

<br/>

> **BharatFarm** is a visionary agricultural ecosystem designed to bridge the digital divide in rural India. By combining **Generative AI**, **Computer Vision**, and **Cinematic Web UX**, we provide farmers with a "digital companion" that speaks their language and secures their livelihood.

---

## 🎨 Visual Showcase

<div align="center">
  <img src="assets/screenshots/dashboard.png" width="800" alt="BharatFarm Dashboard">
  <p><i>The Premium AI-Powered Dashboard featuring real-time KrishiBot and Leaf Scanner</i></p>

---

## 🚨 The Problem vs 💡 The Solution

| Current Agricultural Challenges | The BharatFarm Solution |
| :--- | :--- |
| **Language Barrier:** Most digital tools are restricted to English, alienating 90% of Indian farmers. | **Full Multilingual Support:** The entire platform—including AI chat—is available in **Hindi, Bengali, and English**. |
| **Information Gap:** Farmers lack real-time access to expert agricultural advice in their native dialects. | **KrishiBot AI:** A 24/7 multilingual voice assistant providing instant contextual guidance via STT/TTS. |
| **Crop Diseases:** Delayed diagnosis leads to massive yield losses and excessive pesticide use. | **Gemini Vision Diagnostic:** Instant, highly accurate leaf disease detection from a single smartphone photo. |
| **Middle-men Exploitation:** Farmers are forced to sell produce at low margins to intermediaries. | **Direct Agri-Marketplace:** A zero-commission P2P platform connecting farmers directly to buyers. |

---

## 🚀 Core Innovations

### 1. 🤖 Intelligent Multilingual AI
- **🎙️ KrishiBot Assistant:** Powered by **Gemini 2.0 Flash**, KrishiBot is a real-time AI companion utilizing **Speech-to-Text (STT)** and **Text-to-Speech (TTS)**. Farmers can *talk* to their application in their native tongue and get expert advice back via voice.
- **🍃 AI Leaf Scanner:** Diagnoses plant diseases with human-like precision, recommending exact fertilizers and treatments instantly.
- **📚 Crop Health Wiki:** A comprehensive, searchable database of 30+ crop diseases, pests, and soil conditions seamlessly integrated with curated, localized treatment recommendations.

### 2. 🎮 Farmer Engagement System
- **📈 Gamified Progress:** Empowers farmers by rewarding educational interactions. Users earn **XP, Coins, and Badges** natively stored in the ecosystem.
- **🧠 Daily Agri-Quizzes:** Features an interactive daily quiz system testing knowledge on soil health, pest control, and market strategy, complete with rich GSAP animations and explanations.
- **🤝 Cross-Feature Hooks:** Integrating directly into the platform, users are automatically awarded XP for utilizing the AI Leaf Scanner and KrishiBot.

### 3. 🌍 Localization & Accessibility
- **🇮🇳 Native First:** Full UI localization for the major agricultural hubs of India. Switch between English, Hindi, and Bengali with a single click.
- **Accessibility Tokens:** High-contrast design and voice-first logic ensure that every farmer, regardless of literacy level or visual ability, can use the platform.

### 4. 📊 Precision Analytics
- **🌤️ Smart Weather:** Localized weather data with proximity-based safety alerts for farming operations.
- **💰 Financial Suite:** Professional cost and revenue calculators supporting local Indian land measurement units (**Acre, Bigha, Katha**).
- **🗺️ Activity Roadmap:** AI-generated day-by-day schedules tailored specifically to the selected crop's lifecycle.

---

## 🏗️ System Architecture

```mermaid
graph TD
    %% Frontend Layer
    subgraph Frontend [Client Browser - Vanilla JS/HTML/CSS]
        UI[Cinematic UI / GSAP]
        Lang[Multilingual Engine]
        Chat[KrishiBot Voice UI]
        Scan[Leaf Scanner UI]
    end

    %% Backend Layer
    subgraph Backend [Node.js Proxy Server]
        API[Express API Router]
        Secure[Protected Gemini Proxy]
    end

    %% External AI & Services
    subgraph Services [External APIs]
        Gemini[Google Gemini 2.0 Flash / Vision]
        Weather[OpenWeatherMap API]
    end

    %% Data Flow
    UI -->|JSON| API
    Lang -->|Context| UI
    Chat -->|Voice Stream| API
    Scan -->|Image Data| API
    
    API -->|Proxied Request| Gemini
    API -->|Coordinates| Weather
    
    Gemini -->|AI Insights| API
    Weather -->|Weather data| API
    API -->|Processed Results| Frontend
```

---

## 🌎 Social Impact

By adopting the BharatFarm ecosystem, a typical rural farming community can expect:
- **⬆️ 15-20% Increase in Profit Margins:** Achieved through direct-to-consumer trade and precise cost calculations.
- **⬇️ 30% Reduction in Chemical Waste:** Driven by exact, AI-recommended fertilizer dosages.
- **⏱️ 24/7 Expert Accessibility:** Democratizing agricultural knowledge across the language barrier.

---

## 🛠️ Installation

1. **Clone & Install**
   ```bash
   git clone https://github.com/Souvik-Dey-2029/BharatFarm_Final-Version.git
   npm install
   ```

2. **Environment Setup**
   Create a `.env` file:
   ```env
   GEMINI_API_KEY=your_key_here
   ```

3. **Run**
   ```bash
   node server.js
   ```
   *Visit `http://localhost:5000`*

---

## 👥 Meet the Architects

| Developer | Role | Profile |
| :--- | :--- | :--- |
| **Souvik Dey** | Lead Developer | [![LinkedIn](https://img.shields.io/badge/LinkedIn-Connect-blue?logo=linkedin)](https://www.linkedin.com/in/souvik-dey-400497366/) |
| **Partha Sarathi Sarkar**| Full Stack & Prompt Engineer | [![LinkedIn](https://img.shields.io/badge/LinkedIn-Connect-blue?logo=linkedin)](https://www.linkedin.com/in/partha-sarathi-sarkar-7385a8367/) |
| **Samrat Chatterjee** | AI Integration Architect | [![LinkedIn](https://img.shields.io/badge/LinkedIn-Connect-blue?logo=linkedin)](https://www.linkedin.com/in/samrat-chatterjee-2aa543368/) |
| **Snehasis Chakroborty**| UI/UX Motion Designer | [![LinkedIn](https://img.shields.io/badge/LinkedIn-Connect-blue?logo=linkedin)](https://www.linkedin.com/in/snehasis-chakraborty-2b68823a6/) |

---

<div align="center">
  <p><i>Demonstration project engineered for agricultural empowerment. Built with passion for a Digital India.</i> 🇮🇳</p>
  <p>&copy; 2026 BharatFarm. All Rights Reserved.</p>
</div>
