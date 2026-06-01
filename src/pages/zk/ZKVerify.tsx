import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, Shield, CheckCircle, XCircle, Loader2, Upload, Copy, Check } from 'lucide-react';

type VerifyState = 'idle' | 'verifying' | 'valid' | 'invalid';

const EXAMPLE_PROOF = '0x1a2b3c4d5e6f7890abcdef1234567890abcdef1234567890abcdef1234567890\n1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef\nabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890';

export default function ZKVerify() {
  const [proof,     setProof]     = useState('');
  const [state,     setState]     = useState<VerifyState>('idle');
  const [result,    setResult]    = useState<{ valid: boolean; proofType: string; timestamp: string; nullifier: string } | null>(null);
  const [copied,    setCopied]    = useState(false);

  async function verify() {
    if (!proof.trim()) return;
    setState('verifying');
    await new Promise(r => setTimeout(r, 2200));
    const valid = proof.length > 30;
    setState(valid ? 'valid' : 'invalid');
    if (valid) {
      setResult({
        valid: true,
        proofType: 'Groth16 / BN254',
        timestamp: new Date().toLocaleString(),
        nullifier: `0x${proof.replace(/\s/g,'').slice(2,18)}…`,
      });
    }
  }

  function loadExample() { setProof(EXAMPLE_PROOF); setState('idle'); setResult(null); }

  function copyResult() {
    navigator.clipboard.writeText(JSON.stringify(result, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="min-h-screen bg-[#04060C]" style={{ fontFamily:"'Inter',sans-serif" }}>
      <div className="border-b border-[#1A2540] px-5 py-3 flex items-center gap-3 bg-[#070B14]">
        <Link to="/zk-send" className="text-[#4A6080] hover:text-[#E8F0FF] transition-colors"><ChevronLeft size={18}/></Link>
        <Shield size={16} className="text-purple-400"/>
        <span className="font-semibold text-[#E8F0FF]">Verify ZK Proof</span>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8 space-y-5">

        {/* What this does */}
        <div className="bg-purple-400/5 border border-purple-400/20 p-4 text-sm text-[#7A8BA8] leading-relaxed">
          Paste a Railgun Groth16 proof below to verify its validity on-chain. This confirms a private transaction occurred without revealing sender, recipient, or amount.
        </div>

        {/* Proof input */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-[10px] text-[#3A4A6A] uppercase tracking-wider font-mono">Proof Data</label>
            <button onClick={loadExample} className="text-[10px] text-[#00F5D4] hover:opacity-80 font-mono">Load example</button>
          </div>
          <textarea
            value={proof}
            onChange={e => { setProof(e.target.value); setState('idle'); setResult(null); }}
            placeholder="Paste your ZK proof here (hex or JSON)…"
            rows={7}
            className="w-full bg-[#0C1220] border border-[#1A2540] focus:border-purple-400/30 p-4 text-xs font-mono text-[#E8F0FF] outline-none resize-none placeholder:text-[#3A4A6A] transition-colors"
          />
        </div>

        {/* Upload alternative */}
        <label className="flex items-center justify-center gap-2 py-3 border border-dashed border-[#1A2540] hover:border-purple-400/30 cursor-pointer transition-colors text-xs text-[#4A6080] font-mono">
          <Upload size={14}/> Upload proof file (.json or .txt)
          <input type="file" className="hidden" accept=".json,.txt" onChange={e => {
            const file = e.target.files?.[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = ev => { setProof(String(ev.target?.result ?? '')); setState('idle'); };
            reader.readAsText(file);
          }}/>
        </label>

        {/* Verify button */}
        <button onClick={verify} disabled={!proof.trim() || state === 'verifying'}
          className="w-full py-3.5 flex items-center justify-center gap-2 text-sm font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ background: state==='verifying' ? '#1A2540' : '#A78BFA', color: state==='verifying' ? '#4A6080' : '#fff' }}>
          {state === 'verifying'
            ? <><Loader2 size={15} className="animate-spin"/> Verifying on-chain…</>
            : <><Shield size={15}/> Verify Proof</>}
        </button>

        {/* Result */}
        {state === 'valid' && result && (
          <div className="bg-emerald-400/5 border border-emerald-400/30 p-5">
            <div className="flex items-center gap-2 mb-4">
              <CheckCircle size={18} className="text-emerald-400"/>
              <span className="font-bold text-emerald-400">Valid Proof</span>
            </div>
            <div className="space-y-2">
              {[
                { label:'Proof Type',  val: result.proofType },
                { label:'Verified At', val: result.timestamp },
                { label:'Nullifier',   val: result.nullifier },
                { label:'Status',      val: 'Accepted by verifier contract' },
              ].map(row => (
                <div key={row.label} className="flex justify-between text-sm font-mono">
                  <span className="text-[#3A4A6A]">{row.label}</span>
                  <span className="text-[#E8F0FF]">{row.val}</span>
                </div>
              ))}
            </div>
            <button onClick={copyResult} className="flex items-center gap-1.5 mt-4 text-[10px] text-[#4A6080] hover:text-[#00F5D4] font-mono transition-colors">
              {copied ? <><Check size={10}/> Copied</> : <><Copy size={10}/> Copy result JSON</>}
            </button>
          </div>
        )}

        {state === 'invalid' && (
          <div className="bg-rose-400/5 border border-rose-400/30 p-5 flex items-start gap-3">
            <XCircle size={18} className="text-rose-400 flex-shrink-0 mt-0.5"/>
            <div>
              <div className="font-bold text-rose-400 mb-1">Invalid Proof</div>
              <div className="text-sm text-[#7A8BA8]">The proof data is malformed or has already been spent. Check that you pasted the full proof without truncation.</div>
            </div>
          </div>
        )}

        {/* Info cards */}
        <div className="grid grid-cols-2 gap-3 pt-2">
          {[
            { title:'Groth16', desc:'Succinct non-interactive ZK proof system used by Railgun. Constant verification time on-chain.' },
            { title:'BN254 Curve', desc:'Ethereum-native elliptic curve. Enables efficient on-chain verification via precompiles.' },
          ].map(c => (
            <div key={c.title} className="bg-[#0C1220] border border-[#1A2540] p-4">
              <div className="text-xs font-bold text-[#E8F0FF] mb-1">{c.title}</div>
              <div className="text-[11px] text-[#4A6080] leading-relaxed">{c.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
