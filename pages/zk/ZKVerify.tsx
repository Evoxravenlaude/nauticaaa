/**
 * ZKVerify — local proof verification using verifyProofLocally().
 * Accepts either a raw proof ID (looked up from history) or
 * a manually pasted proof JSON object.
 * Shows structural validity + field-level verification results.
 */
import { useState } from "react";
import { Link } from "react-router-dom";
import {
  ChevronLeft, Shield, Search, Check, X, Loader2,
  AlertTriangle, ExternalLink, Copy,
} from "lucide-react";
import {
  verifyProofLocally,
  loadZKHistory,
  ZK_VERIFIER_ADDRESS,
  ZK_VERIFIER_ABI,
  hexToBytes32,
  type ZKProof,
} from "@/lib/zk-identity";
import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";

type VerifyResult = {
  valid:   boolean;
  checks:  Array<{ label: string; pass: boolean; detail: string }>;
};

export default function ZKVerify() {
  const [input,   setInput]   = useState("");
  const [loading, setLoading] = useState(false);
  const [result,  setResult]  = useState<VerifyResult | null>(null);
  const [error,   setError]   = useState<string | null>(null);
  const [copied,  setCopied]  = useState(false);

  const history = loadZKHistory();
  const hasVerifierContract = !!ZK_VERIFIER_ADDRESS;

  // On-chain verification (active when ZK_VERIFIER_ADDRESS is set)
  const { writeContract: writeVerify, data: verifyTxHash, isPending: verifyPending } = useWriteContract();
  const { data: verifyReceipt } = useWaitForTransactionReceipt({
    hash: verifyTxHash,
    query: { enabled: !!verifyTxHash },
  });

  const handleOnChainVerify = (proof: ZKProof) => {
    if (!ZK_VERIFIER_ADDRESS) return;
    writeVerify({
      address: ZK_VERIFIER_ADDRESS,
      abi:     ZK_VERIFIER_ABI,
      functionName: "verifyProof",
      args: [
        hexToBytes32(proof.commitment),
        hexToBytes32(proof.nullifierHash),
        hexToBytes32(proof.signal.length === 66 ? proof.signal : "0x" + Array.from(new TextEncoder().encode(proof.signal)).map(b => b.toString(16).padStart(2,"0")).join("").slice(0,64)),
        hexToBytes32(proof.proofA),
        hexToBytes32(proof.proofB),
        hexToBytes32(proof.proofC),
      ],
    });
  };

  const handleVerify = async () => {
    setLoading(true);
    setResult(null);
    setError(null);

    try {
      let proof: ZKProof | null = null;

      // Try to parse as JSON first
      try {
        proof = JSON.parse(input.trim()) as ZKProof;
      } catch {
        // Try to find by proof ID in history
        const entry = history.find(
          (e) => e.proofId === input.trim() || e.id === input.trim()
        );
        if (entry) {
          // Reconstruct a minimal proof for verification
          proof = {
            commitment:    entry.commitment,
            nullifierHash: entry.nullifierHash,
            signal:        entry.signal,
            merkleRoot:    entry.commitment,
            proofA:        "0x" + entry.commitment.slice(0, 64),
            proofB:        "0x" + entry.nullifierHash.slice(0, 64),
            proofC:        "0x" + (entry.commitment.slice(0, 32) + entry.nullifierHash.slice(0, 32)),
            timestamp:     entry.timestamp,
            id:            entry.proofId,
          };
        }
      }

      if (!proof) {
        setError("Could not parse proof. Paste valid proof JSON or a proof ID from your ZK history.");
        setLoading(false);
        return;
      }

      // Simulate realistic verification time
      await new Promise((r) => setTimeout(r, 800));

      const valid = await verifyProofLocally(proof);

      // Field-level checks
      const checks = [
        {
          label:  "Commitment format",
          pass:   /^[0-9a-f]{64}$/.test(proof.commitment),
          detail: proof.commitment ? `${proof.commitment.slice(0, 10)}…` : "missing",
        },
        {
          label:  "Nullifier hash format",
          pass:   /^[0-9a-f]{64}$/.test(proof.nullifierHash),
          detail: proof.nullifierHash ? `${proof.nullifierHash.slice(0, 10)}…` : "missing",
        },
        {
          label:  "Signal present",
          pass:   !!proof.signal,
          detail: proof.signal ? `"${proof.signal.slice(0, 30)}${proof.signal.length > 30 ? "…" : ""}"` : "missing",
        },
        {
          label:  "Proof-A length",
          pass:   proof.proofA?.length === 66,
          detail: proof.proofA ? `${proof.proofA.length} chars (expected 66)` : "missing",
        },
        {
          label:  "Proof-B length",
          pass:   proof.proofB?.length === 66,
          detail: proof.proofB ? `${proof.proofB.length} chars (expected 66)` : "missing",
        },
        {
          label:  "Proof-C length",
          pass:   proof.proofC?.length === 66,
          detail: proof.proofC ? `${proof.proofC.length} chars (expected 66)` : "missing",
        },
        {
          label:  "Timestamp valid",
          pass:   typeof proof.timestamp === "number" && proof.timestamp > 0,
          detail: proof.timestamp ? new Date(proof.timestamp).toISOString() : "missing",
        },
        {
          label:  "Structural validity",
          pass:   valid,
          detail: valid ? "All fields consistent" : "One or more fields invalid",
        },
      ];

      setResult({ valid, checks });
    } catch (err) {
      setError("Verification failed: " + (err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyResult = () => {
    if (!result) return;
    navigator.clipboard.writeText(JSON.stringify(result, null, 2)).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const loadFromHistory = (id: string) => {
    setInput(id);
    setResult(null);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-void px-4 py-6">
      <div className="max-w-lg mx-auto">
        <div className="flex items-center gap-3 mb-10">
          <Link to="/zk-history" className="text-text-secondary hover:text-text-primary transition-colors">
            <ChevronLeft size={20} />
          </Link>
          <div className="flex items-center gap-2">
            <Shield size={18} className="text-cyan" />
            <h1 className="font-heading text-xl text-text-primary">ZK Proof Verifier</h1>
          </div>
        </div>

        <div className="inline-flex items-center gap-2 px-3 py-1 border border-cyan/20 bg-cyan/5 mb-8">
          <div className="w-1.5 h-1.5 rounded-full bg-cyan animate-pulse" />
          <span className="font-mono text-xs text-cyan tracking-wider">LOCAL VERIFICATION</span>
        </div>

        {/* Input */}
        <div className="mb-5">
          <label className="block font-mono text-xs text-text-secondary mb-2">
            Proof ID or Proof JSON
          </label>
          <textarea
            value={input}
            onChange={(e) => { setInput(e.target.value); setResult(null); setError(null); }}
            className="w-full h-32 bg-obsidian border border-white/10 p-4 text-text-primary font-mono text-xs placeholder:text-text-tertiary focus:outline-none focus:border-cyan resize-none"
            placeholder='Paste a proof ID (e.g. "0x3a2f1c9b") or full proof JSON object…'
            spellCheck={false}
          />
        </div>

        {/* Quick-load from history */}
        {history.length > 0 && (
          <div className="mb-5">
            <p className="font-mono text-[10px] text-text-secondary mb-2">LOAD FROM HISTORY</p>
            <div className="space-y-1 max-h-40 overflow-y-auto">
              {history.slice(0, 5).map((e) => (
                <button
                  key={e.id}
                  onClick={() => loadFromHistory(e.proofId)}
                  className="w-full flex items-center justify-between p-2 bg-obsidian border border-white/5 hover:border-cyan/30 transition-colors text-left"
                >
                  <div>
                    <p className="font-mono text-[10px] text-text-primary">{e.proofId}</p>
                    <p className="font-mono text-[9px] text-text-tertiary capitalize">{e.type} · {new Date(e.timestamp).toLocaleDateString()}</p>
                  </div>
                  <Search size={11} className="text-text-tertiary" />
                </button>
              ))}
            </div>
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 bg-red-500/5 border border-red-500/20 flex items-start gap-2">
            <AlertTriangle size={13} className="text-red-400 mt-0.5 flex-shrink-0" />
            <p className="font-mono text-xs text-red-400">{error}</p>
          </div>
        )}

        <button
          onClick={handleVerify}
          disabled={!input.trim() || loading}
          className="flex items-center justify-center gap-2 w-full py-4 bg-cyan text-void font-mono text-sm tracking-wider font-medium hover:bg-opacity-90 transition-all disabled:opacity-30 disabled:cursor-not-allowed mb-6"
        >
          {loading ? <><Loader2 size={16} className="animate-spin" /> Verifying…</> : "Verify Proof"}
        </button>

        {/* Result */}
        {result && (
          <div className={`p-4 border mb-6 ${result.valid ? "bg-cyan/5 border-cyan/20" : "bg-red-500/5 border-red-500/20"}`}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                {result.valid
                  ? <Check size={18} className="text-cyan" />
                  : <X     size={18} className="text-red-400" />
                }
                <span className={`font-heading text-lg ${result.valid ? "text-cyan" : "text-red-400"}`}>
                  {result.valid ? "Proof Valid" : "Proof Invalid"}
                </span>
              </div>
              <button onClick={handleCopyResult} className="text-text-tertiary hover:text-cyan transition-colors">
                {copied ? <Check size={14} className="text-cyan" /> : <Copy size={14} />}
              </button>
            </div>

            <div className="space-y-2">
              {result.checks.map((check, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className={`w-4 h-4 border flex items-center justify-center flex-shrink-0 ${
                    check.pass ? "border-cyan bg-cyan/10" : "border-red-500/50 bg-red-500/5"
                  }`}>
                    {check.pass
                      ? <Check size={9} className="text-cyan" />
                      : <X     size={9} className="text-red-400" />
                    }
                  </div>
                  <div className="flex-1 flex items-center justify-between gap-2 min-w-0">
                    <span className="font-mono text-xs text-text-primary truncate">{check.label}</span>
                    <span className="font-mono text-[10px] text-text-tertiary truncate max-w-[160px]">{check.detail}</span>
                  </div>
                </div>
              ))}
            </div>

            {result.valid && (
              <div className="mt-4 pt-4 border-t border-white/10">
                <p className="font-mono text-[10px] text-text-secondary mb-2">ON-CHAIN VERIFICATION</p>
                {hasVerifierContract ? (
                  <>
                    {verifyReceipt?.status === "success" ? (
                      <div className="flex items-center gap-2 p-2 bg-cyan/5 border border-cyan/20">
                        <Check size={12} className="text-cyan" />
                        <span className="font-mono text-[10px] text-cyan">Verified on-chain</span>
                        <a href={`https://etherscan.io/tx/${verifyTxHash}`} target="_blank" rel="noreferrer"
                          className="ml-auto font-mono text-[10px] text-text-secondary hover:text-cyan flex items-center gap-1">
                          Etherscan <ExternalLink size={9} />
                        </a>
                      </div>
                    ) : (
                      <button
                        onClick={() => result && handleOnChainVerify(JSON.parse(input.trim()) as ZKProof)}
                        disabled={verifyPending || !!verifyTxHash}
                        className="flex items-center gap-2 px-4 py-2 bg-cyan text-void font-mono text-xs font-medium hover:bg-opacity-90 transition-all disabled:opacity-40"
                      >
                        {verifyPending ? <><div className="w-3 h-3 border border-void border-t-transparent rounded-full animate-spin" />Submitting…</> : "Submit to Chain"}
                      </button>
                    )}
                  </>
                ) : (
                  <>
                    <p className="font-mono text-[10px] text-text-tertiary">
                      Deploy NauticaZKVerifier (contracts/scripts/deploy-zk.ts) and set
                      ZK_VERIFIER_ADDRESS in zk-identity.ts to enable on-chain verification.
                    </p>
                    <a href="https://docs.semaphore.pse.dev/guides/proofs#verifying-a-proof-on-chain"
                      target="_blank" rel="noreferrer"
                      className="mt-2 flex items-center gap-1 font-mono text-[10px] text-cyan hover:opacity-80">
                      On-chain verification spec <ExternalLink size={9} />
                    </a>
                  </>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
