/**
 * deploy-zk.ts — Deploy NauticaZKVerifier.
 *
 * Usage:
 *   npx hardhat run scripts/deploy-zk.ts --network sepolia   # test first
 *   npx hardhat run scripts/deploy-zk.ts --network mainnet
 *
 * After deployment, update src/lib/zk-identity.ts:
 *   export const ZK_VERIFIER_ADDRESS = "0x…"
 *
 * Then update ZKVerify.tsx to call verifyProof() on-chain
 * and ZKSend.tsx to call verifyProof() after generating a proof.
 */
import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying NauticaZKVerifier with:", deployer.address);
  console.log("Balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "ETH\n");

  const Verifier = await ethers.getContractFactory("NauticaZKVerifier");
  const contract = await Verifier.deploy();
  await contract.waitForDeployment();
  const address = await contract.getAddress();

  console.log("✅ NauticaZKVerifier deployed to:", address);
  console.log("\nNext steps:");
  console.log(`  1. Set ZK_VERIFIER_ADDRESS = "${address}" in src/lib/zk-identity.ts`);
  console.log(`  2. Add Nautica's commitment to the group:`);
  console.log(`       cast send ${address} "addMember(bytes32)" <your_commitment> --rpc-url <rpc> --private-key <key>`);
  console.log(`  3. Verify on Etherscan:`);
  console.log(`       npx hardhat verify --network mainnet ${address}`);
  console.log(`  4. View: https://etherscan.io/address/${address}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
