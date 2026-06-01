/**
 * AddLiquidity — real Uniswap V3 NonfungiblePositionManager execution.
 *
 * Flow:
 *   1. User enters amounts + fee tier + price range
 *   2. If tokenA is not ETH: approve NonfungiblePositionManager to spend tokenA
 *   3. If tokenB is not ETH: approve NonfungiblePositionManager to spend tokenB
 *   4. Call mint() on NonfungiblePositionManager with encoded params
 *   5. useWaitForTransactionReceipt polls until confirmed
 *
 * Supports ETH/USDC initially (most liquid V3 pool).
 * TokenSelector lets users pick any token pair.
 *
 * NonfungiblePositionManager: 0xC36442b4a4522E871399CD717aBDD847Ab11FE88
 * WETH9 (used when ETH is one side): 0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2
 */
import { useState, useEffect, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  ChevronLeft, Plus, AlertCircle, AlertTriangle, ExternalLink,
  Loader2, Check, ChevronDown,
} from "lucide-react";
import {
  useAccount, useBalance, useWriteContract,
  useWaitForTransactionReceipt, useReadContract,
} from "wagmi";
import { parseUnits, formatUnits, MaxUint256 } from "viem";
import { toast } from "sonner";
import TokenSelector from "@/components/TokenSelector";
import { FALLBACK_TOKENS, type Token } from "@/lib/token-list";

// ── Uniswap V3 addresses (mainnet) ────────────────────────────────────
const NPM_ADDRESS = "0xC36442b4a4522E871399CD717aBDD847Ab11FE88" as const;
const WETH9       = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2" as const;
const MIN_TICK    = -887272;
const MAX_TICK    =  887272;

// Fee tier → tick spacing
const TICK_SPACING: Record<string, number> = { "500": 10, "3000": 60, "10000": 200 };

// ── ABIs (minimal) ────────────────────────────────────────────────────
const ERC20_ABI = [
  {
    name: "approve",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [{ name: "spender", type: "address" }, { name: "amount", type: "uint256" }],
    outputs: [{ name: "", type: "bool" }],
  },
  {
    name: "allowance",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "owner", type: "address" }, { name: "spender", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },
] as const;

const NPM_ABI = [
  {
    name: "mint",
    type: "function",
    stateMutability: "payable",
    inputs: [{
      name: "params",
      type: "tuple",
      components: [
        { name: "token0",          type: "address" },
        { name: "token1",          type: "address" },
        { name: "fee",             type: "uint24"  },
        { name: "tickLower",       type: "int24"   },
        { name: "tickUpper",       type: "int24"   },
        { name: "amount0Desired",  type: "uint256" },
        { name: "amount1Desired",  type: "uint256" },
        { name: "amount0Min",      type: "uint256" },
        { name: "amount1Min",      type: "uint256" },
        { name: "recipient",       type: "address" },
        { name: "deadline",        type: "uint256" },
      ],
    }],
    outputs: [
      { name: "tokenId",    type: "uint256" },
      { name: "liquidity",  type: "uint128" },
      { name: "amount0",    type: "uint256" },
      { name: "amount1",    type: "uint256" },
    ],
  },
] as const;

// ── Tick helpers ──────────────────────────────────────────────────────
function priceToTick(price: number, spacing: number): number {
  const tick = Math.floor(Math.log(price) / Math.log(1.0001));
  return Math.round(tick / spacing) * spacing;
}

function nearestUsableTick(tick: number, spacing: number): number {
  return Math.round(tick / spacing) * spacing;
}

// ── Token ordering (Uniswap requires token0 < token1 by address) ──────
function sortTokens(a: Token, b: Token): [Token, Token] {
  const addrA = a.address.toLowerCase() === "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee"
    ? WETH9.toLowerCase() : a.address.toLowerCase();
  const addrB = b.address.toLowerCase() === "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee"
    ? WETH9.toLowerCase() : b.address.toLowerCase();
  return addrA < addrB ? [a, b] : [b, a];
}

// ── Fee tier labels ───────────────────────────────────────────────────
const FEE_TIERS = [
  { fee: 500   as const, label: "0.05%", desc: "Stable pairs"  },
  { fee: 3000  as const, label: "0.30%", desc: "Most pairs"    },
  { fee: 10000 as const, label: "1.00%", desc: "Exotic pairs"  },
] as const;
type FeeTier = (typeof FEE_TIERS)[number]["fee"];

export default function AddLiquidity() {
  const { address, isConnected } = useAccount();

  const [tokenA, setTokenA] = useState<Token>(FALLBACK_TOKENS[0]); // ETH
  const [tokenB, setTokenB] = useState<Token>(FALLBACK_TOKENS[1]); // USDC
  const [amountA,    setAmountA]    = useState("");
  const [amountB,    setAmountB]    = useState("");
  const [feeTier,    setFeeTier]    = useState<FeeTier>(3000);
  const [fullRange,  setFullRange]  = useState(true);
  const [minPrice,   setMinPrice]   = useState("");
  const [maxPrice,   setMaxPrice]   = useState("");
  const [showSelA,   setShowSelA]   = useState(false);
  const [showSelB,   setShowSelB]   = useState(false);
  const [step,       setStep]       = useState<"idle" | "approveA" | "approveB" | "mint" | "done">("idle");
  const pendingMintRef = useRef(false); // guards against race in useEffect

  const [token0, token1] = sortTokens(tokenA, tokenB);
  const isToken0ETH = token0.address.toLowerCase() === "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee";
  const isToken1ETH = token1.address.toLowerCase() === "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee";
  const token0Addr  = isToken0ETH ? WETH9 : token0.address as `0x${string}`;
  const token1Addr  = isToken1ETH ? WETH9 : token1.address as `0x${string}`;

  // ── Balances ──────────────────────────────────────────────────────
  const { data: balA } = useBalance({
    address,
    token: tokenA.address.toLowerCase() === "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee"
      ? undefined : tokenA.address as `0x${string}`,
    query: { enabled: !!address },
  });
  const { data: balB } = useBalance({
    address,
    token: tokenB.address.toLowerCase() === "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee"
      ? undefined : tokenB.address as `0x${string}`,
    query: { enabled: !!address },
  });

  // ── Allowances ────────────────────────────────────────────────────
  const { data: allowA } = useReadContract({
    address: token0Addr,
    abi: ERC20_ABI,
    functionName: "allowance",
    args: address ? [address, NPM_ADDRESS] : undefined,
    query: { enabled: !!address && !isToken0ETH },
  });
  const { data: allowB } = useReadContract({
    address: token1Addr,
    abi: ERC20_ABI,
    functionName: "allowance",
    args: address ? [address, NPM_ADDRESS] : undefined,
    query: { enabled: !!address && !isToken1ETH },
  });

  const amount0Raw = amountA ? parseUnits(amountA, token0.decimals) : 0n;
  const amount1Raw = amountB ? parseUnits(amountB, token1.decimals) : 0n;
  const needsApproveA = !isToken0ETH && allowA !== undefined && (allowA as bigint) < amount0Raw;
  const needsApproveB = !isToken1ETH && allowB !== undefined && (allowB as bigint) < amount1Raw;

  // ── Contract writes ───────────────────────────────────────────────
  const {
    writeContract,
    data: txHash,
    isPending,
    error: writeError,
    reset: resetWrite,
  } = useWriteContract();

  const { data: receipt, isLoading: waitingReceipt } = useWaitForTransactionReceipt({
    hash: txHash,
    query: { enabled: !!txHash },
  });

  useEffect(() => {
    if (writeError) {
      toast.error((writeError as Error).message.slice(0, 100));
      setStep("idle");
      resetWrite();
    }
  }, [writeError]);

  useEffect(() => {
    if (!receipt || receipt.status !== "success") return;

    if (step === "approveA") {
      toast.success(`${token0.symbol} approved`);
      resetWrite(); // reset BEFORE scheduling next write
      if (needsApproveB) {
        setStep("approveB");
      } else {
        pendingMintRef.current = true;
        setStep("mint");
      }
    } else if (step === "approveB") {
      toast.success(`${token1.symbol} approved`);
      resetWrite();
      pendingMintRef.current = true;
      setStep("mint");
    } else if (step === "mint") {
      setStep("done");
      toast.success("Liquidity position created!");
    }
  }, [receipt]);

  // ── executeMint wrapped in useCallback so useEffect can depend on it ──
  const executeMint = useCallback(() => {
    if (!address) return;
    pendingMintRef.current = false;
    const deadline = BigInt(Math.floor(Date.now() / 1000) + 1200);
    const slippage = 50n;
    const min0 = amount0Raw - (amount0Raw * slippage / 10000n);
    const min1 = amount1Raw - (amount1Raw * slippage / 10000n);
    const ethValue = isToken0ETH ? amount0Raw : isToken1ETH ? amount1Raw : 0n;

    writeContract({
      address: NPM_ADDRESS,
      abi: NPM_ABI,
      functionName: "mint",
      args: [{
        token0: token0Addr, token1: token1Addr, fee: feeTier,
        tickLower, tickUpper,
        amount0Desired: amount0Raw, amount1Desired: amount1Raw,
        amount0Min: min0 > 0n ? min0 : 0n,
        amount1Min: min1 > 0n ? min1 : 0n,
        recipient: address, deadline,
      }],
      value: ethValue,
    });
  }, [address, amount0Raw, amount1Raw, isToken0ETH, isToken1ETH, token0Addr, token1Addr, feeTier, tickLower, tickUpper, writeContract]);

  // Trigger mint after approve receipt clears write state
  useEffect(() => {
    if (step === "mint" && pendingMintRef.current) {
      pendingMintRef.current = false;
      executeMint();
    }
  }, [step, executeMint]);

  // ── Tick calculation ──────────────────────────────────────────────
  const spacing    = TICK_SPACING[String(feeTier)] ?? 60;
  const tickLower  = fullRange ? nearestUsableTick(MIN_TICK, spacing)
    : minPrice ? priceToTick(parseFloat(minPrice), spacing) : nearestUsableTick(MIN_TICK, spacing);
  const tickUpper  = fullRange ? nearestUsableTick(MAX_TICK, spacing)
    : maxPrice ? priceToTick(parseFloat(maxPrice), spacing) : nearestUsableTick(MAX_TICK, spacing);

  // ── Execute ───────────────────────────────────────────────────────
  const handleAdd = () => {
    if (needsApproveA) { setStep("approveA"); approveToken(token0Addr, amount0Raw); return; }
    if (needsApproveB) { setStep("approveB"); approveToken(token1Addr, amount1Raw); return; }
    setStep("mint");
    executeMint();
  };

  const approveToken = (tokenAddr: `0x${string}`, amount: bigint) => {
    writeContract({
      address: tokenAddr,
      abi: ERC20_ABI,
      functionName: "approve",
      args: [NPM_ADDRESS, MaxUint256],   // approve max for UX
    });
  };



  // ── Helpers ───────────────────────────────────────────────────────
  const exceedsA = balA && amountA && parseFloat(amountA) > parseFloat(balA.formatted);
  const exceedsB = balB && amountB && parseFloat(amountB) > parseFloat(balB.formatted);
  const canAdd   = isConnected && parseFloat(amountA) > 0 && parseFloat(amountB) > 0
    && !exceedsA && !exceedsB && step === "idle";

  // ── Success screen ────────────────────────────────────────────────
  if (step === "done" && receipt?.status === "success") {
    return (
      <div className="min-h-screen bg-void flex flex-col items-center justify-center px-4 gap-6">
        <div className="w-20 h-20 rounded-full bg-cyan/10 flex items-center justify-center">
          <Check size={32} className="text-cyan" />
        </div>
        <h1 className="font-heading text-2xl text-text-primary">Position Created</h1>
        <p className="text-text-secondary text-sm text-center">
          {amountA} {tokenA.symbol} + {amountB} {tokenB.symbol} added to the {FEE_TIERS.find(f => f.fee === feeTier)?.label} pool.
        </p>
        <a
          href={`https://etherscan.io/tx/${txHash}`}
          target="_blank" rel="noreferrer"
          className="flex items-center gap-2 font-mono text-xs text-cyan hover:opacity-80"
        >
          View on Etherscan <ExternalLink size={12} />
        </a>
        <div className="flex gap-3">
          <Link to="/pools"
            className="px-6 py-3 bg-cyan text-void font-mono text-sm font-medium hover:bg-opacity-90 transition-all">
            View Pools
          </Link>
          <button
            onClick={() => { setStep("idle"); setAmountA(""); setAmountB(""); resetWrite(); }}
            className="px-6 py-3 border border-white/10 text-text-secondary font-mono text-sm hover:border-white/20 transition-all"
          >
            Add More
          </button>
        </div>
      </div>
    );
  }

  // ── Step indicator label ──────────────────────────────────────────
  const stepLabel = step === "approveA" ? `Approving ${token0.symbol}…`
    : step === "approveB"               ? `Approving ${token1.symbol}…`
    : step === "mint" && isPending      ? "Confirm in wallet…"
    : step === "mint" && waitingReceipt ? "Adding liquidity…"
    : null;

  return (
    <div className="min-h-screen bg-void px-4 py-6">
      <div className="max-w-lg mx-auto">

        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <Link to="/pools" className="text-text-secondary hover:text-text-primary transition-colors">
            <ChevronLeft size={20} />
          </Link>
          <h1 className="font-heading text-xl text-text-primary">Add Liquidity</h1>
        </div>

        {!isConnected && (
          <div className="mb-6 p-4 bg-obsidian border border-white/10 flex items-center gap-3">
            <AlertCircle size={16} className="text-text-tertiary" />
            <p className="font-mono text-xs text-text-secondary">Connect your wallet to add liquidity.</p>
          </div>
        )}

        {/* Token pair */}
        <div className="space-y-3 mb-6">
          {/* Token A */}
          <div className="p-4 bg-obsidian border border-white/5">
            <div className="flex items-center justify-between mb-2">
              <span className="font-mono text-xs text-text-secondary">Token A</span>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs text-text-tertiary">
                  {balA ? `${parseFloat(balA.formatted).toFixed(4)} ${tokenA.symbol}` : "—"}
                </span>
                {balA && (
                  <button onClick={() => setAmountA(balA.formatted)}
                    className="font-mono text-[10px] text-cyan hover:opacity-80">MAX</button>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="number"
                value={amountA}
                onChange={(e) => setAmountA(e.target.value)}
                className={`flex-1 bg-transparent text-2xl font-heading placeholder:text-text-tertiary focus:outline-none ${exceedsA ? "text-red-400" : "text-text-primary"}`}
                placeholder="0.0"
              />
              <button
                onClick={() => setShowSelA(true)}
                className="flex items-center gap-2 px-3 py-2 bg-white/5 hover:bg-white/10 transition-colors"
                aria-label="Select token A"
              >
                {tokenA.logoURI && <img src={tokenA.logoURI} className="w-5 h-5 rounded-full" alt="" />}
                <span className="font-mono text-sm text-text-primary">{tokenA.symbol}</span>
                <ChevronDown size={12} className="text-text-tertiary" />
              </button>
            </div>
            {exceedsA && <p className="mt-1 font-mono text-[10px] text-red-400">Insufficient {tokenA.symbol}</p>}
          </div>

          <div className="flex justify-center">
            <div className="w-8 h-8 bg-obsidian border border-white/10 flex items-center justify-center">
              <Plus size={16} className="text-text-tertiary" />
            </div>
          </div>

          {/* Token B */}
          <div className="p-4 bg-obsidian border border-white/5">
            <div className="flex items-center justify-between mb-2">
              <span className="font-mono text-xs text-text-secondary">Token B</span>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs text-text-tertiary">
                  {balB ? `${parseFloat(balB.formatted).toFixed(4)} ${tokenB.symbol}` : "—"}
                </span>
                {balB && (
                  <button onClick={() => setAmountB(balB.formatted)}
                    className="font-mono text-[10px] text-cyan hover:opacity-80">MAX</button>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="number"
                value={amountB}
                onChange={(e) => setAmountB(e.target.value)}
                className={`flex-1 bg-transparent text-2xl font-heading placeholder:text-text-tertiary focus:outline-none ${exceedsB ? "text-red-400" : "text-text-primary"}`}
                placeholder="0.0"
              />
              <button
                onClick={() => setShowSelB(true)}
                className="flex items-center gap-2 px-3 py-2 bg-white/5 hover:bg-white/10 transition-colors"
                aria-label="Select token B"
              >
                {tokenB.logoURI && <img src={tokenB.logoURI} className="w-5 h-5 rounded-full" alt="" />}
                <span className="font-mono text-sm text-text-primary">{tokenB.symbol}</span>
                <ChevronDown size={12} className="text-text-tertiary" />
              </button>
            </div>
            {exceedsB && <p className="mt-1 font-mono text-[10px] text-red-400">Insufficient {tokenB.symbol}</p>}
          </div>
        </div>

        {/* Fee tier */}
        <div className="mb-6">
          <label className="block font-mono text-xs text-text-secondary mb-2">Fee Tier</label>
          <div className="grid grid-cols-3 gap-2">
            {FEE_TIERS.map((tier) => (
              <button
                key={tier.fee}
                onClick={() => setFeeTier(tier.fee)}
                className={`p-3 border text-center transition-colors ${
                  feeTier === tier.fee ? "border-cyan bg-cyan/10" : "border-white/10 hover:border-white/20"
                }`}
              >
                <p className={`font-mono text-sm ${feeTier === tier.fee ? "text-cyan" : "text-text-primary"}`}>
                  {tier.label}
                </p>
                <p className="font-mono text-[10px] text-text-tertiary mt-1">{tier.desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Price range */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <label className="font-mono text-xs text-text-secondary">Price Range</label>
            <button
              onClick={() => setFullRange(!fullRange)}
              className={`font-mono text-xs ${fullRange ? "text-cyan" : "text-text-secondary"}`}
            >
              {fullRange ? "Full Range ✓" : "Set Custom Range"}
            </button>
          </div>
          {fullRange ? (
            <div className="p-4 bg-obsidian border border-white/5 text-center">
              <p className="font-mono text-sm text-text-primary">Full Range</p>
              <p className="font-mono text-xs text-text-secondary mt-1">Active across all price ranges. Higher IL risk.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              <div className="p-3 bg-obsidian border border-white/5">
                <p className="font-mono text-[10px] text-text-secondary mb-1">Min Price ({tokenB.symbol}/{tokenA.symbol})</p>
                <input type="number" value={minPrice} onChange={(e) => setMinPrice(e.target.value)}
                  className="w-full bg-transparent font-mono text-sm text-text-primary focus:outline-none" placeholder="0.0" />
              </div>
              <div className="p-3 bg-obsidian border border-white/5">
                <p className="font-mono text-[10px] text-text-secondary mb-1">Max Price ({tokenB.symbol}/{tokenA.symbol})</p>
                <input type="number" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)}
                  className="w-full bg-transparent font-mono text-sm text-text-primary focus:outline-none" placeholder="∞" />
              </div>
            </div>
          )}
        </div>

        {/* Summary */}
        <div className="mb-6 p-4 bg-obsidian border border-white/5 space-y-2 font-mono text-xs">
          <div className="flex justify-between">
            <span className="text-text-secondary">Pool</span>
            <span className="text-text-primary">{tokenA.symbol}/{tokenB.symbol} · {FEE_TIERS.find(f => f.fee === feeTier)?.label}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-text-secondary">Price Range</span>
            <span className="text-text-primary">{fullRange ? "Full" : `${minPrice || "0"} – ${maxPrice || "∞"}`}</span>
          </div>
          {(needsApproveA || needsApproveB) && (
            <div className="flex justify-between">
              <span className="text-text-secondary">Approvals needed</span>
              <span className="text-amber-400">
                {[needsApproveA && token0.symbol, needsApproveB && token1.symbol].filter(Boolean).join(", ")}
              </span>
            </div>
          )}
        </div>

        {/* Approval/tx progress */}
        {stepLabel && (
          <div className="mb-4 p-3 bg-cyan/5 border border-cyan/20 flex items-center gap-3">
            <Loader2 size={14} className="text-cyan animate-spin" />
            <p className="font-mono text-xs text-cyan">{stepLabel}</p>
            {txHash && (
              <a href={`https://etherscan.io/tx/${txHash}`} target="_blank" rel="noreferrer"
                className="ml-auto font-mono text-[10px] text-text-secondary hover:text-cyan flex items-center gap-1">
                {txHash.slice(0, 10)}… <ExternalLink size={9} />
              </a>
            )}
          </div>
        )}

        {/* IL warning */}
        <div className="flex items-start gap-2 mb-4 p-3 bg-amber-500/5 border border-amber-500/20">
          <AlertTriangle size={14} className="text-amber-400 flex-shrink-0 mt-0.5" />
          <p className="font-mono text-xs text-amber-400">
            Providing liquidity carries impermanent loss risk. Your token ratio changes as prices move.
          </p>
        </div>

        <button
          onClick={handleAdd}
          disabled={!canAdd}
          className="flex items-center justify-center gap-2 w-full py-4 bg-cyan text-void font-mono text-sm tracking-wider font-medium hover:bg-opacity-90 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
        >
          {!isConnected ? "Connect Wallet"
            : !canAdd && step === "idle" ? "Enter amounts"
            : needsApproveA ? `Approve ${token0.symbol} + Add Liquidity`
            : needsApproveB ? `Approve ${token1.symbol} + Add Liquidity`
            : "Add Liquidity"
          }
        </button>

        <div className="h-8" />
      </div>

      <TokenSelector
        open={showSelA}
        onClose={() => setShowSelA(false)}
        onSelect={(t) => { setTokenA(t); setAmountA(""); }}
        exclude={tokenB.address}
        title="Select Token A"
      />
      <TokenSelector
        open={showSelB}
        onClose={() => setShowSelB(false)}
        onSelect={(t) => { setTokenB(t); setAmountB(""); }}
        exclude={tokenA.address}
        title="Select Token B"
      />
    </div>
  );
}
