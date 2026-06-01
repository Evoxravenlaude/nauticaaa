import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, Bell, TrendingUp, Shield, Droplets, Zap, Check } from 'lucide-react';

const MOCK_NOTIFS = [
  { id:1, icon:<TrendingUp size={14}/>, color:'text-emerald-400', bg:'bg-emerald-400/10', title:'ETH up 3.2%', sub:'Ethereum crossed $2,900', time:'5 min ago', unread:true },
  { id:2, icon:<Shield size={14}/>, color:'text-purple-400', bg:'bg-purple-400/10', title:'ZK Transfer complete', sub:'0.5 ETH shielded successfully', time:'1 hr ago', unread:true },
  { id:3, icon:<Droplets size={14}/>, color:'text-[#00F5D4]', bg:'bg-[#00F5D4]/10', title:'Liquidity earned', sub:'ETH/USDC pool: +$12.40 fees', time:'3 hr ago', unread:false },
  { id:4, icon:<Zap size={14}/>, color:'text-amber-400', bg:'bg-amber-400/10', title:'Swap executed', sub:'1 ETH → 2,847 USDC at best rate', time:'Yesterday', unread:false },
  { id:5, icon:<Bell size={14}/>, color:'text-[#0EA5E9]', bg:'bg-[#0EA5E9]/10', title:'Price alert triggered', sub:'SOL reached your target of $90', time:'Yesterday', unread:false },
];

export default function Notifications() {
  const [notifs, setNotifs] = useState(MOCK_NOTIFS);

  function markAll() { setNotifs(n => n.map(x => ({ ...x, unread: false }))); }

  return (
    <div className="min-h-screen bg-[#04060C]" style={{ fontFamily: "'Inter',sans-serif" }}>
      <div className="max-w-lg mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Link to="/" className="text-[#4A6080] hover:text-[#E8F0FF] transition-colors"><ChevronLeft size={18}/></Link>
            <h1 className="text-2xl font-bold text-[#E8F0FF]">Notifications</h1>
            {notifs.some(n => n.unread) && (
              <span className="px-2 py-0.5 bg-[#00F5D4]/10 text-[#00F5D4] text-[10px] font-bold font-mono border border-[#00F5D4]/20">
                {notifs.filter(n => n.unread).length} new
              </span>
            )}
          </div>
          <button onClick={markAll} className="flex items-center gap-1.5 text-xs text-[#4A6080] hover:text-[#00F5D4] transition-colors font-mono">
            <Check size={12}/> Mark all read
          </button>
        </div>

        <div className="space-y-2">
          {notifs.map(n => (
            <div key={n.id} className={`flex items-start gap-3 p-4 border transition-colors ${n.unread ? 'bg-[#0C1220] border-[#1A2540]' : 'bg-[#070B14] border-[#1A2540]/50'}`}
              onClick={() => setNotifs(prev => prev.map(x => x.id === n.id ? { ...x, unread: false } : x))}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${n.bg} ${n.color}`}>{n.icon}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-[#E8F0FF]">{n.title}</span>
                  {n.unread && <div className="w-2 h-2 rounded-full bg-[#00F5D4] flex-shrink-0"/>}
                </div>
                <div className="text-xs text-[#4A6080] mt-0.5">{n.sub}</div>
              </div>
              <div className="text-[10px] text-[#3A4A6A] font-mono flex-shrink-0">{n.time}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
