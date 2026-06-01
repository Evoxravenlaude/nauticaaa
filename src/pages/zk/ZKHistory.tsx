import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, Shield, ArrowUpRight, ArrowDownLeft, ArrowLeftRight, ExternalLink, Download, Search } from 'lucide-react';

type TxType = 'shield' | 'unshield' | 'transfer' | 'swap';
type Status = 'confirmed' | 'pending' | 'failed';

interface ZKTx {
  id: string; type: TxType; amount: string; token: string;
  status: Status; proofMs: number; txHash: string;
  timestamp: number; recipient?: string; privacyLevel: string;
}

const HISTORY: ZKTx[] = [
  { id:'1', type:'transfer', amount:'0.50',  token:'ETH',  status:'confirmed', proofMs:1840, txHash:'0x3a4f…8b2c', timestamp:Date.now()-180000,   recipient:'0x9b2c…4a1f', privacyLevel:'Enhanced' },
  { id:'2', type:'shield',   amount:'200',   token:'USDC', status:'confirmed', proofMs:820,  txHash:'0x7f1a…3d9e', timestamp:Date.now()-3600000,  privacyLevel:'Standard' },
  { id:'3', type:'swap',     amount:'1.20',  token:'ETH',  status:'confirmed', proofMs:4180, txHash:'0x2b8e…1c4f', timestamp:Date.now()-86400000, privacyLevel:'Maximum' },
  { id:'4', type:'unshield', amount:'100',   token:'USDC', status:'confirmed', proofMs:960,  txHash:'0x8d2a…6f1b', timestamp:Date.now()-172800000,privacyLevel:'Standard' },
  { id:'5', type:'transfer', amount:'0.025', token:'WBTC', status:'pending',   proofMs:0,    txHash:'0x1c3e…9a4d', timestamp:Date.now()-60000,    recipient:'0x4f1a…8c2e', privacyLevel:'Enhanced' },
];

const TYPE_META: Record<TxType, { icon: React.ReactNode; label: string; color: string; bg: string }> = {
  shield:   { icon:<Shield size={14}/>,           label:'Shield',   color:'text-purple-400',  bg:'bg-purple-400/10' },
  unshield: { icon:<ArrowUpRight size={14}/>,     label:'Unshield', color:'text-amber-400',   bg:'bg-amber-400/10' },
  transfer: { icon:<ArrowLeftRight size={14}/>,   label:'Send',     color:'text-[#00F5D4]',   bg:'bg-[#00F5D4]/10' },
  swap:     { icon:<ArrowDownLeft size={14}/>,    label:'ZK Swap',  color:'text-emerald-400', bg:'bg-emerald-400/10' },
};

const STATUS_STYLE: Record<Status, string> = {
  confirmed: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
  pending:   'text-amber-400 bg-amber-400/10 border-amber-400/20',
  failed:    'text-rose-400 bg-rose-400/10 border-rose-400/20',
};

function timeAgo(ts: number) {
  const d = Date.now() - ts;
  if (d < 3600000) return `${Math.floor(d/60000)}m ago`;
  if (d < 86400000) return `${Math.floor(d/3600000)}h ago`;
  return `${Math.floor(d/86400000)}d ago`;
}

export default function ZKHistory() {
  const [filter, setFilter] = useState<'all'|TxType>('all');
  const [search, setSearch] = useState('');

  const filtered = HISTORY.filter(tx =>
    (filter === 'all' || tx.type === filter) &&
    (!search || tx.token.toLowerCase().includes(search.toLowerCase()) || tx.txHash.includes(search))
  );

  const totalShielded = HISTORY.filter(t=>t.type==='shield' && t.status==='confirmed').reduce((s,t)=>s+parseFloat(t.amount),0);
  const avgProof = Math.round(HISTORY.filter(t=>t.proofMs>0).reduce((s,t)=>s+t.proofMs,0) / HISTORY.filter(t=>t.proofMs>0).length);

  return (
    <div className="min-h-screen bg-[#04060C]" style={{ fontFamily:"'Inter',sans-serif" }}>
      <div className="border-b border-[#1A2540] px-5 py-3 flex items-center gap-3 bg-[#070B14]">
        <Link to="/zk-send" className="text-[#4A6080] hover:text-[#E8F0FF] transition-colors"><ChevronLeft size={18}/></Link>
        <Shield size={16} className="text-purple-400"/>
        <span className="font-semibold text-[#E8F0FF]">ZK History</span>
        <span className="ml-auto text-[10px] font-mono text-[#3A4A6A]">Railgun · Private</span>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label:'Total Shielded', val:`${totalShielded.toFixed(2)} ETH equiv`, color:'text-purple-400' },
            { label:'Avg Proof Time', val:`${avgProof}ms`, color:'text-[#00F5D4]' },
            { label:'Transactions', val:String(HISTORY.length), color:'text-emerald-400' },
          ].map(s=>(
            <div key={s.label} className="bg-[#0C1220] border border-[#1A2540] p-3 text-center">
              <div className={`text-base font-bold font-mono ${s.color}`}>{s.val}</div>
              <div className="text-[9px] text-[#3A4A6A] font-mono uppercase tracking-wider mt-1">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Filters + search */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex items-center gap-2 bg-[#0C1220] border border-[#1A2540] px-3 py-2 flex-1">
            <Search size={13} className="text-[#3A4A6A]"/>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search by token, hash…"
              className="bg-transparent text-xs text-[#E8F0FF] outline-none font-mono flex-1 placeholder:text-[#3A4A6A]"/>
          </div>
          <div className="flex gap-1">
            {(['all','shield','unshield','transfer','swap'] as const).map(f=>(
              <button key={f} onClick={()=>setFilter(f)}
                className={`px-3 py-2 text-[10px] font-mono capitalize border transition-colors ${filter===f?'border-purple-400/40 text-purple-400 bg-purple-400/5':'border-[#1A2540] text-[#3A4A6A] hover:text-[#7A8BA8]'}`}>
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* Tx list */}
        <div className="space-y-2">
          {filtered.length === 0 ? (
            <div className="text-center py-12 text-[#3A4A6A] text-sm font-mono">No transactions found</div>
          ) : filtered.map(tx => {
            const meta = TYPE_META[tx.type];
            return (
              <div key={tx.id} className="bg-[#0C1220] border border-[#1A2540] hover:border-[#243060] p-4 transition-all">
                <div className="flex items-start gap-3">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${meta.bg} ${meta.color}`}>{meta.icon}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-[#E8F0FF]">{meta.label} {tx.amount} {tx.token}</span>
                      <span className={`text-[9px] font-bold font-mono px-2 py-0.5 border ${STATUS_STYLE[tx.status]}`}>{tx.status}</span>
                    </div>
                    <div className="flex items-center gap-3 mt-1 flex-wrap">
                      <span className="text-[10px] text-[#3A4A6A] font-mono">{tx.txHash}</span>
                      {tx.recipient && <span className="text-[10px] text-[#3A4A6A] font-mono">→ {tx.recipient}</span>}
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="text-[10px] text-[#3A4A6A] font-mono">{timeAgo(tx.timestamp)}</div>
                    {tx.proofMs > 0 && <div className="text-[10px] text-purple-400 font-mono mt-0.5">{tx.proofMs}ms proof</div>}
                    <div className={`text-[9px] font-bold mt-0.5 ${tx.privacyLevel==='Maximum'?'text-purple-400':tx.privacyLevel==='Enhanced'?'text-[#00F5D4]':'text-[#4A6080]'}`}>{tx.privacyLevel}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 mt-3 pt-3 border-t border-[#1A2540]">
                  <a href={`https://etherscan.io/tx/${tx.txHash}`} target="_blank" rel="noreferrer"
                    className="flex items-center gap-1 text-[10px] text-[#4A6080] hover:text-[#00F5D4] font-mono transition-colors">
                    <ExternalLink size={10}/> Etherscan
                  </a>
                  <button className="flex items-center gap-1 text-[10px] text-[#4A6080] hover:text-[#00F5D4] font-mono transition-colors">
                    <Download size={10}/> Export proof
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
