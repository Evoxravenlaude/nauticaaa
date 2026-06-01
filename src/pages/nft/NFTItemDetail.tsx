import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Heart, Share2, ExternalLink, Copy, Check } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { fetchNFTDetail } from '@/lib/api';

const RARITY_LABEL = (pct: string) => {
  const n = parseFloat(pct);
  if (n <= 1) return { label: 'Legendary', cls: 'text-purple-400 bg-purple-400/10 border-purple-400/30' };
  if (n <= 5) return { label: 'Rare', cls: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/30' };
  if (n <= 15) return { label: 'Uncommon', cls: 'text-[#00F5D4] bg-[#00F5D4]/10 border-[#00F5D4]/30' };
  return { label: 'Common', cls: 'text-[#4A6080] bg-[#1A2540] border-[#243060]' };
};

export default function NFTItemDetail() {
  const { id } = useParams<{ id: string }>();
  const [liked, setLiked] = useState(false);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'traits' | 'history' | 'offers'>('traits');

  // id format: "{contractAddress}-{tokenId}"
  const [contractAddress, tokenId] = (id ?? '-').split(/-(.+)/);

  const { data: nft, isLoading, isError } = useQuery({
    queryKey: ['nft-detail', contractAddress, tokenId],
    queryFn: () => fetchNFTDetail(contractAddress, tokenId),
    enabled: !!contractAddress && !!tokenId,
    staleTime: 120_000,
  });

  function copyAddress() {
    navigator.clipboard.writeText(contractAddress ?? '');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#04060C] px-4 py-8">
        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-8">
          <div className="aspect-square bg-[#0C1220] border border-[#1A2540] animate-pulse" />
          <div className="space-y-4">
            {[60, 40, 80, 30, 100].map((w, i) => (
              <div key={i} className="h-5 bg-[#0C1220] rounded animate-pulse" style={{ width: `${w}%` }} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (isError || !nft) {
    return (
      <div className="min-h-screen bg-[#04060C] flex flex-col items-center justify-center gap-4">
        <p className="text-[#7A8BA8]">NFT not found.</p>
        <Link to="/nft" className="text-[#00F5D4] text-sm">← Back to Marketplace</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#04060C]" style={{ fontFamily: "'Inter',sans-serif" }}>
      <div className="max-w-6xl mx-auto px-4 py-8">

        {/* Breadcrumb */}
        <div className="flex items-center gap-2 mb-6 text-xs" style={{ fontFamily: "'JetBrains Mono',monospace" }}>
          <Link to="/nft" className="text-[#3A4A6A] hover:text-[#7A8BA8] transition-colors">Marketplace</Link>
          <span className="text-[#3A4A6A]">/</span>
          <Link to={`/collection/${contractAddress?.slice(2, 10)}`} className="text-[#3A4A6A] hover:text-[#7A8BA8] transition-colors">{nft.collectionName || 'Collection'}</Link>
          <span className="text-[#3A4A6A]">/</span>
          <span className="text-[#7A8BA8]">{nft.name}</span>
        </div>

        <div className="grid md:grid-cols-2 gap-8">

          {/* Image */}
          <div>
            <div className="aspect-square bg-[#0C1220] border border-[#1A2540] overflow-hidden">
              {nft.image ? (
                <img src={nft.image} alt={nft.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <span className="text-6xl font-black text-[#00F5D4]/10">{nft.name[0]}</span>
                </div>
              )}
            </div>
            <div className="flex items-center gap-2 mt-3">
              <button onClick={() => setLiked(!liked)}
                className={`flex items-center gap-1.5 px-3 py-2 border transition-all text-xs ${liked ? 'border-rose-400/40 text-rose-400 bg-rose-400/5' : 'border-[#1A2540] text-[#4A6080] hover:border-[#243060]'}`}
                style={{ fontFamily: "'JetBrains Mono',monospace" }}>
                <Heart size={13} fill={liked ? 'currentColor' : 'none'} /> {liked ? 'Liked' : 'Like'}
              </button>
              <button className="flex items-center gap-1.5 px-3 py-2 border border-[#1A2540] text-[#4A6080] hover:border-[#243060] transition-all text-xs" style={{ fontFamily: "'JetBrains Mono',monospace" }}>
                <Share2 size={13} /> Share
              </button>
              <a href={`https://etherscan.io/token/${contractAddress}?a=${tokenId}`} target="_blank" rel="noreferrer"
                className="flex items-center gap-1.5 px-3 py-2 border border-[#1A2540] text-[#4A6080] hover:border-[#243060] transition-all text-xs" style={{ fontFamily: "'JetBrains Mono',monospace" }}>
                <ExternalLink size={13} /> Etherscan
              </a>
            </div>
          </div>

          {/* Info */}
          <div>
            <div className="text-[10px] text-[#00F5D4] mb-1 font-bold uppercase tracking-wider" style={{ fontFamily: "'JetBrains Mono',monospace" }}>{nft.collectionName}</div>
            <h1 className="text-3xl font-black text-[#E8F0FF] mb-3">{nft.name}</h1>

            {nft.description && (
              <p className="text-sm text-[#4A6080] leading-relaxed mb-5">{nft.description}</p>
            )}

            {/* Price card */}
            <div className="bg-[#0C1220] border border-[#1A2540] p-5 mb-5">
              <div className="text-[10px] text-[#3A4A6A] uppercase tracking-wider mb-1" style={{ fontFamily: "'JetBrains Mono',monospace" }}>Floor Price</div>
              <div className="text-2xl font-black text-[#E8F0FF] mb-4" style={{ fontFamily: "'JetBrains Mono',monospace" }}>
                {nft.floorPrice > 0 ? `${nft.floorPrice} ETH` : '—'}
              </div>
              <div className="flex gap-3">
                <button className="flex-1 py-3 bg-[#00F5D4] text-[#04060C] text-sm font-bold hover:brightness-110 transition-all">Buy Now</button>
                <button className="flex-1 py-3 border border-[#1A2540] text-[#7A8BA8] text-sm font-bold hover:border-[#243060] transition-all">Make Offer</button>
              </div>
            </div>

            {/* Contract info */}
            <div className="bg-[#0C1220] border border-[#1A2540] p-4 mb-5">
              <div className="text-[10px] text-[#3A4A6A] uppercase tracking-wider mb-2" style={{ fontFamily: "'JetBrains Mono',monospace" }}>Contract Details</div>
              <div className="space-y-2 text-xs" style={{ fontFamily: "'JetBrains Mono',monospace" }}>
                <div className="flex justify-between items-center">
                  <span className="text-[#3A4A6A]">Address</span>
                  <div className="flex items-center gap-1.5 text-[#7A8BA8]">
                    <span>{contractAddress?.slice(0, 8)}…{contractAddress?.slice(-6)}</span>
                    <button onClick={copyAddress} className="text-[#3A4A6A] hover:text-[#00F5D4] transition-colors">
                      {copied ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} />}
                    </button>
                  </div>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#3A4A6A]">Token ID</span>
                  <span className="text-[#7A8BA8]">#{tokenId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#3A4A6A]">Token Standard</span>
                  <span className="text-[#7A8BA8]">ERC-721</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#3A4A6A]">Network</span>
                  <span className="text-[#7A8BA8]">Ethereum</span>
                </div>
              </div>
            </div>

            {/* Tabs: Traits / History / Offers */}
            <div className="border-b border-[#1A2540] flex mb-4">
              {(['traits', 'history', 'offers'] as const).map(tab => (
                <button key={tab} onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2.5 text-xs font-medium capitalize transition-all ${activeTab === tab ? 'text-[#00F5D4] border-b-2 border-[#00F5D4]' : 'text-[#3A4A6A] hover:text-[#7A8BA8]'}`}
                  style={{ fontFamily: "'JetBrains Mono',monospace" }}>{tab}</button>
              ))}
            </div>

            {activeTab === 'traits' && (
              nft.traits.length > 0 ? (
                <div className="grid grid-cols-2 gap-2">
                  {nft.traits.map((t, i) => {
                    const r = RARITY_LABEL('10'); // default; real rarity needs a rarity API
                    return (
                      <div key={i} className={`p-3 border ${r.cls} text-center`}>
                        <div className="text-[9px] uppercase tracking-wider mb-1 opacity-70" style={{ fontFamily: "'JetBrains Mono',monospace" }}>{t.trait_type}</div>
                        <div className="text-sm font-bold text-[#E8F0FF]">{t.value}</div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8 text-[#3A4A6A] text-sm" style={{ fontFamily: "'JetBrains Mono',monospace" }}>No traits data available.</div>
              )
            )}

            {activeTab === 'history' && (
              <div className="text-center py-8 text-[#3A4A6A] text-sm" style={{ fontFamily: "'JetBrains Mono',monospace" }}>
                Transaction history coming soon.<br/>
                <a href={`https://etherscan.io/token/${contractAddress}?a=${tokenId}`} target="_blank" rel="noreferrer" className="text-[#00F5D4] hover:opacity-80 mt-2 inline-flex items-center gap-1">
                  View on Etherscan <ExternalLink size={11} />
                </a>
              </div>
            )}

            {activeTab === 'offers' && (
              <div className="text-center py-8 text-[#3A4A6A] text-sm" style={{ fontFamily: "'JetBrains Mono',monospace" }}>No active offers.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
