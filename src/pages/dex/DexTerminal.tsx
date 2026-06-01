import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, Settings, ArrowUpDown } from 'lucide-react';
import { useOrderBook } from '@/hooks/useOrderBook';
import { useCandles, type TimeFrame } from '@/hooks/useCandles';
import TradingChart from '@/components/charts/TradingChart';

const PAIRS = ['ETH/USDC','BTC/USDC','SOL/USDC','ARB/USDC','OP/USDC'];
const BASE_PRICES: Record<string, number> = { 'ETH/USDC':2847.5,'BTC/USDC':105400,'SOL/USDC':169.4,'ARB/USDC':0.842,'OP/USDC':1.24 };
const TIMEFRAMES: TimeFrame[] = ['1m','5m','15m','1H','4H','1D'];
const INDICATORS = ['RSI','MACD','BB','VWAP','EMA'];

interface RecentTrade { price: number; size: number; side: 'buy'|'sell'; time: string; }

function genTrades(mid: number): RecentTrade[] {
  return Array.from({length:20},(_,i)=>({
    price: parseFloat((mid + (Math.random()-0.5)*2).toFixed(2)),
    size: parseFloat((Math.random()*4+0.1).toFixed(3)),
    side: Math.random()>0.5?'buy':'sell',
    time: new Date(Date.now()-i*3000).toLocaleTimeString('en',{hour12:false}),
  }));
}

export default function DexTerminal() {
  const [activePair, setActivePair] = useState('ETH/USDC');
  const [showPairPicker, setShowPairPicker] = useState(false);
  const [tf, setTf] = useState<TimeFrame>('1m');
  const [activeIndicators, setActiveIndicators] = useState<string[]>([]);
  const [orderType, setOrderType] = useState<'limit'|'market'|'stop'>('limit');
  const [side, setSide] = useState<'buy'|'sell'>('buy');
  const [price, setPrice] = useState('');
  const [qty, setQty] = useState('');
  const [bottomTab, setBottomTab] = useState<'orders'|'positions'|'trades'|'history'>('orders');
  const [recentTrades, setRecentTrades] = useState<RecentTrade[]>([]);
  const [execState, setExecState] = useState<'idle'|'pending'|'done'>('idle');
  const [tpsl, setTpsl] = useState(false);
  const [reduceOnly, setReduceOnly] = useState(false);

  const base = BASE_PRICES[activePair] ?? 2847.5;
  const book = useOrderBook(base);
  const candles = useCandles(tf, base);

  // Initialise price input from orderbook mid
  const priceInitRef = useRef(false);
  useEffect(() => {
    if (!priceInitRef.current && book.midPrice) {
      setPrice(book.midPrice.toFixed(2));
      priceInitRef.current = true;
    }
  }, [book.midPrice]);

  // Update recent trades
  useEffect(() => {
    setRecentTrades(genTrades(book.lastPrice));
    const id = setInterval(() => {
      setRecentTrades(prev => [{
        price: parseFloat((book.lastPrice+(Math.random()-0.5)*1.5).toFixed(2)),
        size: parseFloat((Math.random()*3+0.1).toFixed(3)),
        side: Math.random()>0.5?'buy':'sell',
        time: new Date().toLocaleTimeString('en',{hour12:false}),
      }, ...prev.slice(0,19)]);
    }, 1400);
    return () => clearInterval(id);
  }, [book.lastPrice]);

  const total = parseFloat(price||'0') * parseFloat(qty||'0');
  const fee = total * 0.0002;
  const maxQty = 8241 / (parseFloat(price||'1') || 1);

  function toggleIndicator(ind: string) {
    setActiveIndicators(prev => prev.includes(ind) ? prev.filter(i=>i!==ind) : [...prev, ind]);
  }

  async function execute() {
    if (!qty || !price) return;
    setExecState('pending');
    await new Promise(r=>setTimeout(r,1400));
    setExecState('done');
    setTimeout(()=>setExecState('idle'),2500);
  }

  const priceDelta = book.lastPrice - base;
  const isUp = priceDelta >= 0;

  return (
    <div className="flex flex-col bg-[#070B14] min-h-screen" style={{fontFamily:"'JetBrains Mono',monospace"}}>

      {/* ── Terminal Header ── */}
      <div className="flex items-center gap-4 px-4 h-12 border-b border-[#1A2540] bg-[#04060C]">
        <Link to="/" className="flex items-center gap-2 mr-2 group">
          <svg width="22" height="22" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg"><circle cx="32" cy="32" r="30" fill="#050A14"/><circle cx="32" cy="32" r="29" fill="none" stroke="#00F5D4" strokeWidth="1.5" opacity="0.8"/><text x="32" y="43" textAnchor="middle" fontFamily="Arial Black,sans-serif" fontWeight="900" fontSize="31" fill="#00F5D4">N</text></svg>
          <span className="text-xs font-bold text-[#E8F0FF] group-hover:text-[#00F5D4] transition-colors tracking-widest">NAUTICA</span>
        </Link>

        {/* Pair picker */}
        <div className="relative">
          <button onClick={()=>setShowPairPicker(!showPairPicker)} className="flex items-center gap-2 px-3 py-1.5 bg-[#0C1220] border border-[#1A2540] hover:border-[#243060] transition-colors">
            <span className="text-sm font-bold text-[#E8F0FF]">{activePair}</span>
            <ChevronDown size={12} className="text-[#4A6080]"/>
          </button>
          {showPairPicker && (
            <div className="absolute top-full left-0 mt-1 bg-[#0C1220] border border-[#1A2540] z-50 min-w-[140px]">
              {PAIRS.map(p=>(
                <button key={p} onClick={()=>{setActivePair(p);setShowPairPicker(false);priceInitRef.current=false;}}
                  className={`block w-full text-left px-4 py-2 text-xs transition-colors ${p===activePair?'text-[#00F5D4] bg-[#070B14]':'text-[#7A8BA8] hover:text-[#E8F0FF] hover:bg-[#0F1828]'}`}>{p}</button>
              ))}
            </div>
          )}
        </div>

        {/* Live price */}
        <div className="flex items-center gap-3">
          <span className={`text-base font-bold ${isUp?'text-[#00E5A0]':'text-[#FF3B6B]'}`}>${book.lastPrice.toLocaleString('en',{minimumFractionDigits:2,maximumFractionDigits:2})}</span>
          <span className={`text-xs ${isUp?'text-[#00E5A0]':'text-[#FF3B6B]'}`}>{isUp?'+':''}{book.change24h.toFixed(2)}%</span>
          <span className="text-xs text-[#3A4A6A]">24H H: <span className="text-[#7A8BA8]">${book.high24h.toFixed(2)}</span></span>
          <span className="text-xs text-[#3A4A6A]">L: <span className="text-[#7A8BA8]">${book.low24h.toFixed(2)}</span></span>
          <span className="text-xs text-[#3A4A6A]">Vol: <span className="text-[#7A8BA8]">${(book.volume24h/1e6).toFixed(1)}M</span></span>
          <span className="text-xs text-[#3A4A6A]">Spread: <span className="text-[#7A8BA8]">{book.spread.toFixed(2)} ({book.spreadPct.toFixed(4)}%)</span></span>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <button className="p-1.5 text-[#4A6080] hover:text-[#00F5D4] transition-colors"><Settings size={14}/></button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden" style={{height:'calc(100vh - 48px - 130px)'}}>

        {/* ── Orderbook ── */}
        <div className="w-44 border-r border-[#1A2540] flex flex-col bg-[#070B14]">
          <div className="px-3 py-2 flex justify-between text-[9px] text-[#3A4A6A] uppercase tracking-wider border-b border-[#1A2540]">
            <span>Price</span><span>Size</span>
          </div>
          <div className="flex-1 overflow-hidden">
            {/* Asks (reversed — lowest ask at bottom) */}
            <div className="flex flex-col-reverse">
              {book.asks.slice(0,10).map((ask,i)=>(
                <div key={i} className="relative flex justify-between items-center px-3 py-[2px] hover:bg-[#0F1828] cursor-pointer group">
                  <div className="absolute inset-0 right-0 bg-[#FF3B6B] opacity-[0.08]" style={{width:`${ask.depth*100}%`,left:'auto'}}/>
                  <span className="text-[10px] text-[#FF3B6B] z-10">{ask.price.toFixed(2)}</span>
                  <span className="text-[10px] text-[#4A6080] z-10 group-hover:text-[#7A8BA8]">{ask.size.toFixed(3)}</span>
                </div>
              ))}
            </div>
            {/* Mid price */}
            <div className="flex items-center justify-between px-3 py-1 bg-[#0C1220] border-y border-[#1A2540]">
              <span className={`text-sm font-bold ${isUp?'text-[#00E5A0]':'text-[#FF3B6B]'}`}>{book.midPrice.toFixed(2)}</span>
              <ArrowUpDown size={10} className="text-[#3A4A6A]"/>
            </div>
            {/* Bids */}
            {book.bids.slice(0,10).map((bid,i)=>(
              <div key={i} className="relative flex justify-between items-center px-3 py-[2px] hover:bg-[#0F1828] cursor-pointer group">
                <div className="absolute inset-0 bg-[#00E5A0] opacity-[0.08]" style={{width:`${bid.depth*100}%`}}/>
                <span className="text-[10px] text-[#00E5A0] z-10">{bid.price.toFixed(2)}</span>
                <span className="text-[10px] text-[#4A6080] z-10 group-hover:text-[#7A8BA8]">{bid.size.toFixed(3)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Chart ── */}
        <div className="flex-1 flex flex-col min-w-0 border-r border-[#1A2540]">
          {/* Chart toolbar */}
          <div className="flex items-center gap-1 px-3 h-9 border-b border-[#1A2540]">
            {TIMEFRAMES.map(t=>(
              <button key={t} onClick={()=>setTf(t)} className={`px-2 py-0.5 text-[10px] rounded transition-colors ${tf===t?'bg-[#0C1220] text-[#00F5D4]':'text-[#4A6080] hover:text-[#7A8BA8]'}`}>{t}</button>
            ))}
            <div className="w-px h-4 bg-[#1A2540] mx-1"/>
            <button className={`px-2 py-0.5 text-[10px] rounded bg-[#0C1220] text-[#00F5D4]`}>Candles</button>
            <button className="px-2 py-0.5 text-[10px] rounded text-[#4A6080] hover:text-[#7A8BA8]">Line</button>
            <div className="w-px h-4 bg-[#1A2540] mx-1"/>
            {INDICATORS.map(ind=>(
              <button key={ind} onClick={()=>toggleIndicator(ind)} className={`px-2 py-0.5 text-[10px] rounded transition-colors ${activeIndicators.includes(ind)?'bg-[#0C1220] text-[#00F5D4]':'text-[#4A6080] hover:text-[#7A8BA8]'}`}>{ind}</button>
            ))}
            <div className="ml-auto text-[10px] text-[#3A4A6A]">Mkt Cap: <span className="text-[#4A6080]">$342.1B</span></div>
          </div>
          <div className="flex-1 min-h-0">
            <TradingChart candles={candles} height={340}/>
          </div>
        </div>

        {/* ── Order Form ── */}
        <div className="w-56 bg-[#04060C] flex flex-col">
          {/* Buy/Sell tabs */}
          <div className="flex border-b border-[#1A2540]">
            <button onClick={()=>setSide('buy')} className={`flex-1 py-2.5 text-xs font-bold transition-all ${side==='buy'?'text-[#00E5A0] border-b-2 border-[#00E5A0] bg-[#00E5A0]/5':'text-[#3A4A6A] hover:text-[#7A8BA8]'}`}>BUY</button>
            <button onClick={()=>setSide('sell')} className={`flex-1 py-2.5 text-xs font-bold transition-all ${side==='sell'?'text-[#FF3B6B] border-b-2 border-[#FF3B6B] bg-[#FF3B6B]/5':'text-[#3A4A6A] hover:text-[#7A8BA8]'}`}>SELL</button>
          </div>

          <div className="p-3 flex flex-col gap-3 flex-1 overflow-y-auto">
            {/* Order type */}
            <div className="flex gap-1">
              {(['limit','market','stop'] as const).map(t=>(
                <button key={t} onClick={()=>setOrderType(t)} className={`flex-1 py-1 text-[9px] uppercase tracking-wider rounded transition-colors ${orderType===t?'bg-[#0C1220] text-[#E8F0FF] border border-[#243060]':'text-[#3A4A6A] hover:text-[#7A8BA8] border border-transparent'}`}>{t}</button>
              ))}
            </div>

            {/* Price */}
            {orderType !== 'market' && (
              <div>
                <label className="block text-[9px] text-[#3A4A6A] uppercase tracking-wider mb-1.5">Price (USDC)</label>
                <div className="flex items-center bg-[#0C1220] border border-[#1A2540] focus-within:border-[#00F5D4]/30 px-2 py-1.5">
                  <input value={price} onChange={e=>setPrice(e.target.value)} type="number" className="flex-1 bg-transparent text-xs text-[#E8F0FF] outline-none w-full" placeholder="0.00"/>
                  <span className="text-[9px] text-[#3A4A6A] ml-1">USDC</span>
                </div>
              </div>
            )}

            {/* Qty */}
            <div>
              <label className="block text-[9px] text-[#3A4A6A] uppercase tracking-wider mb-1.5">Amount ({activePair.split('/')[0]})</label>
              <div className="flex items-center bg-[#0C1220] border border-[#1A2540] focus-within:border-[#00F5D4]/30 px-2 py-1.5">
                <input value={qty} onChange={e=>setQty(e.target.value)} type="number" className="flex-1 bg-transparent text-xs text-[#E8F0FF] outline-none w-full" placeholder="0.0000"/>
              </div>
            </div>

            {/* Pct buttons */}
            <div className="grid grid-cols-4 gap-1">
              {[0.25,0.5,0.75,1].map(pct=>(
                <button key={pct} onClick={()=>setQty((maxQty*pct).toFixed(4))} className="py-1 text-[9px] text-[#4A6080] bg-[#0C1220] border border-[#1A2540] hover:border-[#243060] hover:text-[#7A8BA8] transition-colors">{pct*100}%</button>
              ))}
            </div>

            {/* Toggles */}
            <div className="flex flex-col gap-2">
              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-[9px] text-[#4A6080]">TP / SL</span>
                <div onClick={()=>setTpsl(!tpsl)} className={`w-8 h-4 rounded-full relative transition-colors ${tpsl?'bg-[#00F5D4]/20':' bg-[#1A2540]'}`}>
                  <div className={`absolute top-0.5 w-3 h-3 rounded-full transition-all ${tpsl?'left-4 bg-[#00F5D4]':'left-0.5 bg-[#3A4A6A]'}`}/>
                </div>
              </label>
              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-[9px] text-[#4A6080]">Reduce Only</span>
                <div onClick={()=>setReduceOnly(!reduceOnly)} className={`w-8 h-4 rounded-full relative transition-colors ${reduceOnly?'bg-[#00F5D4]/20':'bg-[#1A2540]'}`}>
                  <div className={`absolute top-0.5 w-3 h-3 rounded-full transition-all ${reduceOnly?'left-4 bg-[#00F5D4]':'left-0.5 bg-[#3A4A6A]'}`}/>
                </div>
              </label>
            </div>

            <div className="border-t border-[#1A2540] pt-2 flex flex-col gap-1.5">
              <div className="flex justify-between text-[10px]"><span className="text-[#3A4A6A]">Total</span><span className="text-[#E8F0FF]">{total>0?total.toLocaleString('en',{maximumFractionDigits:2}):'-'} USDC</span></div>
              <div className="flex justify-between text-[10px]"><span className="text-[#3A4A6A]">Fee (0.02%)</span><span className="text-[#7A8BA8]">{fee>0?'$'+fee.toFixed(4):'-'}</span></div>
              <div className="flex justify-between text-[10px]"><span className="text-[#3A4A6A]">Available</span><span className="text-[#00E5A0]">8,241.00 USDC</span></div>
            </div>

            <button onClick={execute} disabled={!qty||!price||execState==='pending'}
              className={`w-full py-2.5 text-xs font-bold tracking-widest transition-all ${side==='buy'?'bg-[#00E5A0] text-[#04060C] hover:brightness-110':'bg-[#FF3B6B] text-white hover:brightness-110'} ${(!qty||!price||execState==='pending')?'opacity-50 cursor-not-allowed':''} ${execState==='done'?'opacity-80':''}`}>
              {execState==='pending'?'CONFIRMING...' : execState==='done'?'✓ ORDER PLACED' : `${side.toUpperCase()} ${activePair.split('/')[0]}`}
            </button>
          </div>
        </div>
      </div>

      {/* ── Bottom Panel ── */}
      <div className="h-[130px] border-t border-[#1A2540] flex bg-[#04060C]">
        {/* Tabs */}
        <div className="flex flex-col border-r border-[#1A2540]">
          {(['orders','positions','trades','history'] as const).map(t=>(
            <button key={t} onClick={()=>setBottomTab(t)} className={`px-4 py-2 text-[9px] uppercase tracking-wider text-left transition-colors ${bottomTab===t?'text-[#00F5D4] bg-[#070B14] border-r-2 border-[#00F5D4]':'text-[#3A4A6A] hover:text-[#7A8BA8]'}`}>{t}</button>
          ))}
        </div>

        {/* Recent trades */}
        {bottomTab==='trades' && (
          <div className="flex-1 overflow-hidden p-2">
            <div className="grid grid-cols-4 text-[9px] text-[#3A4A6A] px-2 mb-1 uppercase tracking-wider">
              <span>Price</span><span>Size</span><span>Side</span><span className="text-right">Time</span>
            </div>
            <div className="space-y-0.5 overflow-auto h-[88px]">
              {recentTrades.map((t,i)=>(
                <div key={i} className="grid grid-cols-4 text-[10px] px-2 py-0.5 hover:bg-[#070B14]">
                  <span className={t.side==='buy'?'text-[#00E5A0]':'text-[#FF3B6B]'}>{t.price.toFixed(2)}</span>
                  <span className="text-[#7A8BA8]">{t.size.toFixed(3)}</span>
                  <span className={t.side==='buy'?'text-[#00E5A0]':'text-[#FF3B6B]'}>{t.side.toUpperCase()}</span>
                  <span className="text-[#3A4A6A] text-right">{t.time}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {bottomTab==='orders' && (
          <div className="flex-1 p-4">
            <div className="grid grid-cols-6 text-[9px] text-[#3A4A6A] uppercase tracking-wider mb-2">
              <span>Pair</span><span>Type</span><span>Side</span><span>Price</span><span>Amount</span><span>Status</span>
            </div>
            <div className="text-[10px] grid grid-cols-6 text-[#7A8BA8]">
              <span>ETH/USDC</span><span>Limit</span><span className="text-[#00E5A0]">Buy</span><span>$2,800.00</span><span>1.2 ETH</span><span className="text-[#FFB347]">Open</span>
            </div>
          </div>
        )}

        {bottomTab==='positions' && (
          <div className="flex-1 p-4 flex items-center text-[10px] text-[#3A4A6A]">No open positions.</div>
        )}
        {bottomTab==='history' && (
          <div className="flex-1 p-4 flex items-center text-[10px] text-[#3A4A6A]">Connect wallet to view trade history.</div>
        )}
      </div>
    </div>
  );
}
