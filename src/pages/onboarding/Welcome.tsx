import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Import, Plus } from "lucide-react";

export default function Welcome() {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setTimeout(() => setLoaded(true), 100);
  }, []);

  return (
    <div className="fixed inset-0 bg-void flex flex-col items-center justify-center px-6">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-radial from-cyan/5 via-transparent to-transparent opacity-50" />

      {/* Logo */}
      <div
        className={`transition-all duration-1000 ${
          loaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
        }`}
      >
        <img src="/logo.png" alt="Nautica" className="w-28 h-28 object-contain" />
      </div>

      {/* Title */}
      <h1
        className={`mt-8 font-heading text-4xl md:text-5xl text-text-primary text-center transition-all duration-1000 delay-200 ${
          loaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
        }`}
      >
        Nautica
      </h1>

      <p
        className={`mt-4 text-text-secondary text-center max-w-md transition-all duration-1000 delay-300 ${
          loaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
        }`}
      >
        Execute at the speed of thought. Trade, collect, and verify on a
        ZK-native chain. Zero slippage, infinite scale.
      </p>

      {/* CTA Buttons */}
      <div
        className={`mt-12 w-full max-w-sm space-y-4 transition-all duration-1000 delay-500 ${
          loaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
        }`}
      >
        <Link
          to="/create-wallet"
          className="flex items-center justify-center gap-3 w-full py-4 bg-cyan text-void font-mono text-sm tracking-wider font-medium hover:bg-opacity-90 transition-all active:scale-[0.97]"
        >
          <Plus size={18} />
          Create New Wallet
        </Link>

        <Link
          to="/import-wallet"
          className="flex items-center justify-center gap-3 w-full py-4 border border-white/10 text-text-primary font-mono text-sm tracking-wider hover:border-cyan/50 hover:text-cyan transition-all active:scale-[0.97]"
        >
          <Import size={18} />
          Import Existing
        </Link>
      </div>

      {/* Terms */}
      <p
        className={`mt-8 text-xs text-text-tertiary text-center max-w-xs transition-all duration-1000 delay-700 ${
          loaded ? "opacity-100" : "opacity-0"
        }`}
      >
        By continuing, you agree to our{" "}
        <span className="text-cyan cursor-pointer">Terms of Service</span> and{" "}
        <span className="text-cyan cursor-pointer">Privacy Policy</span>
      </p>
    </div>
  );
}
