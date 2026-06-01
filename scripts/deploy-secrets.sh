#!/usr/bin/env bash
# deploy-secrets.sh — Push all Cloudflare Worker secrets from .env.local in one go.
# Usage: bash scripts/deploy-secrets.sh

set -e
ENV_FILE=".env.local"

if [ ! -f "$ENV_FILE" ]; then
  echo "❌  $ENV_FILE not found. Copy .env.local.example and fill in your values."
  exit 1
fi

get_val() { grep -E "^$1=" "$ENV_FILE" | cut -d= -f2- | tr -d '"' | tr -d "'"; }

ALCHEMY_KEY=$(get_val "VITE_ALCHEMY_API_KEY")
ZERO_X_KEY=$(get_val "VITE_ZERO_X_API_KEY")
RESERVOIR_KEY=$(get_val "RESERVOIR_API_KEY")

echo "🔐  Pushing Cloudflare Worker secrets…"
echo ""

if [ -n "$ALCHEMY_KEY" ]; then
  echo "$ALCHEMY_KEY" | npx wrangler secret put ALCHEMY_API_KEY
  echo "✅  ALCHEMY_API_KEY"
else
  echo "⚠️   VITE_ALCHEMY_API_KEY not in $ENV_FILE — skipping"
fi

if [ -n "$ZERO_X_KEY" ]; then
  echo "$ZERO_X_KEY" | npx wrangler secret put ZERO_X_API_KEY
  echo "✅  ZERO_X_API_KEY"
else
  echo "⚠️   VITE_ZERO_X_API_KEY not in $ENV_FILE — skipping"
fi

if [ -n "$RESERVOIR_KEY" ]; then
  echo "$RESERVOIR_KEY" | npx wrangler secret put RESERVOIR_API_KEY
  echo "✅  RESERVOIR_API_KEY"
else
  echo "ℹ️   No RESERVOIR_API_KEY — Reservoir runs on free public tier"
fi

echo ""
echo "🚀  Done. Run: npm run build && npx wrangler deploy"
