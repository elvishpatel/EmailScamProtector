# 🛡️ Email Scam Protector

A production-ready Chrome extension that protects elderly and vulnerable users from phishing, scam, manipulation, and impersonation emails. Analyzes email content in real-time using a hybrid AI + rule engine system and explains risks in simple, non-technical language.

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Chrome Extension                      │
│                                                          │
│  ┌──────────┐  ┌──────────────┐  ┌────────────────┐    │
│  │ Content   │  │ Background   │  │ Popup UI       │    │
│  │ Script    │──│ Service      │──│ (React)        │    │
│  │ (Gmail)   │  │ Worker       │  │                │    │
│  └──────────┘  └──────────────┘  └────────────────┘    │
│       │              │                                   │
│       │         ┌────┴────┐                             │
│       │         │  Rule   │ ← Layer 1: Local heuristics │
│       │         │ Engine  │                             │
│       │         └────┬────┘                             │
│       │              │                                   │
│       ▼              ▼                                   │
│  ┌──────────┐  ┌──────────┐                             │
│  │ Warning  │  │   AI     │ ← Layer 2: Gemini Flash    │
│  │  Panel   │  │  Client  │                             │
│  │(Shadow   │  └──────────┘                             │
│  │  DOM)    │        │                                   │
│  └──────────┘        │                                   │
└──────────────────────┼───────────────────────────────────┘
                       │
                       ▼
              ┌────────────────┐
              │  Backend API   │
              │  (Express)     │
              │  ┌──────────┐  │
              │  │  Gemini  │  │
              │  │ Adapter  │  │
              │  └──────────┘  │
              └────────────────┘
```

**Hybrid Detection System:**
- **Layer 1 (Rules):** Local deterministic heuristics — urgency detection, impersonation, suspicious links, financial pressure, credential theft, emotional manipulation, formatting analysis
- **Layer 2 (AI):** Google Gemini 2.5 Flash — natural language understanding, scam classification, human-friendly explanations

## ✨ Features

- 🔍 **Real-time Analysis** — Automatically scans emails when you open them in Gmail
- 🧠 **Hybrid AI + Rules** — Deterministic rules for speed, AI for nuanced understanding
- 👵 **Elderly-Friendly UI** — Large fonts, simple language, clear actions, high contrast
- 🎨 **Risk Level System** — Safe → Low → Suspicious → High → Dangerous with color coding
- 🔗 **Link Analysis** — Detects shortened URLs, punycode, domain mismatches, suspicious TLDs
- 👤 **Sender Verification** — Compares display names with actual email domains
- 🔒 **Privacy-First** — Email content never stored, AI data sanitized, local rules-only mode
- 🌙 **Dark Mode** — Full dark/light theme support
- 📚 **Education Mode** — Interactive guide teaching users to spot scams
- 🌍 **Multilingual** — English and Hindi support (extensible)

## 🚀 Quick Start

### Prerequisites

- [Node.js](https://nodejs.org/) 18+
- [Google Chrome](https://www.google.com/chrome/) browser
- [Gemini API Key](https://aistudio.google.com/apikey) (free tier available)

### 1. Clone & Install

```bash
# Install extension dependencies
cd extension
npm install

# Install backend dependencies
cd ../backend
npm install
```

### 2. Configure Backend

```bash
cd backend
cp .env.example .env
```

Edit `.env` and add your Gemini API key:
```
GEMINI_API_KEY=your_key_here
```

### 3. Start Backend

```bash
cd backend
npm run dev
```

The API server will start on `http://localhost:3001`.

### 4. Build Extension

```bash
cd extension
npm run build
```

### 5. Load in Chrome

1. Open `chrome://extensions/` in Chrome
2. Enable **Developer mode** (toggle in top-right)
3. Click **Load unpacked**
4. Select the `extension/dist/` folder
5. Navigate to [Gmail](https://mail.google.com) — the extension activates automatically!

## 📁 Project Structure

```
Email Scam Protector/
├── extension/                  # Chrome Extension
│   ├── src/
│   │   ├── content/            # Gmail DOM integration
│   │   │   ├── gmail-observer.ts
│   │   │   ├── email-extractor.ts
│   │   │   ├── warning-panel.ts
│   │   │   └── index.ts
│   │   ├── background/         # Service worker
│   │   │   ├── service-worker.ts
│   │   │   ├── message-handler.ts
│   │   │   ├── analysis-pipeline.ts
│   │   │   └── cache-manager.ts
│   │   ├── popup/              # React UI
│   │   │   ├── App.tsx
│   │   │   └── pages/
│   │   ├── rules/              # Rule engine
│   │   │   ├── engine.ts
│   │   │   ├── scorer.ts
│   │   │   └── rules/          # 7 detection modules
│   │   ├── components/         # Shared React components
│   │   ├── ai/                 # AI client
│   │   ├── services/           # Storage, hashing
│   │   ├── utils/              # URL/domain/text analysis
│   │   └── types/              # TypeScript types
│   ├── public/
│   │   └── manifest.json
│   ├── popup.html
│   ├── vite.config.ts
│   └── tailwind.config.ts
│
├── backend/                    # API Server
│   ├── src/
│   │   ├── index.ts
│   │   ├── routes/
│   │   ├── controllers/
│   │   ├── services/           # Gemini adapter
│   │   ├── middleware/         # CORS, rate limiting
│   │   └── prompts/           # AI prompt templates
│   └── .env.example
│
└── README.md
```

## 🛡️ Risk Levels

| Level | Score | Color | Meaning |
|-------|-------|-------|---------|
| ✅ SAFE | 0–15 | Green | No warning signs found |
| ℹ️ LOW RISK | 16–35 | Blue | Minor unusual patterns |
| ⚠️ SUSPICIOUS | 36–55 | Amber | Possible scam indicators |
| 🚨 HIGH RISK | 56–75 | Red | Uses common scam tactics |
| 🛑 DANGEROUS | 76–100 | Deep Red | Very likely a scam |

## 🔒 Privacy & Security

- **Email content is never stored** — only analysis results and hashes are cached
- **AI requests are sanitized** — personal names, phone numbers, and full body content are stripped
- **Privacy Mode** — disable AI entirely for local-only rules-based scanning
- **API key protection** — Gemini key stays on the backend, never exposed to the frontend
- **Rate limiting** — 100 requests per 15 minutes to prevent abuse
- **No tracking** — zero analytics or telemetry

## 🔧 Development

### Extension (Frontend)

```bash
cd extension
npm run dev        # Vite dev server for popup
npm run build      # Full production build
npm run type-check # TypeScript type checking
```

### Backend

```bash
cd backend
npm run dev        # Dev server with hot reload (tsx watch)
npm run build      # TypeScript compilation
npm start          # Production server
```

## 🌐 Deployment

### Backend (Render)

1. Push `backend/` to a Git repository
2. Create a new **Web Service** on [Render](https://render.com)
3. Set:
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm start`
   - **Environment:** Add `GEMINI_API_KEY` and other env vars
4. Update the extension's backend URL in Settings to point to your Render URL

### Extension (Chrome Web Store)

1. Build: `cd extension && npm run build`
2. Replace placeholder icons in `dist/icons/` with proper PNG files
3. Zip the `dist/` folder
4. Upload to [Chrome Developer Dashboard](https://chrome.google.com/webstore/devconsole)

## 📋 Future Roadmap

- [ ] ONNX Runtime Web for offline AI classification
- [ ] Family alert system (notify trusted contacts about dangerous emails)
- [ ] Voice warning mode (Web Speech API)
- [ ] Interactive phishing quiz
- [ ] Community-sourced scam pattern database
- [ ] More languages (Spanish, French, etc.)
- [ ] Firefox/Edge extension support

## 📄 License

MIT

---

Built with ❤️ to protect our elders and vulnerable users from online scams.
