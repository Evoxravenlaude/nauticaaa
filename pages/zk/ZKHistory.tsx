/**
 * ZKHistory — real encrypted proof history from localStorage.
 * Loads ZKHistoryEntry records saved by ZKSend's generateProof() call.
 * Supports filtering, CSV export, and entry deletion.
 */
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  ChevronLeft, Shield, Download, Trash2, Copy, Check,
  ArrowUpRight, ArrowDownLeft, Search, AlertCircle, ExternalLink,
} from "lucide-react";
import { loadZKHistory, clearZKHistory, type ZKHistoryEntry } from "@/lib/zk-identity";

function timeAgo(ts: number): string {
  const d = (Date.now() - ts) / 1000;
  if (d < 60)    return "just now";
  if (d < 3600)  return `${Math.floor(d / 60)}m ago`;
  if (d < 86400) return `${Math.floor(d / 3600)}h ago`;
  return new Date(ts).toLocaleDateString();
}

export default function ZKHistory() {
  const [entries,  setEntries]  = useState<ZKHistoryEntry[]>([]);
  const [filter,   setFilter]   = useState<"all" | "send" | "receive" | "verify">("all");
  const [search,   setSearch]   = useState("");
  const [copied,   setCopied]   = useState<string | null>(null);
  const [showClear, setShowClear] = useState(false);

  useEffect(() => {
    setEntries(loadZKHistory());
  }, []);

  const filtered = entries.filter((e) => {
    if (filter !== "all" && e.type !== filter) return false;
    if (search) {
      const q = search.toLowerCase();
      return e.proofId.includes(q) || e.nullifierHash.includes(q) || (e.note ?? "").toLowerCase().includes(q);
    }
    return true;
  });

  const handleCopy = (label: string, value: string) => {
    navigator.clipboard.writeText(value).then(() => {
      setCopied(label);
      setTimeout(() => setCopied(null), 2000);
    });
  };

  const handleExportCSV = () => {
    const header = "id,type,nullifierHash,commitment,status,timestamp,note";
    const rows = entries.map((e) =>
      [e.id, e.type, e.nullifierHash, e.commitment, e.status, new Date(e.timestamp).toISOString(), e.note ?? ""].join(",")
    );
    const blob = new Blob([[header, ...rows].join("\n")], { type: "text/csv" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href = url; a.download = "nautica-zk-history.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  const handleClearAll = () => {
    clearZKHistory();
    setEntries([]);
    setShowClear(false);
  };

  const statusColor = (s: ZKHistoryEntry["status"]) => {
    if (s === "verified") return "text-cyan";
    if (s === "failed")   return "text-red-400";
    return "text-amber-400";
  };

  const TypeIcon = ({ type }: { type: ZKHistoryEntry["type"] }) => {
    if (type === "send")    return <ArrowUpRight   size={14} className="text-red-400" />;
    if (type === "receive") return <ArrowDownLeft  size={14} className="text-cyan"    />;
    return                         <Shield          size={14} className="text-amber-400" />;
  };

  return (
    <div className="min-h-screen bg-void px-4 py-6">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Link to="/" className="text-text-secondary hover:text-text-primary transition-colors">
              <ChevronLeft size={20} />
            </Link>
            <div className="flex items-center gap-2">
              <Shield size={18} className="text-cyan" />
              <h1 className="font-heading text-xl text-text-primary">ZK History</h1>
              {entries.length > 0 && (
                <span className="font-mono text-xs text-text-tertiary">({entries.length})</span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {entries.length > 0 && (
              <>
                <button
                  onClick={handleExportCSV}
                  className="p-2 text-text-tertiary hover:text-cyan transition-colors"
                  title="Export CSV"
                >
                  <Download size={16} />
                </button>
                <button
                  onClick={() => setShowClear(true)}
                  className="p-2 text-text-tertiary hover:text-red-400 transition-colors"
                  title="Clear history"
                >
                  <Trash2 size={16} />
                </button>
              </>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 border-b border-white/5 mb-5">
          {(["all", "send", "receive", "verify"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`pb-3 font-mono text-xs capitalize transition-colors ${
                filter === f ? "text-cyan border-b-2 border-cyan" : "text-text-secondary hover:text-text-primary"
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Search */}
        {entries.length > 0 && (
          <div className="relative mb-5">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by proof ID or nullifier…"
              className="w-full bg-obsidian border border-white/10 pl-9 pr-4 py-2 font-mono text-xs text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-cyan"
            />
          </div>
        )}

        {/* Empty state */}
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Shield size={32} className="text-text-tertiary" />
            <p className="font-mono text-sm text-text-secondary">
              {entries.length === 0 ? "No ZK proofs generated yet" : "No matching proofs"}
            </p>
            {entries.length === 0 && (
              <Link to="/zk-send" className="font-mono text-xs text-cyan hover:opacity-80">
                Generate your first ZK proof →
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((entry) => (
              <div
                key={entry.id}
                className="p-4 bg-obsidian border border-white/5 hover:border-white/10 transition-all"
              >
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <TypeIcon type={entry.type} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <p className="font-mono text-xs text-text-primary capitalize">{entry.type} · <span className={statusColor(entry.status)}>{entry.status}</span></p>
                      <span className="font-mono text-[10px] text-text-tertiary flex-shrink-0">{timeAgo(entry.timestamp)}</span>
                    </div>
                    {entry.note && (
                      <p className="font-mono text-[10px] text-text-secondary mb-2">{entry.note}</p>
                    )}
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[9px] text-text-tertiary w-16">PROOF ID</span>
                        <span className="font-mono text-[10px] text-cyan">{entry.proofId}</span>
                        <button onClick={() => handleCopy(entry.id + "pid", entry.proofId)}
                          className="text-text-tertiary hover:text-cyan transition-colors ml-auto">
                          {copied === entry.id + "pid" ? <Check size={9} className="text-cyan" /> : <Copy size={9} />}
                        </button>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[9px] text-text-tertiary w-16">NULLIFIER</span>
                        <span className="font-mono text-[10px] text-text-secondary truncate max-w-[140px]">{entry.nullifierHash.slice(0, 12)}…</span>
                        <button onClick={() => handleCopy(entry.id + "null", entry.nullifierHash)}
                          className="text-text-tertiary hover:text-cyan transition-colors ml-auto">
                          {copied === entry.id + "null" ? <Check size={9} className="text-cyan" /> : <Copy size={9} />}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Clear confirmation */}
        {showClear && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 px-4">
            <div className="bg-obsidian border border-white/10 p-6 max-w-sm w-full">
              <h3 className="font-heading text-lg text-text-primary">Clear ZK History?</h3>
              <p className="mt-2 text-text-secondary text-sm">
                This removes all locally stored proofs and nullifiers. Your ZK identity is not affected.
              </p>
              <div className="flex gap-3 mt-6">
                <button onClick={() => setShowClear(false)}
                  className="flex-1 py-3 border border-white/10 text-text-secondary font-mono text-sm hover:border-white/20 transition-colors">
                  Cancel
                </button>
                <button onClick={handleClearAll}
                  className="flex-1 py-3 bg-red-500 text-white font-mono text-sm hover:bg-red-600 transition-colors">
                  Clear All
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="h-24" />
      </div>
    </div>
  );
}
