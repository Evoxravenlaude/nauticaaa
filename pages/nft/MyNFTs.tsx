import { Link } from 'react-router-dom';
import { useAccount } from 'wagmi';
import { useQuery } from '@tanstack/react-query';
import { fetchNFTsForOwner } from '@/lib/api';
import { Grid3X3, List, Plus, ExternalLink } from 'lucide-react';
import { useState } from 'react';

export default function MyNFTs() {
  const { address, isConnected } = useAccount();
  const [viewMode, setViewMode] = useState<'grid'|'list'>('grid');

  const { data: nfts = [], isLoading } = useQuery({
    queryKey: ['my-nfts', address],
    queryFn: () => fetchNFTsForOwner(address!),
    enabled: !!address,
    staleTime: 60_000,
  });

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-[#04060C] flex flex-col items-center justify-center gap-4 px-6 text-center">
        <svg width="56" height="56" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="ml" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#06F5D6" stopOpacity="0.4"/><stop offset="100%" stopColor="#0EA5E9" stopOpacity="0.4"/></linearGradient></defs><circle cx="32" cy="32" r="30" fill="#0A1628"/><text x="32" y="42" textAnchor="middle" fontFamily="Arial Black,sans-serif" fontWeight="900" fontSize="32" fill="url(#ml)">N</text></svg>
        <h1 className="text-xl font-bold text-[#E8F0FF]">Connect Your Wallet</h1>
        <p className="text-sm text-[#4A6080] max-w-sm">Connect your wallet to view your NFT collection.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#04060C]" style={{ fontFamily:"'Inter',sans-serif" }}>
      <div className="border-b border-[#1A2540] px-5 py-4 flex items-center justify-between bg-[#070B14]">
        <div>
          <h1 className="font-bold text-lg text-[#E8F0FF]">My NFTs</h1>
          <div className="text-[10px] text-[#3A4A6A] font-mono mt-0.5">
            {isLoading ? 'Loading…' : `${nfts.length} items across all collections`}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex border border-[#1A2540]">
            <button onClick={()=>setViewMode('grid')} className={`p-2 transition-colors ${viewMode==='grid'?'bg-[#0C1220] text-[#00F5D4]':'text-[#3A4A6A]'}`}><Grid3X3 size={14}/></button>
            <button onClick={()=>setViewMode('list')} className={`p-2 transition-colors ${viewMode==='list'?'bg-[#0C1220] text-[#00F5D4]':'text-[#3A4A6A]'}`}><List size={14}/></button>
          </div>
          <Link to="/create-nft" className="flex items-center gap-1.5 px-3 py-2 bg-[#00F5D4] text-[#04060C] text-xs font-bold hover:brightness-110 transition-all">
            <Plus size={13}/> Create
          </Link>
        </div>
      </div>

      <div className="p-4">
        {isLoading ? (
          <div className={`grid gap-3 ${viewMode==='grid'?'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5':'grid-cols-1'}`}>
            {Array.from({length:8}).map((_,i)=>(
              <div key={i} className="bg-[#0C1220] border border-[#1A2540] animate-pulse">
                <div className="aspect-square bg-[#1A2540]"/>
                <div className="p-3 space-y-2"><div className="h-3 bg-[#1A2540] rounded w-3/4"/><div className="h-2 bg-[#1A2540] rounded w-1/2"/></div>
              </div>
            ))}
          </div>
        ) : nfts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <div className="w-16 h-16 rounded-full bg-[#0C1220] flex items-center justify-center">
              <svg width="56" height="56" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="ml" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#06F5D6" stopOpacity="0.4"/><stop offset="100%" stopColor="#0EA5E9" stopOpacity="0.4"/></linearGradient></defs><circle cx="32" cy="32" r="30" fill="#0A1628"/><text x="32" y="42" textAnchor="middle" fontFamily="Arial Black,sans-serif" fontWeight="900" fontSize="32" fill="url(#ml)">N</text></svg>
            </div>
            <div className="text-center">
              <div className="text-sm font-semibold text-[#E8F0FF] mb-1">No NFTs found</div>
              <div className="text-xs text-[#4A6080]">Your collection will appear here</div>
            </div>
            <Link to="/nft" className="px-5 py-2.5 bg-[#00F5D4] text-[#04060C] text-xs font-bold hover:brightness-110 transition-all">Browse Marketplace</Link>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            {nfts.map(nft=>(
              <Link key={`${nft.contractAddress}-${nft.tokenId}`}
                to={`/nft/${nft.contractAddress}-${nft.tokenId}`}
                className="group bg-[#0C1220] border border-[#1A2540] hover:border-[#00F5D4]/40 overflow-hidden transition-all hover:-translate-y-0.5">
                <div className="aspect-square bg-[#070B14] overflow-hidden">
                  {nft.image
                    ? <img src={nft.image} alt={nft.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"/>
                    : <div className="w-full h-full flex items-center justify-center text-3xl font-black text-[#00F5D4]/10">{nft.name[0]}</div>}
                </div>
                <div className="p-3">
                  <div className="text-xs font-bold text-[#E8F0FF] truncate group-hover:text-[#00F5D4] transition-colors">{nft.name}</div>
                  <div className="text-[10px] text-[#3A4A6A] font-mono mt-0.5">#{nft.tokenId}</div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {nfts.map(nft=>(
              <Link key={`${nft.contractAddress}-${nft.tokenId}`}
                to={`/nft/${nft.contractAddress}-${nft.tokenId}`}
                className="flex items-center gap-4 bg-[#0C1220] border border-[#1A2540] hover:border-[#00F5D4]/30 p-3 transition-all">
                <div className="w-14 h-14 bg-[#070B14] overflow-hidden flex-shrink-0">
                  {nft.image
                    ? <img src={nft.image} alt={nft.name} className="w-full h-full object-cover"/>
                    : <div className="w-full h-full flex items-center justify-center font-black text-[#00F5D4]/10">{nft.name[0]}</div>}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold text-[#E8F0FF] truncate">{nft.name}</div>
                  <div className="text-[10px] text-[#3A4A6A] font-mono">#{nft.tokenId}</div>
                  {nft.traits.length > 0 && (
                    <div className="flex gap-1 mt-1 flex-wrap">
                      {nft.traits.slice(0,3).map((t,i)=>(
                        <span key={i} className="text-[9px] px-1.5 py-0.5 bg-[#1A2540] text-[#4A6080] font-mono">{t.trait_type}: {t.value}</span>
                      ))}
                    </div>
                  )}
                </div>
                <a href={`https://etherscan.io/token/${nft.contractAddress}?a=${nft.tokenId}`}
                  target="_blank" rel="noreferrer" onClick={e=>e.stopPropagation()}
                  className="text-[#3A4A6A] hover:text-[#00F5D4] transition-colors flex-shrink-0">
                  <ExternalLink size={14}/>
                </a>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
