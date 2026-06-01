import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, Shield, Copy, Check, RefreshCw, Eye, EyeOff, Info } from 'lucide-react';
import { useAccount } from 'wagmi';

// Deterministic stealth address derivation (scaffolded — real impl uses Railgun SDK)
// Real: RailgunWalletInfo.railgunAddress from createRailgunWallet()
function deriveStealthAddress(walletAddr: string, nonce: number): string {
  const seed = walletAddr.slice(2, 10) + nonce.toString(16).padStart(4, '0');
  const chars = '0123456789abcdef';
  let result = '0zk1q';
  for (let i = 0; i < 38; i++) {
    result += chars[(parseInt(seed[i % seed.length], 16) + i * nonce + 7) % 16];
  }
  result += seed.slice(0, 4);
  return result;
}

function QRCode({ data, size = 180 }: { data: string; size?: number }) {
  // Deterministic pattern from the address string
  const cells = 21;
  const cellSize = size / cells;
  const bits: boolean[][] = Array.from({ length: cells }, (_, row) =>
    Array.from({ length: cells }, (_, col) => {
      // Finder patterns
      const inFinder = (r: number, c: number, sr: number, sc: number) =>
        r >= sr && r <= sr + 6 && c >= sc && c <= sc + 6 &&
        (r === sr || r === sr + 6 || c === sc || c === sc + 6 ||
         (r >= sr + 2 && r <= sr + 4 && c >= sc + 2 && c <= sc + 4));
      if (inFinder(row, col, 0, 0) || inFinder(row, col, 0, 14) || inFinder(row, col, 14, 0)) return true;
      // Data from address
      const idx = (row * cells + col) % data.length;
      const charCode = data.charCodeAt(idx);
      return (charCode + row * 3 + col * 7 + row * col) % 3 !== 0;
    })
  );

  return (
    <div className="bg-white p-3 inline-block" style={{ width: size + 24, height: size + 24 }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} xmlns="http://www.w3.org/2000/svg">
        {bits.map((row, r) =>
          row.map((on, c) =>
            on ? <rect key={`${r}-${c}`} x={c * cellSize} y={r * cellSize} width={cellSize} height={cellSize} fill="#04060C" /> : null
          )
        )}
      </svg>
    </div>
  );
}

const DUMMY_PENDING = [
  { id: 1, amount: '0.50', token: 'ETH',  from: 'Stealth #2847', time: '12 min ago', status: 'pending'   as const },
  { id: 2, amount: '200',  token: 'USDC', from: 'Stealth #1024', time: '2 hr ago',   status: 'confirmed' as const },
  { id: 3, amount: '0.12', token: 'ETH',  from: 'Stealth #8912', time: '5 hr ago',   status: 'confirmed' as const },
];

export default function ZKReceive() {
  const { address } = useAccount();
  const [nonce, setNonce] = useState(0);
  const [copied, setCopied] = useState(false);
  const [showAddr, setShowAddr] = useState(true);
  const baseAddr = address ?? '0x0000000000000000000000000000000000000000';
  const zkAddress = deriveStealthAddress(baseAddr, nonce);

  function copyAddr() {
    navigator.clipboard.writeText(zkAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function newAddress() { setNonce(n => n + 1); }

  return (
    <div className="min-h-screen bg-[#04060C]" style={{ fontFamily: "'Inter',sans-serif" }}>

      {/* Header */}
      <div className="border-b border-[#1A2540] px-5 py-3 flex items-center gap-3 bg-[#070B14]">
        <Link to="/wallet-home" className="text-[#4A6080] hover:text-[#E8F0FF] transition-colors"><ChevronLeft size={18} /></Link>
        <div className="flex items-center gap-2">
          <Shield size={16} className="text-purple-400" />
          <span className="font-semibold text-[#E8F0FF]">Receive Privately</span>
          <span className="px-2 py-0.5 text-[9px] font-bold bg-purple-400/10 text-purple-400 border border-purple-400/20 font-mono">Railgun</span>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-5 py-8 space-y-6">

        {/* QR + address */}
        <div className="bg-[#0C1220] border border-[#1A2540] p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="text-[10px] text-[#3A4A6A] uppercase tracking-wider font-mono flex items-center gap-1.5">
              <Shield size={10} className="text-purple-400" /> Stealth Address #{nonce}
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setShowAddr(!showAddr)} className="text-[#3A4A6A] hover:text-[#7A8BA8] transition-colors">
                {showAddr ? <Eye size={14} /> : <EyeOff size={14} />}
              </button>
              <button onClick={newAddress} className="flex items-center gap-1 text-[10px] text-[#00F5D4] hover:opacity-80 font-mono">
                <RefreshCw size={11} /> New
              </button>
            </div>
          </div>

          <div className="flex justify-center mb-5">
            <QRCode data={zkAddress} size={180} />
          </div>

          <div className="bg-[#070B14] border border-[#1A2540] p-3 flex items-center gap-3">
            <code className="flex-1 text-xs font-mono text-[#E8F0FF] break-all leading-relaxed">
              {showAddr ? zkAddress : '0zk1q●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●'}
            </code>
            <button onClick={copyAddr} className="flex-shrink-0 text-[#3A4A6A] hover:text-[#00F5D4] transition-colors">
              {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
            </button>
          </div>

          <div className="flex gap-3 mt-4">
            <button onClick={copyAddr}
              className="flex-1 py-2.5 flex items-center justify-center gap-1.5 border border-[#1A2540] hover:border-[#243060] transition-all text-xs text-[#7A8BA8] font-mono">
              {copied ? <><Check size={12} className="text-emerald-400" /> Copied</> : <><Copy size={12} /> Copy Address</>}
            </button>
            <button onClick={newAddress}
              className="flex-1 py-2.5 flex items-center justify-center gap-1.5 border border-purple-400/30 bg-purple-400/5 text-purple-400 text-xs font-mono hover:bg-purple-400/10 transition-all">
              <RefreshCw size={12} /> Generate New
            </button>
          </div>
        </div>

        {/* Info box */}
        <div className="flex items-start gap-3 bg-purple-400/5 border border-purple-400/20 p-4">
          <Info size={14} className="text-purple-400 flex-shrink-0 mt-0.5" />
          <div className="text-xs text-[#7A8BA8] leading-relaxed">
            Your stealth address is different from your public wallet address. Share this to receive private transfers — the sender can't link it to your identity on-chain. Generate a new address for each sender for maximum anonymity.
          </div>
        </div>

        {/* Supported tokens */}
        <div>
          <div className="text-[10px] text-[#3A4A6A] uppercase tracking-wider font-mono mb-3">Supported tokens</div>
          <div className="flex flex-wrap gap-2">
            {['ETH', 'USDC', 'USDT', 'DAI', 'WBTC', 'LINK', 'UNI', 'AAVE'].map(t => (
              <div key={t} className="px-3 py-1.5 bg-[#0C1220] border border-[#1A2540] text-xs font-mono text-[#7A8BA8]">{t}</div>
            ))}
          </div>
        </div>

        {/* Pending private inbound */}
        <div>
          <div className="text-[10px] text-[#3A4A6A] uppercase tracking-wider font-mono mb-3">Pending Inbound</div>
          <div className="space-y-2">
            {DUMMY_PENDING.map(tx => (
              <div key={tx.id} className="flex items-center gap-3 bg-[#0C1220] border border-[#1A2540] px-4 py-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${tx.status === 'pending' ? 'bg-amber-400/10' : 'bg-emerald-400/10'}`}>
                  <Shield size={13} className={tx.status === 'pending' ? 'text-amber-400' : 'text-emerald-400'} />
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium text-[#E8F0FF]">{tx.amount} {tx.token}</div>
                  <div className="text-[10px] text-[#3A4A6A] font-mono">From {tx.from}</div>
                </div>
                <div className="text-right">
                  <div className={`text-[10px] font-bold font-mono ${tx.status === 'pending' ? 'text-amber-400' : 'text-emerald-400'}`}>{tx.status}</div>
                  <div className="text-[10px] text-[#3A4A6A]">{tx.time}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <Link to="/zk-send" className="flex items-center justify-center gap-2 w-full py-3 border border-purple-400/30 text-purple-400 text-sm font-bold hover:bg-purple-400/5 transition-all">
          <Shield size={15} /> Send Privately Instead
        </Link>
      </div>
    </div>
  );
}
