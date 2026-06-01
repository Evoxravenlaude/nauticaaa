// Reservoir API — aggregates OpenSea, Blur, LooksRare, X2Y2
// No API key needed for basic reads (public endpoints)
const BASE = 'https://api.reservoir.tools';

export interface ReservoirToken {
  token: {
    tokenId: string;
    name: string;
    image: string;
    contract: string;
    collection: { name: string; floorAskPrice?: { amount: { decimal: number } } };
  };
  market: {
    floorAsk?: {
      price?: { amount: { decimal: number; usd: number }; currency: { symbol: string } };
      source?: { name: string; url: string };
    };
    topBid?: { price?: { amount: { decimal: number } } };
  };
}

export interface ReservoirListing {
  id: string;
  price: { amount: { decimal: number; usd: number }; currency: { symbol: string } };
  source: { name: string; url: string; icon: string };
  maker: string;
  expiration: number;
}

export async function getTokenListings(
  contract: string,
  tokenId: string
): Promise<ReservoirListing[]> {
  try {
    const r = await fetch(
      `${BASE}/orders/asks/v5?token=${contract}:${tokenId}&sortBy=price&limit=5`,
      { headers: { 'x-api-key': '' } }
    );
    if (!r.ok) return [];
    const d = await r.json() as { orders?: ReservoirListing[] };
    return d.orders ?? [];
  } catch { return []; }
}

export async function getTokenDetails(
  contract: string,
  tokenId: string
): Promise<ReservoirToken | null> {
  try {
    const r = await fetch(
      `${BASE}/tokens/v7?tokens=${contract}:${tokenId}&includeLastSale=true`,
      { headers: { 'x-api-key': '' } }
    );
    if (!r.ok) return null;
    const d = await r.json() as { tokens?: ReservoirToken[] };
    return d.tokens?.[0] ?? null;
  } catch { return null; }
}

export async function getCollectionFloor(contract: string): Promise<number> {
  try {
    const r = await fetch(`${BASE}/collections/v7?id=${contract}&limit=1`);
    if (!r.ok) return 0;
    const d = await r.json() as { collections?: { floorAsk?: { price?: { amount?: { decimal?: number } } } }[] };
    return d.collections?.[0]?.floorAsk?.price?.amount?.decimal ?? 0;
  } catch { return 0; }
}

// Build a buy URL for the cheapest listing
export function buildBuyUrl(source: string, url: string): string {
  return url || `https://opensea.io/assets/ethereum/${url}`;
}
