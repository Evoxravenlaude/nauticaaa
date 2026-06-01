/**
 * Nautica Edge Worker
 *
 * Serves the SPA for all non-API routes.
 * Proxies all third-party API calls server-side so keys never reach the browser.
 *
 * Required Cloudflare secrets (set via `wrangler secret put`):
 *   ALCHEMY_KEY      — Alchemy API key
 *   ZERO_X_KEY       — 0x Protocol API key
 *   RESERVOIR_KEY    — Reservoir API key (optional — free tier works without it)
 */

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS },
  });
}

function err(msg, status = 500) {
  return json({ error: msg }, status);
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;

    // ── Preflight ────────────────────────────────────────────────────────
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: CORS });
    }

    // ── /api/alchemy-nft/* → Alchemy NFT v3 ─────────────────────────────
    if (path.startsWith('/api/alchemy-nft/')) {
      if (!env.ALCHEMY_KEY) return err('ALCHEMY_KEY not configured');
      const sub    = path.replace('/api/alchemy-nft/', '');
      const target = `https://eth-mainnet.g.alchemy.com/nft/v3/${env.ALCHEMY_KEY}/${sub}${url.search}`;
      const res    = await fetch(target, { headers: { accept: 'application/json' } });
      return new Response(await res.text(), {
        status: res.status,
        headers: { 'Content-Type': 'application/json', ...CORS },
      });
    }

    // ── /api/alchemy/* → Alchemy JSON-RPC (getAssetTransfers, etc.) ──────
    if (path.startsWith('/api/alchemy/')) {
      if (!env.ALCHEMY_KEY) return err('ALCHEMY_KEY not configured');
      const sub    = path.replace('/api/alchemy/', '');
      const target = `https://eth-mainnet.g.alchemy.com/${sub}${url.search}`;
      const res    = await fetch(target, {
        method:  request.method,
        headers: {
          'Content-Type': 'application/json',
          Authorization:  `Bearer ${env.ALCHEMY_KEY}`,
        },
        body: request.method !== 'GET' ? request.body : undefined,
      });
      return new Response(await res.text(), {
        status: res.status,
        headers: { 'Content-Type': 'application/json', ...CORS },
      });
    }

    // ── /api/0x/* → 0x Protocol ──────────────────────────────────────────
    if (path.startsWith('/api/0x/')) {
      if (!env.ZERO_X_KEY) return err('ZERO_X_KEY not configured');
      const sub    = path.replace('/api/0x/', '');
      const target = `https://api.0x.org/${sub}${url.search}`;
      const res    = await fetch(target, {
        method:  request.method,
        headers: {
          'Content-Type': 'application/json',
          '0x-api-key':   env.ZERO_X_KEY,
        },
        body: request.method !== 'GET' ? request.body : undefined,
      });
      return new Response(await res.text(), {
        status: res.status,
        headers: { 'Content-Type': 'application/json', ...CORS },
      });
    }

    // ── /api/prices → CoinGecko (no key required) ────────────────────────
    if (path === '/api/prices') {
      const ids    = 'ethereum,solana,usd-coin,bitcoin,chainlink,arbitrum,uniswap,tether,matic-network';
      const target = `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true`;
      const res    = await fetch(target, { headers: { accept: 'application/json' } });
      return new Response(await res.text(), {
        status: res.status,
        headers: { 'Content-Type': 'application/json', ...CORS },
      });
    }

    // ── /api/reservoir/* → Reservoir (NFT listings, buy steps, sales) ────
    if (path.startsWith('/api/reservoir/')) {
      const sub    = path.replace('/api/reservoir/', '');
      const target = `https://api.reservoir.tools/${sub}${url.search}`;
      const res    = await fetch(target, {
        method:  request.method,
        headers: {
          accept:        'application/json',
          'Content-Type': 'application/json',
          ...(env.RESERVOIR_KEY ? { 'x-api-key': env.RESERVOIR_KEY } : {}),
        },
        body: request.method !== 'GET' ? request.body : undefined,
      });
      return new Response(await res.text(), {
        status: res.status,
        headers: { 'Content-Type': 'application/json', ...CORS },
      });
    }

    // ── Everything else → SPA ────────────────────────────────────────────
    return env.ASSETS.fetch(request);
  },
};
