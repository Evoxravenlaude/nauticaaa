/**
 * CreateWallet — Step 1 of 3
 *
 * Generates a REAL BIP-39 12-word mnemonic via viem and displays it.
 * The mnemonic is passed forward via React Router navigation state so
 * it is never written to localStorage in plaintext.
 */
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Copy, Check, AlertTriangle, ArrowRight, EyeOff, Eye, RefreshCw } from "lucide-react";
import { createMnemonic } from "@/lib/wallet-store";

export default function CreateWallet() {
  const [mnemonic, setMnemonic]   = useState<string[]>([]);
  const [revealed,  setRevealed]  = useState(false);
  const [copied,    setCopied]    = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  // Generate a real mnemonic on mount
  useEffect(() => {
    setMnemonic(createMnemonic().split(" "));
  }, []);

  const handleRegenerate = () => {
    setMnemonic(createMnemonic().split(" "));
    setConfirmed(false);
    setCopied(false);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(mnemonic.join(" ")).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  if (mnemonic.length === 0) {
    return (
      <div className="min-h-screen bg-void flex items-center justify-center">
        <p className="font-mono text-xs text-text-secondary animate-pulse">
          Generating secure seed phrase…
        </p>
      </div>
    );
  }

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
          Write down these 12 words in order and store them somewhere safe.
          They are the only way to recover your wallet.
        </p>
      </div>

      {/* Reveal toggle */}
      <div className="max-w-md mx-auto w-full mt-6 flex items-center justify-between">
        <button
          onClick={() => setRevealed((v) => !v)}
          className="flex items-center gap-2 font-mono text-xs text-text-secondary hover:text-text-primary transition-colors"
        >
          {revealed ? <EyeOff size={14} /> : <Eye size={14} />}
          {revealed ? "Hide words" : "Tap to reveal"}
        </button>
        <button
          onClick={handleRegenerate}
          className="flex items-center gap-2 font-mono text-xs text-text-tertiary hover:text-text-secondary transition-colors"
        >
          <RefreshCw size={12} />
          Regenerate
        </button>
      </div>

      {/* Seed grid */}
      <div className="max-w-md mx-auto w-full mt-3">
        <div
          className={`grid grid-cols-3 gap-2 transition-all ${
            !revealed ? "blur-md select-none pointer-events-none" : ""
          }`}
        >
          {mnemonic.map((word, i) => (
            <div
              key={i}
              className="relative bg-obsidian border border-white/5 p-3 text-center"
            >
              <span className="absolute top-1 left-2 font-mono text-[10px] text-text-tertiary">
                {i + 1}
              </span>
              <span className="font-mono text-sm text-text-primary">{word}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Copy */}
      {revealed && (
        <div className="max-w-md mx-auto w-full mt-4">
          <button
            onClick={handleCopy}
            className="flex items-center gap-2 text-cyan font-mono text-xs hover:opacity-80 transition-opacity"
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
            {copied ? "Copied to clipboard" : "Copy to clipboard"}
          </button>
        </div>
      )}

      {/* Warning */}
      <div className="max-w-md mx-auto w-full mt-6 flex gap-3 bg-red-500/5 border border-red-500/20 p-4">
        <AlertTriangle size={20} className="text-red-400 shrink-0 mt-0.5" />
        <div>
          <p className="text-red-400 text-sm font-medium">Never share your seed phrase</p>
          <p className="text-text-secondary text-xs mt-1">
            Anyone with these 12 words can take full control of your wallet. Store
            them offline — not in screenshots, cloud notes, or email.
          </p>
        </div>
      </div>

      {/* Confirm checkbox */}
      {revealed && (
        <div className="max-w-md mx-auto w-full mt-4">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={confirmed}
              onChange={(e) => setConfirmed(e.target.checked)}
              className="w-4 h-4 accent-cyan"
            />
            <span className="font-mono text-xs text-text-secondary">
              I have written down my seed phrase in a safe place.
            </span>
          </label>
        </div>
      )}

      {/* Continue — passes mnemonic via navigation state (never touches localStorage) */}
      <div className="max-w-md mx-auto w-full mt-auto pt-8">
        {confirmed ? (
          <Link
            to="/confirm-seed"
            state={{ mnemonic }}
            className="flex items-center justify-center gap-2 w-full py-4 bg-cyan text-void font-mono text-sm tracking-wider font-medium hover:bg-opacity-90 transition-all"
          >
            Continue
            <ArrowRight size={16} />
          </Link>
        ) : (
          <button
            disabled
            className="w-full py-4 bg-white/5 text-text-tertiary font-mono text-sm cursor-not-allowed"
          >
            {revealed ? "Confirm you've saved your phrase to continue" : "Reveal your seed phrase to continue"}
          </button>
        )}
      </div>
    </div>
  );
}
