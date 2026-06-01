#!/usr/bin/env bash
# set-domain.sh — Point a custom domain to the Nautica Cloudflare Worker.
# Usage: bash scripts/set-domain.sh yourdomain.xyz
#
# Prerequisites:
#   1. Domain must be added to your Cloudflare account
#   2. wrangler must be authenticated (npx wrangler login)

set -e
DOMAIN="${1:-}"

if [ -z "$DOMAIN" ]; then
  echo "Usage: bash scripts/set-domain.sh yourdomain.xyz"
  exit 1
fi

echo "🌐  Adding custom domain: $DOMAIN"
npx wrangler custom-domain put "$DOMAIN"

echo ""
echo "✅  Domain configured. DNS changes may take up to 5 minutes."
echo ""
echo "Next: update the OG URLs in index.html:"
echo "  og:url     → https://$DOMAIN"
echo "  og:image   → https://$DOMAIN/og-image.svg"
echo "  twitter:image → https://$DOMAIN/og-image.svg"
