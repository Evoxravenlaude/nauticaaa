/**
 * CreateNFT — real IPFS upload via NFT.Storage (free, no backend needed)
 * + ERC-721 mint via a simple factory contract interaction.
 *
 * Flow:
 *   1. User selects image + fills metadata
 *   2. Image uploaded to IPFS via NFT.Storage API (key in .env.local)
 *   3. Metadata JSON pinned to IPFS
 *   4. useWriteContract calls mint() on an ERC-721 contract
 *   5. useWaitForTransactionReceipt polls until confirmed
 *
 * In production: deploy your own ERC-721 contract or use a shared
 * Nautica NFT factory. The IPFS upload and metadata structure are
 * production-ready right now.
 */
import { useState, useRef } from "react";
import { Link } from "react-router-dom";
import {
  ChevronLeft, Upload, Plus, X, Check, Loader2,
  ExternalLink, AlertCircle, AlertTriangle,
} from "lucide-react";
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { toast } from "sonner";

// ── Minimal ERC-721 mint ABI ──────────────────────────────────────────
// Replace FACTORY_ADDRESS with your deployed contract when ready.
const FACTORY_ADDRESS = "" as `0x${string}`;   // placeholder — deploy to enable

const MINT_ABI = [
  {
    name: "mint",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "to",      type: "address" },
      { name: "tokenURI",type: "string"  },
    ],
    outputs: [{ name: "tokenId", type: "uint256" }],
  },
] as const;

// ── NFT.Storage upload ────────────────────────────────────────────────
// Get a free key at https://nft.storage — add VITE_NFT_STORAGE_KEY to .env.local
async function uploadToIPFS(file: File, metadata: Record<string, unknown>): Promise<string> {
  const key = import.meta.env.VITE_NFT_STORAGE_KEY as string | undefined;
  if (!key) throw new Error("VITE_NFT_STORAGE_KEY not set in .env.local");

  // 1. Upload image
  const imgRes = await fetch("https://api.nft.storage/upload", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": file.type },
    body: file,
  });
  if (!imgRes.ok) throw new Error(`Image upload failed: ${imgRes.statusText}`);
  const imgData = await imgRes.json() as { value: { cid: string } };
  const imageCID = imgData.value.cid;

  // 2. Upload metadata JSON with image CID
  const metaJson = JSON.stringify({
    ...metadata,
    image: `ipfs://${imageCID}`,
  });
  const metaRes = await fetch("https://api.nft.storage/upload", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: metaJson,
  });
  if (!metaRes.ok) throw new Error(`Metadata upload failed: ${metaRes.statusText}`);
  const metaData = await metaRes.json() as { value: { cid: string } };
  return `ipfs://${metaData.value.cid}`;
}

export default function CreateNFT() {
  const { address, isConnected } = useAccount();

  const [step,        setStep]        = useState<1 | 2 | 3>(1);
  const [image,       setImage]       = useState<{ file: File; preview: string } | null>(null);
  const [name,        setName]        = useState("");
  const [description, setDescription] = useState("");
  const [properties,  setProperties]  = useState<{ key: string; value: string }[]>([]);
  const [uploading,   setUploading]   = useState(false);
  const [uploadErr,   setUploadErr]   = useState<string | null>(null);
  const [tokenURI,    setTokenURI]    = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const {
    writeContract,
    data: txHash,
    isPending,
    error: writeError,
  } = useWriteContract();

  const { data: receipt, isLoading: waitingForReceipt } = useWaitForTransactionReceipt({
    hash: txHash,
    query: { enabled: !!txHash },
  });

  const handleImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { toast.error("Image must be under 10MB"); return; }
    const reader = new FileReader();
    reader.onloadend = () => setImage({ file, preview: reader.result as string });
    reader.readAsDataURL(file);
  };

  const handleUploadIPFS = async () => {
    if (!image || !name) return;
    setUploading(true);
    setUploadErr(null);
    try {
      const meta: Record<string, unknown> = {
        name,
        description,
        attributes: properties.filter((p) => p.key).map((p) => ({
          trait_type: p.key,
          value: p.value,
        })),
      };
      const uri = await uploadToIPFS(image.file, meta);
      setTokenURI(uri);
      setStep(2);
      toast.success("Uploaded to IPFS");
    } catch (err) {
      setUploadErr((err as Error).message);
      toast.error("IPFS upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleMint = () => {
    if (!tokenURI || !address || !FACTORY_ADDRESS) return;
    writeContract({
      address: FACTORY_ADDRESS,
      abi:     MINT_ABI,
      functionName: "mint",
      args:    [address, tokenURI],
    });
  };

  // ── Success ───────────────────────────────────────────────────────
  if (receipt?.status === "success") {
    return (
      <div className="min-h-screen bg-void flex flex-col items-center justify-center px-4 gap-6">
        <div className="w-20 h-20 rounded-full bg-cyan/10 flex items-center justify-center animate-pulse">
          <Check size={32} className="text-cyan" />
        </div>
        <h1 className="font-heading text-2xl text-text-primary">NFT Minted!</h1>
        {image && (
          <img src={image.preview} alt={name} className="w-40 h-40 object-cover rounded border border-white/10" />
        )}
        <p className="font-mono text-sm text-text-secondary text-center">{name}</p>
        <a
          href={`https://etherscan.io/tx/${txHash}`}
          target="_blank" rel="noreferrer"
          className="flex items-center gap-2 font-mono text-xs text-cyan hover:opacity-80"
        >
          View on Etherscan <ExternalLink size={12} />
        </a>
        <div className="flex gap-3">
          <Link to="/my-nfts" className="px-6 py-3 bg-cyan text-void font-mono text-sm font-medium">
            View My NFTs
          </Link>
          <button onClick={() => { setStep(1); setImage(null); setName(""); setDescription(""); setProperties([]); setTokenURI(null); }}
            className="px-6 py-3 border border-white/10 text-text-secondary font-mono text-sm hover:border-white/20 transition-all">
            Mint Another
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-void px-4 py-6">
      <div className="max-w-lg mx-auto">

        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <Link to="/nft" className="text-text-secondary hover:text-text-primary transition-colors">
            <ChevronLeft size={20} />
          </Link>
          <h1 className="font-heading text-xl text-text-primary">Create NFT</h1>
          {/* Step indicator */}
          <div className="ml-auto flex items-center gap-1">
            {[1, 2].map((s) => (
              <div key={s} className={`w-6 h-1 rounded-full transition-colors ${step >= s ? "bg-cyan" : "bg-white/10"}`} />
            ))}
          </div>
        </div>

        {/* Not connected */}
        {!isConnected && (
          <div className="mb-6 p-4 bg-obsidian border border-white/10 flex items-center gap-3">
            <AlertCircle size={16} className="text-text-tertiary" />
            <p className="font-mono text-xs text-text-secondary">Connect your wallet to mint NFTs.</p>
          </div>
        )}

        {/* No factory notice */}
        {!FACTORY_ADDRESS && (
          <div className="mb-6 p-4 bg-amber-500/5 border border-amber-500/20 flex items-start gap-3">
            <AlertTriangle size={14} className="text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-mono text-xs text-amber-400">NFT contract not deployed yet.</p>
              <p className="font-mono text-[10px] text-text-secondary mt-1">
                IPFS upload works now. On-chain minting requires deploying the ERC-721 factory and
                setting FACTORY_ADDRESS in CreateNFT.tsx. You can upload to IPFS and copy the token URI
                to mint manually via Etherscan or Remix.
              </p>
            </div>
          </div>
        )}

        {/* NFT.Storage key notice */}
        {!import.meta.env.VITE_NFT_STORAGE_KEY && (
          <div className="mb-6 p-3 bg-obsidian border border-white/5 font-mono text-[10px] text-text-secondary">
            Add <span className="text-cyan">VITE_NFT_STORAGE_KEY</span> to .env.local to enable IPFS upload.{" "}
            <a href="https://nft.storage" target="_blank" rel="noreferrer" className="text-cyan hover:opacity-80">
              Get a free key →
            </a>
          </div>
        )}

        {/* ── Step 1: Metadata ── */}
        {step === 1 && (
          <>
            {/* Image upload */}
            <div className="mb-6">
              <label className="block font-mono text-xs text-text-secondary mb-2">
                Image <span className="text-text-tertiary">(PNG, JPG, GIF, SVG · max 10MB)</span>
              </label>
              <div
                onClick={() => fileRef.current?.click()}
                className={`relative border-2 border-dashed transition-colors cursor-pointer flex items-center justify-center ${
                  image ? "border-cyan/30" : "border-white/10 hover:border-white/20"
                }`}
                style={{ aspectRatio: "1", maxHeight: 280 }}
              >
                {image ? (
                  <>
                    <img src={image.preview} alt="preview" className="w-full h-full object-contain" />
                    <button
                      onClick={(e) => { e.stopPropagation(); setImage(null); }}
                      className="absolute top-2 right-2 w-6 h-6 bg-black/70 flex items-center justify-center hover:bg-red-500 transition-colors"
                      aria-label="Remove image"
                    >
                      <X size={12} className="text-white" />
                    </button>
                  </>
                ) : (
                  <div className="flex flex-col items-center gap-2 text-text-tertiary p-8">
                    <Upload size={28} />
                    <p className="font-mono text-xs">Click to upload</p>
                  </div>
                )}
                <input ref={fileRef} type="file" accept="image/*" onChange={handleImage} className="hidden" />
              </div>
            </div>

            {/* Name */}
            <div className="mb-4">
              <label className="block font-mono text-xs text-text-secondary mb-2">Name *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-obsidian border border-white/10 px-4 py-3 font-mono text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-cyan"
                placeholder="e.g. Cosmic Drift #001"
                maxLength={100}
              />
            </div>

            {/* Description */}
            <div className="mb-4">
              <label className="block font-mono text-xs text-text-secondary mb-2">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full h-24 bg-obsidian border border-white/10 px-4 py-3 font-mono text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-cyan resize-none"
                placeholder="Describe your NFT…"
                maxLength={1000}
              />
            </div>

            {/* Properties */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <label className="font-mono text-xs text-text-secondary">Properties</label>
                <button
                  onClick={() => setProperties([...properties, { key: "", value: "" }])}
                  className="flex items-center gap-1 font-mono text-[10px] text-cyan hover:opacity-80 transition-opacity"
                >
                  <Plus size={11} /> Add
                </button>
              </div>
              {properties.length > 0 && (
                <div className="space-y-2">
                  {properties.map((p, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={p.key}
                        onChange={(e) => {
                          const n = [...properties]; n[i].key = e.target.value; setProperties(n);
                        }}
                        className="flex-1 bg-obsidian border border-white/10 px-3 py-2 font-mono text-xs text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-cyan"
                        placeholder="Trait type"
                      />
                      <input
                        type="text"
                        value={p.value}
                        onChange={(e) => {
                          const n = [...properties]; n[i].value = e.target.value; setProperties(n);
                        }}
                        className="flex-1 bg-obsidian border border-white/10 px-3 py-2 font-mono text-xs text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-cyan"
                        placeholder="Value"
                      />
                      <button
                        onClick={() => setProperties(properties.filter((_, j) => j !== i))}
                        className="text-text-tertiary hover:text-red-400 transition-colors"
                        aria-label="Remove property"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {uploadErr && (
              <p className="mb-4 font-mono text-xs text-red-400">{uploadErr}</p>
            )}

            <button
              onClick={handleUploadIPFS}
              disabled={!image || !name || uploading || !isConnected}
              className="flex items-center justify-center gap-2 w-full py-4 bg-cyan text-void font-mono text-sm tracking-wider font-medium hover:bg-opacity-90 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            >
              {uploading
                ? <><Loader2 size={16} className="animate-spin" /> Uploading to IPFS…</>
                : "Upload to IPFS →"
              }
            </button>
          </>
        )}

        {/* ── Step 2: Mint ── */}
        {step === 2 && tokenURI && (
          <>
            <div className="mb-6 p-4 bg-cyan/5 border border-cyan/20">
              <p className="font-mono text-xs text-cyan mb-1">✓ Uploaded to IPFS</p>
              <p className="font-mono text-[10px] text-text-secondary break-all">{tokenURI}</p>
            </div>

            {/* Preview */}
            <div className="flex items-center gap-4 mb-6 p-4 bg-obsidian border border-white/5">
              {image && <img src={image.preview} alt={name} className="w-20 h-20 object-cover flex-shrink-0" />}
              <div>
                <p className="font-body text-base text-text-primary">{name}</p>
                {description && <p className="font-mono text-xs text-text-secondary mt-1 line-clamp-2">{description}</p>}
                {properties.filter((p) => p.key).length > 0 && (
                  <p className="font-mono text-[10px] text-text-tertiary mt-1">
                    {properties.filter((p) => p.key).length} properties
                  </p>
                )}
              </div>
            </div>

            {/* Mint status */}
            {txHash && waitingForReceipt && (
              <div className="mb-4 p-3 bg-cyan/5 border border-cyan/20 flex items-center gap-3">
                <Loader2 size={14} className="text-cyan animate-spin" />
                <div>
                  <p className="font-mono text-xs text-cyan">Waiting for confirmation…</p>
                  <a href={`https://etherscan.io/tx/${txHash}`} target="_blank" rel="noreferrer"
                    className="font-mono text-[10px] text-text-secondary flex items-center gap-1 mt-0.5">
                    {txHash.slice(0, 16)}… <ExternalLink size={9} />
                  </a>
                </div>
              </div>
            )}

            {writeError && (
              <p className="mb-4 font-mono text-xs text-red-400">{(writeError as Error).message.slice(0, 120)}</p>
            )}

            <button
              onClick={handleMint}
              disabled={!FACTORY_ADDRESS || isPending || waitingForReceipt || !!txHash}
              className="flex items-center justify-center gap-2 w-full py-4 bg-cyan text-void font-mono text-sm tracking-wider font-medium hover:bg-opacity-90 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isPending
                ? <><Loader2 size={16} className="animate-spin" /> Confirm in wallet…</>
                : waitingForReceipt
                ? <><Loader2 size={16} className="animate-spin" /> Minting…</>
                : !FACTORY_ADDRESS
                ? "Contract not deployed"
                : "Mint NFT"
              }
            </button>

            {/* Copy tokenURI for manual mint */}
            <button
              onClick={() => { navigator.clipboard.writeText(tokenURI); toast.success("Token URI copied"); }}
              className="mt-3 w-full py-3 border border-white/10 text-text-secondary font-mono text-xs hover:border-white/20 transition-all"
            >
              Copy Token URI (for manual mint)
            </button>

            <button onClick={() => setStep(1)}
              className="block mt-2 w-full text-center font-mono text-xs text-text-tertiary hover:text-text-secondary py-2 transition-colors">
              ← Back to edit
            </button>
          </>
        )}

        <div className="h-8" />
      </div>
    </div>
  );
}
