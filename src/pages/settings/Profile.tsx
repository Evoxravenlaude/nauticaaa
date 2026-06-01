import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, Copy, Check, ExternalLink, Shield, BarChart3, Wallet } from 'lucide-react';
import { useAccount, useBalance } from 'wagmi';
import { useQuery } from '@tanstack/react-query';
import { getLivePrices } from '@/lib/api';

export default function Profile() {
  const { address, isConnected } = useAccount();
  const [copied, setCopied] = useState(false);
  const { data: ethBalance } = useBalance({ address, query: { enabled: isConnected } });
  const { data: prices } = useQuery({ queryKey: ['prices'], queryFn: getLivePrices, staleTime: 30_000 });
  const ethPrice = prices?.ethereum?.usd ?? 0;
  const ethBal = ethBalance ? Number(ethBalance.value) / 10 ** ethBalance.decimals : 0;
  const totalUsd = ethBal * ethPrice;

  function copy() {
    if (!address) return;
    navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const stats = [
    { label: 'Portfolio', val: `$${totalUsd.toFixed(2)}`, icon: <Wallet size={14}/>, color: 'text-[#00F5D4]' },
    { label: 'Shielded', val: 'Private', icon: <Shield size={14}/>, color: 'text-purple-400' },
    { label: 'Trades', val: '—', icon: <BarChart3 size={14}/>, color: 'text-emerald-400' },
  ];

  return (
    <div className="min-h-screen bg-[#04060C]" style={{ fontFamily: "'Inter',sans-serif" }}>
      <div className="max-w-lg mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-8">
          <Link to="/settings" className="text-[#4A6080] hover:text-[#E8F0FF] transition-colors"><ChevronLeft size={18}/></Link>
          <h1 className="text-2xl font-bold text-[#E8F0FF]">Profile</h1>
        </div>

        {/* Avatar + address */}
        <div className="bg-[#0C1220] border border-[#1A2540] p-6 mb-4 flex flex-col items-center text-center">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#00F5D4]/20 to-purple-400/20 border border-[#1A2540] flex items-center justify-center mb-4">
            <img src="/logo.png" alt="" className="w-10 h-10 object-contain opacity-60"/>
          </div>
          {isConnected ? (
            <>
              <div className="flex items-center gap-2 mb-1">
                <span className="font-mono text-sm text-[#E8F0FF]">{address?.slice(0,10)}…{address?.slice(-8)}</span>
                <button onClick={copy} className="text-[#3A4A6A] hover:text-[#00F5D4] transition-colors">
                  {copied ? <Check size={13} className="text-emerald-400"/> : <Copy size={13}/>}
                </button>
              </div>
              <a href={`https://etherscan.io/address/${address}`} target="_blank" rel="noreferrer"
                className="flex items-center gap-1 text-[10px] text-[#4A6080] hover:text-[#00F5D4] transition-colors font-mono">
                View on Etherscan <ExternalLink size={10}/>
              </a>
            </>
          ) : (
            <p className="text-sm text-[#4A6080]">Connect your wallet to view profile</p>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {stats.map(s => (
            <div key={s.label} className="bg-[#0C1220] border border-[#1A2540] p-4 text-center">
              <div className={`flex justify-center mb-2 ${s.color}`}>{s.icon}</div>
              <div className={`text-base font-bold font-mono ${s.color}`}>{s.val}</div>
              <div className="text-[10px] text-[#3A4A6A] font-mono mt-1">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Quick links */}
        <div className="bg-[#0C1220] border border-[#1A2540] divide-y divide-[#1A2540]">
          {[
            { label: 'My NFTs', sub: 'View your collection', path: '/my-nfts' },
            { label: 'Transaction History', sub: 'All on-chain activity', path: '/wallet-home' },
            { label: 'ZK Shield History', sub: 'Private transfer log', path: '/zk-history' },
          ].map(item => (
            <Link key={item.path} to={item.path} className="flex items-center justify-between px-4 py-4 hover:bg-[#070B14] transition-colors">
              <div>
                <div className="text-sm font-medium text-[#E8F0FF]">{item.label}</div>
                <div className="text-xs text-[#4A6080] mt-0.5">{item.sub}</div>
              </div>
              <ChevronLeft size={16} className="text-[#3A4A6A] rotate-180"/>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
