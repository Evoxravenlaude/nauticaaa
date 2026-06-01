import { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, Copy, Check, Share2 } from "lucide-react";
import { useAccount } from "wagmi";

const TOKENS = ["ETH", "USDC", "WBTC", "DAI", "LINK", "UNI"];

export default function Receive() {
  const [selectedToken, setSelectedToken] = useState("ETH");
  const [copied, setCopied] = useState(false);
  const { address, isConnected } = useAccount();

  const displayAddress = address ?? "";

  const handleCopy = () => {
    if (!displayAddress) return;
    navigator.clipboard.writeText(displayAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-void flex flex-col items-center justify-center px-4">
        <div className="w-16 h-16 rounded-full bg-cyan/10 flex items-center justify-center mb-6">
          <span className="font-heading text-2xl text-cyan">N</span>
        </div>
        <h1 className="font-heading text-xl text-text-primary">Connect Your Wallet</h1>
        <p className="mt-2 text-text-secondary text-sm text-center max-w-sm">
          Connect your wallet to see your receive address.
        </p>
        <Link to="/wallet-home" className="mt-6 font-mono text-xs text-cyan hover:opacity-80">
          ← Back to Wallet
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-void px-4 py-6">
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <Link to="/wallet-home" className="text-text-secondary hover:text-text-primary">
            <ChevronLeft size={20} />
          </Link>
          <h1 className="font-heading text-xl text-text-primary">Receive</h1>
        </div>

        {/* Token Selector */}
        <div className="mb-8">
          <label className="block font-mono text-xs text-text-secondary mb-2">
            Select Token
          </label>
          <div className="flex flex-wrap gap-2">
            {TOKENS.map((token) => (
              <button
                key={token}
                onClick={() => setSelectedToken(token)}
                className={`px-4 py-2 font-mono text-xs border transition-colors ${
                  selectedToken === token
                    ? "border-cyan bg-cyan/10 text-cyan"
                    : "border-white/10 text-text-secondary hover:border-white/20"
                }`}
              >
                {token}
              </button>
            ))}
          </div>
        </div>

        {/* QR Code */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-56 h-56 bg-white p-4 flex items-center justify-center">
            <div className="w-full h-full bg-void relative">
              <svg viewBox="0 0 100 100" className="w-full h-full">
                <rect x="5" y="5" width="25" height="25" fill="white" />
                <rect x="10" y="10" width="15" height="15" fill="black" />
                <rect x="13" y="13" width="9" height="9" fill="white" />
                <rect x="70" y="5" width="25" height="25" fill="white" />
                <rect x="75" y="10" width="15" height="15" fill="black" />
                <rect x="78" y="13" width="9" height="9" fill="white" />
                <rect x="5" y="70" width="25" height="25" fill="white" />
                <rect x="10" y="75" width="15" height="15" fill="black" />
                <rect x="13" y="78" width="9" height="9" fill="white" />
                {[...Array(20)].map((_, i) => (
                  <rect
                    key={i}
                    x={35 + (i % 5) * 8}
                    y={10 + Math.floor(i / 5) * 8}
                    width="5"
                    height="5"
                    fill="white"
                  />
                ))}
                {[...Array(15)].map((_, i) => (
                  <rect
                    key={`b-${i}`}
                    x={10 + (i % 5) * 8}
                    y={40 + Math.floor(i / 5) * 8}
                    width="5"
                    height="5"
                    fill="white"
                  />
                ))}
              </svg>
            </div>
          </div>
          <p className="mt-4 font-mono text-xs text-text-secondary">
            Scan to receive {selectedToken}
          </p>
        </div>

        {/* Address */}
        <div className="bg-obsidian border border-white/5 p-4 mb-4">
          <p className="font-mono text-xs text-text-secondary mb-2">Wallet Address</p>
          <p className="font-mono text-sm text-text-primary break-all">{displayAddress}</p>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={handleCopy}
            className="flex-1 flex items-center justify-center gap-2 py-3 bg-obsidian border border-white/10 text-text-primary font-mono text-xs hover:border-cyan/30 transition-all"
          >
            {copied ? <Check size={14} className="text-cyan" /> : <Copy size={14} />}
            {copied ? "Copied" : "Copy Address"}
          </button>
          <button className="flex-1 flex items-center justify-center gap-2 py-3 bg-obsidian border border-white/10 text-text-primary font-mono text-xs hover:border-cyan/30 transition-all">
            <Share2 size={14} />
            Share
          </button>
        </div>

        {/* Networks */}
        <div className="mt-8">
          <p className="font-mono text-xs text-text-secondary mb-3">Supported Networks</p>
          <div className="flex flex-wrap gap-2">
            {["Ethereum", "Base", "Optimism", "Arbitrum", "Polygon"].map((network) => (
              <span
                key={network}
                className="px-3 py-1 bg-cyan/5 border border-cyan/20 font-mono text-[10px] text-cyan"
              >
                {network}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
