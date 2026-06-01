import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Fingerprint, ShoppingBag, Send, ArrowRight } from "lucide-react";

export default function OnboardingSuccess() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    setTimeout(() => setShow(true), 200);
  }, []);

  const cards = [
    { icon: Send, label: "Try ZK Send", desc: "Send tokens privately", path: "/zk-send" },
    { icon: ShoppingBag, label: "Explore NFTs", desc: "Browse collections", path: "/nft" },
    { icon: Fingerprint, label: "Enable Biometrics", desc: "Face ID / Touch ID", path: "/settings" },
  ];

  return (
    <div className="min-h-screen bg-void flex flex-col px-4 py-8 items-center justify-center">
      {/* Success Animation */}
      <div
        className={`transition-all duration-1000 ${
          show ? "opacity-100 scale-100" : "opacity-0 scale-50"
        }`}
      >
        <div className="w-24 h-24 rounded-full bg-cyan/10 flex items-center justify-center animate-pulse-glow">
          <svg width="64" height="64" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="cg" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#06F5D6"/><stop offset="100%" stopColor="#0EA5E9"/></linearGradient></defs><circle cx="32" cy="32" r="30" fill="none" stroke="url(#cg)" strokeWidth="2"/><path d="M18 33 L27 42 L46 22" stroke="#06F5D6" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/></svg>
        </div>
      </div>

      <h1
        className={`mt-8 font-heading text-3xl text-text-primary transition-all duration-700 delay-300 ${
          show ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
        }`}
      >
        Wallet Ready
      </h1>

      <p
        className={`mt-3 text-text-secondary text-center transition-all duration-700 delay-500 ${
          show ? "opacity-100" : "opacity-0"
        }`}
      >
        You&apos;re all set to explore Nautica
      </p>

      {/* Quick Start Cards */}
      <div
        className={`mt-10 w-full max-w-sm space-y-3 transition-all duration-700 delay-700 ${
          show ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
        }`}
      >
        {cards.map((card) => (
          <Link
            key={card.label}
            to={card.path}
            className="flex items-center gap-4 p-4 bg-obsidian border border-white/5 hover:border-cyan/30 transition-colors"
          >
            <div className="w-10 h-10 bg-cyan/10 rounded-lg flex items-center justify-center">
              <card.icon size={18} className="text-cyan" />
            </div>
            <div className="flex-1">
              <p className="font-body text-sm text-text-primary">{card.label}</p>
              <p className="font-mono text-xs text-text-secondary">{card.desc}</p>
            </div>
            <ArrowRight size={14} className="text-text-tertiary" />
          </Link>
        ))}
      </div>

      {/* Go to Dashboard */}
      <div
        className={`mt-8 w-full max-w-sm transition-all duration-700 delay-1000 ${
          show ? "opacity-100" : "opacity-0"
        }`}
      >
        <Link
          to="/wallet-home"
          className="flex items-center justify-center gap-2 w-full py-4 bg-cyan text-void font-mono text-sm tracking-wider font-medium hover:bg-opacity-90 transition-all"
        >
          Go to Dashboard
          <ArrowRight size={16} />
        </Link>
      </div>
    </div>
  );
}
