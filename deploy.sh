#!/bin/bash
set -euo pipefail

# ─── PennyworthBot Cloud Run Deployment ─────────────────────
# Usage: ./deploy.sh
#
# Prerequisites:
#   - gcloud CLI installed and authenticated
#   - A GCP project selected (gcloud config set project PROJECT_ID)
#   - Slack tokens ready
# ────────────────────────────────────────────────────────

PROJECT_ID=$(gcloud config get-value project 2>/dev/null)
REGION="${GCP_REGION:-asia-south1}"
SERVICE_NAME="nimbusbot"
IMAGE="gcr.io/${PROJECT_ID}/${SERVICE_NAME}"

echo "☁️  Deploying PennyworthBot to Cloud Run"
echo "   Project:  ${PROJECT_ID}"
echo "   Region:   ${REGION}"
echo "   Service:  ${SERVICE_NAME}"
echo ""

# ── Step 1: Build and push container image ──────────────
echo "📦 Building container image..."
gcloud builds submit --tag "${IMAGE}" --quiet

# ── Step 2: Create secrets if they don't exist ──────────
echo "🔐 Setting up secrets..."

create_secret_if_missing() {
  local name=$1
  local prompt=$2
  if ! gcloud secrets describe "$name" --project="$PROJECT_ID" &>/dev/null; then
    echo "  Creating secret: $name"
    read -rsp "  Enter ${prompt}: " value
    echo ""
    printf '%s' "$value" | gcloud secrets create "$name" \
      --data-file=- \
      --replication-policy="automatic" \
      --project="$PROJECT_ID"
  else
    echo "  Secret exists: $name"
  fi
}

create_secret_if_missing "nimbusbot-slack-bot-token" "Slack Bot Token (xoxb-...)"
create_secret_if_missing "nimbusbot-slack-signing-secret" "Slack Signing Secret"
create_secret_if_missing "nimbusbot-slack-app-token" "Slack App Token (xapp-...)"

# ── Step 3: Grant Cloud Run access to secrets ───────────
echo "🔑 Granting secret access to Cloud Run service account..."
SA="${PROJECT_ID}@appspot.gserviceaccount.com"
# Try compute default SA if appspot doesn't exist
if ! gcloud iam service-accounts describe "$SA" &>/dev/null 2>&1; then
  PROJECT_NUMBER=$(gcloud projects describe "$PROJECT_ID" --format='value(projectNumber)')
  SA="${PROJECT_NUMBER}-compute@developer.gserviceaccount.com"
fi

for secret in nimbusbot-slack-bot-token nimbusbot-slack-signing-secret nimbusbot-slack-app-token; do
  gcloud secrets add-iam-policy-binding "$secret" \
    --member="serviceAccount:${SA}" \
    --role="roles/secretmanager.secretAccessor" \
    --project="$PROJECT_ID" \
    --quiet 2>/dev/null || true
done

# ── Step 4: Deploy to Cloud Run ─────────────────────────
echo "🚀 Deploying to Cloud Run..."
gcloud run deploy "$SERVICE_NAME" \
  --image "${IMAGE}" \
  --region "${REGION}" \
  --platform managed \
  --no-allow-unauthenticated \
  --min-instances=1 \
  --max-instances=1 \
  --cpu=1 \
  --memory=256Mi \
  --timeout=3600 \
  --no-cpu-throttling \
  --set-secrets="SLACK_BOT_TOKEN=nimbusbot-slack-bot-token:latest,SLACK_SIGNING_SECRET=nimbusbot-slack-signing-secret:latest,SLACK_APP_TOKEN=nimbusbot-slack-app-token:latest" \
  --set-env-vars="TZ=Asia/Kolkata,DAILY_BUZZ_CHANNEL=daily-buzz,KEYWORD_CHANNELS=general,QUIZ_REVEAL_DELAY_HOURS=4,CONFERENCE_DATE=2026-03-14T08:50:00+05:30,CONFERENCE_URL=https://cloudconf.ai,NODE_ENV=production" \
  --quiet

echo ""
echo "✅ PennyworthBot deployed successfully!"
echo ""
SERVICE_URL=$(gcloud run services describe "$SERVICE_NAME" --region="$REGION" --format='value(status.url)')
echo "   Service URL: ${SERVICE_URL}"
echo "   Health check: ${SERVICE_URL}/health"
echo ""
echo "   Secrets stored in Google Secret Manager (not in env vars)"
echo "   Min instances: 1 (always-on for Socket Mode + cron)"
echo "   CPU throttling: disabled (cron jobs run in background)"
echo ""
echo "That's a 200 OK deployment. ☁️"
