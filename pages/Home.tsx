import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight, TrendingUp, Shield, Zap, Lock, Globe, BarChart3, ChevronRight } from 'lucide-react';
import { fetchCollections, getLivePrices } from '@/lib/api';

const TICKERS = [
  { sym: 'ETH',  id: 'ethereum',    color: '#00F5D4' },
  { sym: 'BTC',  id: 'bitcoin',     color: '#FFB347' },
  { sym: 'SOL',  id: 'solana',      color: '#9945FF' },
  { sym: 'ARB',  id: 'arbitrum',    color: '#28A0F0' },
  { sym: 'USDC', id: 'usd-coin',    color: '#3B82F6' },
];

function GridBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
      <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse">
            <path d="M 60 0 L 0 0 0 60" fill="none" stroke="rgba(0,245,212,0.04)" strokeWidth="1"/>
          </pattern>
          <radialGradient id="glow" cx="30%" cy="40%" r="60%">
            <stop offset="0%" stopColor="rgba(0,245,212,0.06)"/>
            <stop offset="100%" stopColor="transparent"/>
          </radialGradient>
          <radialGradient id="glow2" cx="80%" cy="80%" r="40%">
            <stop offset="0%" stopColor="rgba(167,139,250,0.04)"/>
            <stop offset="100%" stopColor="transparent"/>
          </radialGradient>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)"/>
        <rect width="100%" height="100%" fill="url(#glow)"/>
        <rect width="100%" height="100%" fill="url(#glow2)"/>
      </svg>
    </div>
  );
}

function AnimatedNumber({ value, prefix = '', suffix = '', decimals = 1 }: { value: number; prefix?: string; suffix?: string; decimals?: number }) {
  const [display, setDisplay] = useState(0);
  const ref = useRef(false);
  useEffect(() => {
    if (ref.current) return;
    ref.current = true;
    const duration = 1200;
    const start = Date.now();
    const tick = () => {
      const elapsed = Date.now() - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(eased * value);
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [value]);
  return <span>{prefix}{display.toFixed(decimals)}{suffix}</span>;
}

const FEATURES = [
  {
    icon: <BarChart3 size={22}/>,
    title: 'Institutional DEX',
    desc: 'Full candlestick terminal with live orderbook, limit/market/stop orders, TP/SL, and sub-second settlement.',
    link: '/dex',
    cta: 'Open Terminal',
    color: 'text-[#00F5D4]',
    border: 'hover:border-[#00F5D4]/30',
    bg: 'bg-[#00F5D4]/5',
  },
  {
    icon: <Globe size={22}/>,
    title: 'NFT Marketplace',
    desc: 'Browse, sweep floor, filter by rarity and trait. Real Alchemy data across top collections on Ethereum.',
    link: '/nft',
    cta: 'Explore NFTs',
    color: 'text-[#0EA5E9]',
    border: 'hover:border-[#0EA5E9]/30',
    bg: 'bg-[#0EA5E9]/5',
  },
  {
    icon: <Shield size={22}/>,
    title: 'ZK Shield',
    desc: 'Private transactions powered by Railgun. Groth16 proofs, shielded balances, stealth addresses.',
    link: '/zk-send',
    cta: 'Shield Assets',
    color: 'text-purple-400',
    border: 'hover:border-purple-400/30',
    bg: 'bg-purple-400/5',
  },
  {
    icon: <TrendingUp size={22}/>,
    title: 'Liquidity Pools',
    desc: 'Provide liquidity to earn fees. Uniswap V3 concentrated liquidity with real-time APR data.',
    link: '/pools',
    cta: 'View Pools',
    color: 'text-emerald-400',
    border: 'hover:border-emerald-400/30',
    bg: 'bg-emerald-400/5',
  },
  {
    icon: <Lock size={22}/>,
    title: 'Private Wallet',
    desc: 'Native multi-chain portfolio view with shielded balance tracking. Your keys, your assets.',
    link: '/wallet-home',
    cta: 'Open Wallet',
    color: 'text-amber-400',
    border: 'hover:border-amber-400/30',
    bg: 'bg-amber-400/5',
  },
  {
    icon: <Zap size={22}/>,
    title: 'Smart Swap',
    desc: '0x-aggregated routing finds the best price across all DEXs. Gasless swaps via meta-transactions.',
    link: '/swap',
    cta: 'Swap Now',
    color: 'text-rose-400',
    border: 'hover:border-rose-400/30',
    bg: 'bg-rose-400/5',
  },
];

export default function Home() {
  const { data: prices } = useQuery({ queryKey: ['prices'], queryFn: getLivePrices, staleTime: 30_000, refetchInterval: 30_000 });
  const { data: collections = [] } = useQuery({ queryKey: ['collections'], queryFn: fetchCollections, staleTime: 60_000 });

  return (
    <div className="min-h-screen bg-[#04060C] text-[#E8F0FF]" style={{ fontFamily: "'Inter', sans-serif" }}>

      {/* ── Ticker Bar ── */}
      <div className="border-b border-[#1A2540] bg-[#070B14] overflow-hidden">
        <div className="flex animate-[ticker_30s_linear_infinite]" style={{ width: 'max-content' }}>
          {[...TICKERS, ...TICKERS].map((t, i) => {
            const p = prices?.[t.id];
            const chg = p?.usd_24h_change ?? 0;
            return (
              <div key={i} className="flex items-center gap-2 px-6 py-2 border-r border-[#1A2540]">
                <span className="text-[11px] font-bold" style={{ color: t.color, fontFamily: "'JetBrains Mono',monospace" }}>{t.sym}</span>
                <span className="text-[11px] text-[#E8F0FF]" style={{ fontFamily: "'JetBrains Mono',monospace" }}>
                  {p ? `$${(p.usd ?? 0).toLocaleString('en', { maximumFractionDigits: 2 })}` : '···'}
                </span>
                {p && (
                  <span className={`text-[10px] ${chg >= 0 ? 'text-emerald-400' : 'text-rose-400'}`} style={{ fontFamily: "'JetBrains Mono',monospace" }}>
                    {chg >= 0 ? '+' : ''}{chg.toFixed(2)}%
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Hero ── */}
      <section className="relative min-h-[580px] flex items-center px-6 lg:px-16 py-24 overflow-hidden">
        <GridBackground />
        <div className="relative z-10 w-full max-w-7xl mx-auto flex items-center justify-between gap-12">
        <div className="flex-1 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 border border-[#00F5D4]/20 bg-[#00F5D4]/5 mb-8">
            <div className="w-1.5 h-1.5 rounded-full bg-[#00F5D4] animate-pulse" />
            <span className="text-[10px] font-bold tracking-[0.15em] text-[#00F5D4]" style={{ fontFamily: "'JetBrains Mono',monospace" }}>ZK-NATIVE · MULTI-CHAIN · PERMISSIONLESS</span>
          </div>
          <h1 className="text-5xl lg:text-7xl font-black leading-[1.05] tracking-tight mb-6">
            Trade. Collect.<br />
            <span style={{ background: 'linear-gradient(90deg, #00F5D4, #0EA5E9)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Stay Private.
            </span>
          </h1>
          <p className="text-lg text-[#7A8BA8] max-w-xl leading-relaxed mb-10">
            A premium Web3 marketplace where every transaction can be private. Institutional DEX, NFT marketplace, and ZK Shield — built on zero-knowledge proofs.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link to="/dex" className="flex items-center gap-2 px-6 py-3.5 bg-[#00F5D4] text-[#04060C] text-sm font-bold hover:brightness-105 transition-all">
              Launch Terminal <ArrowRight size={16} />
            </Link>
            <Link to="/zk-send" className="flex items-center gap-2 px-6 py-3.5 border border-purple-400/40 text-purple-400 text-sm font-medium hover:bg-purple-400/5 transition-all">
              <Shield size={16} /> ZK Shield
            </Link>
            <Link to="/nft" className="flex items-center gap-2 px-6 py-3.5 border border-[#1A2540] text-[#7A8BA8] text-sm font-medium hover:border-[#243060] hover:text-[#E8F0FF] transition-all">
              Explore NFTs
            </Link>
          </div>
        </div>

        {/* Hero logo — right column */}
        <div className="hidden lg:flex flex-shrink-0 items-center justify-center relative">
          <div className="absolute inset-0 rounded-full blur-3xl opacity-20" style={{ background: 'radial-gradient(circle, rgba(0,245,212,0.3) 0%, transparent 70%)' }} />
          <svg className="relative z-10 w-72 h-72 xl:w-96 xl:h-96"
            viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg"
            style={{ filter: 'drop-shadow(0 0 48px rgba(0,245,212,0.25))' }}>
            <defs>
              <linearGradient id="hrl" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#06F5D6"/>
                <stop offset="100%" stopColor="#0EA5E9"/>
              </linearGradient>
            </defs>
            <circle cx="32" cy="32" r="30" fill="#0A1628"/>
            <circle cx="32" cy="32" r="29" fill="none" stroke="url(#hrl)" strokeWidth="1.5" opacity="0.6"/>
            <text x="32" y="42" textAnchor="middle" fontFamily="Arial Black,sans-serif"
              fontWeight="900" fontSize="32" fill="url(#hrl)">N</text>
          </svg>
        </div>

        </div>
      </section>

      {/* ── Live Stats ── */}
      <section className="border-y border-[#1A2540] bg-[#070B14]">
        <div className="grid grid-cols-2 md:grid-cols-4">
          {[
            { label: 'Total Volume', value: 4.2, prefix: '$', suffix: 'B', decimals: 1, color: 'text-[#00F5D4]' },
            { label: 'ZK Proofs Generated', value: 98.4, prefix: '', suffix: 'K', decimals: 1, color: 'text-purple-400' },
            { label: 'NFTs Indexed', value: 1.24, prefix: '', suffix: 'M', decimals: 2, color: 'text-[#0EA5E9]' },
            { label: 'Active Traders', value: 89.2, prefix: '', suffix: 'K', decimals: 1, color: 'text-emerald-400' },
          ].map((stat, i) => (
            <div key={stat.label} className={`px-8 py-7 ${i < 3 ? 'border-r border-[#1A2540]' : ''}`}>
              <div className={`text-3xl font-black mb-1 ${stat.color}`} style={{ fontFamily: "'JetBrains Mono',monospace" }}>
                <AnimatedNumber {...stat} />
              </div>
              <div className="text-[11px] text-[#3A4A6A] uppercase tracking-wider" style={{ fontFamily: "'JetBrains Mono',monospace" }}>{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Token Prices ── */}
      {prices && (
        <section className="px-6 lg:px-16 py-14">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold">Live Markets</h2>
            <Link to="/dex" className="flex items-center gap-1 text-xs text-[#00F5D4] hover:opacity-80 transition-opacity" style={{ fontFamily: "'JetBrains Mono',monospace" }}>View All <ChevronRight size={14} /></Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {TICKERS.map(t => {
              const p = prices[t.id];
              if (!p) return null;
              const chg = p.usd_24h_change ?? 0;
              return (
                <Link key={t.id} to="/dex" className="bg-[#0C1220] border border-[#1A2540] hover:border-[#243060] p-4 transition-all group">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold" style={{ color: t.color, fontFamily: "'JetBrains Mono',monospace" }}>{t.sym}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 ${chg >= 0 ? 'bg-emerald-400/10 text-emerald-400' : 'bg-rose-400/10 text-rose-400'}`} style={{ fontFamily: "'JetBrains Mono',monospace" }}>{chg >= 0 ? '+' : ''}{chg.toFixed(2)}%</span>
                  </div>
                  <div className="text-lg font-black text-[#E8F0FF] group-hover:text-[#00F5D4] transition-colors" style={{ fontFamily: "'JetBrains Mono',monospace" }}>
                    ${(p.usd ?? 0).toLocaleString('en', { maximumFractionDigits: 2 })}
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* ── Features Grid ── */}
      <section className="px-6 lg:px-16 py-10 border-t border-[#1A2540]">
        <div className="mb-10">
          <div className="text-[10px] text-[#3A4A6A] uppercase tracking-[0.15em] mb-3" style={{ fontFamily: "'JetBrains Mono',monospace" }}>Platform</div>
          <h2 className="text-3xl font-black">Everything you need<br /><span className="text-[#3A4A6A]">in one terminal.</span></h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {FEATURES.map(f => (
            <Link key={f.title} to={f.link} className={`group bg-[#0C1220] border border-[#1A2540] ${f.border} p-6 transition-all duration-200 hover:-translate-y-0.5 block`}>
              <div className={`inline-flex p-2.5 mb-4 ${f.bg} ${f.color}`}>{f.icon}</div>
              <h3 className="text-base font-bold text-[#E8F0FF] mb-2">{f.title}</h3>
              <p className="text-[13px] text-[#4A6080] leading-relaxed mb-4">{f.desc}</p>
              <div className={`flex items-center gap-1.5 text-[11px] font-bold ${f.color}`} style={{ fontFamily: "'JetBrains Mono',monospace" }}>
                {f.cta} <ChevronRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ── Trending Collections ── */}
      {collections.length > 0 && (
        <section className="px-6 lg:px-16 py-14 border-t border-[#1A2540]">
          <div className="flex items-center justify-between mb-6">
            <div>
              <div className="text-[10px] text-[#3A4A6A] uppercase tracking-[0.15em] mb-1" style={{ fontFamily: "'JetBrains Mono',monospace" }}>Live from Alchemy</div>
              <h2 className="text-xl font-bold">Trending Collections</h2>
            </div>
            <Link to="/nft" className="flex items-center gap-1 text-xs text-[#00F5D4] hover:opacity-80" style={{ fontFamily: "'JetBrains Mono',monospace" }}>All Collections <ChevronRight size={14} /></Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {collections.slice(0, 6).map(col => (
              <Link key={col.id} to={`/collection/${col.id}`} className="group bg-[#0C1220] border border-[#1A2540] hover:border-[#00F5D4]/30 overflow-hidden transition-all hover:-translate-y-0.5">
                <div className="aspect-square bg-[#070B14] overflow-hidden">
                  {col.image
                    ? <img src={col.image} alt={col.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    : <div className="w-full h-full flex items-center justify-center text-3xl font-black text-[#00F5D4]/10">{col.name[0]}</div>
                  }
                </div>
                <div className="p-3">
                  <div className="text-[11px] font-bold text-[#E8F0FF] truncate">{col.name}</div>
                  <div className="text-[10px] text-[#00F5D4] mt-0.5" style={{ fontFamily: "'JetBrains Mono',monospace" }}>{col.floor > 0 ? `${col.floor.toFixed(2)} ETH` : '—'}</div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ── ZK CTA Banner ── */}
      <section className="px-6 lg:px-16 py-16 border-t border-[#1A2540]">
        <div className="bg-gradient-to-r from-purple-900/20 via-[#0C1220] to-[#0C1220] border border-purple-400/20 p-10 flex flex-col md:flex-row items-center justify-between gap-8">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
              <span className="text-[10px] font-bold tracking-[0.12em] text-purple-400" style={{ fontFamily: "'JetBrains Mono',monospace" }}>RAILGUN-POWERED ZK PRIVACY</span>
            </div>
            <h2 className="text-2xl font-black mb-2">Your transactions.<br /><span className="text-purple-400">Nobody's business.</span></h2>
            <p className="text-[13px] text-[#4A6080] max-w-lg">Shield your assets and transact privately using Groth16 zero-knowledge proofs. No one can see your amounts, addresses, or history.</p>
          </div>
          <Link to="/zk-send" className="flex-shrink-0 flex items-center gap-2 px-8 py-4 bg-purple-500 text-white text-sm font-bold hover:bg-purple-400 transition-colors">
            <Shield size={16} /> Enable ZK Shield
          </Link>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-[#1A2540] px-6 lg:px-16 py-10 bg-[#070B14]">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <svg width="28" height="28" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="hl" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#06F5D6"/><stop offset="100%" stopColor="#0EA5E9"/></linearGradient></defs><circle cx="32" cy="32" r="30" fill="#0A1628"/><circle cx="32" cy="32" r="29" fill="none" stroke="url(#hl)" strokeWidth="1.5" opacity="0.5"/><text x="32" y="42" textAnchor="middle" fontFamily="Arial Black,sans-serif" fontWeight="900" fontSize="32" fill="url(#hl)">N</text></svg>
            <span className="text-sm font-bold tracking-widest text-[#E8F0FF]">NAUTICA</span>
          </div>
          <div className="flex gap-8 text-[11px] text-[#3A4A6A]" style={{ fontFamily: "'JetBrains Mono',monospace" }}>
            {['Docs','GitHub','Audits','Governance','Terms','Privacy'].map(l => (
              <span key={l} className="hover:text-[#7A8BA8] cursor-pointer transition-colors">{l}</span>
            ))}
          </div>
          <p className="text-[11px] text-[#3A4A6A]" style={{ fontFamily: "'JetBrains Mono',monospace" }}>
            © {new Date().getFullYear()} Nautica
          </p>
        </div>
      </footer>
    </div>
  );
}
