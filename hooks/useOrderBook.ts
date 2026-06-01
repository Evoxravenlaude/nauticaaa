import { useState, useEffect, useRef } from 'react';

export interface OrderBookEntry { price: number; size: number; total: number; depth: number; }
export interface OrderBook { asks: OrderBookEntry[]; bids: OrderBookEntry[]; spread: number; spreadPct: number; midPrice: number; lastPrice: number; change24h: number; volume24h: number; high24h: number; low24h: number; }

function buildSide(mid: number, isAsk: boolean, levels = 12): OrderBookEntry[] {
  const entries: OrderBookEntry[] = [];
  let runningTotal = 0;
  for (let i = 0; i < levels; i++) {
    const offset = isAsk ? (i+1)*0.20+Math.random()*0.30 : -(i+1)*0.20-Math.random()*0.30;
    const price = parseFloat((mid+offset).toFixed(2));
    const size = parseFloat((Math.random()*8+0.1).toFixed(3));
    runningTotal += size;
    entries.push({ price, size, total: runningTotal, depth: 0 });
  }
  const max = entries[entries.length-1].total;
  return entries.map((e) => ({ ...e, depth: e.total/max }));
}

export function useOrderBook(basePrice = 2847.5) {
  const [book, setBook] = useState<OrderBook>(() => {
    const asks = buildSide(basePrice, true);
    const bids = buildSide(basePrice, false).reverse();
    const spread = asks[0].price - bids[0].price;
    return { asks, bids, spread: parseFloat(spread.toFixed(2)), spreadPct: parseFloat(((spread/basePrice)*100).toFixed(4)), midPrice: basePrice, lastPrice: basePrice, change24h: 2.14, volume24h: 142800000, high24h: basePrice*1.019, low24h: basePrice*0.982 };
  });
  const midRef = useRef(basePrice);
  useEffect(() => {
    const tick = setInterval(() => {
      midRef.current += (Math.random()-0.499)*1.2;
      midRef.current = Math.max(basePrice*0.97, Math.min(basePrice*1.03, midRef.current));
      const mid = parseFloat(midRef.current.toFixed(2));
      const asks = buildSide(mid, true);
      const bids = buildSide(mid, false).reverse();
      const spread = asks[0].price - bids[0].price;
      setBook((prev) => ({ asks, bids, spread: parseFloat(spread.toFixed(2)), spreadPct: parseFloat(((spread/mid)*100).toFixed(4)), midPrice: mid, lastPrice: mid, change24h: prev.change24h, volume24h: prev.volume24h+Math.random()*5000, high24h: Math.max(prev.high24h, mid), low24h: Math.min(prev.low24h, mid) }));
    }, 600);
    return () => clearInterval(tick);
  }, [basePrice]);
  return book;
}
