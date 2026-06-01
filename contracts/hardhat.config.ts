import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import * as dotenv from "dotenv";

dotenv.config({ path: "../.env.local" });

// Keys come from .env.local (same file as the frontend)
const DEPLOYER_KEY  = process.env.DEPLOYER_PRIVATE_KEY ?? "0x" + "0".repeat(64);
const ALCHEMY_KEY   = process.env.VITE_ALCHEMY_API_KEY  ?? "";
const ETHERSCAN_KEY = process.env.ETHERSCAN_API_KEY     ?? "";

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.20",
    settings: { optimizer: { enabled: true, runs: 200 } },
  },
  networks: {
    hardhat: {},
    sepolia: {
      url: `https://eth-sepolia.g.alchemy.com/v2/${ALCHEMY_KEY}`,
      accounts: [DEPLOYER_KEY],
      chainId: 11155111,
    },
    mainnet: {
      url: `https://eth-mainnet.g.alchemy.com/v2/${ALCHEMY_KEY}`,
      accounts: [DEPLOYER_KEY],
      chainId: 1,
    },
  },
  etherscan: {
    apiKey: ETHERSCAN_KEY,
  },
};

export default config;
