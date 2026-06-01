import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ChevronLeft, Check, Loader2, ExternalLink } from 'lucide-react';
import { useSendTransaction, useWaitForTransactionReceipt } from 'wagmi';
import { parseUnits } from 'viem';
import { useToast } from '@/components/ui/Toast';

export default function SendReview() {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast, updateToast } = useToast();
  const [submitted, setSubmitted] = useState(false);
  const [txHash, setTxHash] = useState<`0x${string}` | undefined>();

  const { token, amount, recipient, recipientDisplay, usdValue, decimals } =
    (location.state ?? {}) as {
      token?: string; amount?: string; recipient?: `0x${string}`;
      recipientDisplay?: string; usdValue?: string; decimals?: number;
    };

  const { sendTransactionAsync } = useSendTransaction();
  const { isLoading: waiting, isSuccess } = useWaitForTransactionReceipt({
    hash: txHash,
    query: { enabled: !!txHash },
  });

  if (!recipient || !amount || !token) {
    return (
      <div className="min-h-screen bg-[#04060C] flex flex-col items-center justify-center gap-4">
        <p className="text-[#7A8BA8] text-sm">No transaction data — go back.</p>
        <Link to="/send" className="text-[#00F5D4] text-xs" style={{ fontFamily: "'JetBrains Mono',monospace" }}>← Back to Send</Link>
      </div>
    );
  }

  async function confirmSend() {
    let toastId = '';
    try {
      setSubmitted(true);
      toastId = toast({ type: 'pending', title: 'Awaiting wallet confirmation', description: `Send ${amount} ${token}` });
      const value = token === 'ETH' ? parseUnits(amount!, decimals ?? 18) : BigInt(0);
      const hash = await sendTransactionAsync({
        to: recipient,
        value,
        // For ERC-20 tokens, data would be the transfer calldata — ETH only for now
      });
      setTxHash(hash);
      updateToast(toastId, { type: 'pending', title: 'Transaction submitted', description: 'Waiting for block confirmation…', txHash: hash });
    } catch (err: unknown) {
      setSubmitted(false);
      const msg = err instanceof Error ? err.message.slice(0, 80) : 'Transaction rejected';
      if (toastId) updateToast(toastId, { type: 'error', title: 'Send failed', description: msg });
      else toast({ type: 'error', title: 'Send failed', description: msg });
    }
  }

  if (isSuccess && txHash) {
    return (
      <div className="min-h-screen bg-[#04060C] flex flex-col items-center justify-center px-6 text-center">
        <div className="w-20 h-20 rounded-full bg-emerald-400/10 flex items-center justify-center mb-6">
          <Check size={36} className="text-emerald-400" />
        </div>
        <h1 className="text-2xl font-bold text-[#E8F0FF] mb-2">Sent!</h1>
        <p className="text-sm text-[#4A6080] mb-2">{amount} {token} → {recipientDisplay?.slice(0, 12)}…</p>
        <a href={`https://etherscan.io/tx/${txHash}`} target="_blank" rel="noreferrer"
          className="flex items-center gap-1 text-xs text-[#00F5D4] mb-10" style={{ fontFamily: "'JetBrains Mono',monospace" }}>
          View on Etherscan <ExternalLink size={10} />
        </a>
        <div className="flex gap-3">
          <button onClick={() => navigate('/send')} className="px-6 py-3 bg-[#00F5D4] text-[#04060C] text-sm font-bold">Send Again</button>
          <Link to="/wallet-home" className="px-6 py-3 border border-[#1A2540] text-[#7A8BA8] text-sm font-bold">Portfolio</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#04060C] px-4 py-10" style={{ fontFamily: "'Inter',sans-serif" }}>
      <div className="max-w-lg mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <Link to="/send" className="text-[#4A6080] hover:text-[#E8F0FF]"><ChevronLeft size={18} /></Link>
          <h1 className="text-lg font-bold text-[#E8F0FF]">Confirm Send</h1>
        </div>

        <div className="bg-[#0C1220] border border-[#1A2540] p-6 mb-4 text-center">
          <div className="text-4xl font-black text-[#E8F0FF] mb-1" style={{ fontFamily: "'JetBrains Mono',monospace" }}>{amount} {token}</div>
          <div className="text-sm text-[#4A6080]">≈ ${usdValue}</div>
        </div>

        <div className="bg-[#0C1220] border border-[#1A2540] p-4 mb-6 space-y-3">
          {[
            { label: 'To', val: recipientDisplay ?? recipient },
            { label: 'Network', val: 'Ethereum Mainnet' },
            { label: 'Network fee', val: '~$1.80' },
            { label: 'Total', val: `${amount} ${token} + gas` },
          ].map(row => (
            <div key={row.label} className="flex justify-between text-sm" style={{ fontFamily: "'JetBrains Mono',monospace" }}>
              <span className="text-[#3A4A6A]">{row.label}</span>
              <span className="text-[#E8F0FF] break-all text-right max-w-[60%]">{row.val}</span>
            </div>
          ))}
        </div>

        <button onClick={confirmSend} disabled={submitted || waiting}
          className="w-full py-4 text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-60 transition-all"
          style={{ background: submitted ? '#0C1220' : '#00F5D4', color: submitted ? '#7A8BA8' : '#04060C', border: submitted ? '1px solid #1A2540' : 'none' }}>
          {waiting ? <><Loader2 size={16} className="animate-spin" /> Confirming…</>
           : submitted ? <><Loader2 size={16} className="animate-spin" /> Waiting for wallet…</>
           : 'Confirm & Send'}
        </button>
        <Link to="/send" className="block text-center text-xs text-[#3A4A6A] hover:text-[#7A8BA8] mt-3 py-2">Cancel</Link>
      </div>
    </div>
  );
}
