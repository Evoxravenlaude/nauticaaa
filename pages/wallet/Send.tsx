import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronLeft, Scan, AlertTriangle } from 'lucide-react';
import { useAccount, useBalance, useEnsAddress } from 'wagmi';
import { isAddress } from 'viem';
import { getLivePrices } from '@/lib/api';
import { useQuery } from '@tanstack/react-query';

const TOKENS = [
  { symbol: 'ETH',  name: 'Ethereum',    decimals: 18, coinId: 'ethereum' },
  { symbol: 'USDC', name: 'USD Coin',    decimals: 6,  coinId: 'usd-coin' },
  { symbol: 'WBTC', name: 'Wrapped BTC', decimals: 8,  coinId: 'bitcoin' },
];

export default function Send() {
  const { address, isConnected } = useAccount();
  const navigate = useNavigate();

  const [selectedToken, setSelectedToken] = useState(TOKENS[0]);
  const [amount, setAmount] = useState('');
  const [recipient, setRecipient] = useState('');
  const [recipientError, setRecipientError] = useState('');

  const { data: prices } = useQuery({ queryKey: ['prices'], queryFn: getLivePrices, staleTime: 30_000 });
  const tokenPrice = prices?.[selectedToken.coinId]?.usd ?? 0;
  const usdValue = parseFloat(amount || '0') * tokenPrice;

  // ETH balance
  const { data: ethBalance } = useBalance({ address, query: { enabled: isConnected } });

  // ENS resolution
  const looksLikeEns = recipient.endsWith('.eth') || recipient.endsWith('.xyz');
  const { data: resolvedAddress, isLoading: ensLoading } = useEnsAddress({
    name: looksLikeEns ? recipient : undefined,
    query: { enabled: looksLikeEns },
  });

  const effectiveRecipient = (resolvedAddress as `0x${string}` | undefined) ?? recipient;
  const isValidAddress = isAddress(effectiveRecipient);

  useEffect(() => {
    if (!recipient) { setRecipientError(''); return; }
    if (looksLikeEns) {
      if (!ensLoading && !resolvedAddress) setRecipientError('ENS name not found');
      else setRecipientError('');
    } else if (!isAddress(recipient)) {
      setRecipientError('Invalid address');
    } else {
      setRecipientError('');
    }
  }, [recipient, looksLikeEns, ensLoading, resolvedAddress]);

  const canContinue = parseFloat(amount || '0') > 0 && isValidAddress && !recipientError;

  function setMax() {
    if (!ethBalance) return;
    const gasBuffer = 0.005;
    const bal = Number(ethBalance.value) / 10 ** ethBalance.decimals;
    const max = Math.max(0, bal - gasBuffer);
    setAmount(max.toFixed(6));
  }

  function proceed() {
    if (!canContinue) return;
    navigate('/send-review', {
      state: {
        token: selectedToken.symbol,
        amount,
        recipient: effectiveRecipient,
        recipientDisplay: looksLikeEns ? recipient : effectiveRecipient,
        usdValue: usdValue.toFixed(2),
        tokenPrice,
        decimals: selectedToken.decimals,
      },
    });
  }

  return (
    <div className="min-h-screen bg-[#04060C] px-4 py-10" style={{ fontFamily: "'Inter',sans-serif" }}>
      <div className="max-w-lg mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <Link to="/wallet-home" className="text-[#4A6080] hover:text-[#E8F0FF] transition-colors"><ChevronLeft size={18} /></Link>
          <h1 className="text-lg font-bold text-[#E8F0FF]">Send</h1>
        </div>

        {/* Token selector */}
        <div className="mb-5">
          <label className="block text-[10px] text-[#3A4A6A] uppercase tracking-wider mb-2" style={{ fontFamily: "'JetBrains Mono',monospace" }}>Token</label>
          <div className="flex gap-2">
            {TOKENS.map(t => (
              <button key={t.symbol} onClick={() => setSelectedToken(t)}
                className={`flex-1 py-2.5 text-xs font-bold border transition-all ${selectedToken.symbol === t.symbol ? 'border-[#00F5D4]/40 bg-[#00F5D4]/5 text-[#00F5D4]' : 'border-[#1A2540] text-[#4A6080] hover:text-[#7A8BA8]'}`}
                style={{ fontFamily: "'JetBrains Mono',monospace" }}>{t.symbol}</button>
            ))}
          </div>
        </div>

        {/* Recipient */}
        <div className="mb-5">
          <label className="block text-[10px] text-[#3A4A6A] uppercase tracking-wider mb-2" style={{ fontFamily: "'JetBrains Mono',monospace" }}>Recipient</label>
          <div className={`flex items-center bg-[#0C1220] border transition-colors px-3 py-3 ${recipientError ? 'border-rose-400/40' : 'border-[#1A2540] focus-within:border-[#00F5D4]/30'}`}>
            <input value={recipient} onChange={e => setRecipient(e.target.value)}
              placeholder="0x... or name.eth"
              className="flex-1 bg-transparent text-sm text-[#E8F0FF] outline-none placeholder:text-[#3A4A6A]"
              style={{ fontFamily: "'JetBrains Mono',monospace" }} />
            <button className="text-[#3A4A6A] hover:text-[#7A8BA8] ml-2"><Scan size={16} /></button>
          </div>
          {recipientError && (
            <div className="flex items-center gap-1 mt-1.5 text-[10px] text-rose-400" style={{ fontFamily: "'JetBrains Mono',monospace" }}>
              <AlertTriangle size={10} /> {recipientError}
            </div>
          )}
          {resolvedAddress && (
            <div className="mt-1.5 text-[10px] text-emerald-400" style={{ fontFamily: "'JetBrains Mono',monospace" }}>
              ✓ Resolved: {(resolvedAddress as string).slice(0, 10)}...{(resolvedAddress as string).slice(-6)}
            </div>
          )}
          {ensLoading && (
            <div className="mt-1.5 text-[10px] text-[#4A6080]" style={{ fontFamily: "'JetBrains Mono',monospace" }}>Resolving ENS...</div>
          )}
        </div>

        {/* Amount */}
        <div className="mb-5">
          <label className="block text-[10px] text-[#3A4A6A] uppercase tracking-wider mb-2" style={{ fontFamily: "'JetBrains Mono',monospace" }}>Amount</label>
          <div className="bg-[#0C1220] border border-[#1A2540] focus-within:border-[#00F5D4]/30 transition-colors p-4">
            <div className="flex items-center gap-3">
              <input value={amount} onChange={e => setAmount(e.target.value)} type="number" placeholder="0.0"
                className="flex-1 bg-transparent text-3xl font-black text-[#E8F0FF] outline-none min-w-0"
                style={{ fontFamily: "'JetBrains Mono',monospace" }} />
              <span className="text-sm font-bold text-[#7A8BA8]" style={{ fontFamily: "'JetBrains Mono',monospace" }}>{selectedToken.symbol}</span>
            </div>
            <div className="flex items-center justify-between mt-2 text-xs" style={{ fontFamily: "'JetBrains Mono',monospace" }}>
              <span className="text-[#3A4A6A]">{usdValue > 0 ? `≈ $${usdValue.toFixed(2)}` : ''}</span>
              <button onClick={setMax} className="text-[#00F5D4] hover:opacity-80 transition-opacity">
                Bal: {ethBalance ? (Number(ethBalance.value) / 10 ** ethBalance.decimals).toFixed(4) : '—'} Max
              </button>
            </div>
          </div>
        </div>

        {/* Quick amounts */}
        <div className="grid grid-cols-4 gap-2 mb-6">
          {[0.01, 0.05, 0.1, 0.5].map(v => (
            <button key={v} onClick={() => setAmount(String(v))}
              className="py-2 text-xs border border-[#1A2540] text-[#4A6080] hover:border-[#243060] hover:text-[#7A8BA8] transition-all"
              style={{ fontFamily: "'JetBrains Mono',monospace" }}>{v} {selectedToken.symbol}</button>
          ))}
        </div>

        {/* Fee estimate */}
        <div className="bg-[#0C1220] border border-[#1A2540] p-4 mb-6 flex justify-between text-sm" style={{ fontFamily: "'JetBrains Mono',monospace" }}>
          <span className="text-[#3A4A6A]">Estimated gas</span>
          <span className="text-[#7A8BA8]">~$1.80 · 0.0006 ETH</span>
        </div>

        <button onClick={proceed} disabled={!canContinue}
          className="w-full py-4 text-sm font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          style={{ background: canContinue ? '#00F5D4' : '#0C1220', color: canContinue ? '#04060C' : '#3A4A6A', border: canContinue ? 'none' : '1px solid #1A2540' }}>
          Review Transaction →
        </button>
      </div>
    </div>
  );
}
