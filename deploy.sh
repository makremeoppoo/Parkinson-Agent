#!/usr/bin/env bash
# Automated deployment script for Parkinson Agent
# Builds and deploys both backend and frontend to Google Cloud Run.
#
# Usage:
#   chmod +x deploy.sh
#   ./deploy.sh
#
# Prerequisites: gcloud CLI authenticated, project set to agentparkinson

set -euo pipefail

# ── Config ────────────────────────────────────────────────────────────────────
GCP_PROJECT="agentparkinson"
REGION="us-central1"
BACKEND_IMAGE="gcr.io/${GCP_PROJECT}/parkinson-backend"
FRONTEND_IMAGE="gcr.io/${GCP_PROJECT}/parkinson-frontend"
BACKEND_SERVICE="parkinson-backend"
FRONTEND_SERVICE="parkinson-frontend"
BACKEND_URL="https://parkinson-backend-1096813203174.us-central1.run.app"

# ── Firebase Web App config (baked into frontend at build time) ───────────────
VITE_FIREBASE_API_KEY="AIzaSyBlYw01ybA1ka8wrcAcQJ3lOoNOpgIzZkw"
VITE_FIREBASE_AUTH_DOMAIN="parkinson-doctor.firebaseapp.com"
VITE_FIREBASE_PROJECT_ID="parkinson-doctor"
VITE_FIREBASE_STORAGE_BUCKET="parkinson-doctor.firebasestorage.app"
VITE_FIREBASE_MESSAGING_SENDER_ID="203853981295"
VITE_FIREBASE_APP_ID="1:203853981295:web:996166fce7092f5abe0f9a"

echo "==> [1/4] Building backend image..."
gcloud builds submit ./backend \
  --tag "${BACKEND_IMAGE}" \
  --project "${GCP_PROJECT}"

echo "==> [2/4] Deploying backend to Cloud Run..."
gcloud run deploy "${BACKEND_SERVICE}" \
  --image "${BACKEND_IMAGE}" \
  --region "${REGION}" \
  --platform managed \
  --allow-unauthenticated \
  --set-env-vars "FIREBASE_AUTH_PROJECT_ID=parkinson-doctor,FRONTEND_URL=https://parkinson-frontend-1096813203174.us-central1.run.app" \
  --project "${GCP_PROJECT}"

echo "==> [3/4] Building frontend image..."
gcloud builds submit ./agent \
  --config ./agent/cloudbuild.yaml \
  --substitutions "_VITE_SERVER_URL=${BACKEND_URL},_VITE_FIREBASE_API_KEY=${VITE_FIREBASE_API_KEY},_VITE_FIREBASE_AUTH_DOMAIN=${VITE_FIREBASE_AUTH_DOMAIN},_VITE_FIREBASE_PROJECT_ID=${VITE_FIREBASE_PROJECT_ID},_VITE_FIREBASE_STORAGE_BUCKET=${VITE_FIREBASE_STORAGE_BUCKET},_VITE_FIREBASE_MESSAGING_SENDER_ID=${VITE_FIREBASE_MESSAGING_SENDER_ID},_VITE_FIREBASE_APP_ID=${VITE_FIREBASE_APP_ID}" \
  --project "${GCP_PROJECT}"

echo "==> [4/4] Deploying frontend to Cloud Run..."
gcloud run deploy "${FRONTEND_SERVICE}" \
  --image "${FRONTEND_IMAGE}" \
  --region "${REGION}" \
  --platform managed \
  --allow-unauthenticated \
  --project "${GCP_PROJECT}"

echo ""
echo "Deployment complete."
echo "  Frontend: https://parkinson-frontend-1096813203174.us-central1.run.app"
echo "  Backend:  ${BACKEND_URL}"
