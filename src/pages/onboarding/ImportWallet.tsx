import { useState } from "react";
import { Link } from "react-router-dom";
import { KeyRound, FileText, ArrowRight, Cloud } from "lucide-react";

export default function ImportWallet() {
  const [tab, setTab] = useState<"seed" | "private">("seed");
  const [input, setInput] = useState("");
  const [password, setPassword] = useState("");

  const words = input.trim().split(/\s+/).filter(Boolean);
  const isValid = tab === "seed" ? words.length >= 12 : input.length >= 64;

  return (
    <div className="min-h-screen bg-void flex flex-col px-4 py-8">
      <div className="max-w-md mx-auto w-full">
        <h1 className="font-heading text-2xl text-text-primary">Import Wallet</h1>
        <p className="mt-2 text-text-secondary text-sm">
          Restore your wallet using a seed phrase or private key.
        </p>
      </div>

      {/* Tabs */}
      <div className="max-w-md mx-auto w-full mt-8">
        <div className="flex border border-white/10">
          <button
            onClick={() => { setTab("seed"); setInput(""); }}
            className={`flex-1 flex items-center justify-center gap-2 py-3 font-mono text-xs transition-colors ${
              tab === "seed"
                ? "bg-cyan/10 text-cyan border-b-2 border-cyan"
                : "text-text-secondary hover:text-text-primary"
            }`}
          >
            <FileText size={14} />
            Seed Phrase
          </button>
          <button
            onClick={() => { setTab("private"); setInput(""); }}
            className={`flex-1 flex items-center justify-center gap-2 py-3 font-mono text-xs transition-colors ${
              tab === "private"
                ? "bg-cyan/10 text-cyan border-b-2 border-cyan"
                : "text-text-secondary hover:text-text-primary"
            }`}
          >
            <KeyRound size={14} />
            Private Key
          </button>
        </div>

        {/* Input */}
        <div className="mt-6">
          {tab === "seed" ? (
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="w-full h-32 bg-obsidian border border-white/10 p-4 text-text-primary font-mono text-sm placeholder:text-text-tertiary focus:outline-none focus:border-cyan resize-none"
              placeholder="Enter your 12 or 24 word seed phrase, separated by spaces..."
            />
          ) : (
            <input
              type="password"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="w-full bg-obsidian border border-white/10 px-4 py-3 text-text-primary font-mono text-sm placeholder:text-text-tertiary focus:outline-none focus:border-cyan"
              placeholder="Enter your private key (0x...)"
            />
          )}
          {tab === "seed" && (
            <p className="mt-2 font-mono text-xs text-text-tertiary">
              {words.length} words entered
            </p>
          )}
        </div>

        {/* Password */}
        <div className="mt-6">
          <label className="block font-mono text-xs text-text-secondary mb-2">
            Set Local Password
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-obsidian border border-white/10 px-4 py-3 text-text-primary font-mono text-sm placeholder:text-text-tertiary focus:outline-none focus:border-cyan"
            placeholder="Encrypt your imported wallet"
          />
        </div>

        {/* Cloud Backup */}
        <button className="mt-6 flex items-center gap-2 text-text-secondary hover:text-cyan transition-colors font-mono text-xs">
          <Cloud size={14} />
          Restore from Cloud Backup
        </button>
      </div>

      {/* Import Button */}
      <div className="max-w-md mx-auto w-full mt-auto pt-8">
        {isValid && password.length >= 8 ? (
          <Link
            to="/wallet-home"
            className="flex items-center justify-center gap-2 w-full py-4 bg-cyan text-void font-mono text-sm tracking-wider font-medium hover:bg-opacity-90 transition-all"
          >
            Import Wallet
            <ArrowRight size={16} />
          </Link>
        ) : (
          <button
            disabled
            className="w-full py-4 bg-white/5 text-text-tertiary font-mono text-sm cursor-not-allowed"
          >
            {tab === "seed" ? "Enter 12+ words" : "Enter valid private key"}
          </button>
        )}
      </div>
    </div>
  );
}
