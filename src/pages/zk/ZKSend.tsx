import { useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAccount } from 'wagmi';
import { ChevronLeft, Shield, Eye, EyeOff, Info, ExternalLink, Check, AlertTriangle, Clock } from 'lucide-react';
import {
  generateZKProof, transferTokens, estimateRelayerFee, isRailgunAddress,
  type PrivacyLevel, type ZKTransaction, type ProofProgress
} from '@/lib/railgun';

const TOKENS = [
  { symbol: 'ETH', name: 'Ethereum', shielded: '1.2400', price: 2847.5 },
  { symbol: 'USDC', name: 'USD Coin', shielded: '500.00', price: 1.0 },
  { symbol: 'WBTC', name: 'Wrapped Bitcoin', shielded: '0.0041', price: 104800 },
];

const PRIVACY_OPTIONS: { level: PrivacyLevel; label: string; sub: string; proofMs: string; icon: string }[] = [
  { level: 'standard',  label: 'Standard',  sub: 'Single note, basic anonymity',  proofMs: '~0.8s', icon: '🔒' },
  { level: 'enhanced',  label: 'Enhanced',  sub: 'Multi-note aggregation',        proofMs: '~1.8s', icon: '🛡️' },
  { level: 'maximum',   label: 'Maximum',   sub: 'Plume shuffle + relayer pool',  proofMs: '~4.2s', icon: '👁️' },
];

const STEP_LABELS: Record<ProofProgress['step'], string> = {
  witness: 'Generating witness',
  constraints: 'Checking arithmetic constraints',
  groth16: 'Groth16 proof computation',
  verify: 'On-chain verification',
  complete: 'Complete',
};

const RECENT_TXS: ZKTransaction[] = [
  { id:'zk-1', type:'transfer', amount:'0.50', token:'ETH', status:'confirmed', proofTimeMs:1840, txHash:'0x3a4f...8b2c', timestamp:Date.now()-180000, recipient:'0x9b2c...4a1f', privacyLevel:'enhanced' },
  { id:'zk-2', type:'shield', amount:'200', token:'USDC', status:'confirmed', proofTimeMs:820, txHash:'0x7f1a...3d9e', timestamp:Date.now()-3600000, privacyLevel:'standard' },
  { id:'zk-3', type:'transfer', amount:'0.0041', token:'WBTC', status:'confirmed', proofTimeMs:4180, txHash:'0x2b8e...1c4f', timestamp:Date.now()-86400000, recipient:'0zk1q...8f3a', privacyLevel:'maximum' },
];

type View = 'send' | 'receive' | 'history' | 'verify';

export default function ZKSend() {
  const { isConnected } = useAccount();
  const [view, setView] = useState<View>('send');
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [selectedToken, setSelectedToken] = useState(TOKENS[0]);
  const [privacyLevel, setPrivacyLevel] = useState<PrivacyLevel>('enhanced');
  const [memo, setMemo] = useState('');
  const [progress, setProgress] = useState<ProofProgress | null>(null);
  const [tx, setTx] = useState<ZKTransaction | null>(null);
  const [phase, setPhase] = useState<'idle' | 'proving' | 'broadcasting' | 'done' | 'error'>('idle');
  const [showBalance, setShowBalance] = useState(false);

  const amountNum = parseFloat(amount || '0');
  const usdValue = amountNum * selectedToken.price;
  const relayerFee = estimateRelayerFee(usdValue, privacyLevel);
  const isRailgun = isRailgunAddress(recipient);
  const isValid = recipient.length > 10 && amountNum > 0;

  const execute = useCallback(async () => {
    if (!isValid) return;
    setPhase('proving');
    setProgress(null);
    try {
      if (view === 'send') {
        const result = await transferTokens({
          recipient,
          tokenAddress: selectedToken.symbol,
          amount,
          privacyLevel,
          onProgress: setProgress,
        });
        setPhase('broadcasting');
        await new Promise(r => setTimeout(r, 800));
        setTx(result);
        setPhase('done');
      } else {
        await generateZKProof(privacyLevel, setProgress);
        setPhase('done');
      }
    } catch {
      setPhase('error');
    }
  }, [isValid, view, recipient, selectedToken, amount, privacyLevel]);

  function reset() {
    setPhase('idle');
    setProgress(null);
    setTx(null);
    setAmount('');
    setRecipient('');
  }

  const proofPct = progress?.pct ?? 0;

  return (
    <div className="min-h-screen bg-[#04060C]" style={{fontFamily:"'Inter',sans-serif"}}>

      {/* ── Header ── */}
      <div className="border-b border-[#1A2540] px-6 py-3 flex items-center gap-4 bg-[#070B14]">
        <Link to="/wallet-home" className="text-[#4A6080] hover:text-[#E8F0FF] transition-colors"><ChevronLeft size={18}/></Link>
        <div className="flex items-center gap-2">
          <Shield size={16} className="text-purple-400"/>
          <span className="text-sm font-semibold text-[#E8F0FF]">ZK Shield</span>
          <span className="px-2 py-0.5 text-[9px] font-bold bg-purple-400/10 text-purple-400 border border-purple-400/20" style={{fontFamily:"'JetBrains Mono',monospace"}}>Powered by Railgun</span>
        </div>
        <div className="ml-auto flex items-center gap-2 text-xs text-[#4A6080]" style={{fontFamily:"'JetBrains Mono',monospace"}}>
          <div className="w-2 h-2 rounded-full bg-purple-400 animate-pulse"/>
          ZK Engine Active
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8 grid grid-cols-[1fr_340px] gap-6">

        {/* ── Left: Context ── */}
        <div className="space-y-5">

          {/* Nav tabs */}
          <div className="flex gap-1 border-b border-[#1A2540]">
            {([
              {key:'send',label:'Shield Send'},
              {key:'receive',label:'Receive Privately'},
              {key:'history',label:'History'},
              {key:'verify',label:'Verify Proof'},
            ] as {key:View;label:string}[]).map(t=>(
              <button key={t.key} onClick={()=>setView(t.key)}
                className={`px-4 py-2.5 text-xs font-medium transition-all ${view===t.key?'text-purple-400 border-b-2 border-purple-400':'text-[#4A6080] hover:text-[#7A8BA8]'}`}
                style={{fontFamily:"'JetBrains Mono',monospace"}}>{t.label}</button>
            ))}
          </div>

          {/* Shielded Balances */}
          <div className="bg-[#0C1220] border border-[#1A2540] p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] text-[#3A4A6A] uppercase tracking-wider" style={{fontFamily:"'JetBrains Mono',monospace"}}>Shielded Balances</span>
              <button onClick={()=>setShowBalance(!showBalance)} className="text-[#4A6080] hover:text-[#7A8BA8] transition-colors">
                {showBalance ? <Eye size={14}/> : <EyeOff size={14}/>}
              </button>
            </div>
            <div className="space-y-2">
              {TOKENS.map(t=>(
                <div key={t.symbol} className="flex items-center justify-between py-1">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-purple-400/10 flex items-center justify-center text-[10px] font-bold text-purple-400" style={{fontFamily:"'JetBrains Mono',monospace"}}>{t.symbol[0]}</div>
                    <div>
                      <div className="text-xs font-medium text-[#E8F0FF]">{t.symbol}</div>
                      <div className="text-[10px] text-[#3A4A6A]" style={{fontFamily:"'JetBrains Mono',monospace"}}>Private</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-bold text-[#E8F0FF]" style={{fontFamily:"'JetBrains Mono',monospace"}}>{showBalance ? t.shielded : '●●●●'} {t.symbol}</div>
                    <div className="text-[10px] text-[#3A4A6A]" style={{fontFamily:"'JetBrains Mono',monospace"}}>{showBalance ? `$${(parseFloat(t.shielded)*t.price).toFixed(2)}` : '——'}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Proof pipeline visualization */}
          {phase === 'proving' && progress && (
            <div className="bg-[#0C1220] border border-purple-400/30 p-4">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-2 h-2 rounded-full bg-purple-400 animate-pulse"/>
                <span className="text-xs font-medium text-purple-400" style={{fontFamily:"'JetBrains Mono',monospace"}}>Generating ZK Proof...</span>
              </div>
              {(['witness','constraints','groth16','verify','complete'] as ProofProgress['step'][]).map((step, i) => {
                const stepPcts = {witness:15,constraints:35,groth16:85,verify:95,complete:100};
                const isDone = proofPct >= stepPcts[step];
                const isActive = !isDone && proofPct >= (i === 0 ? 0 : [0,15,35,85,95][i]);
                return (
                  <div key={step} className="flex items-center gap-3 mb-3">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${isDone?'bg-purple-400 text-white':isActive?'border border-purple-400 text-purple-400':'border border-[#1A2540] text-[#3A4A6A]'}`}>
                      {isDone ? <Check size={12}/> : <span className="text-[9px]" style={{fontFamily:"'JetBrains Mono',monospace"}}>{i+1}</span>}
                    </div>
                    <div className="flex-1">
                      <div className={`text-xs ${isDone?'text-[#7A8BA8]':isActive?'text-[#E8F0FF]':'text-[#3A4A6A]'}`}>{STEP_LABELS[step]}</div>
                    </div>
                  </div>
                );
              })}
              <div className="mt-3 h-1.5 bg-[#1A2540] rounded-full overflow-hidden">
                <div className="h-full bg-purple-400 rounded-full transition-all duration-500" style={{width:`${proofPct}%`}}/>
              </div>
              <div className="flex justify-between mt-1.5 text-[10px] text-[#3A4A6A]" style={{fontFamily:"'JetBrains Mono',monospace"}}>
                <span>Step: {STEP_LABELS[progress.step]}</span>
                <span>{proofPct}% · {((progress.estimatedTotalMs - progress.elapsedMs)/1000).toFixed(1)}s remaining</span>
              </div>
            </div>
          )}

          {/* Broadcasting indicator */}
          {phase === 'broadcasting' && (
            <div className="bg-[#0C1220] border border-[#00F5D4]/30 p-4 flex items-center gap-3">
              <Clock size={16} className="text-[#00F5D4] animate-spin"/>
              <span className="text-xs text-[#00F5D4]" style={{fontFamily:"'JetBrains Mono',monospace"}}>Broadcasting shielded transaction...</span>
            </div>
          )}

          {/* Success */}
          {phase === 'done' && tx && (
            <div className="bg-emerald-400/5 border border-emerald-400/30 p-4">
              <div className="flex items-center gap-2 mb-3">
                <Check size={16} className="text-emerald-400"/>
                <span className="text-xs font-semibold text-emerald-400" style={{fontFamily:"'JetBrains Mono',monospace"}}>Transaction Shielded & Confirmed</span>
              </div>
              <div className="space-y-1.5 text-[11px]" style={{fontFamily:"'JetBrains Mono',monospace"}}>
                <div className="flex justify-between"><span className="text-[#4A6080]">Tx Hash</span><span className="text-[#E8F0FF]">{tx.txHash}</span></div>
                <div className="flex justify-between"><span className="text-[#4A6080]">Proof Time</span><span className="text-emerald-400">{tx.proofTimeMs}ms</span></div>
                <div className="flex justify-between"><span className="text-[#4A6080]">Privacy Level</span><span className="text-purple-400 capitalize">{tx.privacyLevel}</span></div>
              </div>
              <div className="flex gap-2 mt-3">
                <button onClick={reset} className="px-4 py-2 bg-[#0C1220] border border-[#1A2540] text-xs text-[#7A8BA8] hover:text-[#E8F0FF] transition-colors">New Transaction</button>
                <button className="px-4 py-2 flex items-center gap-1.5 text-xs text-[#4A6080] hover:text-[#00F5D4] transition-colors">View on Etherscan <ExternalLink size={11}/></button>
              </div>
            </div>
          )}

          {/* History tab */}
          {view === 'history' && (
            <div className="space-y-2">
              <div className="text-[10px] text-[#3A4A6A] uppercase tracking-wider mb-3" style={{fontFamily:"'JetBrains Mono',monospace"}}>Recent Shielded Activity</div>
              {RECENT_TXS.map(t=>(
                <div key={t.id} className="bg-[#0C1220] border border-[#1A2540] hover:border-[#243060] transition-colors p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${t.type==='shield'?'bg-purple-400/10 text-purple-400':'bg-emerald-400/10 text-emerald-400'}`}>
                        <Shield size={14}/>
                      </div>
                      <div>
                        <div className="text-xs font-medium text-[#E8F0FF] capitalize">{t.type}</div>
                        <div className="text-[10px] text-[#3A4A6A]" style={{fontFamily:"'JetBrains Mono',monospace"}}>{new Date(t.timestamp).toLocaleString()}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-bold text-[#E8F0FF]" style={{fontFamily:"'JetBrains Mono',monospace"}}>{t.amount} {t.token}</div>
                      <div className="text-[10px] text-[#3A4A6A] capitalize" style={{fontFamily:"'JetBrains Mono',monospace"}}>{t.privacyLevel} · {t.proofTimeMs}ms</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Stats */}
          {view !== 'history' && (
            <div className="grid grid-cols-3 gap-3">
              {[
                {label:'Shielded TVL', val:'$2.1B', color:'text-purple-400'},
                {label:'Avg Proof Time', val:'0.4s', color:'text-[#00F5D4]'},
                {label:'Total Proofs', val:'98K', color:'text-emerald-400'},
              ].map(s=>(
                <div key={s.label} className="bg-[#0C1220] border border-[#1A2540] p-3 text-center">
                  <div className={`text-base font-bold ${s.color}`} style={{fontFamily:"'JetBrains Mono',monospace"}}>{s.val}</div>
                  <div className="text-[9px] text-[#3A4A6A] uppercase tracking-wider mt-1" style={{fontFamily:"'JetBrains Mono',monospace"}}>{s.label}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Right: Form ── */}
        <div className="space-y-4">

          {/* Recipient */}
          <div>
            <label className="block text-[10px] text-[#3A4A6A] uppercase tracking-wider mb-2" style={{fontFamily:"'JetBrains Mono',monospace"}}>Recipient</label>
            <div className={`bg-[#0C1220] border transition-colors p-3 ${isRailgun?'border-purple-400/40':'border-[#1A2540]'} focus-within:border-[#00F5D4]/30`}>
              <input value={recipient} onChange={e=>setRecipient(e.target.value)}
                placeholder="0x... or 0zk1q... (Railgun stealth address)"
                className="w-full bg-transparent text-xs text-[#E8F0FF] outline-none placeholder:text-[#3A4A6A]"
                style={{fontFamily:"'JetBrains Mono',monospace"}} disabled={phase!=='idle'}/>
              {isRailgun && (
                <div className="flex items-center gap-1 mt-2 text-[10px] text-purple-400" style={{fontFamily:"'JetBrains Mono',monospace"}}>
                  <Shield size={10}/> Railgun stealth address — maximum privacy
                </div>
              )}
            </div>
          </div>

          {/* Token + Amount */}
          <div>
            <label className="block text-[10px] text-[#3A4A6A] uppercase tracking-wider mb-2" style={{fontFamily:"'JetBrains Mono',monospace"}}>Amount</label>
            <div className="bg-[#0C1220] border border-[#1A2540] focus-within:border-[#00F5D4]/30 transition-colors p-3">
              <div className="flex items-center gap-3">
                <input value={amount} onChange={e=>setAmount(e.target.value)} type="number" placeholder="0.0"
                  className="flex-1 bg-transparent text-xl font-bold text-[#E8F0FF] outline-none w-full" style={{fontFamily:"'JetBrains Mono',monospace"}} disabled={phase!=='idle'}/>
                <div className="relative">
                  <select value={selectedToken.symbol} onChange={e=>setSelectedToken(TOKENS.find(t=>t.symbol===e.target.value)!)}
                    className="bg-[#070B14] border border-[#243060] text-xs text-[#E8F0FF] px-3 py-1.5 outline-none cursor-pointer appearance-none pr-6" style={{fontFamily:"'JetBrains Mono',monospace"}}>
                    {TOKENS.map(t=><option key={t.symbol} value={t.symbol}>{t.symbol}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex justify-between mt-2 text-[10px]" style={{fontFamily:"'JetBrains Mono',monospace"}}>
                <span className="text-[#3A4A6A]">≈ ${usdValue > 0 ? usdValue.toLocaleString('en',{maximumFractionDigits:2}) : '0.00'}</span>
                <span className="text-[#4A6080] cursor-pointer hover:text-[#00F5D4]" onClick={()=>setAmount(selectedToken.shielded)}>Max: {selectedToken.shielded} {selectedToken.symbol}</span>
              </div>
            </div>
          </div>

          {/* Privacy Level */}
          <div>
            <label className="block text-[10px] text-[#3A4A6A] uppercase tracking-wider mb-2" style={{fontFamily:"'JetBrains Mono',monospace"}}>Privacy Level</label>
            <div className="grid grid-cols-3 gap-2">
              {PRIVACY_OPTIONS.map(opt=>(
                <button key={opt.level} onClick={()=>setPrivacyLevel(opt.level)} disabled={phase!=='idle'}
                  className={`p-3 border text-center transition-all ${privacyLevel===opt.level?'border-purple-400/50 bg-purple-400/5':'border-[#1A2540] hover:border-[#243060]'}`}>
                  <div className="text-base mb-1">{opt.icon}</div>
                  <div className="text-[10px] font-semibold text-[#E8F0FF]">{opt.label}</div>
                  <div className="text-[9px] text-[#3A4A6A] mt-0.5" style={{fontFamily:"'JetBrains Mono',monospace"}}>{opt.proofMs}</div>
                </button>
              ))}
            </div>
            <div className="mt-2 text-[10px] text-[#3A4A6A] flex items-start gap-1.5" style={{fontFamily:"'JetBrains Mono',monospace"}}>
              <Info size={10} className="mt-0.5 flex-shrink-0"/>
              {PRIVACY_OPTIONS.find(o=>o.level===privacyLevel)?.sub}
            </div>
          </div>

          {/* Optional memo */}
          <div>
            <label className="block text-[10px] text-[#3A4A6A] uppercase tracking-wider mb-2" style={{fontFamily:"'JetBrains Mono',monospace"}}>Encrypted Memo (optional)</label>
            <input value={memo} onChange={e=>setMemo(e.target.value)} placeholder="Private note — encrypted on-chain"
              className="w-full bg-[#0C1220] border border-[#1A2540] focus:border-[#00F5D4]/30 px-3 py-2 text-xs text-[#E8F0FF] outline-none placeholder:text-[#3A4A6A]"
              style={{fontFamily:"'JetBrains Mono',monospace"}} disabled={phase!=='idle'}/>
          </div>

          {/* Fee breakdown */}
          <div className="bg-[#0C1220] border border-[#1A2540] p-3 space-y-2">
            {[
              {label:'Relayer fee', val:`${relayerFee.toFixed(4)} USDC`},
              {label:'ZK proof fee', val:'0.0001 ETH'},
              {label:'Gas (est.)', val:'~$1.80'},
            ].map(row=>(
              <div key={row.label} className="flex justify-between text-[11px]" style={{fontFamily:"'JetBrains Mono',monospace"}}>
                <span className="text-[#3A4A6A]">{row.label}</span>
                <span className="text-[#7A8BA8]">{row.val}</span>
              </div>
            ))}
            <div className="border-t border-[#1A2540] pt-2 flex justify-between text-[11px] font-bold" style={{fontFamily:"'JetBrains Mono',monospace"}}>
              <span className="text-[#E8F0FF]">Total fees</span>
              <span className="text-purple-400">${(relayerFee + 1.80 + 0.0001*2847.5).toFixed(2)}</span>
            </div>
          </div>

          {/* Connect wallet warning */}
          {!isConnected && (
            <div className="flex items-center gap-2 p-3 bg-amber-400/5 border border-amber-400/20 text-xs text-amber-400" style={{fontFamily:"'JetBrains Mono',monospace"}}>
              <AlertTriangle size={12}/>
              Connect wallet to use ZK Shield
            </div>
          )}

          {/* CTA */}
          {phase === 'idle' && (
            <button onClick={execute} disabled={!isValid || !isConnected}
              className="w-full py-3.5 flex items-center justify-center gap-2 bg-purple-500 text-white text-sm font-bold tracking-wide hover:bg-purple-400 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
              <Shield size={15}/>
              Generate ZK Proof &amp; Send
            </button>
          )}
          {(phase === 'proving' || phase === 'broadcasting') && (
            <button disabled className="w-full py-3.5 flex items-center justify-center gap-2 bg-purple-500/50 text-white text-sm font-bold cursor-not-allowed">
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>
              {phase === 'proving' ? `Generating Proof ${proofPct}%...` : 'Broadcasting...'}
            </button>
          )}
          {phase === 'done' && (
            <button onClick={reset} className="w-full py-3.5 flex items-center justify-center gap-2 bg-emerald-500 text-white text-sm font-bold">
              <Check size={15}/> Done — Send Another
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
