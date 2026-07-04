# WanderMind AI — Boutique Travel Intelligence Platform

WanderMind AI is a production-grade bespoke travel planning platform powered by Google Gemini AI (`gemini-flash-latest`) and deployed via Netlify Serverless Functions. It transforms user budgets and travel preferences into realistic, contextual itineraries with per-person financial breakdowns and real-time cultural intelligence.

## 🚀 Key Features

* **Contextual Financial Blueprint:** Itemized spend breakdown strictly on a per-person basis with local vs. tourist cost categories. Dynamic pricing anchors adapt to the cost of living of the target destination (e.g., Paris vs. Bali).
* **Budget Verdict Engine:** Real-time financial feasibility badges (`✓ Within Budget` / `⚠ Over Budget`).
* **Pace Check & Breathing Room:** Automated overload detection flagging days with active sightseeing exceeding 8.5 hours, featuring a one-click "Breathing Room" activity removal mechanism.
* **On-Demand Cultural Intel:** Instant Wikipedia REST API integration for activity cards with image thumbnail retrieval and fuzzy title matching.
* **Markdown Intel Export:** One-click clipboard export of generated itineraries as clean Markdown.
* **Full Keyboard Accessibility:** Fully navigable autocomplete (ArrowUp/Down/Enter/Escape) and card drawers (Space/Enter).

## 📁 Repository Structure

```
├── index.html                  # Main Semantic HTML5 Interface & ARIA Landmarks
├── styles.css                  # Custom Vanilla CSS Design Token System
├── app.js                      # Modular Client Logic, Debouncing & Wiki Memory Cache
├── package.json                # Project Dependencies & Test Harness Config
├── .gitignore                  # Git Exclusion Rules
├── tests/
│   ├── unit.test.js            # Unit Tests (Sanitization, Budget Math, Pace Check)
│   └── schema.test.js          # Schema & Validation Tests
└── netlify/
    └── functions/
        └── plan-trip.js        # Netlify Serverless Function (Gemini API Integration)
```

## 🛠️ Installation & Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/lavagandhii/trip-planner-promptwars.git
   cd trip-planner-promptwars
   ```

2. **Configure Environment Variables:**
   Create a `.env` file or set the variable in Netlify:
   ```env
   GEMINI_API_KEY=your_google_gemini_api_key
   ```

3. **Run Local Server:**
   ```bash
   npx netlify-cli dev
   ```

## 🧪 Running Automated Tests

Run the comprehensive test suite locally using Node's native test runner or Jest:

```bash
npm test
```

## 🔒 Security & Performance

* **XSS Sanitization:** All user inputs and AI outputs are escaped via `esc()` utility functions.
* **Payload Validation:** Serverless function validates destination string length, budget bounds, and duration ranges before invoking Gemini.
* **Efficiency:** Wikipedia requests are cached in an in-memory `wikiCache` object to prevent redundant network calls. Input changes are debounced by 300ms.
