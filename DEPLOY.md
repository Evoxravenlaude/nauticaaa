# Nautica — Deployment Guide

## First deploy (Cloudflare Workers)

```bash
npm run build
npx wrangler deploy
```

## API Keys — set as Worker secrets (REQUIRED before launch)

These must be set as Cloudflare secrets, **not** committed to the repo.
The app routes all Alchemy and 0x calls through `worker.js` which reads them server-side.

```bash
npx wrangler secret put ALCHEMY_KEY
# paste your Alchemy API key when prompted

npx wrangler secret put ZERO_X_KEY
# paste your 0x API key when prompted
```

Verify they're set:
```bash
npx wrangler secret list
```

## Local dev

Copy `.dev.vars.example` to `.dev.vars` (gitignored) and fill in your keys:
```bash
cp .dev.vars.example .dev.vars
# edit .dev.vars with your keys
npx wrangler dev
```

## Custom domain

1. Add `nautica.xyz` (or your domain) in Cloudflare dashboard → Workers → your worker → Custom Domains
2. Update the `og:url` and `twitter:image` URLs in `index.html`

## OG Image

Create a 1200×630 PNG and place it at `public/og-image.png`.
You can generate one at [og-playground.vercel.app](https://og-playground.vercel.app) or use Figma.
