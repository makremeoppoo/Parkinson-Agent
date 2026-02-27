# Agent Parkinson — AI Motor Symptom Detection

An AI-powered web agent that detects Parkinson's disease motor symptoms in real time using a webcam. The agent records a short video of the patient's hands, sends it to a Gemini-powered backend, and returns scored analysis with a spoken voice report.

Built for the [Gemini Live Agent Challenge](https://geminiliveagentchallenge.devpost.com/).

---

## Features

- **Live camera scan** — 7-second webcam recording of hand movements
- **Multimodal AI analysis** — Gemini 2.5 Flash evaluates tremor, rigidity, bradykinesia, gait, and balance (each scored 0–3)
- **Voice feedback** — Agent speaks the diagnosis result using the Web Speech API (TTS)
- **How-to-use guide** — "HOW TO USE" button triggers a spoken walkthrough of the app
- **Medical report** — Auto-generated HTML report with Chart.js charts across all sessions
- **CSV export** — Download all session data as a spreadsheet
- **Alert system** — Flags sessions where any symptom score ≥ 2
- **Cloud Run ready** — Dockerized backend for Google Cloud deployment

---

## Architecture

```
┌─────────────────────────────────────┐
│         Browser (React + Vite)      │
│                                     │
│  Camera → MediaRecorder (7s)        │
│  Base64 video → POST /analyze-frame │
│  Result → Web Speech API (TTS)      │
└────────────────┬────────────────────┘
                 │ HTTP
┌────────────────▼────────────────────┐
│       Backend (Node.js / Express)   │
│                                     │
│  POST /analyze-frame                │
│  GET  /results                      │
│  GET  /results/export  (CSV)        │
│  GET  /results/report  (HTML)       │
└────────────────┬────────────────────┘
                 │ Google GenAI SDK
┌────────────────▼────────────────────┐
│       Gemini 2.5 Flash              │
│  (multimodal video understanding)   │
│  → JSON scores + voice_message      │
└─────────────────────────────────────┘
```

---

## Project Structure

```
doctor-parkinson/
├── agent/                        # React frontend
│   └── src/
│       ├── components/
│       │   ├── ParkinsonAgent.tsx    # Main layout
│       │   ├── AgentAvatar.tsx       # Center panel + controls
│       │   ├── HandPanel.tsx         # Left/right hand guides
│       │   ├── ScanningOverlay.tsx   # Recording overlay
│       │   └── ResultOverlay.tsx     # Analysis results UI
│       ├── hooks/
│       │   └── useVideoRecording.ts  # Camera, recorder, TTS, API call
│       └── global-config.ts          # Server URL config
│
└── backend/                      # Express API
    ├── src/
    │   ├── controller/analysisController.js
    │   ├── services/geminiService.js     # Gemini API integration
    │   ├── utils/dataLogger.js           # JSON + CSV persistence
    │   └── utils/reportGenerator.js      # HTML report with Chart.js
    ├── Dockerfile
    └── server.js
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS |
| Icons | Lucide React |
| Voice output | Web Speech API (browser TTS) |
| Video capture | MediaRecorder API |
| Backend | Node.js, Express |
| AI model | Gemini 2.5 Flash (`@google/generative-ai`) |
| Report charts | Chart.js |
| Containerization | Docker (multi-stage build) |
| Cloud hosting | Google Cloud Run |

---

## Local Setup

### Prerequisites

- Node.js 20+
- Yarn (backend) / npm (frontend)
- A Gemini API key — [get one at Google AI Studio](https://aistudio.google.com/app/apikey)

### 1. Backend

```bash
cd backend
cp .env.example .env   # then fill in your API key
yarn install
node server.js
# → Running at localhost:1000
```

**backend/.env**
```env
API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-2.5-flash
PORT=1000
```

### 2. Frontend

```bash
cd agent
npm install
npm run dev
# → http://localhost:3031
```

**agent/.env** (optional — defaults to `http://localhost:8000`)
```env
VITE_SERVER_URL=http://localhost:1000
```

---

## Cloud Run Deployment

Both frontend and backend run as separate Cloud Run services.

### Prerequisites (once)

```bash
gcloud auth login
gcloud config set project YOUR_PROJECT_ID
gcloud services enable run.googleapis.com cloudbuild.googleapis.com
```

---

### Step 1 — Deploy the backend first

```bash
# Build and push the image
gcloud builds submit ./backend \
  --tag gcr.io/YOUR_PROJECT_ID/parkinson-backend

# Deploy
gcloud run deploy parkinson-backend \
  --image gcr.io/YOUR_PROJECT_ID/parkinson-backend \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars "API_KEY=YOUR_GEMINI_KEY,GEMINI_MODEL=gemini-2.5-flash"

# Note the URL printed at the end — you need it for Step 2
# Example: https://parkinson-backend-xxxx-uc.a.run.app
```

---

### Step 2 — Deploy the frontend

Replace the backend URL below with the real one from Step 1.

> `VITE_SERVER_URL` is a **build-time** variable baked into the JS bundle by Vite.
> It must be passed as `--build-arg`, not as a Cloud Run env var.

```bash
# Build the React app with the backend URL, then push the image
gcloud builds submit ./agent \
  --tag gcr.io/YOUR_PROJECT_ID/parkinson-frontend \
  --build-arg VITE_SERVER_URL=https://parkinson-backend-xxxx-uc.a.run.app

# Deploy
gcloud run deploy parkinson-frontend \
  --image gcr.io/YOUR_PROJECT_ID/parkinson-frontend \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated

# Note the URL printed at the end
# Example: https://parkinson-frontend-xxxx-uc.a.run.app
```

---

### Step 3 — Update backend CORS with the frontend URL

```bash
gcloud run services update parkinson-backend \
  --region us-central1 \
  --update-env-vars "FRONTEND_URL=https://parkinson-frontend-xxxx-uc.a.run.app"
```

---

### Docker files reference

| File | Purpose |
|---|---|
| `backend/Dockerfile` | Multi-stage build, runs Express on port 8080 |
| `backend/.dockerignore` | Excludes `node_modules`, `.env`, `data/` |
| `agent/Dockerfile` | Builds React with Vite, serves with nginx on port 8080 |
| `agent/nginx.conf` | SPA fallback routing + cache headers |
| `agent/.dockerignore` | Excludes `node_modules`, `dist`, `.env` |

---

## API Reference

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/analyze-frame` | Analyze base64 video for Parkinson symptoms |
| `GET` | `/results` | List all saved sessions as JSON |
| `GET` | `/results/export` | Download all sessions as CSV |
| `GET` | `/results/report` | View HTML medical report with charts |

### POST /analyze-frame

**Request body:**
```json
{
  "frame": "<base64 encoded video/webm>",
  "mimeType": "video/webm",
  "currentLang": "en"
}
```

**Response:**
```json
{
  "data": {
    "tremor_score": 1,
    "rigidity_score": 0,
    "bradykinesia_score": 1,
    "gait_score": 0,
    "balance_score": 0,
    "overall_severity": "Mild",
    "confidence_score": "78%",
    "observations": "Slight resting tremor detected in the right hand.",
    "recommendation": "Continue monitoring. Consult your neurologist at next appointment.",
    "needs_alert": false,
    "alert_message": "",
    "voice_message": "Hello! I noticed a slight tremor in your right hand today. Overall you are stable and doing well. Keep up with your exercises and reach out to your care team if anything changes."
  }
}
```

---

## How It Works

1. Patient opens the app and clicks **START RECORDING**
2. The browser activates the webcam and records **7 seconds** of video
3. The recording is encoded as base64 and sent to `POST /analyze-frame`
4. The Express backend forwards the video to **Gemini 2.5 Flash** with a structured medical prompt
5. Gemini returns scored JSON: tremor, rigidity, bradykinesia, gait, balance + a warm voice message
6. The frontend reads the voice message aloud via the **Web Speech API**
7. Results are logged to `data/results.json` and `data/results.csv`
8. The **RAPPORT** button opens a full HTML medical report with historical Chart.js graphs

---

## Symptom Scoring

Each motor indicator is scored **0–3**:

| Score | Meaning |
|---|---|
| 0 | Absent — no symptoms detected |
| 1 | Mild — subtle or intermittent |
| 2 | Moderate — clearly present *(triggers alert)* |
| 3 | Severe — significantly impacting movement |

> **Disclaimer:** This tool is for research and monitoring assistance only. It is not a substitute for professional medical diagnosis.

---

## License

MIT
