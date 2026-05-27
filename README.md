# 🛡️ Email Scam Protector

> A Chrome extension that protects elderly and vulnerable users from phishing, scam, and impersonation emails — using a hybrid AI + rule engine system with real-time analysis and simple, human-friendly explanations.

![Chrome Extension](https://img.shields.io/badge/Platform-Chrome%20Extension-4285F4?logo=googlechrome&logoColor=white)
![Manifest V3](https://img.shields.io/badge/Manifest-V3-34A853?logo=googlechrome&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6?logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white)
![Gemini](https://img.shields.io/badge/AI-Gemini%202.5%20Flash-8E75B2?logo=google&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-green)

---

## 📖 Table of Contents

- [Why This Exists](#-why-this-exists)
- [Features](#-features)
- [Architecture](#-architecture)
- [Detection System](#-detection-system)
- [Risk Levels](#-risk-levels)
- [Quick Start](#-quick-start)
- [Project Structure](#-project-structure)
- [Configuration](#-configuration)
- [Privacy & Security](#-privacy--security)
- [Development](#-development)
- [Deployment](#-deployment)
- [Tech Stack](#-tech-stack)
- [Contributing](#-contributing)
- [Roadmap](#-roadmap)
- [License](#-license)

---

## 💡 Why This Exists

Email phishing is the #1 attack vector targeting elderly users. Scammers impersonate banks, government agencies, and tech companies with increasingly sophisticated emails. This extension acts as a **real-time safety net** — analyzing every email you open in Gmail and explaining risks in language a grandparent would understand.

**Design Principles:**
- 🎯 **Accuracy over alerts** — Minimize false positives. A real email from your bank should never be flagged.
- 👵 **Elderly-first UX** — Large text, high contrast, simple actions. No jargon.
- 🔒 **Privacy-first** — Email content is never stored. AI requests are sanitized.
- ⚡ **Fast** — Local rule engine runs in <50ms. AI is only called when needed.

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| 🔍 **Real-time Gmail Analysis** | Automatically scans emails the moment you open them |
| 🧠 **Hybrid AI + Rules Engine** | 8 local detection rules + Gemini 2.5 Flash AI for nuanced analysis |
| 🎯 **Phishing Link Detection** | Catches the #1 phishing pattern: credential language + unrelated link domains |
| 👤 **Sender Trust System** | Distinguishes corporate senders (HDFC Bank) from personal email (Gmail/Yahoo) |
| 🏦 **120+ Trusted Brands** | Extensive verified domain database for Indian & global banks, brokers, fintech |
| 🔗 **URL Deep Analysis** | Detects URL shorteners, punycode, IP-based URLs, suspicious TLDs, display mismatches |
| 🛡️ **Shadow DOM Warning Panel** | Injected directly into Gmail with complete CSS isolation |
| 📊 **5-Level Risk Scoring** | Safe → Low → Suspicious → High → Dangerous with color-coded UI |
| 📱 **Popup Dashboard** | Analysis history, settings, and an interactive scam education guide |
| 🌙 **Dark Mode** | Full dark/light theme support |
| 🔒 **Privacy Mode** | Disable AI entirely — runs local rules only |
| 🌍 **Multilingual** | English and Hindi (extensible) |

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Chrome Extension                      │
│                                                          │
│  ┌──────────┐  ┌──────────────┐  ┌────────────────┐    │
│  │ Content   │  │ Background   │  │ Popup UI       │    │
│  │ Script    │──│ Service      │──│ (React +       │    │
│  │ (Gmail)   │  │ Worker       │  │  TailwindCSS)  │    │
│  └──────────┘  └──────────────┘  └────────────────┘    │
│       │              │                                   │
│       │         ┌────┴────┐                             │
│       │         │  Rule   │ ← Layer 1: 8 Detection     │
│       │         │ Engine  │   Rules + Trust System      │
│       │         └────┬────┘                             │
│       │              │                                   │
│       ▼              ▼                                   │
│  ┌──────────┐  ┌──────────┐                             │
│  │ Warning  │  │   AI     │ ← Layer 2: Gemini 2.5      │
│  │  Panel   │  │  Client  │   Flash (conditional)      │
│  │(Shadow   │  └──────────┘                             │
│  │  DOM)    │        │                                   │
│  └──────────┘        │                                   │
└──────────────────────┼───────────────────────────────────┘
                       │
                       ▼
              ┌────────────────┐
              │  Backend API   │
              │  (Express.js)  │
              │  ┌──────────┐  │
              │  │  Gemini  │  │
              │  │ 2.5 Flash│  │
              │  └──────────┘  │
              └────────────────┘
```

### How Analysis Works

1. **Gmail Observer** detects when you open an email (MutationObserver on Gmail DOM)
2. **Email Extractor** pulls sender info, subject, body text, and all links
3. **Rule Engine** runs 8 detection rules locally (~50ms)
4. **Sender Trust Check** determines if the sender is a verified corporate domain
5. **Scorer** computes a weighted risk score with trust-based adjustments
6. If score exceeds threshold AND sender is not a trusted brand → **AI Analysis** via backend
7. **Warning Panel** appears above the email with the risk assessment

---

## 🎯 Detection System

### Layer 1: Rule Engine (8 Rules)

| Rule | What It Detects | Key Accuracy Feature |
|------|----------------|---------------------|
| **Phishing Link** | Credential language + links to unrelated domains | Cross-references email content with link destinations |
| **Impersonation** | Display name claims a brand, domain doesn't match | Skips check if sender domain IS a verified brand |
| **Suspicious Links** | URL shorteners, punycode, IP URLs, bad TLDs | Links to trusted domains are whitelisted |
| **Credential Theft** | Requests for OTPs, passwords, card numbers | Two-tier: always-scam phrases + context-aware phrases |
| **Financial** | Gift card, wire transfer, crypto payment requests | Only scam-specific phrases, not normal business terms |
| **Urgency** | Threats combined with time pressure | Requires urgency + threat together, not just "urgent" |
| **Emotional** | Fear tactics, fake rewards, authority impersonation | Scam-specific context, not generic phrases |
| **Formatting** | Excessive punctuation, generic greetings | Removed false-positive-prone ALL CAPS detection |

### Layer 2: AI Analysis (Gemini 2.5 Flash)

Called **only** when the rule engine score exceeds threshold AND the sender is not a trusted brand. The AI provides:
- Natural language risk explanation
- Detected manipulation patterns
- Recommended actions in simple language

### Sender Trust System

This is the core accuracy mechanism that prevents false positives:

```
Email from hdfcbank.com?
  → Trusted corporate sender ✅
  → Content rules discounted 95%
  → Result: SAFE (even if email says "payment due")

Email from gmail.com claiming to be Google Support?
  → Public email provider ❌ (anyone can create a Gmail account)
  → Full rule scanning applied
  → Phishing link detected → Result: HIGH RISK / DANGEROUS
```

**Key distinction:** Public email providers (Gmail, Yahoo, Outlook) are **never** treated as trusted corporate senders — because anyone can send from them. Only corporate-controlled domains (hdfcbank.com, nseindia.com, chase.com) get the trust bonus.

### Trusted Domain Database

120+ verified brands with all known sending domains:

- **Indian Banks:** HDFC (7 domains), SBI, ICICI, Axis, Kotak, PNB, IndusInd, Yes Bank, IDFC First, Federal Bank, RBL
- **Global Banks:** Chase, Wells Fargo, Bank of America, Citibank, HSBC, Barclays, Standard Chartered
- **Stock Exchanges & Regulators:** NSE, BSE, SEBI, NSDL, CDSL
- **Brokers:** Zerodha, Groww, Upstox, Angel One, Motilal Oswal, IIFL, Dhan, 5Paisa
- **Fintech:** Paytm, PhonePe, Razorpay, CRED, Jupiter, Fi Money, Slice, OneCard
- **Government:** IRCTC, Income Tax, EPFO, DigiLocker, IRS, HMRC
- **Tech:** Google, Microsoft, Apple, Amazon, Meta, Netflix, Spotify, GitHub, AWS
- **E-commerce:** Flipkart, Amazon, Myntra, Ajio, Meesho, Swiggy, Zomato

---

## 🛡️ Risk Levels

| Level | Score | Color | When It Triggers |
|-------|-------|-------|-----------------|
| ✅ **Safe** | 0–15 | Green | No warning signs, or email is from a verified trusted brand |
| ℹ️ **Low Risk** | 16–35 | Blue | Minor unusual patterns (single content-only match) |
| ⚠️ **Suspicious** | 36–55 | Amber | Multiple signals or weak structural match |
| 🚨 **High Risk** | 56–75 | Red | Phishing link, impersonation, or multiple scam signals |
| 🛑 **Dangerous** | 76–100 | Deep Red | Strong phishing indicators — delete immediately |

---

## 🚀 Quick Start

### Prerequisites

- [Node.js](https://nodejs.org/) 18+ (LTS recommended)
- [Google Chrome](https://www.google.com/chrome/) browser
- [Gemini API Key](https://aistudio.google.com/apikey) (free tier available)

### 1. Clone & Install

```bash
git clone https://github.com/your-username/email-scam-protector.git
cd email-scam-protector

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

```env
GEMINI_API_KEY=your_gemini_api_key_here
PORT=3001
NODE_ENV=development
```

### 3. Start Backend Server

```bash
cd backend
npm run dev
```

The API server starts on `http://localhost:3001`. Verify it's running:

```bash
curl http://localhost:3001/api/health
# → {"status":"ok","timestamp":"...","version":"1.0.0"}
```

### 4. Build Extension

```bash
cd extension
npm run build
```

This runs the custom build pipeline:
- Vite builds the React popup UI
- esbuild bundles the content script (IIFE format)
- esbuild bundles the service worker (ESM format)
- Copies manifest.json and icons to `dist/`

### 5. Load in Chrome

1. Open `chrome://extensions/` in Chrome
2. Enable **Developer mode** (toggle in top-right corner)
3. Click **Load unpacked**
4. Select the `extension/dist/` folder
5. Open [Gmail](https://mail.google.com) — the extension activates automatically

### 6. Configure Extension

Click the extension icon in Chrome toolbar → **Settings**:
- **AI Analysis:** Toggle on/off (works locally without AI too)
- **Backend URL:** `http://localhost:3001` (or your deployed URL)
- **Dark Mode:** Toggle theme

---

## 📁 Project Structure

```
email-scam-protector/
├── extension/                       # Chrome Extension (50 source files)
│   ├── src/
│   │   ├── content/                 # Gmail DOM Integration
│   │   │   ├── gmail-observer.ts    # MutationObserver for email open detection
│   │   │   ├── email-extractor.ts   # Extracts sender, subject, body, links
│   │   │   ├── warning-panel.ts     # Shadow DOM risk banner
│   │   │   └── index.ts            # Content script entry (IIFE)
│   │   │
│   │   ├── background/             # Service Worker
│   │   │   ├── service-worker.ts    # Entry point + install handler
│   │   │   ├── message-handler.ts   # Chrome message router
│   │   │   ├── analysis-pipeline.ts # Hybrid analysis orchestrator
│   │   │   └── cache-manager.ts     # 24h TTL, 500-entry LRU cache
│   │   │
│   │   ├── rules/                   # Rule Engine
│   │   │   ├── engine.ts           # Orchestrator — runs all rules
│   │   │   ├── scorer.ts           # Weighted scoring + trust multiplier
│   │   │   ├── types.ts            # DetectionRule interface
│   │   │   ├── rules/              # 8 Detection Modules
│   │   │   │   ├── phishing-link.ts     # ★ Credential content + unrelated links
│   │   │   │   ├── impersonation.ts     # Brand spoofing + typosquatting
│   │   │   │   ├── suspicious-links.ts  # URL analysis (shorteners, punycode, etc.)
│   │   │   │   ├── credential.ts        # OTP/password theft (two-tier)
│   │   │   │   ├── financial.ts         # Gift card/crypto/wire scams
│   │   │   │   ├── urgency.ts           # Threat + time pressure
│   │   │   │   ├── emotional.ts         # Fear/reward/authority manipulation
│   │   │   │   ├── formatting.ts        # Generic greetings, short click-bait
│   │   │   │   └── index.ts            # Rule registry
│   │   │   └── data/               # Detection Databases
│   │   │       ├── trusted-domains.json  # 120+ brands, 400+ domains
│   │   │       ├── scam-phrases.json
│   │   │       ├── scam-domains.json
│   │   │       └── urgency-words.json
│   │   │
│   │   ├── popup/                   # React Popup UI
│   │   │   ├── App.tsx             # Tab navigation (Dashboard/Settings/Learn)
│   │   │   ├── main.tsx            # React entry
│   │   │   └── pages/
│   │   │       ├── Dashboard.tsx    # Status shield + analysis history
│   │   │       ├── Settings.tsx     # AI toggle, backend URL, theme
│   │   │       └── Education.tsx    # 7 scam type cards + safety guide
│   │   │
│   │   ├── components/              # Shared React Components
│   │   │   ├── RiskBadge.tsx       # Color-coded risk indicator
│   │   │   ├── RiskExplanation.tsx  # Expandable analysis details
│   │   │   ├── SafetyTip.tsx       # Action recommendation card
│   │   │   ├── ToggleSwitch.tsx    # Accessible toggle with ARIA
│   │   │   ├── AnalysisHistory.tsx  # History list with shimmer loading
│   │   │   └── LoadingSpinner.tsx   # Double-ring spinner
│   │   │
│   │   ├── ai/                      # AI Client
│   │   │   ├── client.ts           # Backend API caller (15s timeout)
│   │   │   ├── sanitizer.ts        # Strips PII before AI analysis
│   │   │   └── types.ts            # AI response types
│   │   │
│   │   ├── services/                # Extension Services
│   │   │   ├── storage.ts          # chrome.storage.local abstraction
│   │   │   └── hash.ts             # SHA-256 email hashing
│   │   │
│   │   ├── utils/                   # Shared Utilities
│   │   │   ├── domain-checker.ts    # Trust system + Levenshtein distance
│   │   │   ├── url-analyzer.ts     # Comprehensive URL analysis
│   │   │   ├── text-analyzer.ts    # Pattern matching utilities
│   │   │   ├── debounce.ts         # Typed debounce function
│   │   │   └── logger.ts           # Debug logger ([ESP] prefix)
│   │   │
│   │   ├── types/                   # TypeScript Type Definitions
│   │   │   ├── analysis.ts         # RiskLevel, RuleMatch, AnalysisResult
│   │   │   ├── email.ts            # EmailData, SenderInfo, LinkData
│   │   │   ├── messages.ts         # Chrome message types
│   │   │   └── settings.ts         # ExtensionSettings, defaults
│   │   │
│   │   └── styles/
│   │       └── globals.css          # TailwindCSS + custom styles
│   │
│   ├── public/
│   │   ├── manifest.json            # Chrome Extension Manifest V3
│   │   └── icons/                   # Extension icons (16/32/48/128px)
│   ├── scripts/
│   │   ├── build.mjs               # Custom build pipeline
│   │   └── generate-icons.mjs      # PNG icon generator
│   ├── popup.html                   # Popup entry HTML
│   ├── vite.config.ts
│   ├── tailwind.config.ts
│   └── tsconfig.json
│
├── backend/                         # API Server (13 source files)
│   ├── src/
│   │   ├── index.ts                # Express server entry
│   │   ├── routes/
│   │   │   ├── analyze.ts          # POST /api/analyze
│   │   │   └── health.ts           # GET /api/health
│   │   ├── controllers/
│   │   │   └── analyze-controller.ts
│   │   ├── services/
│   │   │   ├── gemini-adapter.ts   # Gemini 2.5 Flash integration
│   │   │   └── ai-service.ts       # Adapter pattern (swappable AI)
│   │   ├── middleware/
│   │   │   ├── cors.ts             # CORS (chrome-extension:// + localhost)
│   │   │   ├── rate-limiter.ts     # 100 req/15min
│   │   │   ├── validator.ts        # Zod schema validation
│   │   │   └── error-handler.ts    # Global error handler
│   │   ├── prompts/
│   │   │   ├── system-prompt.ts    # Elderly-friendly cybersecurity analyst
│   │   │   └── analysis-prompt.ts  # Structured email analysis prompt
│   │   └── types/
│   │       └── index.ts            # Zod schemas + shared types
│   ├── .env.example
│   ├── package.json
│   └── tsconfig.json
│
└── README.md
```

---

## ⚙️ Configuration

### Backend Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `GEMINI_API_KEY` | (required) | Google Gemini API key from [AI Studio](https://aistudio.google.com/apikey) |
| `PORT` | `3001` | Server port |
| `NODE_ENV` | `development` | `development` or `production` |
| `ALLOWED_ORIGINS` | `chrome-extension://*, localhost` | CORS origins (comma-separated) |
| `RATE_LIMIT_MAX` | `100` | Max requests per rate limit window |
| `RATE_LIMIT_WINDOW_MINUTES` | `15` | Rate limit window duration |

### Extension Settings (via Popup UI)

| Setting | Default | Description |
|---------|---------|-------------|
| AI Analysis | Enabled | Toggle Gemini AI integration on/off |
| Backend URL | `http://localhost:3001` | API server address |
| Dark Mode | System | Light/dark/system theme |
| Language | English | English or Hindi |

---

## 🔒 Privacy & Security

| Aspect | Implementation |
|--------|---------------|
| **Email storage** | Never stored — only SHA-256 hashes and analysis results are cached |
| **AI data sanitization** | Personal names, phone numbers, and email addresses stripped before AI analysis. Body truncated to 2000 chars |
| **API key protection** | Gemini API key stays on the backend server — never exposed to the extension |
| **Privacy mode** | Disable AI entirely for offline, rules-only scanning |
| **Rate limiting** | 100 requests per 15 minutes to prevent abuse |
| **No telemetry** | Zero analytics, tracking, or data collection |
| **Shadow DOM isolation** | Warning panel CSS is completely isolated from Gmail |
| **Content script safety** | All operations wrapped in try/catch — extension can never crash Gmail |

---

## 🔧 Development

### Extension

```bash
cd extension

npm run dev          # Vite dev server (popup hot reload)
npm run build        # Full production build (popup + content + worker)
npm run type-check   # TypeScript strict mode validation
```

### Backend

```bash
cd backend

npm run dev          # Dev server with hot reload (tsx watch)
npm run build        # TypeScript compilation → dist/
npm start            # Production server from dist/
npm run type-check   # TypeScript validation
```

### Build Pipeline

The extension uses a custom build script (`scripts/build.mjs`) because Chrome extensions require:
- **Popup:** Standard Vite React build
- **Content script:** IIFE bundle (Chrome content scripts don't support ESM)
- **Service worker:** ESM bundle (Chrome Manifest V3 requirement)

---

## 🌐 Deployment

### Backend → Render

1. Push the project to a Git repository
2. Create a new **Web Service** on [Render](https://render.com)
3. Configure:
   - **Root Directory:** `backend`
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm start`
   - **Environment Variables:** Add `GEMINI_API_KEY`, set `NODE_ENV=production`
4. After deployment, update the extension Settings → Backend URL to your Render URL

### Extension → Chrome Web Store

1. Build: `cd extension && npm run build`
2. Zip the `extension/dist/` folder
3. Upload to [Chrome Developer Dashboard](https://chrome.google.com/webstore/devconsole)
4. Fill in store listing, screenshots, and privacy details
5. Submit for review

---

## 🛠️ Tech Stack

### Extension
| Technology | Purpose |
|-----------|---------|
| TypeScript 5.7 | Type-safe codebase |
| React 18 | Popup UI components |
| TailwindCSS 3.4 | Utility-first styling |
| Chrome Manifest V3 | Modern extension platform |
| Vite 5 | Popup bundling |
| esbuild | Content script & service worker bundling |

### Backend
| Technology | Purpose |
|-----------|---------|
| Node.js 18+ | Runtime |
| Express 4 | HTTP framework |
| Gemini 2.5 Flash | AI email analysis |
| Zod | Request validation |
| Helmet | Security headers |
| express-rate-limit | Rate limiting |

---

## 🤝 Contributing

Contributions are welcome! Here's how you can help:

1. **Report false positives/negatives** — If a legitimate email is flagged or a scam email is missed, open an issue with the email details (redact personal info)
2. **Add trusted domains** — Edit `extension/src/rules/data/trusted-domains.json` to add verified brand domains
3. **Improve detection rules** — Enhance rules in `extension/src/rules/rules/`
4. **Add language support** — Help translate the UI and explanations
5. **UI/UX improvements** — Make the extension even more accessible for elderly users

### Development Flow

```bash
# Fork & clone
git clone https://github.com/your-username/email-scam-protector.git

# Install all dependencies
cd extension && npm install
cd ../backend && npm install

# Make changes, then verify
cd extension && npm run type-check   # Must pass with 0 errors
cd extension && npm run build        # Must build successfully
```

---

## 📋 Roadmap

- [ ] ONNX Runtime Web for offline AI classification
- [ ] Family alert system — notify trusted contacts about dangerous emails
- [ ] Voice warning mode using Web Speech API
- [ ] Interactive phishing quiz game
- [ ] Community-sourced scam pattern database
- [ ] Outlook / Yahoo Mail support
- [ ] More languages (Spanish, French, Marathi, Tamil, etc.)
- [ ] Firefox and Edge extension ports
- [ ] Real-time scam URL blacklist via API
- [ ] SMS/WhatsApp scam detection companion app

---

## 📄 License

MIT License — see [LICENSE](LICENSE) for details.

---

<div align="center">

Built with ❤️ to protect our elders and vulnerable users from online scams.

**[⬆ Back to Top](#-email-scam-protector)**

</div>
