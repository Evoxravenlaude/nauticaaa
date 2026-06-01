/**
 * verify-nft.ts — Verify NauticaNFT on Etherscan.
 * Requires ETHERSCAN_API_KEY in .env.local
 *
 * Usage: npx hardhat run scripts/verify-nft.ts --network mainnet
 */
import { run } from "hardhat";

const ADDRESS = process.env.NFT_CONTRACT_ADDRESS ?? "";

async function main() {
  if (!ADDRESS) throw new Error("Set NFT_CONTRACT_ADDRESS env var");
  await run("verify:verify", {
    address: ADDRESS,
    constructorArguments: ["Nautica", "NAUT", 0, 500],
  });
  console.log("✅ Verified on Etherscan");
}

main().catch((e) => { console.error(e); process.exit(1); });
