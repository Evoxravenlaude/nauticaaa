import path from "path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  // NOTE: their wrangler.json uses static assets — keep './' for local dev
  // Change to '/' if deploying directly to Cloudflare Workers with wrangler
  base: "./",

  plugins: [react()],

  server: {
    port: 3000,
    // ── Local dev proxy ─────────────────────────────────────────────────
    // Mirrors all Cloudflare Worker /api/* routes so `npm run dev` works
    // identically to production. Keys come from .env.local — never hardcoded.
    proxy: {
      // Alchemy NFT v3 (collections, NFT metadata, ownership)
      "/api/alchemy-nft": {
        target: "https://eth-mainnet.g.alchemy.com",
        changeOrigin: true,
        rewrite: (p) =>
          p.replace(
            /^\/api\/alchemy-nft/,
            `/nft/v3/${process.env.VITE_ALCHEMY_API_KEY ?? ""}`
          ),
      },
      // Alchemy JSON-RPC (getAssetTransfers, eth_call, etc.)
      "/api/alchemy": {
        target: "https://eth-mainnet.g.alchemy.com",
        changeOrigin: true,
        rewrite: (p) =>
          p.replace(
            /^\/api\/alchemy/,
            `/v2/${process.env.VITE_ALCHEMY_API_KEY ?? ""}`
          ),
      },
      // 0x Protocol (swap quotes)
      "/api/0x": {
        target: "https://api.0x.org",
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/api\/0x/, ""),
        headers: {
          "0x-api-key": process.env.VITE_ZERO_X_API_KEY ?? "",
        },
      },
      // CoinGecko (live prices — no key needed)
      "/api/prices": {
        target: "https://api.coingecko.com",
        changeOrigin: true,
        rewrite: () =>
          "/api/v3/simple/price?ids=ethereum,solana,usd-coin,bitcoin,chainlink,arbitrum,uniswap,tether,matic-network&vs_currencies=usd&include_24hr_change=true",
      },
      // Reservoir (NFT listings, buy steps, recent sales)
      "/api/reservoir": {
        target: "https://api.reservoir.tools",
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/api\/reservoir/, ""),
        headers: { accept: "application/json" },
      },
    },
  },

  build: {
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks: {
          "vendor-web3":   ["wagmi", "viem", "@rainbow-me/rainbowkit"],
          "vendor-react":  ["react", "react-dom", "react-router-dom"],
          "vendor-query":  ["@tanstack/react-query"],
          "vendor-charts": ["lightweight-charts"],
          "vendor-utils":  ["lodash", "sonner"],
        },
      },
    },
    minify: "esbuild",
    sourcemap: false,
    target: "es2022",
  },

  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
});
