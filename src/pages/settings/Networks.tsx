import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, Check } from 'lucide-react';

const NETWORKS = [
  { id:1,   name:'Ethereum',          sym:'ETH',   type:'Mainnet',  rpc:'eth-mainnet.g.alchemy.com', color:'#627EEA', active:true },
  { id:8453, name:'Base',             sym:'ETH',   type:'L2',       rpc:'mainnet.base.org',           color:'#0052FF', active:true },
  { id:42161,name:'Arbitrum One',     sym:'ETH',   type:'L2',       rpc:'arb1.arbitrum.io/rpc',       color:'#28A0F0', active:true },
  { id:10,   name:'Optimism',         sym:'ETH',   type:'L2',       rpc:'mainnet.optimism.io',        color:'#FF0420', active:false },
  { id:137,  name:'Polygon',          sym:'MATIC', type:'Sidechain',rpc:'polygon-rpc.com',            color:'#8247E5', active:false },
  { id:11155111,name:'Ethereum Sepolia',sym:'ETH', type:'Testnet',  rpc:'sepolia.infura.io',          color:'#627EEA', active:false },
];

export default function Networks() {
  const [active, setActive] = useState<number[]>([1, 8453, 42161]);

  function toggle(id: number) {
    setActive(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  }

  return (
    <div className="min-h-screen bg-[#04060C]" style={{ fontFamily: "'Inter',sans-serif" }}>
      <div className="max-w-lg mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-8">
          <Link to="/settings" className="text-[#4A6080] hover:text-[#E8F0FF]"><ChevronLeft size={18}/></Link>
          <h1 className="text-2xl font-bold text-[#E8F0FF]">Networks</h1>
        </div>

        <div className="space-y-2">
          {NETWORKS.map(net => {
            const isOn = active.includes(net.id);
            return (
              <div key={net.id} onClick={() => toggle(net.id)}
                className="flex items-center gap-4 bg-[#0C1220] border border-[#1A2540] hover:border-[#243060] p-4 cursor-pointer transition-all">
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                  style={{ background: `${net.color}20`, color: net.color }}>{net.sym[0]}</div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-[#E8F0FF]">{net.name}</div>
                  <div className="text-[10px] text-[#3A4A6A] font-mono mt-0.5">{net.type} · Chain {net.id}</div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-[9px] font-bold font-mono px-2 py-0.5 ${isOn ? 'bg-emerald-400/10 text-emerald-400 border border-emerald-400/20' : 'bg-[#1A2540] text-[#3A4A6A]'}`}>
                    {isOn ? 'Active' : 'Off'}
                  </span>
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${isOn ? 'bg-[#00F5D4] border-[#00F5D4]' : 'border-[#1A2540]'}`}>
                    {isOn && <Check size={11} className="text-[#04060C]"/>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <p className="mt-4 text-xs text-[#3A4A6A] font-mono text-center">
          Active networks appear in wallet and swap flows
        </p>
      </div>
    </div>
  );
}
