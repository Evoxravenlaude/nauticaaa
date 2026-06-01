import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Droplets, TrendingUp, Plus, ArrowUpDown, ExternalLink, Info } from 'lucide-react';
import { fetchPools, type PoolData } from '@/lib/api';

type SortKey = 'tvl' | 'apr' | 'volume' | 'fees';
type FeeFilter = 'all' | '100' | '500' | '3000' | '10000';

const FEE_LABEL: Record<number, string> = { 100: '0.01%', 500: '0.05%', 3000: '0.30%', 10000: '1.00%' };
const FEE_COLOR: Record<number, string> = { 100: 'text-[#00F5D4] bg-[#00F5D4]/10', 500: 'text-[#0EA5E9] bg-[#0EA5E9]/10', 3000: 'text-purple-400 bg-purple-400/10', 10000: 'text-amber-400 bg-amber-400/10' };

function usd(n: number): string {
  if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `$${(n / 1e3).toFixed(0)}K`;
  return `$${n.toFixed(0)}`;
}

function AprBar({ apr }: { apr: number }) {
  const width = Math.min(apr / 60 * 100, 100);
  const color = apr > 40 ? '#00E5A0' : apr > 20 ? '#00F5D4' : '#4A6080';
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1 bg-[#1A2540] rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${width}%`, background: color }} />
      </div>
      <span className="text-xs font-bold w-12 text-right" style={{ color, fontFamily: "'JetBrains Mono',monospace" }}>{apr.toFixed(1)}%</span>
    </div>
  );
}

export default function Pools() {
  const [sort, setSort] = useState<SortKey>('tvl');
  const [feeFilter, setFeeFilter] = useState<FeeFilter>('all');
  const [search, setSearch] = useState('');
  const [showAddLiq, setShowAddLiq] = useState(false);
  const [activePool, setActivePool] = useState<PoolData | null>(null);

  const { data: pools = [], isLoading } = useQuery({
    queryKey: ['pools'],
    queryFn: fetchPools,
    staleTime: 30_000,
    refetchInterval: 30_000,
  });

  const sorted = [...pools]
    .filter(p => feeFilter === 'all' || String(p.feeTier) === feeFilter)
    .filter(p => !search || `${p.token0Symbol}/${p.token1Symbol}`.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      if (sort === 'tvl') return b.tvlUsd - a.tvlUsd;
      if (sort === 'apr') return b.apr - a.apr;
      if (sort === 'volume') return b.volume24h - a.volume24h;
      if (sort === 'fees') return b.fees24h - a.fees24h;
      return 0;
    });

  const totalTvl = pools.reduce((s, p) => s + p.tvlUsd, 0);
  const totalVol = pools.reduce((s, p) => s + p.volume24h, 0);
  const avgApr = pools.length ? pools.reduce((s, p) => s + p.apr, 0) / pools.length : 0;

  function SortBtn({ k, label }: { k: SortKey; label: string }) {
    return (
      <button onClick={() => setSort(k)}
        className={`flex items-center gap-1 text-[10px] uppercase tracking-wider transition-colors ${sort === k ? 'text-[#00F5D4]' : 'text-[#3A4A6A] hover:text-[#7A8BA8]'}`}
        style={{ fontFamily: "'JetBrains Mono',monospace" }}>
        {label}
        {sort === k && <ArrowUpDown size={10} />}
      </button>
    );
  }

  return (
    <div className="min-h-screen bg-[#04060C]" style={{ fontFamily: "'Inter',sans-serif" }}>

      {/* Header */}
      <div className="border-b border-[#1A2540] px-6 py-4 flex items-center justify-between bg-[#070B14]">
        <div className="flex items-center gap-3">
          <Droplets size={18} className="text-[#00F5D4]" />
          <span className="font-bold text-[#E8F0FF]">Liquidity Pools</span>
          <span className="text-[10px] text-[#3A4A6A] px-2 py-0.5 border border-[#1A2540]" style={{ fontFamily: "'JetBrains Mono',monospace" }}>Uniswap V3</span>
        </div>
        <Link to="/add-liquidity">
          <button className="flex items-center gap-2 px-4 py-2 bg-[#00F5D4] text-[#04060C] text-xs font-bold hover:brightness-110 transition-all">
            <Plus size={13} /> New Position
          </button>
        </Link>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 border-b border-[#1A2540]">
        {[
          { label: 'Total TVL', val: usd(totalTvl), icon: <TrendingUp size={14} />, color: 'text-[#00F5D4]' },
          { label: '24H Volume', val: usd(totalVol), icon: <Droplets size={14} />, color: 'text-[#0EA5E9]' },
          { label: 'Avg APR', val: `${avgApr.toFixed(1)}%`, icon: <TrendingUp size={14} />, color: 'text-emerald-400' },
        ].map((s, i) => (
          <div key={s.label} className={`px-8 py-5 flex items-center gap-4 ${i < 2 ? 'border-r border-[#1A2540]' : ''}`}>
            <div className={`p-2 bg-[#0C1220] ${s.color}`}>{s.icon}</div>
            <div>
              <div className={`text-2xl font-black ${s.color}`} style={{ fontFamily: "'JetBrains Mono',monospace" }}>{s.val}</div>
              <div className="text-[10px] text-[#3A4A6A] uppercase tracking-wider mt-0.5" style={{ fontFamily: "'JetBrains Mono',monospace" }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-4 px-6 py-3 border-b border-[#1A2540] bg-[#04060C]">
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search pairs..."
          className="bg-[#0C1220] border border-[#1A2540] px-3 py-2 text-xs text-[#E8F0FF] outline-none placeholder:text-[#3A4A6A] w-52 focus:border-[#00F5D4]/30 transition-colors"
          style={{ fontFamily: "'JetBrains Mono',monospace" }} />

        <div className="flex gap-1">
          {(['all', '100', '500', '3000', '10000'] as FeeFilter[]).map(f => (
            <button key={f} onClick={() => setFeeFilter(f)}
              className={`px-2.5 py-1 text-[9px] uppercase tracking-wider border transition-colors ${feeFilter === f ? 'border-[#00F5D4]/40 text-[#00F5D4] bg-[#00F5D4]/5' : 'border-[#1A2540] text-[#3A4A6A] hover:text-[#7A8BA8]'}`}
              style={{ fontFamily: "'JetBrains Mono',monospace" }}>
              {f === 'all' ? 'All Fees' : FEE_LABEL[parseInt(f)]}
            </button>
          ))}
        </div>
      </div>

      {/* Table Header */}
      <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1.5fr_80px] gap-4 px-6 py-2.5 border-b border-[#1A2540] text-[9px] text-[#3A4A6A] uppercase tracking-wider" style={{ fontFamily: "'JetBrains Mono',monospace" }}>
        <span>Pool</span>
        <span className="text-right"><SortBtn k="tvl" label="TVL" /></span>
        <span className="text-right"><SortBtn k="volume" label="24H Vol" /></span>
        <span className="text-right"><SortBtn k="fees" label="24H Fees" /></span>
        <span><SortBtn k="apr" label="APR" /></span>
        <span />
      </div>

      {/* Rows */}
      <div className="divide-y divide-[#1A2540]">
        {isLoading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="grid grid-cols-[2fr_1fr_1fr_1fr_1.5fr_80px] gap-4 px-6 py-4 animate-pulse">
              <div className="h-4 bg-[#1A2540] rounded w-32" />
              <div className="h-4 bg-[#1A2540] rounded w-20 ml-auto" />
              <div className="h-4 bg-[#1A2540] rounded w-16 ml-auto" />
              <div className="h-4 bg-[#1A2540] rounded w-16 ml-auto" />
              <div className="h-4 bg-[#1A2540] rounded w-24" />
              <div className="h-4 bg-[#1A2540] rounded w-16" />
            </div>
          ))
        ) : sorted.map(pool => (
          <div key={pool.id}
            className="grid grid-cols-[2fr_1fr_1fr_1fr_1.5fr_80px] gap-4 px-6 py-4 items-center hover:bg-[#070B14] cursor-pointer transition-colors group"
            onClick={() => { setActivePool(pool); setShowAddLiq(true); }}>

            <div className="flex items-center gap-3">
              <div className="flex -space-x-1.5">
                <div className="w-7 h-7 rounded-full bg-[#0C1220] border-2 border-[#070B14] flex items-center justify-center text-[10px] font-bold text-[#00F5D4]">{pool.token0Symbol[0]}</div>
                <div className="w-7 h-7 rounded-full bg-[#0C1220] border-2 border-[#070B14] flex items-center justify-center text-[10px] font-bold text-[#0EA5E9]">{pool.token1Symbol[0]}</div>
              </div>
              <div>
                <div className="text-sm font-bold text-[#E8F0FF] group-hover:text-[#00F5D4] transition-colors">
                  {pool.token0Symbol}/{pool.token1Symbol}
                </div>
                <span className={`text-[9px] font-bold px-1.5 py-0.5 ${FEE_COLOR[pool.feeTier]}`} style={{ fontFamily: "'JetBrains Mono',monospace" }}>
                  {FEE_LABEL[pool.feeTier]}
                </span>
              </div>
            </div>

            <div className="text-right text-sm font-bold text-[#E8F0FF]" style={{ fontFamily: "'JetBrains Mono',monospace" }}>{usd(pool.tvlUsd)}</div>
            <div className="text-right text-sm text-[#7A8BA8]" style={{ fontFamily: "'JetBrains Mono',monospace" }}>{usd(pool.volume24h)}</div>
            <div className="text-right text-sm text-[#7A8BA8]" style={{ fontFamily: "'JetBrains Mono',monospace" }}>{usd(pool.fees24h)}</div>

            <AprBar apr={pool.apr} />

            <div className="flex items-center justify-end gap-2">
              <button
                onClick={e => { e.stopPropagation(); setActivePool(pool); setShowAddLiq(true); }}
                className="px-3 py-1.5 text-[9px] font-bold bg-[#00F5D4] text-[#04060C] hover:brightness-110 transition-all"
                style={{ fontFamily: "'JetBrains Mono',monospace" }}>
                + Add
              </button>
              <button onClick={e => e.stopPropagation()} className="text-[#3A4A6A] hover:text-[#7A8BA8]">
                <ExternalLink size={12} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Info footer */}
      <div className="px-6 py-4 flex items-center gap-2 text-[11px] text-[#3A4A6A] border-t border-[#1A2540]" style={{ fontFamily: "'JetBrains Mono',monospace" }}>
        <Info size={12} />
        <span>APR is calculated from 24H fees annualised against current TVL. Past performance is not indicative of future returns.</span>
      </div>

      {/* Add Liquidity Slide-over */}
      {showAddLiq && activePool && (
        <div className="fixed inset-0 z-50 flex items-end justify-end">
          <div className="absolute inset-0 bg-black/60" onClick={() => setShowAddLiq(false)} />
          <div className="relative w-[420px] h-full bg-[#070B14] border-l border-[#1A2540] flex flex-col overflow-y-auto">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#1A2540]">
              <div>
                <div className="font-bold text-[#E8F0FF]">{activePool.token0Symbol}/{activePool.token1Symbol}</div>
                <div className="text-[10px] text-[#3A4A6A] mt-0.5" style={{ fontFamily: "'JetBrains Mono',monospace" }}>
                  {FEE_LABEL[activePool.feeTier]} fee tier · APR {activePool.apr.toFixed(1)}%
                </div>
              </div>
              <button onClick={() => setShowAddLiq(false)} className="text-[#3A4A6A] hover:text-[#E8F0FF] text-xl">✕</button>
            </div>

            <div className="p-5 space-y-5 flex-1">
              {/* Pool stats */}
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'TVL', val: usd(activePool.tvlUsd) },
                  { label: '24H Volume', val: usd(activePool.volume24h) },
                  { label: '24H Fees', val: usd(activePool.fees24h) },
                  { label: 'Current APR', val: `${activePool.apr.toFixed(2)}%` },
                ].map(s => (
                  <div key={s.label} className="bg-[#0C1220] border border-[#1A2540] p-3">
                    <div className="text-[9px] text-[#3A4A6A] uppercase tracking-wider mb-1" style={{ fontFamily: "'JetBrains Mono',monospace" }}>{s.label}</div>
                    <div className="text-sm font-bold text-[#E8F0FF]" style={{ fontFamily: "'JetBrains Mono',monospace" }}>{s.val}</div>
                  </div>
                ))}
              </div>

              {/* Price range */}
              <div>
                <label className="block text-[10px] text-[#3A4A6A] uppercase tracking-wider mb-2" style={{ fontFamily: "'JetBrains Mono',monospace" }}>Price Range ({activePool.token0Symbol}/{activePool.token1Symbol})</label>
                <div className="flex gap-2">
                  {['Min Price', 'Max Price'].map(label => (
                    <div key={label} className="flex-1">
                      <div className="text-[9px] text-[#3A4A6A] mb-1" style={{ fontFamily: "'JetBrains Mono',monospace" }}>{label}</div>
                      <input type="number" placeholder="0.00"
                        className="w-full bg-[#0C1220] border border-[#1A2540] focus:border-[#00F5D4]/30 px-3 py-2 text-xs text-[#E8F0FF] outline-none"
                        style={{ fontFamily: "'JetBrains Mono',monospace" }} />
                    </div>
                  ))}
                </div>
                <div className="flex gap-2 mt-2">
                  {['Full Range', '±10%', '±5%', '±1%'].map(p => (
                    <button key={p} className="flex-1 py-1 text-[9px] border border-[#1A2540] text-[#4A6080] hover:border-[#243060] hover:text-[#7A8BA8] transition-colors"
                      style={{ fontFamily: "'JetBrains Mono',monospace" }}>{p}</button>
                  ))}
                </div>
              </div>

              {/* Deposit amounts */}
              <div className="space-y-2">
                <label className="block text-[10px] text-[#3A4A6A] uppercase tracking-wider" style={{ fontFamily: "'JetBrains Mono',monospace" }}>Deposit Amounts</label>
                {[activePool.token0Symbol, activePool.token1Symbol].map(sym => (
                  <div key={sym} className="bg-[#0C1220] border border-[#1A2540] focus-within:border-[#00F5D4]/30 transition-colors p-3 flex items-center gap-3">
                    <input type="number" placeholder="0.0"
                      className="flex-1 bg-transparent text-lg font-bold text-[#E8F0FF] outline-none"
                      style={{ fontFamily: "'JetBrains Mono',monospace" }} />
                    <span className="text-xs font-bold text-[#7A8BA8]" style={{ fontFamily: "'JetBrains Mono',monospace" }}>{sym}</span>
                  </div>
                ))}
              </div>

              <Link to="/add-liquidity">
                <button className="w-full py-3.5 bg-[#00F5D4] text-[#04060C] text-sm font-bold hover:brightness-110 transition-all flex items-center justify-center gap-2">
                  <Plus size={15} /> Add Liquidity
                </button>
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
