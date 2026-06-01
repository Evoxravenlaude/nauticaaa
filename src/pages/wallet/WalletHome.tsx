import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, ArrowDownLeft, ArrowLeftRight, Plus, Eye, EyeOff, Copy, Check, Shield, ExternalLink, RefreshCw, ChevronRight } from 'lucide-react';
import { useAccount, useBalance } from 'wagmi';
import { useQuery } from '@tanstack/react-query';
import { getLivePrices, fetchTransactionHistory, type AssetTransfer } from '@/lib/api';

const TOKENS = [
  { symbol: 'ETH',  name: 'Ethereum',    coinId: 'ethereum',  icon: 'Ξ', color: '#00F5D4',  decimals: 18 },
  { symbol: 'USDC', name: 'USD Coin',    coinId: 'usd-coin',  icon: '◆', color: '#3B82F6',  decimals: 6  },
  { symbol: 'SOL',  name: 'Solana',      coinId: 'solana',    icon: '◎', color: '#9945FF',  decimals: 9  },
  { symbol: 'WBTC', name: 'Wrapped BTC', coinId: 'bitcoin',   icon: '₿', color: '#FFB347',  decimals: 8  },
];

// Mini sparkline component — pure CSS bars
function Sparkline({ positive }: { positive: boolean }) {
  const bars = useMemo(() =>
    Array.from({ length: 28 }, () => 20 + Math.random() * 70),
    // eslint-disable-next-line react-hooks/exhaustive-deps
  []);
  return (
    <div className="flex items-end gap-[2px] h-8 w-20">
      {bars.map((h, i) => (
        <div key={i} className="flex-1 rounded-sm min-h-[3px] transition-all"
          style={{ height: `${h}%`, background: positive ? 'rgba(0,229,160,0.5)' : 'rgba(255,59,107,0.5)' }} />
      ))}
    </div>
  );
}

function TxIcon({ category, value }: { category: string; value: number | null }) {
  const isIn = category === 'external' ? (value ?? 0) > 0 : true;
  return (
    <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${isIn ? 'bg-emerald-400/10' : 'bg-rose-400/10'}`}>
      {isIn
        ? <ArrowDownLeft size={15} className="text-emerald-400" />
        : <ArrowUpRight size={15} className="text-rose-400" />}
    </div>
  );
}

function TxRow({ tx }: { tx: AssetTransfer }) {
  const date = tx.metadata?.blockTimestamp
    ? new Date(tx.metadata.blockTimestamp).toLocaleDateString('en', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
    : 'Pending';
  const isIn = tx.to?.toLowerCase() !== '';
  const amount = tx.value != null ? `${tx.value > 0 ? '+' : ''}${tx.value.toFixed(4)}` : '—';
  return (
    <div className="flex items-center gap-3 px-4 py-3 hover:bg-[#070B14] transition-colors group cursor-pointer">
      <TxIcon category={tx.category} value={tx.value} />
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-[#E8F0FF] capitalize">{tx.category === 'erc20' ? 'Token Transfer' : tx.category === 'external' ? (isIn ? 'Received' : 'Sent') : 'NFT Transfer'}</div>
        <div className="text-[10px] text-[#3A4A6A] font-mono truncate">
          {tx.from.slice(0, 8)}…{tx.from.slice(-6)} → {tx.to?.slice(0, 8)}…{tx.to?.slice(-6)}
        </div>
      </div>
      <div className="text-right">
        <div className={`text-sm font-bold font-mono ${(tx.value ?? 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>{amount} {tx.asset ?? 'ETH'}</div>
        <div className="text-[10px] text-[#3A4A6A]">{date}</div>
      </div>
      <a href={`https://etherscan.io/tx/${tx.hash}`} target="_blank" rel="noreferrer"
        onClick={e => e.stopPropagation()}
        className="opacity-0 group-hover:opacity-100 text-[#3A4A6A] hover:text-[#00F5D4] transition-all">
        <ExternalLink size={12} />
      </a>
    </div>
  );
}

export default function WalletHome() {
  const [showBalance, setShowBalance] = useState(true);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'assets' | 'history' | 'nfts'>('assets');
  const { address, isConnected } = useAccount();

  const { data: ethBalance, refetch: refetchBal } = useBalance({ address, query: { enabled: isConnected } });
  const { data: prices } = useQuery({ queryKey: ['prices'], queryFn: getLivePrices, staleTime: 30_000, refetchInterval: 30_000 });
  const { data: txHistory = [], isLoading: txLoading, refetch: refetchTx } = useQuery({
    queryKey: ['tx-history', address],
    queryFn: () => fetchTransactionHistory(address!),
    enabled: !!address && activeTab === 'history',
    staleTime: 60_000,
  });

  const ethPrice  = prices?.ethereum?.usd ?? 0;
  const ethChange = prices?.ethereum?.usd_24h_change ?? 0;
  const ethBal    = ethBalance ? Number(ethBalance.value) / 10 ** ethBalance.decimals : 0;
  const totalUsd  = ethBal * ethPrice;
  const shortAddr = address ? `${address.slice(0, 8)}…${address.slice(-6)}` : '—';

  function copyAddr() {
    if (!address) return;
    navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function refresh() { refetchBal(); if (activeTab === 'history') refetchTx(); }

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-[#04060C] flex flex-col items-center justify-center px-6 text-center">
        <svg width="56" height="56" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" className="mb-6 opacity-40" aria-hidden="true">
          <circle cx="32" cy="32" r="30" fill="#050A14"/>
          <circle cx="32" cy="32" r="29" fill="none" stroke="#00F5D4" strokeWidth="1.5" opacity="0.8"/>
          <text x="32" y="43" textAnchor="middle" fontFamily="Arial Black,sans-serif" fontWeight="900" fontSize="31" fill="#00F5D4">N</text>
        </svg>
        <h1 className="text-xl font-bold text-[#E8F0FF] mb-2">Connect Your Wallet</h1>
        <p className="text-sm text-[#4A6080] max-w-sm">Connect using the button in the top navigation to view your portfolio and transaction history.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#04060C]" style={{ fontFamily: "'Inter',sans-serif" }}>

      {/* ── Portfolio Hero ── */}
      <div className="bg-[#070B14] border-b border-[#1A2540] px-5 py-6">
        <div className="max-w-lg mx-auto">

          {/* Address row */}
          <div className="flex items-center justify-between mb-5">
            <button onClick={copyAddr} className="flex items-center gap-2 px-3 py-1.5 bg-[#0C1220] border border-[#1A2540] hover:border-[#243060] transition-colors text-xs font-mono text-[#7A8BA8]">
              {shortAddr}
              {copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} className="text-[#3A4A6A]" />}
            </button>
            <div className="flex items-center gap-2">
              <button onClick={refresh} className="p-1.5 text-[#3A4A6A] hover:text-[#7A8BA8] transition-colors"><RefreshCw size={14} /></button>
              <button onClick={() => setShowBalance(!showBalance)} className="p-1.5 text-[#3A4A6A] hover:text-[#7A8BA8] transition-colors">
                {showBalance ? <Eye size={14} /> : <EyeOff size={14} />}
              </button>
              <Link to="/profile" className="p-1.5 text-[#3A4A6A] hover:text-[#00F5D4] transition-colors text-xs font-mono">Profile</Link>
            </div>
          </div>

          {/* Balance */}
          <div className="mb-1">
            <div className="text-[10px] text-[#3A4A6A] uppercase tracking-wider mb-1 font-mono">Total Balance</div>
            <div className="text-4xl font-black text-[#E8F0FF] tracking-tight" style={{ fontFamily: "'JetBrains Mono',monospace" }}>
              {showBalance ? `$${totalUsd.toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '●●●●●●'}
            </div>
          </div>
          <div className="flex items-center gap-2 mb-6">
            <span className={`text-sm font-mono font-bold ${ethChange >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {ethChange >= 0 ? '+' : ''}{ethChange.toFixed(2)}%
            </span>
            <span className="text-xs text-[#3A4A6A] font-mono">24h</span>
            <div className="ml-auto flex items-center gap-1 text-xs text-[#3A4A6A] font-mono">
              <span className="text-purple-400 font-bold">zkETH</span> shielded
              <Shield size={11} className="text-purple-400" />
            </div>
          </div>

          {/* Quick actions */}
          <div className="grid grid-cols-5 gap-2">
            {[
              { icon: ArrowUpRight,  label: 'Send',    path: '/send',        color: '#00F5D4' },
              { icon: ArrowDownLeft, label: 'Receive', path: '/receive',     color: '#0EA5E9' },
              { icon: ArrowLeftRight,label: 'Swap',    path: '/swap',        color: '#9945FF' },
              { icon: Shield,        label: 'Shield',  path: '/zk-send',     color: '#A78BFA' },
              { icon: Plus,          label: 'Buy',     path: '/dex',         color: '#FFB347' },
            ].map(a => (
              <Link key={a.label} to={a.path}
                className="flex flex-col items-center gap-1.5 p-3 bg-[#0C1220] border border-[#1A2540] hover:border-[#243060] transition-all group">
                <a.icon size={18} style={{ color: a.color }} />
                <span className="text-[10px] text-[#4A6080] group-hover:text-[#7A8BA8] transition-colors font-mono">{a.label}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="border-b border-[#1A2540] px-5">
        <div className="max-w-lg mx-auto flex">
          {(['assets', 'history', 'nfts'] as const).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`px-4 py-3 text-xs font-medium capitalize transition-all font-mono ${activeTab === tab ? 'text-[#00F5D4] border-b-2 border-[#00F5D4]' : 'text-[#3A4A6A] hover:text-[#7A8BA8]'}`}>
              {tab}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-lg mx-auto">

        {/* ── Assets ── */}
        {activeTab === 'assets' && (
          <div className="divide-y divide-[#1A2540]">
            {TOKENS.map(token => {
              const p = prices?.[token.coinId];
              const chg = p?.usd_24h_change ?? 0;
              const price = p?.usd ?? 0;
              const bal = token.symbol === 'ETH' ? ethBal : 0;
              const val = bal * price;
              return (
                <div key={token.symbol} className="flex items-center gap-3 px-4 py-4 hover:bg-[#070B14] transition-colors cursor-pointer group">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-black"
                    style={{ background: `${token.color}15`, color: token.color, fontFamily: "'JetBrains Mono',monospace" }}>
                    {token.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-[#E8F0FF]">{token.name}</div>
                    <div className="text-[10px] text-[#3A4A6A] font-mono">{token.symbol} · ${price.toLocaleString()}</div>
                  </div>
                  <Sparkline positive={chg >= 0} />
                  <div className="text-right ml-2">
                    <div className="text-sm font-bold text-[#E8F0FF] font-mono">
                      {showBalance ? (bal > 0 ? bal.toFixed(4) : '—') : '●●●●'}
                    </div>
                    <div className="text-[11px] font-mono" style={{ color: chg >= 0 ? '#00E5A0' : '#FF3B6B' }}>
                      {chg >= 0 ? '+' : ''}{chg.toFixed(2)}%
                    </div>
                    {val > 0 && showBalance && (
                      <div className="text-[10px] text-[#3A4A6A] font-mono">${val.toFixed(2)}</div>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Shielded row */}
            <div className="flex items-center gap-3 px-4 py-4 hover:bg-[#070B14] transition-colors cursor-pointer group">
              <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 bg-purple-400/10">
                <Shield size={16} className="text-purple-400" />
              </div>
              <div className="flex-1">
                <div className="text-sm font-semibold text-[#E8F0FF]">Shielded Balance</div>
                <div className="text-[10px] text-[#3A4A6A] font-mono">ZK private · Railgun</div>
              </div>
              <div className="text-right">
                <div className="text-sm font-bold text-purple-400 font-mono">{showBalance ? '——' : '●●●●'}</div>
                <div className="text-[10px] text-[#3A4A6A]">Private</div>
              </div>
              <Link to="/zk-send" onClick={e => e.stopPropagation()} className="opacity-0 group-hover:opacity-100 text-purple-400/60 hover:text-purple-400 transition-all ml-1">
                <ChevronRight size={14} />
              </Link>
            </div>
          </div>
        )}

        {/* ── Transaction History ── */}
        {activeTab === 'history' && (
          <div>
            {txLoading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 px-4 py-4 border-b border-[#1A2540] animate-pulse">
                  <div className="w-9 h-9 rounded-full bg-[#0C1220]" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 bg-[#0C1220] rounded w-32" />
                    <div className="h-2 bg-[#0C1220] rounded w-48" />
                  </div>
                  <div className="space-y-2 text-right">
                    <div className="h-3 bg-[#0C1220] rounded w-20 ml-auto" />
                    <div className="h-2 bg-[#0C1220] rounded w-16 ml-auto" />
                  </div>
                </div>
              ))
            ) : txHistory.length === 0 ? (
              <div className="px-4 py-16 text-center">
                <div className="text-[#3A4A6A] text-sm font-mono mb-2">No transactions found</div>
                <div className="text-[#1A2540] text-xs font-mono">Recent transactions will appear here</div>
              </div>
            ) : (
              <div className="divide-y divide-[#1A2540]">
                {txHistory.map(tx => <TxRow key={tx.hash} tx={tx} />)}
              </div>
            )}
          </div>
        )}

        {/* ── NFTs ── */}
        {activeTab === 'nfts' && (
          <div className="p-4 text-center">
            <Link to="/my-nfts" className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#00F5D4] text-[#04060C] text-sm font-bold hover:brightness-110 transition-all">
              View My NFTs <ChevronRight size={14} />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
