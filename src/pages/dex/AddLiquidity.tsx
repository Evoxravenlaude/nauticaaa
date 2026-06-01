import { useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, Plus, Info, TrendingUp, AlertTriangle } from 'lucide-react';
import { useAccount } from 'wagmi';
import { useQuery } from '@tanstack/react-query';
import { fetchPools } from '@/lib/api';

const FEE_TIERS = [
  { bps:100,  label:'0.01%', desc:'Best for stable pairs like USDC/USDT' },
  { bps:500,  label:'0.05%', desc:'Best for stable-ish pairs like ETH/stETH' },
  { bps:3000, label:'0.30%', desc:'Most pairs — best fee/volume balance' },
  { bps:10000,label:'1.00%', desc:'Exotic / high-volatility pairs' },
];

const TOKENS = ['ETH','USDC','USDT','WBTC','DAI','LINK','ARB','UNI'];

export default function AddLiquidity() {
  const { isConnected } = useAccount();
  const [token0, setToken0] = useState('ETH');
  const [token1, setToken1] = useState('USDC');
  const [feeTier, setFeeTier] = useState(3000);
  const [amount0, setAmount0] = useState('');
  const [amount1, setAmount1] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [fullRange, setFullRange] = useState(false);
  const [step, setStep] = useState<1|2|3>(1);

  const { data: pools = [] } = useQuery({ queryKey:['pools'], queryFn: fetchPools, staleTime:30_000 });
  const matchedPool = pools.find(p =>
    (p.token0Symbol===token0 && p.token1Symbol===token1 ||
     p.token0Symbol===token1 && p.token1Symbol===token0) &&
    p.feeTier === feeTier
  );

  const estimatedApr = matchedPool?.apr ?? 0;

  const handleAmount0 = useCallback((val: string) => {
    setAmount0(val);
    // Rough 1:2847 ETH:USDC ratio estimate
    if (token0==='ETH' && token1==='USDC' && val) {
      setAmount1((parseFloat(val) * 2847.5).toFixed(2));
    }
  }, [token0, token1]);

  return (
    <div className="min-h-screen bg-[#04060C]" style={{ fontFamily:"'Inter',sans-serif" }}>
      <div className="border-b border-[#1A2540] px-5 py-3 flex items-center gap-3 bg-[#070B14]">
        <Link to="/pools" className="text-[#4A6080] hover:text-[#E8F0FF] transition-colors"><ChevronLeft size={18}/></Link>
        <span className="font-semibold text-[#E8F0FF]">Add Liquidity</span>
        <span className="text-[10px] text-[#3A4A6A] font-mono ml-1">Uniswap V3</span>
      </div>

      <div className="max-w-lg mx-auto px-4 py-8 space-y-5">

        {/* Step indicator */}
        <div className="flex items-center gap-2">
          {[1,2,3].map(s => (
            <div key={s} className="flex items-center gap-2">
              <div onClick={()=>setStep(s as 1|2|3)}
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold cursor-pointer transition-all ${step===s?'bg-[#00F5D4] text-[#04060C]':step>s?'bg-emerald-400 text-[#04060C]':'bg-[#1A2540] text-[#3A4A6A]'}`}>
                {s}
              </div>
              {s < 3 && <div className={`flex-1 h-px w-12 ${step>s?'bg-emerald-400':'bg-[#1A2540]'}`}/>}
            </div>
          ))}
          <span className="ml-2 text-xs text-[#4A6080] font-mono">
            {step===1?'Select pair':step===2?'Set range':'Deposit'}
          </span>
        </div>

        {/* Step 1: Token pair + fee */}
        {step === 1 && (
          <>
            <div>
              <label className="block text-[10px] text-[#3A4A6A] uppercase tracking-wider font-mono mb-2">Token Pair</label>
              <div className="flex gap-3">
                {[{val:token0,set:setToken0},{val:token1,set:setToken1}].map(({val,set},i)=>(
                  <select key={i} value={val} onChange={e=>set(e.target.value)}
                    className="flex-1 bg-[#0C1220] border border-[#1A2540] focus:border-[#00F5D4]/30 px-3 py-3 text-sm font-bold text-[#E8F0FF] outline-none font-mono cursor-pointer">
                    {TOKENS.filter(t=>i===0?t!==token1:t!==token0).map(t=><option key={t}>{t}</option>)}
                  </select>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-[10px] text-[#3A4A6A] uppercase tracking-wider font-mono mb-2">Fee Tier</label>
              <div className="grid grid-cols-2 gap-2">
                {FEE_TIERS.map(ft=>(
                  <button key={ft.bps} onClick={()=>setFeeTier(ft.bps)}
                    className={`p-3 border text-left transition-all ${feeTier===ft.bps?'border-[#00F5D4]/40 bg-[#00F5D4]/5':'border-[#1A2540] hover:border-[#243060]'}`}>
                    <div className="text-sm font-bold text-[#E8F0FF] font-mono">{ft.label}</div>
                    <div className="text-[10px] text-[#4A6080] mt-0.5">{ft.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {matchedPool && (
              <div className="bg-emerald-400/5 border border-emerald-400/20 p-4 flex items-center gap-3">
                <TrendingUp size={14} className="text-emerald-400 flex-shrink-0"/>
                <div className="text-xs text-[#7A8BA8]">
                  Active pool found · <span className="text-emerald-400 font-bold">{estimatedApr.toFixed(1)}% APR</span> · TVL ${(matchedPool.tvlUsd/1e6).toFixed(1)}M
                </div>
              </div>
            )}

            <button onClick={()=>setStep(2)} disabled={token0===token1}
              className="w-full py-3.5 bg-[#00F5D4] text-[#04060C] text-sm font-bold hover:brightness-110 transition-all disabled:opacity-40">
              Continue →
            </button>
          </>
        )}

        {/* Step 2: Price range */}
        {step === 2 && (
          <>
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold text-[#E8F0FF]">Set Price Range</div>
              <label className="flex items-center gap-2 cursor-pointer">
                <span className="text-xs text-[#4A6080] font-mono">Full Range</span>
                <div onClick={()=>setFullRange(!fullRange)} className={`w-10 h-5 rounded-full relative transition-colors ${fullRange?'bg-[#00F5D4]/30':'bg-[#1A2540]'}`}>
                  <div className={`absolute top-0.5 w-4 h-4 rounded-full transition-all ${fullRange?'left-5 bg-[#00F5D4]':'left-0.5 bg-[#4A6080]'}`}/>
                </div>
              </label>
            </div>

            {!fullRange && (
              <div className="grid grid-cols-2 gap-3">
                {[{label:'Min Price',val:minPrice,set:setMinPrice},{label:'Max Price',val:maxPrice,set:setMaxPrice}].map(({label,val,set})=>(
                  <div key={label}>
                    <label className="block text-[10px] text-[#3A4A6A] font-mono mb-1.5">{label} ({token1}/{token0})</label>
                    <input value={val} onChange={e=>set(e.target.value)} type="number" placeholder="0.00"
                      className="w-full bg-[#0C1220] border border-[#1A2540] focus:border-[#00F5D4]/30 px-3 py-2.5 text-sm font-mono text-[#E8F0FF] outline-none"/>
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-2">
              {['±1%','±5%','±10%','Full'].map(p=>(
                <button key={p} onClick={()=>{
                  if(p==='Full'){setFullRange(true);}
                  else{setFullRange(false);const pct=parseFloat(p)/100;setMinPrice((2847.5*(1-pct)).toFixed(2));setMaxPrice((2847.5*(1+pct)).toFixed(2));}
                }} className="flex-1 py-1.5 text-[10px] font-mono border border-[#1A2540] text-[#4A6080] hover:border-[#243060] hover:text-[#7A8BA8] transition-all">{p}</button>
              ))}
            </div>

            {!fullRange && (!minPrice || !maxPrice) && (
              <div className="flex items-center gap-2 text-[11px] text-amber-400 font-mono">
                <AlertTriangle size={12}/> Set both min and max price to continue
              </div>
            )}

            <div className="flex gap-3">
              <button onClick={()=>setStep(1)} className="flex-1 py-3 border border-[#1A2540] text-[#7A8BA8] text-sm font-bold hover:border-[#243060] transition-all">← Back</button>
              <button onClick={()=>setStep(3)} disabled={!fullRange&&(!minPrice||!maxPrice)}
                className="flex-1 py-3 bg-[#00F5D4] text-[#04060C] text-sm font-bold hover:brightness-110 transition-all disabled:opacity-40">Continue →</button>
            </div>
          </>
        )}

        {/* Step 3: Deposit amounts */}
        {step === 3 && (
          <>
            <div className="space-y-3">
              {[{sym:token0,val:amount0,set:handleAmount0},{sym:token1,val:amount1,set:setAmount1}].map(({sym,val,set})=>(
                <div key={sym} className="bg-[#0C1220] border border-[#1A2540] focus-within:border-[#00F5D4]/30 p-4 transition-colors">
                  <div className="text-[10px] text-[#3A4A6A] font-mono mb-2">{sym} Amount</div>
                  <div className="flex items-center gap-3">
                    <input value={val} onChange={e=>set(e.target.value)} type="number" placeholder="0.0"
                      className="flex-1 bg-transparent text-2xl font-bold text-[#E8F0FF] outline-none font-mono"/>
                    <span className="text-sm font-bold text-[#7A8BA8] font-mono">{sym}</span>
                  </div>
                </div>
              ))}
            </div>

            {estimatedApr > 0 && (
              <div className="bg-[#0C1220] border border-[#1A2540] p-4 space-y-2">
                <div className="text-[10px] text-[#3A4A6A] uppercase tracking-wider font-mono mb-2">Position Summary</div>
                {[
                  {label:'Pool APR',    val:`${estimatedApr.toFixed(1)}%`,        color:'text-emerald-400'},
                  {label:'Fee Tier',    val:`${FEE_TIERS.find(f=>f.bps===feeTier)?.label}`, color:'text-[#00F5D4]'},
                  {label:'Price Range', val:fullRange?'Full range':`${minPrice||'?'} – ${maxPrice||'?'}`, color:'text-[#E8F0FF]'},
                ].map(r=>(
                  <div key={r.label} className="flex justify-between text-sm font-mono">
                    <span className="text-[#3A4A6A]">{r.label}</span>
                    <span className={r.color}>{r.val}</span>
                  </div>
                ))}
              </div>
            )}

            <div className="flex items-start gap-2 text-[11px] text-[#4A6080] font-mono">
              <Info size={11} className="mt-0.5 flex-shrink-0"/>
              By adding liquidity you'll earn {FEE_TIERS.find(f=>f.bps===feeTier)?.label} of all trades on this pair proportional to your share. Positions are represented as NFTs.
            </div>

            <div className="flex gap-3">
              <button onClick={()=>setStep(2)} className="flex-1 py-3 border border-[#1A2540] text-[#7A8BA8] text-sm font-bold hover:border-[#243060] transition-all">← Back</button>
              {!isConnected ? (
                <button className="flex-1 py-3 bg-[#0C1220] border border-[#1A2540] text-[#3A4A6A] text-sm font-bold cursor-not-allowed">Connect Wallet</button>
              ) : (
                <button className="flex-1 py-3 flex items-center justify-center gap-2 bg-[#00F5D4] text-[#04060C] text-sm font-bold hover:brightness-110 transition-all">
                  <Plus size={15}/> Add Liquidity
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
