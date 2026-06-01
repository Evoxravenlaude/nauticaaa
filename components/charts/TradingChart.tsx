import { useEffect, useRef, memo } from 'react';
import type { Candle } from '@/hooks/useCandles';

// lightweight-charts v5 API:
//   chart.addSeries(CandlestickSeries, opts)  (was addCandlestickSeries)
//   chart.addSeries(HistogramSeries, opts)    (was addHistogramSeries)
//   background requires ColorType enum value  (not string literal)

interface Props { candles: Candle[]; height?: number; }

const TradingChart = memo(function TradingChart({ candles, height = 340 }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const refs = useRef<{ chart: any; cs: any; vs: any }>({ chart: null, cs: null, vs: null });

  useEffect(() => {
    if (!containerRef.current) return;
    let active = true;

    import('lightweight-charts').then((lc) => {
      if (!active || !containerRef.current) return;

      const chart = lc.createChart(containerRef.current, {
        width: containerRef.current.clientWidth,
        height,
        layout: {
          background: { type: lc.ColorType.Solid, color: '#070B14' },
          textColor: '#4A6080',
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 10,
        },
        grid: {
          vertLines: { color: '#0F1A2E' },
          horzLines: { color: '#0F1A2E' },
        },
        crosshair: {
          mode: 1,
          vertLine: { color: '#00F5D4', width: 1, style: 2, labelBackgroundColor: '#00F5D4' },
          horzLine: { color: '#00F5D4', width: 1, style: 2, labelBackgroundColor: '#00F5D4' },
        },
        rightPriceScale: {
          borderColor: '#1A2540',
          textColor: '#4A6080',
          scaleMargins: { top: 0.05, bottom: 0.25 },
        },
        timeScale: { borderColor: '#1A2540', timeVisible: true, secondsVisible: false },
      });

      // v5: addSeries(SeriesType, options)
      const cs = chart.addSeries(lc.CandlestickSeries, {
        upColor: '#00E5A0', downColor: '#FF3B6B',
        borderUpColor: '#00E5A0', borderDownColor: '#FF3B6B',
        wickUpColor: '#00E5A0', wickDownColor: '#FF3B6B',
      });

      const vs = chart.addSeries(lc.HistogramSeries, {
        priceFormat: { type: 'volume' as const },
        priceScaleId: 'vol',
      });
      chart.priceScale('vol').applyOptions({ scaleMargins: { top: 0.8, bottom: 0 } });

      refs.current = { chart, cs, vs };

      const ro = new ResizeObserver(() => {
        if (containerRef.current) chart.applyOptions({ width: containerRef.current.clientWidth });
      });
      ro.observe(containerRef.current);
      (containerRef.current as HTMLDivElement & { _ro?: ResizeObserver })._ro = ro;
    });

    return () => {
      active = false;
      const el = containerRef.current as (HTMLDivElement & { _ro?: ResizeObserver }) | null;
      el?._ro?.disconnect();
      refs.current.chart?.remove();
      refs.current = { chart: null, cs: null, vs: null };
    };
  }, [height]);

  useEffect(() => {
    const { cs, vs, chart } = refs.current;
    if (!cs || !vs || !candles.length) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    cs.setData(candles.map((c: Candle) => ({ time: c.time as any, open: c.open, high: c.high, low: c.low, close: c.close })));
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vs.setData(candles.map((c: Candle) => ({ time: c.time as any, value: c.volume, color: c.close >= c.open ? 'rgba(0,229,160,0.2)' : 'rgba(255,59,107,0.2)' })));
    chart?.timeScale().fitContent();
  }, [candles]);

  return <div ref={containerRef} style={{ width: '100%', height }} />;
});

export default TradingChart;
