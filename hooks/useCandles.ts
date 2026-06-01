import { useState, useEffect } from 'react';
export type TimeFrame = '1m'|'5m'|'15m'|'1H'|'4H'|'1D';
export interface Candle { time: number; open: number; high: number; low: number; close: number; volume: number; }
const TF_MS: Record<TimeFrame,number> = { '1m':60000,'5m':300000,'15m':900000,'1H':3600000,'4H':14400000,'1D':86400000 };
function seedCandles(tf: TimeFrame, count=120, base=2847.5): Candle[] {
  const iv=TF_MS[tf]; const now=Math.floor(Date.now()/iv)*iv; let price=base*(0.92+Math.random()*0.08); const arr:Candle[]=[];
  for(let i=count;i>=0;i--){const o=price;const move=(Math.random()-0.492)*base*0.008;const c=Math.max(base*0.85,Math.min(base*1.15,o+move));arr.push({time:(now-i*iv)/1000,open:o,high:Math.max(o,c)+Math.random()*base*0.003,low:Math.min(o,c)-Math.random()*base*0.003,close:c,volume:200+Math.random()*2000});price=c;}
  return arr;
}
export function useCandles(tf:TimeFrame='1m', base=2847.5){
  const [candles,setCandles]=useState<Candle[]>(()=>seedCandles(tf,120,base));
  useEffect(()=>{setCandles(seedCandles(tf,120,base));},[tf,base]);
  useEffect(()=>{
    const id=setInterval(()=>{setCandles(prev=>{const last=prev[prev.length-1];const move=(Math.random()-0.492)*base*0.005;const nc=Math.max(base*0.85,Math.min(base*1.15,last.close+move));return [...prev.slice(0,-1),{...last,close:nc,high:Math.max(last.high,nc),low:Math.min(last.low,nc),volume:last.volume+Math.random()*50}];});},1200);
    return ()=>clearInterval(id);
  },[tf,base]);
  return candles;
}
