/**
 * TokenSelector — reusable modal/drawer for picking any ERC-20 token.
 * - Searches Uniswap default list (https://tokens.uniswap.org)
 * - Paste any contract address → resolves via Alchemy metadata
 * - Persists custom tokens to localStorage
 * Used by Swap.tsx and Send.tsx.
 */
import { useState, useEffect, useRef } from "react";
import { Search, X, Plus, Trash2, Loader2, ExternalLink } from "lucide-react";
import {
  searchTokens,
  lookupTokenByAddress,
  loadCustomTokens,
  saveCustomToken,
  removeCustomToken,
  FALLBACK_TOKENS,
  type Token,
} from "@/lib/token-list";
import { isAddress } from "viem";

interface Props {
  open:      boolean;
  onClose:   () => void;
  onSelect:  (token: Token) => void;
  exclude?:  string;   // address to exclude (e.g. the other side of a swap)
  title?:    string;
}

export default function TokenSelector({ open, onClose, onSelect, exclude, title = "Select Token" }: Props) {
  const [query,    setQuery]    = useState("");
  const [results,  setResults]  = useState<Token[]>(FALLBACK_TOKENS.slice(0, 10));
  const [custom,   setCustom]   = useState<Token[]>([]);
  const [loading,  setLoading]  = useState(false);
  const [addrErr,  setAddrErr]  = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setQuery("");
      setResults(FALLBACK_TOKENS.slice(0, 10));
      setCustom(loadCustomTokens());
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const t = setTimeout(async () => {
      setAddrErr(null);
      if (!query) { setResults(FALLBACK_TOKENS.slice(0, 10)); return; }

      // Exact address lookup
      if (isAddress(query)) {
        setLoading(true);
        const found = await lookupTokenByAddress(query);
        setLoading(false);
        if (found) setResults([found]);
        else setAddrErr("No ERC-20 token found at this address.");
        return;
      }

      setLoading(true);
      const res = await searchTokens(query);
      setLoading(false);
      setResults(res);
    }, 300);
    return () => clearTimeout(t);
  }, [query, open]);

  const handleSelect = (token: Token) => {
    if (exclude && token.address.toLowerCase() === exclude.toLowerCase()) return;
    onSelect(token);
    onClose();
  };

  const handleAddCustom = async (token: Token) => {
    saveCustomToken(token);
    setCustom(loadCustomTokens());
  };

  const handleRemoveCustom = (address: string) => {
    removeCustomToken(address);
    setCustom(loadCustomTokens());
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center px-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      {/* Panel */}
      <div className="relative w-full max-w-md bg-obsidian border border-white/10 flex flex-col max-h-[80vh] sm:max-h-[600px]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/5">
          <h2 className="font-heading text-base text-text-primary">{title}</h2>
          <button onClick={onClose} className="text-text-tertiary hover:text-text-primary transition-colors" aria-label="Close">
            <X size={18} />
          </button>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-white/5">
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full bg-void border border-white/10 pl-9 pr-4 py-2 font-mono text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-cyan"
              placeholder="Search name, symbol, or paste address…"
              aria-label="Search tokens"
            />
            {loading && <Loader2 size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-cyan animate-spin" />}
          </div>
          {addrErr && <p className="mt-1 font-mono text-[10px] text-red-400">{addrErr}</p>}
        </div>

        <div className="flex-1 overflow-y-auto">
          {/* Custom tokens */}
          {custom.length > 0 && !query && (
            <div>
              <p className="px-4 py-2 font-mono text-[10px] text-text-tertiary uppercase tracking-wider">Your tokens</p>
              {custom.map((t) => (
                <TokenRow
                  key={t.address}
                  token={t}
                  excluded={exclude === t.address}
                  onSelect={() => handleSelect(t)}
                  action={
                    <button
                      onClick={(e) => { e.stopPropagation(); handleRemoveCustom(t.address); }}
                      className="p-1 text-text-tertiary hover:text-red-400 transition-colors"
                      aria-label={`Remove ${t.symbol}`}
                    >
                      <Trash2 size={12} />
                    </button>
                  }
                />
              ))}
              <div className="border-t border-white/5 my-1" />
            </div>
          )}

          {/* Results */}
          {results.length > 0 && (
            <div>
              {!query && (
                <p className="px-4 py-2 font-mono text-[10px] text-text-tertiary uppercase tracking-wider">Common tokens</p>
              )}
              {results.map((t) => (
                <TokenRow
                  key={t.address}
                  token={t}
                  excluded={exclude === t.address}
                  onSelect={() => handleSelect(t)}
                  action={
                    !custom.find((c) => c.address.toLowerCase() === t.address.toLowerCase()) &&
                    !FALLBACK_TOKENS.find((f) => f.address.toLowerCase() === t.address.toLowerCase()) ? (
                      <button
                        onClick={(e) => { e.stopPropagation(); handleAddCustom(t); }}
                        className="p-1 text-text-tertiary hover:text-cyan transition-colors"
                        aria-label={`Add ${t.symbol}`}
                      >
                        <Plus size={12} />
                      </button>
                    ) : null
                  }
                />
              ))}
            </div>
          )}

          {results.length === 0 && !loading && query && !addrErr && (
            <div className="flex flex-col items-center justify-center py-10 gap-2">
              <p className="font-mono text-sm text-text-secondary">No tokens found</p>
              {isAddress(query) && (
                <a
                  href={`https://etherscan.io/token/${query}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1 font-mono text-xs text-cyan hover:opacity-80"
                >
                  View on Etherscan <ExternalLink size={11} />
                </a>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-white/5 text-center">
          <p className="font-mono text-[10px] text-text-tertiary">
            Powered by Uniswap Token List · {results.length} tokens
          </p>
        </div>
      </div>
    </div>
  );
}

function TokenRow({
  token, excluded, onSelect, action,
}: {
  token: Token;
  excluded: boolean;
  onSelect: () => void;
  action?: React.ReactNode;
}) {
  return (
    <button
      onClick={onSelect}
      disabled={excluded}
      className={`w-full flex items-center gap-3 px-4 py-3 transition-colors text-left ${
        excluded ? "opacity-30 cursor-not-allowed" : "hover:bg-white/5 cursor-pointer"
      }`}
    >
      {token.logoURI ? (
        <img
          src={token.logoURI}
          alt={token.symbol}
          className="w-8 h-8 rounded-full bg-white/5 object-cover flex-shrink-0"
          onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
        />
      ) : (
        <div className="w-8 h-8 rounded-full bg-cyan/10 flex items-center justify-center flex-shrink-0">
          <span className="font-mono text-xs text-cyan">{token.symbol[0]}</span>
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="font-body text-sm text-text-primary">{token.symbol}</p>
        <p className="font-mono text-[10px] text-text-tertiary truncate">{token.name}</p>
      </div>
      <div className="flex items-center gap-1">
        {excluded && <span className="font-mono text-[9px] text-text-tertiary">selected</span>}
        {action}
      </div>
    </button>
  );
}
