import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { mainnet, base, optimism, arbitrum, polygon } from "wagmi/chains";

export const wagmiConfig = getDefaultConfig({
  appName: "Nautica",
  projectId: "accd59192fb9954746ff0d2d3a205f2b",
  chains: [mainnet, base, optimism, arbitrum, polygon],
});
