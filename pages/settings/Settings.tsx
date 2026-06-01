import { useState } from 'react';
import { clearWallet } from '@/lib/wallet-store';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronRight, Moon, Sun, Bell, Shield, Globe, Key, LogOut, Info, Wallet } from 'lucide-react';
import { useAccount, useDisconnect } from 'wagmi';

type Section = { icon: React.ReactNode; label: string; sub: string; action?: string; path?: string; toggle?: boolean; danger?: boolean };

export default function Settings() {
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const [darkMode,      setDarkMode]      = useState(true);
  const [notifications, setNotifications] = useState(true);
  const [txAlerts,      setTxAlerts]      = useState(true);
  const [biometric,     setBiometric]     = useState(false);

  const sections: { title: string; items: Section[] }[] = [
    {
      title: 'Appearance',
      items: [
        { icon: darkMode ? <Moon size={16}/> : <Sun size={16}/>, label: 'Dark Mode', sub: darkMode ? 'Enabled' : 'Disabled', toggle: true },
      ],
    },
    {
      title: 'Notifications',
      items: [
        { icon: <Bell size={16}/>, label: 'Push Notifications', sub: 'Price alerts and activity', toggle: true },
        { icon: <Bell size={16}/>, label: 'Transaction Alerts', sub: 'Pending and confirmed', toggle: true },
      ],
    },
    {
      title: 'Security',
      items: [
        { icon: <Key size={16}/>, label: 'Biometric Auth', sub: 'Face ID / Touch ID', toggle: true },
        { icon: <Shield size={16}/>, label: 'ZK Privacy', sub: 'Manage shielded accounts', path: '/zk-send' },
      ],
    },
    {
      title: 'Network',
      items: [
        { icon: <Globe size={16}/>, label: 'Networks', sub: 'Ethereum, Base, Arbitrum, Polygon', path: '/networks' },
      ],
    },
    {
      title: 'Wallet',
      items: [
        { icon: <Wallet size={16}/>, label: 'Connected Wallet', sub: isConnected ? `${address?.slice(0,8)}…${address?.slice(-6)}` : 'Not connected', path: '/wallet-home' },
        { icon: <Info size={16}/>, label: 'App Version', sub: 'Nautica v1.0.0' },
      ],
    },
  ];

  const toggles = [setDarkMode, setNotifications, setTxAlerts, setBiometric];
  const toggleStates = [darkMode, notifications, txAlerts, biometric];
  let toggleIdx = 0;

  return (
    <div className="min-h-screen bg-[#04060C]" style={{ fontFamily: "'Inter',sans-serif" }}>
      <div className="max-w-lg mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-[#E8F0FF] mb-8">Settings</h1>
        <div className="space-y-8">
          {sections.map(section => (
            <div key={section.title}>
              <div className="text-[10px] text-[#3A4A6A] uppercase tracking-wider font-mono mb-3">{section.title}</div>
              <div className="bg-[#0C1220] border border-[#1A2540] divide-y divide-[#1A2540]">
                {section.items.map((item, i) => {
                  const isToggle = item.toggle;
                  const state = isToggle ? toggleStates[toggleIdx] : false;
                  const setter = isToggle ? toggles[toggleIdx] : null;
                  if (isToggle) toggleIdx++;

                  const inner = (
                    <div className="flex items-center gap-4 px-4 py-4 hover:bg-[#070B14] transition-colors cursor-pointer">
                      <div className="text-[#4A6080]">{item.icon}</div>
                      <div className="flex-1">
                        <div className="text-sm font-medium text-[#E8F0FF]">{item.label}</div>
                        <div className="text-xs text-[#4A6080] mt-0.5">{item.sub}</div>
                      </div>
                      {isToggle ? (
                        <div onClick={() => setter?.(!state)} className={`w-11 h-6 rounded-full relative transition-colors cursor-pointer ${state ? 'bg-[#00F5D4]/30' : 'bg-[#1A2540]'}`}>
                          <div className={`absolute top-0.5 w-5 h-5 rounded-full transition-all ${state ? 'left-5 bg-[#00F5D4]' : 'left-0.5 bg-[#4A6080]'}`} />
                        </div>
                      ) : item.path ? (
                        <ChevronRight size={16} className="text-[#3A4A6A]" />
                      ) : null}
                    </div>
                  );
                  return item.path
                    ? <Link key={i} to={item.path}>{inner}</Link>
                    : <div key={i}>{inner}</div>;
                })}
              </div>
            </div>
          ))}

          {isConnected && (
            <button onClick={() => { clearWallet(); disconnect(); }} className="w-full flex items-center justify-center gap-2 px-4 py-3.5 border border-rose-400/30 text-rose-400 text-sm font-bold hover:bg-rose-400/5 transition-all">
              <LogOut size={15} /> Disconnect Wallet
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
