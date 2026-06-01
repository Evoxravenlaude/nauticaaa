import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAccount } from 'wagmi';
import { ChevronLeft, ArrowUpDown, Settings, Info, RefreshCw, AlertTriangle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { getLivePrices, getSwapQuoteV2, type SwapQuote } from '@/lib/api';

const TOKENS = [
  { symbol: 'ETH',  name: 'Ethereum',     coinId: 'ethereum',     decimals: 18, color: '#00F5D4' },
  { symbol: 'WBTC', name: 'Wrapped BTC',  coinId: 'bitcoin',      decimals: 8,  color: '#FFB347' },
  { symbol: 'SOL',  name: 'Solana',       coinId: 'solana',       decimals: 9,  color: '#9945FF' },
  { symbol: 'USDC', name: 'USD Coin',     coinId: 'usd-coin',     decimals: 6,  color: '#3B82F6' },
  { symbol: 'USDT', name: 'Tether',       coinId: 'tether',       decimals: 6,  color: '#26A17B' },
  { symbol: 'LINK', name: 'Chainlink',    coinId: 'chainlink',    decimals: 18, color: '#2A5ADA' },
  { symbol: 'ARB',  name: 'Arbitrum',     coinId: 'arbitrum',     decimals: 18, color: '#28A0F0' },
  { symbol: 'UNI',  name: 'Uniswap',      coinId: 'uniswap',      decimals: 18, color: '#FF007A' },
];

const SLIPPAGE_OPTIONS = ['0.1', '0.5', '1.0'];

function TokenSelector({ selected, onSelect, exclude }: {
  selected: typeof TOKENS[0];
  onSelect: (t: typeof TOKENS[0]) => void;
  exclude: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-2 bg-[#070B14] border border-[#1A2540] hover:border-[#243060] transition-colors min-w-[100px]">
        <div className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black" style={{ background: `${selected.color}20`, color: selected.color }}>{selected.symbol[0]}</div>
        <span className="text-sm font-bold text-[#E8F0FF]" style={{ fontFamily: "'JetBrains Mono',monospace" }}>{selected.symbol}</span>
        <span className="text-[#3A4A6A] text-xs">▾</span>
      </button>
      {open && (
        <div className="absolute top-full right-0 mt-1 bg-[#0C1220] border border-[#1A2540] z-50 w-52 shadow-xl">
          {TOKENS.filter(t => t.symbol !== exclude).map(t => (
            <button key={t.symbol} onClick={() => { onSelect(t); setOpen(false); }}
              className={`flex items-center gap-3 w-full px-4 py-2.5 text-left hover:bg-[#0F1828] transition-colors ${t.symbol === selected.symbol ? 'bg-[#0F1828]' : ''}`}>
              <div className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-black" style={{ background: `${t.color}20`, color: t.color }}>{t.symbol[0]}</div>
              <div>
                <div className="text-xs font-bold text-[#E8F0FF]" style={{ fontFamily: "'JetBrains Mono',monospace" }}>{t.symbol}</div>
                <div className="text-[10px] text-[#3A4A6A]">{t.name}</div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Swap() {
  const { address, isConnected } = useAccount();
  const [fromToken, setFromToken] = useState(TOKENS[0]); // ETH
  const [toToken, setToToken] = useState(TOKENS[3]);     // USDC
  const [fromAmount, setFromAmount] = useState('');
  const [slippage, setSlippage] = useState('0.5');
  const [customSlippage, setCustomSlippage] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [quote, setQuote] = useState<SwapQuote | null>(null);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [quoteError, setQuoteError] = useState('');
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const { data: prices } = useQuery({ queryKey: ['prices'], queryFn: getLivePrices, staleTime: 30_000 });

  const fromPrice = prices?.[fromToken.coinId]?.usd ?? 0;
  const toPrice = prices?.[toToken.coinId]?.usd ?? 0;
  const fromUsd = parseFloat(fromAmount || '0') * fromPrice;

  const activeSlippage = customSlippage || slippage;

  const fetchQuote = useCallback(async () => {
    const amt = parseFloat(fromAmount);
    if (!amt || amt <= 0 || !fromPrice) return;
    setQuoteLoading(true);
    setQuoteError('');
    try {
      // Convert to base units (18 decimals for ETH)
      const sellAmount = BigInt(Math.floor(amt * 10 ** fromToken.decimals)).toString();
      const q = await getSwapQuoteV2({
        sellToken: fromToken.symbol === 'ETH' ? 'ETH' : fromToken.symbol,
        buyToken: toToken.symbol === 'ETH' ? 'ETH' : toToken.symbol,
        sellAmount,
        slippagePercentage: (parseFloat(activeSlippage) / 100).toString(),
        takerAddress: address,
      });
      if (q) {
        setQuote(q);
        setLastUpdated(new Date());
      } else {
        // Fallback: price-ratio estimate
        setQuote(null);
        setQuoteError('');
      }
    } catch {
      setQuoteError('Quote unavailable');
    } finally {
      setQuoteLoading(false);
    }
  }, [fromAmount, fromToken, toToken, activeSlippage, address, fromPrice]);

  // Debounce fetch
  useEffect(() => {
    const t = setTimeout(fetchQuote, 800);
    return () => clearTimeout(t);
  }, [fetchQuote]);

  // Derive toAmount
  const toAmountRaw = quote
    ? (parseInt(quote.buyAmount) / 10 ** toToken.decimals).toFixed(6)
    : fromPrice && toPrice && fromAmount
      ? ((parseFloat(fromAmount) * fromPrice) / toPrice).toFixed(6)
      : '';

  const priceImpact = quote ? parseFloat(quote.estimatedPriceImpact ?? '0') : 0;
  const impactColor = priceImpact > 5 ? 'text-rose-400' : priceImpact > 1 ? 'text-amber-400' : 'text-emerald-400';
  const rate = fromPrice && toPrice ? (fromPrice / toPrice).toFixed(6) : '—';

  function flip() {
    setFromToken(toToken);
    setToToken(fromToken);
    setFromAmount(toAmountRaw);
    setQuote(null);
  }

  const canSwap = isConnected && parseFloat(fromAmount || '0') > 0;

  return (
    <div className="min-h-screen bg-[#04060C] flex items-start justify-center px-4 py-10" style={{ fontFamily: "'Inter',sans-serif" }}>
      <div className="w-full max-w-lg">

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Link to="/wallet-home" className="text-[#4A6080] hover:text-[#E8F0FF] transition-colors"><ChevronLeft size={18} /></Link>
          <h1 className="font-bold text-lg text-[#E8F0FF]">Swap</h1>
          <div className="ml-auto flex items-center gap-2">
            {lastUpdated && (
              <span className="text-[10px] text-[#3A4A6A]" style={{ fontFamily: "'JetBrains Mono',monospace" }}>
                Updated {lastUpdated.toLocaleTimeString()}
              </span>
            )}
            <button onClick={fetchQuote} className="p-1.5 text-[#4A6080] hover:text-[#00F5D4] transition-colors">
              <RefreshCw size={14} className={quoteLoading ? 'animate-spin' : ''} />
            </button>
            <button onClick={() => setShowSettings(!showSettings)} className="p-1.5 text-[#4A6080] hover:text-[#00F5D4] transition-colors">
              <Settings size={14} />
            </button>
          </div>
        </div>

        {/* Settings panel */}
        {showSettings && (
          <div className="bg-[#0C1220] border border-[#1A2540] p-4 mb-4">
            <div className="text-[10px] text-[#3A4A6A] uppercase tracking-wider mb-3" style={{ fontFamily: "'JetBrains Mono',monospace" }}>Slippage Tolerance</div>
            <div className="flex gap-2 items-center">
              {SLIPPAGE_OPTIONS.map(s => (
                <button key={s} onClick={() => { setSlippage(s); setCustomSlippage(''); }}
                  className={`px-3 py-1.5 text-xs border transition-colors ${slippage === s && !customSlippage ? 'border-[#00F5D4]/40 text-[#00F5D4] bg-[#00F5D4]/5' : 'border-[#1A2540] text-[#4A6080] hover:text-[#7A8BA8]'}`}
                  style={{ fontFamily: "'JetBrains Mono',monospace" }}>{s}%</button>
              ))}
              <div className="flex items-center bg-[#070B14] border border-[#1A2540] focus-within:border-[#00F5D4]/30 px-2 py-1.5 flex-1">
                <input value={customSlippage} onChange={e => setCustomSlippage(e.target.value)} placeholder="Custom"
                  className="w-full bg-transparent text-xs text-[#E8F0FF] outline-none" style={{ fontFamily: "'JetBrains Mono',monospace" }} />
                <span className="text-[10px] text-[#3A4A6A]">%</span>
              </div>
            </div>
            {parseFloat(activeSlippage) > 3 && (
              <div className="flex items-center gap-1.5 mt-2 text-[10px] text-amber-400" style={{ fontFamily: "'JetBrains Mono',monospace" }}>
                <AlertTriangle size={10} /> High slippage — transaction may be frontrun
              </div>
            )}
          </div>
        )}

        {/* From box */}
        <div className="bg-[#0C1220] border border-[#1A2540] focus-within:border-[#00F5D4]/20 transition-colors p-4 mb-1">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] text-[#3A4A6A] uppercase tracking-wider" style={{ fontFamily: "'JetBrains Mono',monospace" }}>From</span>
            {isConnected && <span className="text-[10px] text-[#4A6080] cursor-pointer hover:text-[#00F5D4]" style={{ fontFamily: "'JetBrains Mono',monospace" }}>Max</span>}
          </div>
          <div className="flex items-center gap-3">
            <input value={fromAmount} onChange={e => setFromAmount(e.target.value)} type="number" placeholder="0.0"
              className="flex-1 bg-transparent text-3xl font-black text-[#E8F0FF] outline-none min-w-0"
              style={{ fontFamily: "'JetBrains Mono',monospace" }} />
            <TokenSelector selected={fromToken} onSelect={setFromToken} exclude={toToken.symbol} />
          </div>
          <div className="flex justify-between mt-2 text-[11px]" style={{ fontFamily: "'JetBrains Mono',monospace" }}>
            <span className="text-[#3A4A6A]">{fromUsd > 0 ? `≈ $${fromUsd.toLocaleString('en', { maximumFractionDigits: 2 })}` : ''}</span>
            <span className="text-[#3A4A6A]">1 {fromToken.symbol} = ${fromPrice.toLocaleString()}</span>
          </div>
        </div>

        {/* Flip button */}
        <div className="flex justify-center -my-0.5 relative z-10">
          <button onClick={flip} className="p-2 bg-[#0C1220] border border-[#1A2540] hover:border-[#00F5D4]/40 text-[#4A6080] hover:text-[#00F5D4] transition-all hover:rotate-180 duration-200">
            <ArrowUpDown size={16} />
          </button>
        </div>

        {/* To box */}
        <div className="bg-[#0C1220] border border-[#1A2540] p-4 mb-4 mt-1">
          <div className="text-[10px] text-[#3A4A6A] uppercase tracking-wider mb-2" style={{ fontFamily: "'JetBrains Mono',monospace" }}>To</div>
          <div className="flex items-center gap-3">
            <div className="flex-1 text-3xl font-black text-[#E8F0FF] min-w-0 truncate" style={{ fontFamily: "'JetBrains Mono',monospace" }}>
              {quoteLoading ? <span className="text-[#3A4A6A] text-lg animate-pulse">Fetching quote...</span> : toAmountRaw || '0.0'}
            </div>
            <TokenSelector selected={toToken} onSelect={setToToken} exclude={fromToken.symbol} />
          </div>
          <div className="mt-2 text-[11px] text-[#3A4A6A]" style={{ fontFamily: "'JetBrains Mono',monospace" }}>
            {toAmountRaw && toPrice ? `≈ $${(parseFloat(toAmountRaw) * toPrice).toLocaleString('en', { maximumFractionDigits: 2 })}` : ''}
          </div>
        </div>

        {/* Quote details */}
        {(quote || (fromAmount && parseFloat(fromAmount) > 0)) && (
          <div className="bg-[#0C1220] border border-[#1A2540] p-4 mb-4 space-y-2.5">
            <div className="flex justify-between text-[11px]" style={{ fontFamily: "'JetBrains Mono',monospace" }}>
              <span className="text-[#3A4A6A]">Rate</span>
              <span className="text-[#E8F0FF]">1 {fromToken.symbol} = {rate} {toToken.symbol}</span>
            </div>
            <div className="flex justify-between text-[11px]" style={{ fontFamily: "'JetBrains Mono',monospace" }}>
              <span className="text-[#3A4A6A]">Price Impact</span>
              <span className={impactColor}>{priceImpact > 0 ? `${priceImpact.toFixed(2)}%` : '< 0.01%'}</span>
            </div>
            <div className="flex justify-between text-[11px]" style={{ fontFamily: "'JetBrains Mono',monospace" }}>
              <span className="text-[#3A4A6A]">Slippage</span>
              <span className="text-[#7A8BA8]">{activeSlippage}%</span>
            </div>
            <div className="flex justify-between text-[11px]" style={{ fontFamily: "'JetBrains Mono',monospace" }}>
              <span className="text-[#3A4A6A]">Network fee</span>
              <span className="text-[#7A8BA8]">~$2.40</span>
            </div>
            {quote && (
              <div>
                <div className="text-[9px] text-[#3A4A6A] uppercase tracking-wider mb-1.5" style={{ fontFamily: "'JetBrains Mono',monospace" }}>Routing</div>
                <div className="flex flex-wrap gap-1.5">
                  {quote.sources.filter(s => parseFloat(s.proportion) > 0).map(s => (
                    <div key={s.name} className="flex items-center gap-1 px-2 py-0.5 bg-[#070B14] border border-[#1A2540] text-[9px]" style={{ fontFamily: "'JetBrains Mono',monospace" }}>
                      <span className="text-[#7A8BA8]">{s.name}</span>
                      <span className="text-[#00F5D4]">{(parseFloat(s.proportion) * 100).toFixed(0)}%</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {quoteError && (
          <div className="flex items-center gap-2 px-3 py-2.5 bg-rose-400/5 border border-rose-400/20 mb-4 text-[11px] text-rose-400" style={{ fontFamily: "'JetBrains Mono',monospace" }}>
            <Info size={12} /> {quoteError} — showing estimated price
          </div>
        )}

        {!isConnected ? (
          <button className="w-full py-4 bg-[#0C1220] border border-[#1A2540] text-sm text-[#7A8BA8] font-bold cursor-not-allowed">
            Connect Wallet to Swap
          </button>
        ) : (
          <Link to="/swap-review" state={{ fromToken: fromToken.symbol, toToken: toToken.symbol, fromAmount, toAmount: toAmountRaw, rate, slippage: activeSlippage, quote }}>
            <button disabled={!canSwap}
              className="w-full py-4 text-sm font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ background: canSwap ? '#00F5D4' : '#0C1220', color: canSwap ? '#04060C' : '#3A4A6A' }}>
              {canSwap ? `Review Swap` : 'Enter an amount'}
            </button>
          </Link>
        )}
      </div>
    </div>
  );
}
