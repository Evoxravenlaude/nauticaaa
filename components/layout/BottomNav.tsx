import { Link, useLocation } from "react-router-dom";
import { Home, ArrowLeftRight, Image, Shield, Settings } from "lucide-react";

const tabs = [
  { icon: Home, label: "Home", path: "/" },
  { icon: ArrowLeftRight, label: "DEX", path: "/dex" },
  { icon: Image, label: "NFTs", path: "/nft" },
  { icon: Shield, label: "ZK", path: "/zk-send" },
  { icon: Settings, label: "Settings", path: "/settings" },
];

export default function BottomNav() {
  const location = useLocation();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 liquid-glass border-t border-white/5"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}>
      <div className="flex items-center justify-around h-16">
        {tabs.map((tab) => {
          const isActive = location.pathname === tab.path;
          return (
            <Link
              key={tab.path}
              to={tab.path}
              className={`flex flex-col items-center gap-1 py-2 px-3 transition-colors ${
                isActive ? "text-cyan" : "text-text-tertiary"
              }`}
            >
              <tab.icon size={20} strokeWidth={isActive ? 2.5 : 1.5} />
              <span className={`text-[10px] font-mono ${isActive ? "font-medium" : ""}`}>
                {tab.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
