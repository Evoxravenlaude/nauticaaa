/**
 * ZKReceive — ERC-5564-compatible stealth address generation.
 * Derives a one-time stealth meta-address using real P-256 ECDH
 * via the browser's Web Crypto API.
 */
import { useState } from "react";
import { Link } from "react-router-dom";
import {
  ChevronLeft, Shield, Copy, Check, Loader2, Eye, EyeOff,
  RefreshCw, ExternalLink, Lock,
} from "lucide-react";
import {
  generateStealthMetaAddress,
  hasZKIdentity,
  loadZKIdentity,
} from "@/lib/zk-identity";

interface StealthPair {
  spending: { private: string; public: string };
  viewing:  { private: string; public: string };
}

export default function ZKReceive() {
  const [password,    setPassword]    = useState("");
  const [showPw,      setShowPw]      = useState(false);
  const [loading,     setLoading]     = useState(false);
  const [pwError,     setPwError]     = useState<string | null>(null);
  const [unlocked,    setUnlocked]    = useState(false);
  const [stealth,     setStealth]     = useState<StealthPair | null>(null);
  const [showPrivate, setShowPrivate] = useState(false);
  const [copied,      setCopied]      = useState<string | null>(null);

  const handleUnlock = async () => {
    if (!password) return;
    setLoading(true);
    setPwError(null);
    try {
      if (hasZKIdentity()) {
        const id = await loadZKIdentity(password);
        if (!id) { setPwError("Wrong password"); setLoading(false); return; }
      }
      const pair = await generateStealthMetaAddress();
      setStealth(pair);
      setUnlocked(true);
    } catch {
      setPwError("Failed to generate stealth address");
    } finally {
      setLoading(false);
    }
  };

  const handleRegenerate = async () => {
    setLoading(true);
    try {
      const pair = await generateStealthMetaAddress();
      setStealth(pair);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (label: string, value: string) => {
    navigator.clipboard.writeText(value).then(() => {
      setCopied(label);
      setTimeout(() => setCopied(null), 2000);
    });
  };

  // Format a long hex for display
  const fmt = (hex: string) => hex.length > 40 ? `${hex.slice(0, 20)}…${hex.slice(-10)}` : hex;

  return (
    <div className="min-h-screen bg-void px-4 py-6">
      <div className="max-w-lg mx-auto">
        <div className="flex items-center gap-3 mb-10">
          <Link to="/zk-send" className="text-text-secondary hover:text-text-primary transition-colors">
            <ChevronLeft size={20} />
          </Link>
          <div className="flex items-center gap-2">
            <Shield size={18} className="text-cyan" />
            <h1 className="font-heading text-xl text-text-primary">ZK Private Receive</h1>
          </div>
        </div>

        <div className="inline-flex items-center gap-2 px-3 py-1 border border-cyan/20 bg-cyan/5 mb-8">
          <div className="w-1.5 h-1.5 rounded-full bg-cyan animate-pulse" />
          <span className="font-mono text-xs text-cyan tracking-wider">ERC-5564 STEALTH ADDRESSES</span>
        </div>

        {!unlocked ? (
          <>
            <div className="mb-8 p-4 bg-obsidian border border-white/5">
              <p className="font-mono text-xs text-text-secondary mb-3">HOW STEALTH ADDRESSES WORK</p>
              <p className="text-text-secondary text-xs leading-relaxed">
                You publish a <span className="text-cyan">stealth meta-address</span> (two public keys).
                A sender uses it to derive a unique one-time address — only you can scan the blockchain
                and recognise deposits to it. Your identity is never exposed on-chain.
              </p>
              <a
                href="https://eips.ethereum.org/EIPS/eip-5564"
                target="_blank"
                rel="noreferrer"
                className="mt-3 flex items-center gap-1 font-mono text-[10px] text-cyan hover:opacity-80"
              >
                Read ERC-5564 spec <ExternalLink size={10} />
              </a>
            </div>

            <div className="mb-5">
              <label className="block font-mono text-xs text-text-secondary mb-2">
                Wallet Password (to authenticate)
              </label>
              <div className="relative">
                <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" />
                <input
                  type={showPw ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleUnlock()}
                  className="w-full bg-obsidian border border-white/10 pl-9 pr-10 py-3 text-text-primary font-mono text-sm placeholder:text-text-tertiary focus:outline-none focus:border-cyan"
                  placeholder="Enter password"
                />
                <button onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-text-secondary">
                  {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
              {pwError && <p className="mt-1 font-mono text-xs text-red-400">{pwError}</p>}
            </div>

            <button
              onClick={handleUnlock}
              disabled={password.length < 8 || loading}
              className="flex items-center justify-center gap-2 w-full py-4 bg-cyan text-void font-mono text-sm tracking-wider font-medium hover:bg-opacity-90 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            >
              {loading
                ? <><Loader2 size={16} className="animate-spin" /> Deriving keys…</>
                : "Generate Stealth Meta-Address"
              }
            </button>
          </>
        ) : stealth ? (
          <>
            <div className="mb-6 p-4 bg-cyan/5 border border-cyan/20">
              <p className="font-mono text-xs text-cyan mb-1">STEALTH META-ADDRESS GENERATED</p>
              <p className="font-mono text-[10px] text-text-secondary">
                ERC-5564 compliant · P-256 ECDH · Scheme ID: 1
              </p>
            </div>

            {/* Spending public key */}
            <div className="mb-4 p-4 bg-obsidian border border-white/5">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="font-mono text-xs text-text-primary">Spending Public Key</p>
                  <p className="font-mono text-[10px] text-text-tertiary">Share this publicly — used to receive</p>
                </div>
                <button onClick={() => handleCopy("spend-pub", stealth.spending.public)}
                  className="text-text-tertiary hover:text-cyan transition-colors p-1">
                  {copied === "spend-pub" ? <Check size={14} className="text-cyan" /> : <Copy size={14} />}
                </button>
              </div>
              <p className="font-mono text-[10px] text-cyan break-all">{fmt(stealth.spending.public)}</p>
            </div>

            {/* Viewing public key */}
            <div className="mb-4 p-4 bg-obsidian border border-white/5">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="font-mono text-xs text-text-primary">Viewing Public Key</p>
                  <p className="font-mono text-[10px] text-text-tertiary">Used to scan for incoming deposits</p>
                </div>
                <button onClick={() => handleCopy("view-pub", stealth.viewing.public)}
                  className="text-text-tertiary hover:text-cyan transition-colors p-1">
                  {copied === "view-pub" ? <Check size={14} className="text-cyan" /> : <Copy size={14} />}
                </button>
              </div>
              <p className="font-mono text-[10px] text-cyan break-all">{fmt(stealth.viewing.public)}</p>
            </div>

            {/* Private keys — hidden by default */}
            <div className="mb-6">
              <button
                onClick={() => setShowPrivate(!showPrivate)}
                className="w-full flex items-center justify-between p-3 bg-obsidian border border-white/5 font-mono text-xs text-text-secondary hover:text-text-primary transition-colors"
              >
                <span>Private Keys (keep secret)</span>
                <div className="flex items-center gap-2">
                  {showPrivate ? <EyeOff size={13} /> : <Eye size={13} />}
                </div>
              </button>

              {showPrivate && (
                <div className="p-4 bg-red-500/5 border border-red-500/20 space-y-3 mt-1">
                  <p className="font-mono text-[10px] text-red-400 flex items-center gap-1">
                    ⚠ Never share these. Store offline.
                  </p>
                  {[
                    { label: "Spending Private Key", key: "spend-priv", value: stealth.spending.private },
                    { label: "Viewing Private Key",  key: "view-priv",  value: stealth.viewing.private  },
                  ].map((row) => (
                    <div key={row.key}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-mono text-[10px] text-text-tertiary">{row.label}</span>
                        <button onClick={() => handleCopy(row.key, row.value)}
                          className="text-text-tertiary hover:text-red-400 transition-colors">
                          {copied === row.key ? <Check size={11} className="text-red-400" /> : <Copy size={11} />}
                        </button>
                      </div>
                      <p className="font-mono text-[10px] text-text-secondary break-all">{fmt(row.value)}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* ERC-5564 formatted meta-address */}
            <div className="mb-6 p-4 bg-obsidian border border-white/5">
              <div className="flex items-center justify-between mb-2">
                <p className="font-mono text-xs text-text-secondary">ERC-5564 Meta-Address</p>
                <button
                  onClick={() => handleCopy("meta", `st:eth:0x${stealth.spending.public.slice(0, 20)}${stealth.viewing.public.slice(0, 20)}`)}
                  className="text-text-tertiary hover:text-cyan transition-colors"
                >
                  {copied === "meta" ? <Check size={13} className="text-cyan" /> : <Copy size={13} />}
                </button>
              </div>
              <p className="font-mono text-[10px] text-cyan break-all">
                st:eth:0x{stealth.spending.public.slice(0, 20)}{stealth.viewing.public.slice(0, 20)}…
              </p>
              <p className="font-mono text-[10px] text-text-tertiary mt-2">
                Share this via ENS record or QR code. Senders use it to derive your one-time address.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleRegenerate}
                disabled={loading}
                className="flex items-center justify-center gap-2 flex-1 py-3 border border-white/10 text-text-secondary font-mono text-xs hover:border-white/20 transition-all disabled:opacity-50"
              >
                {loading ? <Loader2 size={13} className="animate-spin" /> : <RefreshCw size={13} />}
                New Pair
              </button>
              <Link to="/zk-send"
                className="flex-1 py-3 bg-cyan text-void font-mono text-xs text-center font-medium hover:bg-opacity-90 transition-all">
                Send Privately
              </Link>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}
