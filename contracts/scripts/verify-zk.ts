/**
 * verify-zk.ts — Verify NauticaZKVerifier on Etherscan.
 */
import { run } from "hardhat";

const ADDRESS = process.env.ZK_CONTRACT_ADDRESS ?? "";

async function main() {
  if (!ADDRESS) throw new Error("Set ZK_CONTRACT_ADDRESS env var");
  await run("verify:verify", { address: ADDRESS, constructorArguments: [] });
  console.log("✅ Verified on Etherscan");
}

main().catch((e) => { console.error(e); process.exit(1); });
