import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ChevronLeft, Search, Filter, Grid3X3, List } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { fetchCollections, fetchNFTsForContract } from "@/lib/api";

const ACTIVITIES = [
  { event: "Sale", item: "—", price: "—", from: "0x7a...3f2a", to: "0x9b...1c4e", time: "2 min ago" },
  { event: "Listing", item: "—", price: "—", from: "0x3d...8a1b", to: "—", time: "15 min ago" },
  { event: "Bid", item: "—", price: "—", from: "0x1a...9f3c", to: "—", time: "32 min ago" },
  { event: "Transfer", item: "—", price: "—", from: "0x5e...2b7d", to: "0x8c...4a0f", time: "1 hr ago" },
];

export default function CollectionDetail() {
  const { id } = useParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState<"items" | "activity" | "analytics">("items");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [expanded, setExpanded] = useState(false);

  // Fetch all collections then find the one matching the URL id
  const { data: collections, isLoading: collectionsLoading } = useQuery({
    queryKey: ["collections"],
    queryFn: fetchCollections,
    staleTime: 60_000,
  });

  const collection = collections?.find((c) => c?.id === id) ?? null;
  const contractAddress = collection?.contractAddress;

  // Fetch NFTs for this specific collection once we have the contract address
  const { data: nfts, isLoading: nftsLoading } = useQuery({
    queryKey: ["nfts-for-contract", contractAddress],
    queryFn: () => fetchNFTsForContract(contractAddress!, 12),
    enabled: !!contractAddress,
    staleTime: 60_000,
  });


  if (collectionsLoading) {
    return (
      <div className="min-h-screen bg-void flex items-center justify-center">
        <div className="font-mono text-xs text-text-secondary animate-pulse">Loading collection...</div>
      </div>
    );
  }

  if (!collection) {
    return (
      <div className="min-h-screen bg-void flex flex-col items-center justify-center gap-4">
        <p className="font-heading text-xl text-text-primary">Collection not found</p>
        <Link to="/nft" className="font-mono text-xs text-cyan hover:opacity-80">← Back to Marketplace</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-void">
      {/* Banner */}
      <div className="relative h-48 md:h-64 overflow-hidden bg-obsidian">
        {collection.image ? (
          <img src={collection.image} alt="" className="w-full h-full object-cover opacity-40" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-cyan/5 to-transparent" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-void to-transparent" />
        <Link
          to="/nft"
          className="absolute top-4 left-4 p-2 bg-black/50 backdrop-blur-sm text-text-primary hover:text-cyan transition-colors"
        >
          <ChevronLeft size={20} />
        </Link>
      </div>

      <div className="max-w-7xl mx-auto px-4 -mt-12 relative z-10">
        {/* Collection Info */}
        <div className="flex flex-col md:flex-row gap-6 mb-8">
          <div className="w-24 h-24 md:w-32 md:h-32 rounded-lg border-4 border-void bg-obsidian overflow-hidden flex-shrink-0">
            {collection.image ? (
              <img src={collection.image} alt={collection.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-cyan/5">
                <span className="font-heading text-3xl text-cyan">{collection.name[0]}</span>
              </div>
            )}
          </div>
          <div className="flex-1">
            <h1 className="font-heading text-3xl text-text-primary">{collection.name}</h1>
            <p className={`mt-2 text-text-secondary text-sm max-w-2xl ${expanded ? "" : "line-clamp-2"}`}>
              {collection.description || "No description available."}
            </p>
            {(collection.description?.length ?? 0) > 100 && (
              <button
                onClick={() => setExpanded(!expanded)}
                className="mt-1 text-cyan font-mono text-xs hover:opacity-80"
              >
                {expanded ? "Show Less" : "Read More"}
              </button>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Items", value: (collection.totalSupply ?? 0).toLocaleString() },
            { label: "Floor Price", value: collection.floor > 0 ? `${collection.floor.toFixed(3)} ETH` : "—" },
            { label: "Network", value: "Ethereum" },
            { label: "Contract", value: `${contractAddress?.slice(0, 6)}...${contractAddress?.slice(-4)}` },
          ].map((stat) => (
            <div key={stat.label} className="p-3 bg-obsidian border border-white/5 text-center">
              <p className="font-mono text-[10px] text-text-secondary">{stat.label}</p>
              <p className="font-heading text-lg text-text-primary mt-1 truncate">{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex items-center justify-between border-b border-white/5 mb-6">
          <div className="flex gap-6">
            {(["items", "activity", "analytics"] as const).map((tab) => (
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
          {activeTab === "items" && (
            <div className="flex gap-2">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-2 ${viewMode === "grid" ? "text-cyan" : "text-text-tertiary"}`}
              >
                <Grid3X3 size={16} />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`p-2 ${viewMode === "list" ? "text-cyan" : "text-text-tertiary"}`}
              >
                <List size={16} />
              </button>
            </div>
          )}
        </div>

        {/* Items Tab */}
        {activeTab === "items" && (
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="relative flex-1">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" />
                <input
                  type="text"
                  className="w-full bg-obsidian border border-white/10 pl-10 pr-4 py-2 font-mono text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-cyan"
                  placeholder="Search items..."
                />
              </div>
              <button className="flex items-center gap-2 px-4 py-2 bg-obsidian border border-white/10 text-text-secondary font-mono text-xs hover:border-white/20">
                <Filter size={14} />
                Filter
              </button>
            </div>

            {/* Skeleton or Grid */}
            {nftsLoading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="bg-obsidian border border-white/5 animate-pulse">
                    <div className="aspect-square bg-white/5" />
                    <div className="p-3 space-y-2">
                      <div className="h-3 bg-white/5 rounded w-3/4" />
                      <div className="h-3 bg-cyan/10 rounded w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : nfts && nfts.length > 0 ? (
              <div className={`grid gap-4 ${viewMode === "grid" ? "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4" : "grid-cols-1"}`}>
                {nfts.map((nft) => (
                  <Link
                    key={`${nft.contractAddress}-${nft.tokenId}`}
                    to={`/nft/${nft.contractAddress}-${nft.tokenId}`}
                    className="group bg-obsidian border border-white/5 hover:border-cyan/30 transition-all"
                  >
                    <div className={`overflow-hidden bg-white/5 ${viewMode === "grid" ? "aspect-square" : "aspect-[2/1]"}`}>
                      {nft.image ? (
                        <img
                          src={nft.image}
                          alt={nft.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <span className="font-heading text-2xl text-text-tertiary">{nft.name[0]}</span>
                        </div>
                      )}
                    </div>
                    <div className="p-3">
                      <p className="font-body text-sm text-text-primary group-hover:text-cyan transition-colors truncate">{nft.name}</p>
                      <p className="font-mono text-xs text-text-tertiary mt-1">#{nft.tokenId}</p>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="p-12 text-center text-text-tertiary font-mono text-sm">
                No NFTs found for this collection.
              </div>
            )}
          </div>
        )}

        {/* Activity Tab */}
        {activeTab === "activity" && (
          <div className="space-y-1">
            {ACTIVITIES.map((act, i) => (
              <div key={i} className="grid grid-cols-[1fr_1fr_1fr_1fr_1fr_1fr] gap-4 px-4 py-3 bg-obsidian/50 hover:bg-obsidian transition-colors">
                <span className={`font-mono text-xs capitalize ${
                  act.event === "Sale" ? "text-blue" : act.event === "Bid" ? "text-amber" : "text-text-secondary"
                }`}>{act.event}</span>
                <span className="font-mono text-xs text-text-primary">{act.item}</span>
                <span className="font-mono text-xs text-cyan">{act.price}</span>
                <span className="font-mono text-xs text-text-tertiary truncate">{act.from}</span>
                <span className="font-mono text-xs text-text-tertiary truncate">{act.to}</span>
                <span className="font-mono text-xs text-text-tertiary text-right">{act.time}</span>
              </div>
            ))}
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === "analytics" && (
          <div className="p-8 bg-obsidian border border-white/5 text-center">
            <p className="font-mono text-sm text-text-secondary">Price History Chart</p>
            <div className="mt-4 h-48 flex items-end justify-center gap-[2px]">
              {[...Array(50)].map((_, i) => {
                const h = 20 + Math.sin(i * 0.4) * 30 + 30;
                return (
                  <div key={i} className="w-2 bg-cyan/40 rounded-t-sm" style={{ height: `${h}%` }} />
                );
              })}
            </div>
            <p className="mt-4 font-mono text-xs text-text-tertiary">Floor price trend (mock)</p>
          </div>
        )}
      </div>
    </div>
  );
}
