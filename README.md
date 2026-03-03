<!-- @format -->

# Agent Parkinson-Doctor — AI Motor Symptom Detection

> **AI-powered Parkinson's monitoring via webcam — no wearables, no clinic visit required.**

A multimodal AI agent that detects Parkinson's disease motor symptoms in real time using an ordinary webcam. Doctors manage patients from a secure dashboard; patients scan at home via a private link — no app install, no login needed.

Built for the [Gemini Live Agent Challenge 2026](https://geminiliveagentchallenge.devpost.com/).

---

## Two-Actor System

| Actor       | Access                                                    | Auth                       |
| ----------- | --------------------------------------------------------- | -------------------------- |
| **Doctor**  | Dashboard → manage patients, generate links, view reports | Firebase email/password    |
| **Patient** | Unique private URL (`?pt=<token>`)                        | No login — link token only |

---

## Features

- **Two scan modes** — 👋 Hand Scan (7 s) or 🧍 Full Body Scan (10 s), selectable per session
- **Multimodal AI analysis** — Gemini Flash evaluates hand tremors, rigidity, and bradykinesia; or full-body posture, arm swing, head tremor, gait, and balance
- **Voice feedback** — Agent speaks the diagnosis result using the Web Speech API (TTS)
- **Doctor dashboard** — Create patients, generate shareable links, view per-patient history
- **Patient home session** — Patients scan from home via a private link; history visible in-app
- **Medical report** — Auto-generated HTML report with Chart.js charts, per-hand data, and body-scan section
- **CSV export** — Download all session data as a spreadsheet
- **Cloud Run ready** — Dockerized backend for Google Cloud deployment
- **Firebase Auth + Firestore** — Secure multi-tenant data isolation per doctor

---

## Architecture Overview

```
┌───────────────────────────────────────────────────────────────────────┐
│                        Browser (React 18 + Vite)                      │
│                                                                       │
│  Doctor flow:  Login → DoctorDashboard → generate patient link        │
│                ParkinsonAgent → 👋/🧍 scan → ResultOverlay            │
│                                                                       │
│  Patient flow: ?pt=<token> → PatientLinkSession → 👋/🧍 scan          │
│                                                                       │
│  Camera → MediaRecorder (7s / 10s) → base64 video                    │
│  → POST /analyze-frame (doctor) or POST /patient-analyze (patient)   │
│  Result → Web Speech API (TTS) + ResultOverlay                        │
└────────────────────────────┬──────────────────────────────────────────┘
                             │ HTTP / Firebase JWT
┌────────────────────────────▼──────────────────────────────────────────┐
│                     Backend (Node.js / Express)                       │
│                                                                       │
│  Auth middleware (Firebase JWT)      Firestore service                │
│  Analysis controller                 ADK Agent (Google ADK)           │
│  Report generator (HTML + Chart.js)                                   │
└────────────────────────────┬──────────────────────────────────────────┘
                             │ Google GenAI SDK
┌────────────────────────────▼──────────────────────────────────────────┐
│                   Gemini Flash (multimodal)                       │
│                                                                       │
│  👋 Hand prompt  → tremor / rigidity / bradykinesia (L + R, 0–3)     │
│  🧍 Body prompt  → posture / facial / arm swing / head tremor (0–3)  │
│  → scored JSON + voice_message                                        │
└───────────────────────────────────────────────────────────────────────┘
              ↓
┌────────────────────────────────────────────────────────────────────────┐
│              Google Cloud Firestore (multi-tenant)                     │
│                                                                        │
│  doctors/{uid}/patients/{code}            ← patient record             │
│  doctors/{uid}/patients/{code}/analyses  ← per-patient analyses        │
│  patientTokens/{token} → { doctorId, patientCode }                    │
│  users/{uid}/analyses                    ← legacy direct scans         │
└────────────────────────────────────────────────────────────────────────┘
```

---

## Project Structure

```
Parkinson-Agent/
├── agent/                          # React 18 + TypeScript frontend
│   └── src/
│       ├── components/
│       │   ├── Login.tsx               # Doctor email/password login
│       │   ├── DoctorDashboard.tsx     # Patient management UI
│       │   ├── ParkinsonAgent.tsx      # In-office scan (doctor context)
│       │   ├── PatientLinkSession.tsx  # Patient home session (link token)
│       │   ├── AgentAvatar.tsx         # Center panel + 👋/🧍 mode toggle
│       │   ├── HandPanel.tsx           # Left/right hand or body guides
│       │   ├── ScanningOverlay.tsx     # Recording overlay (hand guides / body frame)
│       │   └── ResultOverlay.tsx       # Analysis results + HandCard + BodyCard
│       ├── hooks/
│       │   ├── useAuth.ts              # Firebase auth (email/password for doctors)
│       │   └── useVideoRecording.ts    # Camera, recorder, TTS, API call, scanMode
│       ├── firebase.ts                 # Firebase app init
│       ├── global-config.ts            # Server URL config
│       └── App.tsx                     # Route dispatch (patient link / doctor / login)
│
└── backend/                        # Node.js + Express API
    ├── src/
    │   ├── controller/
    │   │   └── analysisController.js   # Request handlers
    │   ├── middleware/
    │   │   └── auth.js                 # Firebase JWT verification
    │   ├── routes/
    │   │   └── index.js                # Route definitions
    │   ├── services/
    │   │   ├── adkAgent.js             # Google ADK agent integration
    │   │   ├── firestoreService.js     # Firestore helpers
    │   │   └── geminiService.js        # Gemini API integration
    │   └── utils/
    │       └── reportGenerator.js      # HTML report with Chart.js
    ├── Dockerfile
    └── server.js
```

---

## Tech Stack

| Layer            | Technology                                    |
| ---------------- | --------------------------------------------- |
| Frontend         | React 18, TypeScript, Vite, Tailwind CSS      |
| Icons            | Lucide React                                  |
| Voice output     | Web Speech API (browser TTS)                  |
| Video capture    | MediaRecorder API                             |
| Authentication   | Firebase Auth (email/password — doctors only) |
| Database         | Google Cloud Firestore                        |
| Backend          | Node.js, Express                              |
| AI model         | Gemini Flash (`@google/generative-ai`)        |
| AI Agent         | Google ADK (`@google/adk`)                    |
| Report charts    | Chart.js                                      |
| Containerization | Docker (multi-stage build)                    |
| Cloud hosting    | Google Cloud Run                              |

---

## Scan Modes

### 👋 Hand Scan (7 seconds)

Records both hands for tremor, rigidity, and bradykinesia analysis.

**Gemini output:**

```json
{
  "left_hand": {
    "tremor_score": 1,
    "rigidity_score": 0,
    "bradykinesia_score": 0
  },
  "right_hand": {
    "tremor_score": 2,
    "rigidity_score": 1,
    "bradykinesia_score": 1
  },
  "overall_severity": "Moderate",
  "confidence_score": "82%",
  "observations": "Resting tremor in right hand...",
  "voice_message": "..."
}
```

### 🧍 Full Body Scan (10 seconds)

Records the full body for posture, facial expression, arm swing, and head tremor.

**Gemini output:**

```json
{
  "posture_score": 1,
  "facial_score": 0,
  "arm_swing_score": 2,
  "head_tremor_score": 1,
  "gait_score": 1,
  "balance_score": 1,
  "body_severity": "Moderate",
  "observations": "Reduced arm swing on left side...",
  "voice_message": "..."
}
```

---

## Symptom Scoring

Each motor indicator is scored **0–3**:

| Score | Meaning                                       |
| ----- | --------------------------------------------- |
| 0     | Absent — no symptoms detected                 |
| 1     | Mild — subtle or intermittent                 |
| 2     | Moderate — clearly present _(triggers alert)_ |
| 3     | Severe — significantly impacting movement     |

> **Disclaimer:** This tool is for research and monitoring assistance only. It is not a substitute for professional medical diagnosis.

---

## API Reference

### Doctor-authenticated routes (Firebase JWT required)

| Method | Endpoint                     | Description                           |
| ------ | ---------------------------- | ------------------------------------- |
| `POST` | `/analyze-frame`             | Analyze base64 video (in-office scan) |
| `GET`  | `/results`                   | List all doctor's sessions            |
| `GET`  | `/results/export`            | Download sessions as CSV              |
| `GET`  | `/results/report`            | HTML medical report with charts       |
| `POST` | `/results/save-report-cloud` | Push report to Cloud Storage          |
| `GET`  | `/results/cloud`             | List cloud-stored results             |
| `GET`  | `/patients`                  | List doctor's patients                |
| `POST` | `/patients`                  | Create a new patient                  |
| `GET`  | `/patients/:code`            | Get patient details                   |
| `GET`  | `/patients/:code/analyses`   | List analyses for a patient           |

### Public patient-link routes (no login required)

| Method | Endpoint                           | Description                              |
| ------ | ---------------------------------- | ---------------------------------------- |
| `GET`  | `/patient-session/:token`          | Validate link token, return patient info |
| `POST` | `/patient-analyze`                 | Analyze video (token in body)            |
| `GET`  | `/patient-session/:token/analyses` | List patient's past analyses             |
| `GET`  | `/patient-session/:token/report`   | Patient's HTML report                    |

---

## Local Setup

### Prerequisites

- Node.js 20+
- Yarn (backend) / npm (frontend)
- A Gemini API key — [get one at Google AI Studio](https://aistudio.google.com/app/apikey)
- A Firebase project with **Email/Password** sign-in enabled and a **Firestore** database
- A Firebase service account JSON for the backend

### 1. Backend

```bash
cd backend
cp .env.example .env   # fill in your keys
yarn install
node server.js
# → Running at localhost:1000
```

**backend/.env**

```env
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-2.5-flash
PORT=1000
FRONTEND_URL=http://localhost:3031
GOOGLE_APPLICATION_CREDENTIALS=./service-account.json
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

### 3. Firebase setup

1. Create a Firebase project at [console.firebase.google.com](https://console.firebase.google.com)
2. Enable **Authentication → Sign-in methods → Email/Password**
3. Create a **Firestore** database in Native mode
4. Download a service account key JSON and place it at `backend/service-account.json`
5. Copy `firebaseConfig` from **Project Settings → Your apps** into `agent/src/firebase.ts`

---

## Cloud Run Deployment

Both frontend and backend run as separate Cloud Run services.

### Prerequisites (once)

```bash
gcloud auth login
gcloud config set project YOUR_PROJECT_ID
gcloud services enable run.googleapis.com cloudbuild.googleapis.com
```

### Step 1 — Deploy the backend

```bash
gcloud builds submit ./backend \
  --tag gcr.io/YOUR_PROJECT_ID/parkinson-backend

gcloud run deploy parkinson-backend \
  --image gcr.io/YOUR_PROJECT_ID/parkinson-backend \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars "GEMINI_API_KEY=YOUR_KEY,GEMINI_MODEL=gemini-2.5-flash"

# Note the service URL — you need it for Step 2
```

### Step 2 — Deploy the frontend

```bash
gcloud builds submit ./agent \
  --tag gcr.io/YOUR_PROJECT_ID/parkinson-frontend \
  --build-arg VITE_SERVER_URL=https://parkinson-backend-xxxx-uc.a.run.app

gcloud run deploy parkinson-frontend \
  --image gcr.io/YOUR_PROJECT_ID/parkinson-frontend \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated
```

### Step 3 — Update backend CORS

```bash
gcloud run services update parkinson-backend \
  --region us-central1 \
  --update-env-vars "FRONTEND_URL=https://parkinson-frontend-xxxx-uc.a.run.app"
```

### Docker files reference

| File                    | Purpose                                                |
| ----------------------- | ------------------------------------------------------ |
| `backend/Dockerfile`    | Multi-stage build, runs Express on port 8080           |
| `backend/.dockerignore` | Excludes `node_modules`, `.env`, `data/`               |
| `agent/Dockerfile`      | Builds React with Vite, serves with nginx on port 8080 |
| `agent/nginx.conf`      | SPA fallback routing + cache headers                   |

---

## How It Works

### Doctor flow

1. Doctor signs in with email/password (Firebase Auth)
2. Opens **Doctor Dashboard** → creates patients, generates shareable scan links
3. To scan in-office: selects a patient → opens **ParkinsonAgent** → chooses scan mode
4. Clicks **START** — browser records 7s (hands) or 10s (body) of webcam video
5. Clicks **Analyze** → video sent to `POST /analyze-frame` with Firebase JWT + `scanMode`
6. Gemini Flash returns scored JSON → agent reads results aloud + displays overlay
7. Result saved to `doctors/{uid}/patients/{code}/analyses` in Firestore
8. **REPORT** button opens a full HTML medical report with Chart.js history charts

### Patient flow (home session)

1. Doctor generates a unique link → patient receives `https://app.url/?pt=<token>`
2. Patient opens the link — no login required; token is validated server-side
3. Chooses scan mode → records hands or full body
4. Clicks **Analyze** → video sent to `POST /patient-analyze` with `patientLinkToken` + `scanMode`
5. Results saved to same Firestore path via reverse token lookup
6. Patient can view **History** and **My Report** directly in the page

---

## License

MIT
