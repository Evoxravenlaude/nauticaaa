# Nautica — Security & Setup Guide

## Step 1 — Push API keys to Cloudflare Worker secrets

Run these once. Keys are encrypted in Cloudflare's secret store and
injected into `env` at runtime — never in the client bundle or git.

```bash
npx wrangler secret put ALCHEMY_API_KEY    # from dashboard.alchemy.com
npx wrangler secret put ZERO_X_API_KEY     # from dashboard.0x.org
```

## Step 2 — Local environment variables

```bash
cp .env.local.example .env.local
# Edit .env.local and fill in your values
```

| Variable                      | Where to get it                        | Used in           |
|-------------------------------|----------------------------------------|-------------------|
| VITE_WALLETCONNECT_PROJECT_ID | cloud.walletconnect.com                | WalletConnect modal |
| VITE_ALCHEMY_API_KEY          | dashboard.alchemy.com                  | Local dev proxy   |
| VITE_ZERO_X_API_KEY           | dashboard.0x.org                       | Local dev proxy   |
| VITE_NFT_STORAGE_KEY          | nft.storage (free)                     | IPFS NFT upload   |

## Step 3 — Local development

```bash
npm run dev       # Vite dev server on :3000 — proxy mirrors Worker routes
```

API calls to `/api/*` are proxied by Vite to the real services using
your `.env.local` keys. No need to run `wrangler dev` for basic dev work.

## Step 4 — Production deploy

```bash
npm run build
npx wrangler deploy
```

## Step 5 — Custom domain (optional)

```bash
npx wrangler custom-domain add nautica.xyz
```

## What the architecture does

```
Browser               Cloudflare Worker              Third party
------                -----------------              -----------
/api/alchemy/*   →→→  Worker reads env.ALCHEMY_KEY  →  Alchemy API
/api/prices      →→→  Worker (no key needed)        →  CoinGecko
/api/swap-quote  →→→  Worker reads env.ZERO_X_KEY   →  0x API
/api/transfers   →→→  Worker reads env.ALCHEMY_KEY  →  Alchemy API
```

Keys never appear in the browser bundle. Vite's dev proxy mirrors
this routing locally using your `.env.local` keys.

## NFT Minting — remaining step

CreateNFT.tsx has real IPFS upload (NFT.Storage) and the mint call ready.
To enable on-chain minting:
1. Deploy an ERC-721 contract (use OpenZeppelin Wizard)
2. Set `FACTORY_ADDRESS` in `src/pages/nft/CreateNFT.tsx`

IPFS upload works immediately with `VITE_NFT_STORAGE_KEY` set.
