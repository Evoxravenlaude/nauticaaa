/**
 * token-list.ts
 *
 * Fetches the Uniswap default token list (https://tokens.uniswap.org)
 * via a cached in-memory store. Falls back to a hardcoded set on failure.
 * Also provides a custom token search by address using the Alchemy proxy.
 */

export interface Token {
  address:  string;
  symbol:   string;
  name:     string;
  decimals: number;
  logoURI?: string;
  chainId:  number;
}

const UNISWAP_LIST = "https://tokens.uniswap.org";

let _cache: Token[] | null = null;

// ── Hardcoded fallback (always available) ─────────────────────────────
export const FALLBACK_TOKENS: Token[] = [
  { address: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE", symbol: "ETH",  name: "Ethereum",        decimals: 18, chainId: 1 },
  { address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", symbol: "USDC", name: "USD Coin",         decimals: 6,  chainId: 1 },
  { address: "0x6B175474E89094C44Da98b954EedeAC495271d0F", symbol: "DAI",  name: "Dai Stablecoin",   decimals: 18, chainId: 1 },
  { address: "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599", symbol: "WBTC", name: "Wrapped Bitcoin",  decimals: 8,  chainId: 1 },
  { address: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2", symbol: "WETH", name: "Wrapped Ether",     decimals: 18, chainId: 1 },
  { address: "0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984", symbol: "UNI",  name: "Uniswap",          decimals: 18, chainId: 1 },
  { address: "0x514910771AF9Ca656af840dff83E8264EcF986CA", symbol: "LINK", name: "Chainlink",         decimals: 18, chainId: 1 },
  { address: "0x7D1AfA7B718fb893dB30A3aBc0Cfc608AaCfeBB0", symbol: "MATIC",name: "Polygon",           decimals: 18, chainId: 1 },
  { address: "0xae78736Cd615f374D3085123A210448E74Fc6393", symbol: "rETH", name: "Rocket Pool ETH",  decimals: 18, chainId: 1 },
  { address: "0xD533a949740bb3306d119CC777fa900bA034cd52", symbol: "CRV",  name: "Curve DAO Token",  decimals: 18, chainId: 1 },
];

// ── Fetch Uniswap list (cached) ────────────────────────────────────────
export async function getTokenList(): Promise<Token[]> {
  if (_cache) return _cache;
  try {
    const res  = await fetch(UNISWAP_LIST);
    const json = await res.json() as { tokens: Token[] };
    _cache = json.tokens.filter((t) => t.chainId === 1);
    return _cache;
  } catch {
    return FALLBACK_TOKENS;
  }
}

// ── Search tokens by symbol or name ───────────────────────────────────
export async function searchTokens(query: string): Promise<Token[]> {
  const list = await getTokenList();
  const q    = query.toLowerCase().trim();
  if (!q) return list.slice(0, 20);
  return list
    .filter((t) =>
      t.symbol.toLowerCase().includes(q) ||
      t.name.toLowerCase().includes(q) ||
      t.address.toLowerCase() === q
    )
    .slice(0, 20);
}

// ── Lookup a token by exact address (ERC-20 metadata from Alchemy) ────
export async function lookupTokenByAddress(address: string): Promise<Token | null> {
  // First check the list
  const list  = await getTokenList();
  const found = list.find((t) => t.address.toLowerCase() === address.toLowerCase());
  if (found) return found;

  // Fall back to Alchemy contract metadata
  try {
    const res  = await fetch(`/api/alchemy-nft/getContractMetadata?contractAddress=${address}`);
    const data = await res.json() as { contract?: Record<string, unknown> };
    const c    = data.contract;
    if (!c) return null;
    return {
      address,
      symbol:   (c.symbol   as string) ?? "???",
      name:     (c.name     as string) ?? "Unknown Token",
      decimals: parseInt((c.decimals as string) ?? "18"),
      chainId:  1,
    };
  } catch {
    return null;
  }
}

// ── Persistent custom token store (localStorage) ──────────────────────
const CUSTOM_KEY = "nautica_custom_tokens";

export function loadCustomTokens(): Token[] {
  try { return JSON.parse(localStorage.getItem(CUSTOM_KEY) ?? "[]"); }
  catch { return []; }
}

export function saveCustomToken(token: Token): void {
  const tokens = loadCustomTokens();
  if (!tokens.find((t) => t.address.toLowerCase() === token.address.toLowerCase())) {
    tokens.push(token);
    localStorage.setItem(CUSTOM_KEY, JSON.stringify(tokens));
  }
}

export function removeCustomToken(address: string): void {
  const tokens = loadCustomTokens().filter(
    (t) => t.address.toLowerCase() !== address.toLowerCase()
  );
  localStorage.setItem(CUSTOM_KEY, JSON.stringify(tokens));
}
