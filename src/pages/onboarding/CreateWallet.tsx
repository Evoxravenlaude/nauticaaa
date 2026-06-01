import { useState } from "react";
import { Link } from "react-router-dom";
import { Copy, AlertTriangle, ArrowRight, EyeOff } from "lucide-react";

const SEED_WORDS = [
  "quantum", "nebula", "cipher", "vertex", "prism", "oracle",
  "lattice", "epoch", "radix", "flux", "nexus", "cipher",
];

export default function CreateWallet() {
  const [revealed, setRevealed] = useState<boolean[]>(new Array(12).fill(false));
  const [copied, setCopied] = useState(false);

  const toggleReveal = (i: number) => {
    setRevealed((prev) => {
      const next = [...prev];
      next[i] = !next[i];
      return next;
    });
  };

  const copyAll = () => {
    navigator.clipboard.writeText(SEED_WORDS.join(" "));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-void flex flex-col px-4 py-8">
      {/* Header */}
      <div className="max-w-md mx-auto w-full">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 bg-cyan/10 rounded-full flex items-center justify-center">
            <span className="text-cyan font-mono text-xs font-bold">01</span>
          </div>
          <span className="font-mono text-xs text-text-secondary">of 3</span>
        </div>
        <h1 className="font-heading text-2xl text-text-primary">Secure Your Wallet</h1>
        <p className="mt-2 text-text-secondary text-sm">
          Write down these 12 words in order and store them in a safe place.
        </p>
      </div>

      {/* Seed Grid */}
      <div className="max-w-md mx-auto w-full mt-8">
        <div className="grid grid-cols-3 gap-2">
          {SEED_WORDS.map((word, i) => (
            <button
              key={i}
              onClick={() => toggleReveal(i)}
              className="relative bg-obsidian border border-white/5 p-3 text-center hover:border-cyan/30 transition-colors"
            >
              <span className="absolute top-1 left-2 font-mono text-[10px] text-text-tertiary">
                {i + 1}
              </span>
              {revealed[i] ? (
                <span className="font-mono text-sm text-text-primary">{word}</span>
              ) : (
                <EyeOff size={16} className="mx-auto text-text-tertiary" />
              )}
            </button>
          ))}
        </div>

        {/* Copy Button */}
        <button
          onClick={copyAll}
          className="mt-4 flex items-center gap-2 text-cyan font-mono text-xs hover:opacity-80 transition-opacity"
        >
          <Copy size={14} />
          {copied ? "Copied!" : "Copy to Clipboard"}
        </button>
      </div>

      {/* Warning */}
      <div className="max-w-md mx-auto w-full mt-6 flex gap-3 bg-red/5 border border-red/20 p-4">
        <AlertTriangle size={20} className="text-red shrink-0 mt-0.5" />
        <div>
          <p className="text-red text-sm font-medium">Never share your seed phrase</p>
          <p className="text-text-secondary text-xs mt-1">
            Anyone with these words can access your wallet. Store them offline in
            a secure location.
          </p>
        </div>
      </div>

      {/* Continue */}
      <div className="max-w-md mx-auto w-full mt-auto pt-8">
        <Link
          to="/confirm-seed"
          className="flex items-center justify-center gap-2 w-full py-4 bg-cyan text-void font-mono text-sm tracking-wider font-medium hover:bg-opacity-90 transition-all"
        >
          Continue
          <ArrowRight size={16} />
        </Link>
      </div>
    </div>
  );
}
