import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider } from "wagmi";
import { RainbowKitProvider, darkTheme } from "@rainbow-me/rainbowkit";
import "@rainbow-me/rainbowkit/styles.css";
import "./index.css";
import App from "./App.tsx";
import { wagmiConfig } from "./lib/web3";

declare global {
  interface Window { __removeSplash?: () => void; }
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      throwOnError: false,
    },
  },
});

const rootEl = document.getElementById("root");
if (!rootEl) throw new Error("Root element not found");

createRoot(rootEl).render(
  <WagmiProvider config={wagmiConfig}>
    <QueryClientProvider client={queryClient}>
      <RainbowKitProvider
        theme={darkTheme({
          accentColor: "#00F5D4",
          accentColorForeground: "#04060C",
          borderRadius: "medium",
          overlayBlur: "small",
        })}
      >
        <App />
      </RainbowKitProvider>
    </QueryClientProvider>
  </WagmiProvider>
);
