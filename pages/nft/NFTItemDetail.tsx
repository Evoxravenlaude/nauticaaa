/**
 * NFTItemDetail — live metadata from Alchemy NFT API v3.
 * Supports two URL shapes:
 *   /nft/:contractAddress/:tokenId   ← new (from CollectionDetail)
 *   /nft/:id                         ← legacy fallback (no-op, shows error)
 */
import { useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { ChevronLeft, Heart, Copy, Check, ExternalLink, Loader2, AlertCircle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import {
  fetchNFTDetail,
  fetchNFTListings,
  fetchBuySteps,
  type NFTListing,
} from "@/lib/api";
import { useAccount, useSendTransaction, useWaitForTransactionReceipt } from "wagmi";
import { toast } from "sonner";

export default function NFTItemDetail() {
  const { contractAddress, tokenId, id } = useParams<{
    contractAddress?: string;
    tokenId?: string;
    id?: string;
  }>();

  const [activeTab, setActiveTab] = useState<"details" | "history" | "offers">("details");
  const [listings,     setListings]     = useState<NFTListing[]>([]);
  const [listingsLoad, setListingsLoad] = useState(false);
  const [buying,       setBuying]       = useState(false);
  const [buyTxHash,    setBuyTxHash]    = useState<`0x${string}` | undefined>();

  const { address } = useAccount();
  const { sendTransaction } = useSendTransaction();
  const { data: buyReceipt } = useWaitForTransactionReceipt({
    hash: buyTxHash,
    query: { enabled: !!buyTxHash },
  });
  const [liked,     setLiked]     = useState(false);
  const [copied,    setCopied]    = useState(false);

  // Resolve params — new route has contractAddress+tokenId, legacy has id
  const resolvedContract = contractAddress ?? null;
  const resolvedTokenId  = tokenId ?? null;
  const hasParams        = !!resolvedContract && !!resolvedTokenId;

  // Load listings when offers tab is selected
  useEffect(() => {
    if (activeTab === "offers" && resolvedContract && resolvedTokenId && !listings.length) {
      setListingsLoad(true);
      fetchNFTListings(resolvedContract, resolvedTokenId)
        .then(setListings)
        .finally(() => setListingsLoad(false));
    }
  }, [activeTab, resolvedContract, resolvedTokenId]);

  // Toast on buy confirmation
  useEffect(() => {
    if (buyReceipt?.status === "success") {
      toast.success("NFT purchased! Check your wallet.");
      setBuying(false);
    }
  }, [buyReceipt]);

  const handleBuy = async (listing: NFTListing) => {
    if (!address || !resolvedContract || !resolvedTokenId) return;
    setBuying(true);
    try {
      const steps = await fetchBuySteps(resolvedContract, resolvedTokenId, address);
      const txStep = steps.find((s) => s.id === "sale");
      const txItem = txStep?.items?.[0];
      if (!txItem?.data) {
        toast.error("Could not get buy transaction from Reservoir. Try on OpenSea.");
        setBuying(false);
        return;
      }
      const tx = txItem.data as { to: string; data: string; value?: string };
      sendTransaction({
        to:    tx.to as `0x${string}`,
        data:  tx.data as `0x${string}`,
        value: tx.value ? BigInt(tx.value) : 0n,
      }, {
        onSuccess: (hash) => setBuyTxHash(hash),
        onError:   (err)  => { toast.error((err as Error).message.slice(0, 80)); setBuying(false); },
      });
    } catch {
      toast.error("Buy failed — try on OpenSea");
      setBuying(false);
    }
  };

  const { data: nft, isLoading, isError } = useQuery({
    queryKey: ["nft-detail", resolvedContract, resolvedTokenId],
    queryFn:  () => fetchNFTDetail(resolvedContract!, resolvedTokenId!),
    enabled:  hasParams,
    staleTime: 300_000,
  });

  const handleCopyAddress = () => {
    if (!resolvedContract) return;
    navigator.clipboard.writeText(resolvedContract).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  // ── Loading ─────────────────────────────────────────────────────────
  if (!hasParams) {
    return (
      <div className="min-h-screen bg-void flex flex-col items-center justify-center gap-4 px-4">
        <AlertCircle size={32} className="text-text-tertiary" />
        <p className="font-mono text-sm text-text-secondary text-center">
          This NFT link is missing the contract address.<br />
          Navigate from a collection page for full details.
        </p>
        <Link to="/nft" className="font-mono text-xs text-cyan">Browse Marketplace</Link>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-void px-4 py-6">
        <div className="max-w-6xl mx-auto">
          <div className="h-6 w-32 bg-white/5 rounded animate-pulse mb-8" />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="aspect-[3/4] bg-obsidian animate-pulse" />
            <div className="space-y-4 animate-pulse">
              <div className="h-4 bg-white/5 rounded w-24" />
              <div className="h-8 bg-white/5 rounded w-3/4" />
              <div className="h-4 bg-white/5 rounded w-1/2" />
              <div className="h-32 bg-white/5 rounded mt-8" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isError || !nft) {
    return (
      <div className="min-h-screen bg-void flex flex-col items-center justify-center gap-4 px-4">
        <AlertCircle size={32} className="text-red-400" />
        <p className="font-mono text-sm text-text-secondary">Failed to load NFT data.</p>
        <Link to="/nft" className="font-mono text-xs text-cyan">Browse Marketplace</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-void px-4 py-6">
      <div className="max-w-6xl mx-auto">

        {/* Back */}
        <Link
          to={`/collection/${resolvedContract?.slice(2, 10)}`}
          className="inline-flex items-center gap-2 text-text-secondary hover:text-text-primary mb-6 transition-colors"
        >
          <ChevronLeft size={18} />
          <span className="font-mono text-xs">{nft.contractName}</span>
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

          {/* ── Image ─────────────────────────────────────────────────── */}
          <div className="relative bg-obsidian border border-white/5 overflow-hidden group">
            {nft.image ? (
              <img
                src={nft.image}
                alt={nft.name}
                className="w-full aspect-[3/4] object-cover group-hover:scale-105 transition-transform duration-700"
              />
            ) : (
              <div className="w-full aspect-[3/4] flex items-center justify-center text-text-tertiary bg-white/5">
                <span className="font-mono text-sm">No image available</span>
              </div>
            )}
            <div className="absolute top-4 right-4 flex gap-2">
              <button
                onClick={() => setLiked(!liked)}
                className={`p-2 bg-black/50 backdrop-blur-sm transition-colors ${liked ? "text-red-400" : "text-text-primary hover:text-red-400"}`}
              >
                <Heart size={18} fill={liked ? "currentColor" : "none"} />
              </button>
              {nft.openseaUrl && (
                <a
                  href={nft.openseaUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="p-2 bg-black/50 backdrop-blur-sm text-text-primary hover:text-cyan transition-colors"
                >
                  <ExternalLink size={18} />
                </a>
              )}
            </div>
          </div>

          {/* ── Info ──────────────────────────────────────────────────── */}
          <div>
            <p className="font-mono text-xs text-cyan">{nft.contractName}</p>
            <h1 className="font-heading text-3xl text-text-primary mt-1">{nft.name}</h1>

            {/* Contract address */}
            <div className="flex items-center gap-2 mt-2">
              <span className="font-mono text-xs text-text-secondary">Contract</span>
              <span className="font-mono text-xs text-cyan">
                {resolvedContract?.slice(0, 6)}…{resolvedContract?.slice(-4)}
              </span>
              <button onClick={handleCopyAddress} className="text-text-tertiary hover:text-cyan transition-colors">
                {copied ? <Check size={10} className="text-cyan" /> : <Copy size={10} />}
              </button>
            </div>

            {/* Token ID */}
            <div className="flex items-center gap-2 mt-1">
              <span className="font-mono text-xs text-text-secondary">Token ID</span>
              <span className="font-mono text-xs text-text-primary">#{resolvedTokenId}</span>
            </div>

            {/* Price / actions */}
            <div className="mt-8 p-6 bg-obsidian border border-white/5">
              {nft.floorPrice > 0 ? (
                <>
                  <p className="font-mono text-xs text-text-secondary mb-1">Collection Floor</p>
                  <div className="flex items-baseline gap-2">
                    <span className="font-heading text-3xl text-text-primary">{nft.floorPrice} ETH</span>
                  </div>
                </>
              ) : (
                <p className="font-mono text-xs text-text-secondary">Floor price unavailable</p>
              )}
              <div className="mt-6 flex gap-3">
                <a
                  href={nft.openseaUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 py-3 bg-cyan text-void font-mono text-sm tracking-wider font-medium hover:bg-opacity-90 transition-all text-center"
                >
                  View on OpenSea
                </a>
                <a
                  href={`https://etherscan.io/token/${resolvedContract}?a=${resolvedTokenId}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 py-3 border border-white/10 text-text-primary font-mono text-sm tracking-wider hover:border-cyan/30 transition-all text-center"
                >
                  Etherscan
                </a>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-6 mt-8 border-b border-white/5">
              {(["details", "history", "offers"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`pb-3 font-mono text-xs capitalize transition-colors ${
                    activeTab === tab
                      ? "text-cyan border-b-2 border-cyan"
                      : "text-text-secondary hover:text-text-primary"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Tab content */}
            <div className="mt-4">
              {activeTab === "details" && (
                <div className="space-y-4">
                  {nft.description && (
                    <p className="text-text-secondary text-sm leading-relaxed">{nft.description}</p>
                  )}

                  {nft.traits.length > 0 ? (
                    <div>
                      <p className="font-mono text-xs text-text-secondary mb-3">Properties ({nft.traits.length})</p>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {nft.traits.map((trait, i) => (
                          <div key={i} className="p-3 bg-obsidian border border-white/5 text-center">
                            <p className="font-mono text-[10px] text-text-tertiary uppercase truncate">{trait.trait_type}</p>
                            <p className="font-mono text-xs text-text-primary mt-1 truncate">{String(trait.value)}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    !nft.description && (
                      <p className="font-mono text-xs text-text-tertiary">No properties available for this token.</p>
                    )
                  )}
                </div>
              )}

              {activeTab === "history" && (
                <div className="space-y-2">
                  <p className="font-mono text-xs text-text-tertiary">
                    On-chain transfer history via Etherscan:
                  </p>
                  <a
                    href={`https://etherscan.io/token/${resolvedContract}?a=${resolvedTokenId}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2 font-mono text-xs text-cyan hover:opacity-80 mt-2"
                  >
                    View full transfer history <ExternalLink size={12} />
                  </a>
                  <p className="font-mono text-[10px] text-text-tertiary mt-4">
                    In-app transfer history via Reservoir API is on the roadmap.
                  </p>
                </div>
              )}

              {activeTab === "offers" && (
                <div className="space-y-2">
                  <p className="font-mono text-xs text-text-tertiary">
                    Live offers via OpenSea:
                  </p>
                  <a
                    href={nft.openseaUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2 font-mono text-xs text-cyan hover:opacity-80 mt-2"
                  >
                    View offers on OpenSea <ExternalLink size={12} />
                  </a>
                  <p className="font-mono text-[10px] text-text-tertiary mt-4">
                    Make offers via the OpenSea link above.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="h-24" />
      </div>
    </div>
  );
}
