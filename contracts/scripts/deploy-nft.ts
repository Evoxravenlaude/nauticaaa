/**
 * deploy-nft.ts — Deploy NauticaNFT ERC-721 factory.
 *
 * Usage:
 *   cd contracts
 *   npm install
 *   # Sepolia testnet first:
 *   npx hardhat run scripts/deploy-nft.ts --network sepolia
 *   # Mainnet:
 *   npx hardhat run scripts/deploy-nft.ts --network mainnet
 *
 * After deployment, copy the printed address into:
 *   src/pages/nft/CreateNFT.tsx  →  const FACTORY_ADDRESS = "0x…"
 */
import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying NauticaNFT with:", deployer.address);
  console.log("Balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "ETH\n");

  const NauticaNFT = await ethers.getContractFactory("NauticaNFT");

  const contract = await NauticaNFT.deploy(
    "Nautica",     // name
    "NAUT",        // symbol
    0n,            // mintFee (0 = free to mint)
    500n           // royaltyBps (5%)
  );

  await contract.waitForDeployment();
  const address = await contract.getAddress();

  console.log("✅ NauticaNFT deployed to:", address);
  console.log("\nNext steps:");
  console.log(`  1. Set FACTORY_ADDRESS = "${address}" in src/pages/nft/CreateNFT.tsx`);
  console.log(`  2. Verify on Etherscan: npx hardhat verify --network ${process.env.HARDHAT_NETWORK ?? "mainnet"} ${address} "Nautica" "NAUT" 0 500`);
  console.log(`  3. View: https://etherscan.io/address/${address}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
