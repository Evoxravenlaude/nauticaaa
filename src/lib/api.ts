// ─── Live Data API Layer ────────────────────────────────────────────────────
// All Alchemy and 0x requests route through the Cloudflare Worker proxy
// so API keys never appear in the client bundle.
//
// Proxy routes (see worker.js):
//   /api/alchemy-nft/…  → eth-mainnet.g.alchemy.com/nft/v3/<KEY>/…
//   /api/alchemy/…      → eth-mainnet.g.alchemy.com/…
//   /api/0x/…           → api.0x.org/…

const ALCHEMY_NFT = '/api/alchemy-nft';
const ALCHEMY_RPC = '/api/alchemy';
const ZERO_X      = '/api/0x';

// ─── CoinGecko: Live prices (no key required) ───────────────────────────────
const CG_IDS = 'ethereum,solana,usd-coin,bitcoin,chainlink,arbitrum,uniswap,tether,matic-network';

export type PriceMap = Record<string, { usd: number; usd_24h_change?: number }>;

export async function getLivePrices(): Promise<PriceMap | null> {
  try {
    const r = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${CG_IDS}&vs_currencies=usd&include_24hr_change=true`
    );
    if (!r.ok) return null;
    return r.json() as Promise<PriceMap>;
  } catch {
    return null;
  }
}

// ─── Alchemy: NFT Collections ──────────────────────────────────────────────
export interface CollectionData {
  id: string;
  name: string;
  image: string;
  floor: number;
  totalSupply: number;
  description: string;
  contractAddress: string;
}

const CURATED_CONTRACTS = [
  '0xbc4ca0eda7647a8ab7c2061c2e118a18a936f13d', // BAYC
  '0xed5af388653567af2f388e6224dc7c4b3241c544', // Azuki
  '0xb47e3cd837dDF8e4c57F05d70Ab865de6e193BBB', // CryptoPunks
  '0x60e4d786628fea6478f785a6d7e704777c86a7c6', // MAYC
  '0x8a90cab2b38dba80c64b7734e58ee1db38b8992e', // Doodles
  '0xbd3531da5cf5857e7cfaa92426877b022e612cf8', // Pudgy Penguins
];

export async function fetchCollections(): Promise<CollectionData[]> {
  try {
    const results = await Promise.allSettled(
      CURATED_CONTRACTS.map(async (addr) => {
        const r = await fetch(
          `${ALCHEMY_NFT}/getContractMetadata?contractAddress=${addr}`
        );
        if (!r.ok) return null;
        const d = await r.json() as {
          name?: string;
          openSea?: { imageUrl?: string; floorPrice?: number; description?: string };
          totalSupply?: string;
          address?: string;
        };
        return {
          id: addr.slice(2, 10),
          name: d.name ?? 'Unknown',
          image: d.openSea?.imageUrl ?? '',
          floor: d.openSea?.floorPrice ?? 0,
          totalSupply: parseInt(d.totalSupply ?? '0'),
          description: d.openSea?.description ?? '',
          contractAddress: addr,
        } satisfies CollectionData;
      })
    );
    return results
      .filter((r): r is PromiseFulfilledResult<CollectionData | null> => r.status === 'fulfilled')
      .map((r) => r.value)
      .filter((c): c is CollectionData => c !== null);
  } catch {
    return [];
  }
}

// ─── Alchemy: NFTs for a collection ────────────────────────────────────────
export interface NFTData {
  tokenId: string;
  name: string;
  image: string;
  contractAddress: string;
  description: string;
  traits: { trait_type: string; value: string }[];
  owner?: string;
}

export async function fetchNFTsForContract(contractAddress: string, limit = 12): Promise<NFTData[]> {
  try {
    const r = await fetch(
      `${ALCHEMY_NFT}/getNFTsForContract?contractAddress=${contractAddress}&withMetadata=true&limit=${limit}`
    );
    if (!r.ok) return [];
    const d = await r.json() as { nfts?: {
      tokenId?: string;
      name?: string;
      image?: { cachedUrl?: string; originalUrl?: string };
      contract?: { address?: string };
      description?: string;
      raw?: { metadata?: { attributes?: { trait_type: string; value: string }[] } };
    }[] };
    return (d.nfts ?? []).map((n) => ({
      tokenId: n.tokenId ?? '0',
      name: n.name ?? `#${n.tokenId}`,
      image: n.image?.cachedUrl ?? n.image?.originalUrl ?? '',
      contractAddress: n.contract?.address ?? contractAddress,
      description: n.description ?? '',
      traits: n.raw?.metadata?.attributes ?? [],
    }));
  } catch {
    return [];
  }
}

// ─── Alchemy: NFT item detail ──────────────────────────────────────────────
export interface NFTDetail extends NFTData {
  collectionName: string;
  floorPrice: number;
  lastSalePrice?: number;
  rarity?: string;
}

export async function fetchNFTDetail(contractAddress: string, tokenId: string): Promise<NFTDetail | null> {
  try {
    const r = await fetch(
      `${ALCHEMY_NFT}/getNFTMetadata?contractAddress=${contractAddress}&tokenId=${tokenId}&refreshCache=false`
    );
    if (!r.ok) return null;
    const n = await r.json() as {
      tokenId?: string;
      name?: string;
      image?: { cachedUrl?: string; originalUrl?: string };
      contract?: { address?: string; name?: string; openSeaMetadata?: { floorPrice?: number } };
      description?: string;
      raw?: { metadata?: { attributes?: { trait_type: string; value: string }[] } };
    };
    return {
      tokenId: n.tokenId ?? tokenId,
      name: n.name ?? `#${tokenId}`,
      image: n.image?.cachedUrl ?? n.image?.originalUrl ?? '',
      contractAddress: n.contract?.address ?? contractAddress,
      description: n.description ?? '',
      traits: n.raw?.metadata?.attributes ?? [],
      collectionName: n.contract?.name ?? '',
      floorPrice: n.contract?.openSeaMetadata?.floorPrice ?? 0,
    };
  } catch {
    return null;
  }
}

// ─── Alchemy: Owned NFTs ────────────────────────────────────────────────────
export async function fetchNFTsForOwner(ownerAddress: string): Promise<NFTData[]> {
  try {
    const r = await fetch(
      `${ALCHEMY_NFT}/getNFTsForOwner?owner=${ownerAddress}&withMetadata=true&pageSize=24`
    );
    if (!r.ok) return [];
    const d = await r.json() as { ownedNfts?: {
      tokenId?: string; name?: string;
      image?: { cachedUrl?: string; originalUrl?: string };
      contract?: { address?: string };
      description?: string;
      raw?: { metadata?: { attributes?: { trait_type: string; value: string }[] } };
    }[] };
    return (d.ownedNfts ?? []).map((n) => ({
      tokenId: n.tokenId ?? '0',
      name: n.name ?? `#${n.tokenId}`,
      image: n.image?.cachedUrl ?? n.image?.originalUrl ?? '',
      contractAddress: n.contract?.address ?? '',
      description: n.description ?? '',
      traits: n.raw?.metadata?.attributes ?? [],
    }));
  } catch {
    return [];
  }
}

// ─── Alchemy: Transaction history ──────────────────────────────────────────
export interface AssetTransfer {
  hash: string;
  from: string;
  to: string | null;
  value: number | null;
  asset: string | null;
  category: string;
  blockNum: string;
  metadata?: { blockTimestamp?: string };
}

export async function fetchTransactionHistory(address: string): Promise<AssetTransfer[]> {
  try {
    const body = {
      id: 1, jsonrpc: '2.0', method: 'alchemy_getAssetTransfers',
      params: [{
        fromAddress: address,
        category: ['external', 'erc20', 'erc721', 'erc1155'],
        withMetadata: true,
        maxCount: '0x19',
        order: 'desc',
      }],
    };
    const r = await fetch(`${ALCHEMY_RPC}/v2/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!r.ok) return [];
    const d = await r.json() as { result?: { transfers?: AssetTransfer[] } };
    return d.result?.transfers ?? [];
  } catch {
    return [];
  }
}

// ─── 0x: Swap quote ─────────────────────────────────────────────────────────
export interface SwapQuote {
  sellAmount: string;
  buyAmount: string;
  price: string;
  guaranteedPrice: string;
  estimatedPriceImpact: string;
  gas: string;
  gasPrice: string;
  to: string;
  data: string;
  value: string;
  protocolFee: string;
  minimumProtocolFee: string;
  sources: { name: string; proportion: string }[];
}

export async function getSwapQuoteV2(params: {
  sellToken: string;
  buyToken: string;
  sellAmount: string;
  takerAddress?: string;
  slippagePercentage?: string;
}): Promise<SwapQuote | null> {
  try {
    const q = new URLSearchParams({
      sellToken: params.sellToken,
      buyToken: params.buyToken,
      sellAmount: params.sellAmount,
      slippagePercentage: params.slippagePercentage ?? '0.01',
      ...(params.takerAddress ? { takerAddress: params.takerAddress } : {}),
    });
    const r = await fetch(`${ZERO_X}/swap/v1/quote?${q}`);
    if (!r.ok) return null;
    return r.json() as Promise<SwapQuote>;
  } catch {
    return null;
  }
}

// ─── Uniswap V3 subgraph ────────────────────────────────────────────────────
export interface PoolData {
  id: string;
  token0: string; token1: string;
  token0Symbol: string; token1Symbol: string;
  feeTier: number;
  tvlUsd: number; volume24h: number; fees24h: number;
  apr: number; price: number; tick: number;
}

const UNI_SUBGRAPH = 'https://api.thegraph.com/subgraphs/name/uniswap/uniswap-v3';

export async function fetchPools(): Promise<PoolData[]> {
  try {
    const query = `{
      pools(first:20,orderBy:totalValueLockedUSD,orderDirection:desc,
            where:{totalValueLockedUSD_gt:"1000000"}) {
        id token0{id symbol} token1{id symbol} feeTier
        totalValueLockedUSD volumeUSD tick
        poolDayData(first:1,orderBy:date,orderDirection:desc){volumeUSD feesUSD}
      }
    }`;
    const r = await fetch(UNI_SUBGRAPH, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query }),
    });
    if (!r.ok) return FALLBACK_POOLS;
    const { data } = await r.json() as { data?: { pools?: Record<string, unknown>[] } };
    if (!data?.pools?.length) return FALLBACK_POOLS;
    return data.pools.map((p): PoolData => {
      const t0 = p.token0 as { id: string; symbol: string };
      const t1 = p.token1 as { id: string; symbol: string };
      const dd = (p.poolDayData as { volumeUSD: string; feesUSD: string }[])?.[0];
      const tvl = parseFloat(p.totalValueLockedUSD as string);
      const vol24 = parseFloat(dd?.volumeUSD ?? '0');
      const fees24 = parseFloat(dd?.feesUSD ?? '0');
      return { id: p.id as string, token0: t0.id, token1: t1.id, token0Symbol: t0.symbol, token1Symbol: t1.symbol,
        feeTier: parseInt(p.feeTier as string), tvlUsd: tvl, volume24h: vol24, fees24h: fees24,
        apr: tvl > 0 ? parseFloat(((fees24 * 365 / tvl) * 100).toFixed(2)) : 0,
        price: 0, tick: parseInt(p.tick as string ?? '0') };
    });
  } catch { return FALLBACK_POOLS; }
}

const FALLBACK_POOLS: PoolData[] = [
  { id:'1',token0:'',token1:'',token0Symbol:'ETH',token1Symbol:'USDC',feeTier:500,  tvlUsd:842e6,volume24h:310e6,fees24h:155e3,apr:26.4,price:2847.5,tick:0 },
  { id:'2',token0:'',token1:'',token0Symbol:'WBTC',token1Symbol:'ETH',feeTier:3000, tvlUsd:520e6,volume24h:142e6,fees24h:426e3,apr:29.9,price:36.98,tick:0 },
  { id:'3',token0:'',token1:'',token0Symbol:'ETH',token1Symbol:'USDT',feeTier:500,  tvlUsd:448e6,volume24h:210e6,fees24h:105e3,apr:26.2,price:2847.5,tick:0 },
  { id:'4',token0:'',token1:'',token0Symbol:'USDC',token1Symbol:'USDT',feeTier:100, tvlUsd:388e6,volume24h:890e6,fees24h:89e3, apr:21.5,price:1.0001,tick:0 },
  { id:'5',token0:'',token1:'',token0Symbol:'ARB',token1Symbol:'ETH',feeTier:3000,  tvlUsd:210e6,volume24h:48e6, fees24h:144e3,apr:24.9,price:0.000296,tick:0 },
  { id:'6',token0:'',token1:'',token0Symbol:'LINK',token1Symbol:'ETH',feeTier:3000, tvlUsd:180e6,volume24h:32e6, fees24h:96e3, apr:19.4,price:0.00491,tick:0 },
  { id:'7',token0:'',token1:'',token0Symbol:'OP',token1Symbol:'USDC',feeTier:3000,  tvlUsd:142e6,volume24h:28e6, fees24h:84e3, apr:21.6,price:1.24,tick:0 },
  { id:'8',token0:'',token1:'',token0Symbol:'UNI',token1Symbol:'ETH',feeTier:3000,  tvlUsd:128e6,volume24h:24e6, fees24h:72e3, apr:20.5,price:0.00289,tick:0 },
];
