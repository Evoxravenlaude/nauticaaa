import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ChevronLeft, ArrowRight, Check, Loader2, ExternalLink, AlertTriangle } from 'lucide-react';
import { useSendTransaction, useWaitForTransactionReceipt } from 'wagmi';
import { useToast } from '@/components/ui/Toast';
import type { SwapQuote } from '@/lib/api';

export default function SwapReview() {
  const location = useLocation();
  const navigate = useNavigate();
  
  const { toast, updateToast } = useToast();
  const [submitted, setSubmitted] = useState(false);

  const {
    fromToken, toToken, fromAmount, toAmount,
    rate, slippage, quote,
  } = (location.state ?? {}) as {
    fromToken?: string; toToken?: string;
    fromAmount?: string; toAmount?: string;
    rate?: string; slippage?: string;
    quote?: SwapQuote;
  };

  const { sendTransactionAsync } = useSendTransaction();
  const [txHash, setTxHash] = useState<`0x${string}` | undefined>();

  const { isLoading: waitingForReceipt, isSuccess } = useWaitForTransactionReceipt({
    hash: txHash,
    query: { enabled: !!txHash },
  });

  // Redirect if navigated to directly without state
  if (!fromToken || !toToken || !fromAmount) {
    return (
      <div className="min-h-screen bg-[#04060C] flex flex-col items-center justify-center gap-4">
        <p className="text-[#7A8BA8] text-sm">No swap data — go back and try again.</p>
        <Link to="/swap" className="text-[#00F5D4] text-xs" style={{ fontFamily: "'JetBrains Mono',monospace" }}>← Back to Swap</Link>
      </div>
    );
  }

  const minReceived = toAmount
    ? (parseFloat(toAmount) * (1 - parseFloat(slippage ?? '0.5') / 100)).toFixed(6)
    : '—';

  const priceImpact = parseFloat(quote?.estimatedPriceImpact ?? '0');
  const highImpact = priceImpact > 5;

  async function confirmSwap() {
    if (!quote?.to || !quote?.data) {
      // No calldata — show informational toast
      toast({ type: 'info', title: 'Quote expired', description: 'Please go back and refresh the quote.' });
      return;
    }

    let toastId = '';
    try {
      setSubmitted(true);
      toastId = toast({
        type: 'pending',
        title: 'Awaiting wallet confirmation',
        description: `Swap ${fromAmount} ${fromToken} → ${toAmount} ${toToken}`,
      });

      const hash = await sendTransactionAsync({
        to: quote.to as `0x${string}`,
        data: quote.data as `0x${string}`,
        value: BigInt(quote.value ?? '0'),
        gas: BigInt(Math.ceil(parseInt(quote.gas ?? '200000') * 1.2)),
      });

      setTxHash(hash);
      updateToast(toastId, {
        type: 'pending',
        title: 'Transaction submitted',
        description: 'Waiting for confirmation…',
        txHash: hash,
      });
    } catch (err: unknown) {
      setSubmitted(false);
      const msg = err instanceof Error ? err.message : 'Transaction rejected';
      if (toastId) updateToast(toastId, { type: 'error', title: 'Swap failed', description: msg.slice(0, 80) });
      else toast({ type: 'error', title: 'Swap failed', description: msg.slice(0, 80) });
    }
  }

  // Success state — show after receipt confirmed
  if (isSuccess && txHash) {
    return (
      <div className="min-h-screen bg-[#04060C] flex flex-col items-center justify-center px-6 text-center">
        <div className="w-20 h-20 rounded-full bg-emerald-400/10 flex items-center justify-center mb-6">
          <Check size={36} className="text-emerald-400" />
        </div>
        <h1 className="text-2xl font-bold text-[#E8F0FF] mb-2">Swap Complete</h1>
        <p className="text-sm text-[#4A6080] mb-2">
          Swapped {fromAmount} {fromToken} → {toAmount} {toToken}
        </p>
        <a href={`https://etherscan.io/tx/${txHash}`} target="_blank" rel="noreferrer"
          className="flex items-center gap-1 text-xs text-[#00F5D4] hover:opacity-80 mb-10"
          style={{ fontFamily: "'JetBrains Mono',monospace" }}>
          {txHash.slice(0, 18)}…{txHash.slice(-6)} <ExternalLink size={11} />
        </a>
        <div className="flex gap-3">
          <button onClick={() => navigate('/swap')} className="px-6 py-3 bg-[#00F5D4] text-[#04060C] text-sm font-bold hover:brightness-110 transition-all">New Swap</button>
          <Link to="/wallet-home" className="px-6 py-3 border border-[#1A2540] text-[#7A8BA8] text-sm font-bold hover:border-[#243060] transition-all">Portfolio</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#04060C] px-4 py-10" style={{ fontFamily: "'Inter',sans-serif" }}>
      <div className="max-w-lg mx-auto">

        <div className="flex items-center gap-3 mb-8">
          <Link to="/swap" className="text-[#4A6080] hover:text-[#E8F0FF] transition-colors"><ChevronLeft size={18} /></Link>
          <h1 className="text-lg font-bold text-[#E8F0FF]">Confirm Swap</h1>
        </div>

        {/* Swap summary */}
        <div className="bg-[#0C1220] border border-[#1A2540] p-6 mb-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="text-3xl font-black text-[#E8F0FF]" style={{ fontFamily: "'JetBrains Mono',monospace" }}>{fromAmount}</div>
              <div className="text-sm text-[#4A6080] mt-1" style={{ fontFamily: "'JetBrains Mono',monospace" }}>{fromToken}</div>
            </div>
            <ArrowRight size={20} className="text-[#3A4A6A] flex-shrink-0" />
            <div className="text-right">
              <div className="text-3xl font-black text-[#00F5D4]" style={{ fontFamily: "'JetBrains Mono',monospace" }}>{parseFloat(toAmount ?? '0').toFixed(4)}</div>
              <div className="text-sm text-[#4A6080] mt-1" style={{ fontFamily: "'JetBrains Mono',monospace" }}>{toToken}</div>
            </div>
          </div>
        </div>

        {/* Details */}
        <div className="bg-[#0C1220] border border-[#1A2540] p-4 mb-4 space-y-3">
          {[
            { label: 'Rate', val: `1 ${fromToken} = ${rate} ${toToken}` },
            { label: 'Min. received', val: `${minReceived} ${toToken}` },
            { label: 'Price impact', val: `${priceImpact > 0 ? priceImpact.toFixed(2) : '< 0.01'}%`, color: highImpact ? 'text-rose-400' : priceImpact > 1 ? 'text-amber-400' : 'text-emerald-400' },
            { label: 'Slippage', val: `${slippage}%` },
            { label: 'Network fee', val: '~$2.40' },
          ].map(row => (
            <div key={row.label} className="flex justify-between text-sm" style={{ fontFamily: "'JetBrains Mono',monospace" }}>
              <span className="text-[#3A4A6A]">{row.label}</span>
              <span className={row.color ?? 'text-[#E8F0FF]'}>{row.val}</span>
            </div>
          ))}
        </div>

        {/* Routing */}
        {quote?.sources && (
          <div className="bg-[#0C1220] border border-[#1A2540] p-4 mb-4">
            <div className="text-[10px] text-[#3A4A6A] uppercase tracking-wider mb-2" style={{ fontFamily: "'JetBrains Mono',monospace" }}>Route</div>
            <div className="flex flex-wrap gap-2 items-center">
              <span className="px-2 py-1 bg-[#070B14] border border-[#1A2540] text-xs text-[#7A8BA8]" style={{ fontFamily: "'JetBrains Mono',monospace" }}>{fromToken}</span>
              {quote.sources.filter(s => parseFloat(s.proportion) > 0).map(s => (
                <div key={s.name} className="flex items-center gap-1">
                  <span className="text-[#3A4A6A] text-xs">→</span>
                  <span className="px-2 py-1 bg-[#00F5D4]/5 border border-[#00F5D4]/20 text-xs text-[#00F5D4]" style={{ fontFamily: "'JetBrains Mono',monospace" }}>
                    {s.name} {(parseFloat(s.proportion) * 100).toFixed(0)}%
                  </span>
                </div>
              ))}
              <span className="text-[#3A4A6A] text-xs">→</span>
              <span className="px-2 py-1 bg-[#070B14] border border-[#1A2540] text-xs text-[#7A8BA8]" style={{ fontFamily: "'JetBrains Mono',monospace" }}>{toToken}</span>
            </div>
          </div>
        )}

        {/* High price impact warning */}
        {highImpact && (
          <div className="flex items-start gap-2 p-3 bg-rose-400/5 border border-rose-400/20 mb-4 text-sm text-rose-400">
            <AlertTriangle size={15} className="mt-0.5 flex-shrink-0" />
            <span>Price impact is high ({priceImpact.toFixed(2)}%). You may receive significantly less than expected.</span>
          </div>
        )}

        {/* No calldata warning */}
        {!quote?.data && (
          <div className="flex items-start gap-2 p-3 bg-amber-400/5 border border-amber-400/20 mb-4 text-xs text-amber-400" style={{ fontFamily: "'JetBrains Mono',monospace" }}>
            <AlertTriangle size={12} className="mt-0.5 flex-shrink-0" />
            Quote has no execution data — transaction will be simulated only.
          </div>
        )}

        <button onClick={confirmSwap}
          disabled={submitted || waitingForReceipt}
          className="w-full py-4 text-sm font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
          style={{ background: submitted ? '#0C1220' : '#00F5D4', color: submitted ? '#7A8BA8' : '#04060C' }}>
          {waitingForReceipt ? (<><Loader2 size={16} className="animate-spin" /> Confirming on-chain…</>) :
           submitted ? (<><Loader2 size={16} className="animate-spin" /> Waiting for wallet…</>) :
           'Confirm Swap'}
        </button>

        <Link to="/swap" className="block mt-3 text-center text-xs text-[#3A4A6A] hover:text-[#7A8BA8] py-2" style={{ fontFamily: "'JetBrains Mono',monospace" }}>
          Cancel
        </Link>
      </div>
    </div>
  );
}
