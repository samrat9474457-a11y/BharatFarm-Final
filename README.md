# BharatFarm - Smart Agriculture Platform

A comprehensive web application designed to help farmers make smarter decisions through technology. BharatFarm provides a premium, mobile-first experience offering weather monitoring, an AI-powered real-time Voice Assistant, crop planning, disease detection, cost calculation, and activity scheduling tools tailored for Indian farming contexts.

## 🌟 Key Features

- **📱 Premium Mobile-First UI**: Native app feel with glassmorphism, fluid animations, and a notch-friendly full-screen chatbot experience.
- **🎙️ Real-time AI Voice Assistant**: A floating, hands-free voice interface for interacting with KrishiBot via Speech-to-Text and Text-to-Speech.
- **🌤️ Weather & Safety**: Real-time weather data with farming safety alerts based on your location.
- **🍃 Leaf Disease Scanner**: Interactive AI scanner to detect leaf diseases and get tailored treatment recommendations.
- **🌾 Comprehensive Crop Database**: Highly detailed information for 33 major Indian crops spanning Vegetables, Fruits, Cereals, Pulses, and Oilseeds. Includes Unsplash/Pexels API integration for real imagery.
- **💰 Cost & Revenue Calculator**: Project costs for seeds and fertilizers using multiple land units (Acre, Bigha, Katha) and estimate expected yields.
- **🗺️ Activity Roadmap**: Day-by-day farming activity schedules tailored precisely for each crop lifecycle.
- **🔔 Smart Notifications**: Alerts for watering, fertilizing, and severe weather conditions.
- **💳 Premium Subscriptions**: Backend-enforced payment mockup system via `/submit-payment` handling.

## 🏗️ Architecture & Project Structure

The project has evolved from a static page into a full-stack **Node.js** architecture relying on external AI proxying to bypass CORS and secure API keys.

```text
BharatFarm/
├── server.js               # Node.js Backend Server (Proxy, API, Subscriptions)
├── .env                    # Environment variables (OpenRouter, Unsplash keys)
├── package.json            # Node.js dependencies
├── index.html              # Main HTML SPA Application
├── css/                    
│   ├── mobile-ui.css       # Dedicated mobile overrides & UI enhancements
│   ├── chatbot.css         # Styling for KrishiBot and Realtime Voice
│   └── ...                 # Component-specific styles
└── js/                     
    ├── config.js           # Frontend config, toggles, keys
    ├── realtimeVoice.js    # STT/TTS Voice Assistant
    ├── cropsData.js        # Offline database of 33 crops
    ├── crops.js            # Unsplash/Pexels image fetching & filtering
    └── ...                 # Core logic modules
```

## 🚀 Getting Started

### Prerequisites

- **Node.js** (v16.x or higher recommended)
- **NPM** (Node Package Manager)

### Installation & Setup

1. **Clone the repository:**

   ```bash
   git clone https://github.com/Souvik-Dey-2029/BharatFarm.git
   cd BharatFarm
   ```

2. **Install Dependencies:**
   Install backend requirements like `dotenv`.
   
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   Create a `.env` file in the root directory (you can copy `sample.env` if available) and add your API credentials:

   ```env
   # Required for Chatbot and Voice Assistant
   OPENROUTER_API_KEY=your_openrouter_or_gemini_key_here
   
   # Optional: For high-quality Crop images (configure in js/config.js as well)
   UNSPLASH_API_KEY=your_unsplash_key_here
   PEXELS_API_KEY=your_pexels_key_here
   ```

4. **Run the Server:**
   Start the Node.js backend which serves the application on Port 5000 and proxies AI requests securely.

   ```bash
   node server.js
   ```

5. **Access the Application:**
   Navigate to `http://localhost:5000` in your browser. (Note: Ensure you view the site on a mobile device or responsive emulator for the optimal experience).

## 🧠 AI Backend Integration

BharatFarm implements a custom `/api/chat` route in `server.js`. This dual-purpose proxy achieves two things:
1. **Security**: Hides your `OPENROUTER_API_KEY` from the client.
2. **Compatibility**: Unifies requests from both the legacy KrishiBot text-chat and the new generic AI configurations (like the plant disease scanner).

## 🌾 The Crop Database

The platform includes a zero-config, pre-populated database (`cropsData.js`) containing 33 crops properly categorized into:
- 🍅 **Vegetables** (Tomato, Potato, Cabbage, etc.)
- 🍎 **Fruits** (Mango, Banana, Papaya, etc.)
- 🌾 **Cereals** (Rice, Wheat, Maize, etc.)
- 🫘 **Pulses** (Chickpea, Lentil, etc.)
- 🌻 **Oilseeds** (Mustard, Soybean, etc.)

With a 5-minute configuration (adding an Unsplash API key), the application seamlessly replaces local generic images with stunning, real-world photography of these crops dynamically.

## 📱 Mobile-First Paradigm

The UI has undergone a substantial mobile overhaul incorporating:
- Fluid, native tap animations with no visual delay.
- Bottom navigation menus that respect device safe-areas (notches).
- A Voice Assistant button gracefully suspended above the `KrishiBot` widget.
- A fully immersive, bezel-less full-screen layout constraint when the AI assistant is activated.

## 📜 Documentation

For more detailed technical insights, review the included markdown files:
- `QUICK_START.md`
- `CROPS_SETUP.md`
- `CROPS_VERIFICATION.md`
- `IMPLEMENTATION_SUMMARY.md`

## 🤝 Contributing & License

This project is a demonstration of progressive web application principles mixed with AI utility in agriculture. Feel free to fork, modify, and elevate the standard of smart farming software.

Provided as-is for educational and demonstration purposes.

---

**© 2026 BharatFarm - Smart Agriculture Platform**  
_Empowering Indian Farmers with Smart Technology_
