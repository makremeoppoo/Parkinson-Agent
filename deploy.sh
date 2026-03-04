#!/usr/bin/env bash
# Automated deployment script for Parkinson Agent
# Builds and deploys both backend and frontend to Google Cloud Run.
#
# Usage:
#   chmod +x deploy.sh
#   cp deploy.env.example deploy.env   # fill in your values
#   ./deploy.sh
#
# Prerequisites: gcloud CLI authenticated, deploy.env present

set -euo pipefail

# ── Load secrets from deploy.env ──────────────────────────────────────────────
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="${SCRIPT_DIR}/deploy.env"

if [[ ! -f "${ENV_FILE}" ]]; then
  echo "ERROR: ${ENV_FILE} not found. Copy deploy.env.example and fill in your values." >&2
  exit 1
fi

# shellcheck source=deploy.env
source "${ENV_FILE}"

# ── Derived config ─────────────────────────────────────────────────────────────
BACKEND_IMAGE="gcr.io/${GCP_PROJECT}/parkinson-backend"
FRONTEND_IMAGE="gcr.io/${GCP_PROJECT}/parkinson-frontend"
BACKEND_SERVICE="parkinson-backend"
FRONTEND_SERVICE="parkinson-frontend"

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
  --set-env-vars "FIREBASE_AUTH_PROJECT_ID=${VITE_FIREBASE_PROJECT_ID},FRONTEND_URL=${FRONTEND_URL}" \
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
echo "  Frontend: ${FRONTEND_URL}"
echo "  Backend:  ${BACKEND_URL}"
