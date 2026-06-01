import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { useEffect, useState, useRef, lazy, Suspense } from "react";
import { ErrorBoundary } from "./components/ui/ErrorBoundary";
import { ToastProvider } from "./components/ui/Toast";
import TopNav from "./components/layout/TopNav";
import BottomNav from "./components/layout/BottomNav";

// ─── Lazy-loaded pages ────────────────────────────────────────────────────────
const Splash           = lazy(() => import("./pages/onboarding/Splash"));
const Welcome          = lazy(() => import("./pages/onboarding/Welcome"));
const CreateWallet     = lazy(() => import("./pages/onboarding/CreateWallet"));
const ConfirmSeed      = lazy(() => import("./pages/onboarding/ConfirmSeed"));
const SetPassword      = lazy(() => import("./pages/onboarding/SetPassword"));
const ImportWallet     = lazy(() => import("./pages/onboarding/ImportWallet"));
const OnboardingSuccess = lazy(() => import("./pages/onboarding/OnboardingSuccess"));

const WalletHome  = lazy(() => import("./pages/wallet/WalletHome"));
const Send        = lazy(() => import("./pages/wallet/Send"));
const SendReview  = lazy(() => import("./pages/wallet/SendReview"));
const Receive     = lazy(() => import("./pages/wallet/Receive"));
const Swap        = lazy(() => import("./pages/wallet/Swap"));
const SwapReview  = lazy(() => import("./pages/wallet/SwapReview"));

const DexTerminal  = lazy(() => import("./pages/dex/DexTerminal"));
const Pools        = lazy(() => import("./pages/dex/Pools"));
const AddLiquidity = lazy(() => import("./pages/dex/AddLiquidity"));

const NFTMarketplace  = lazy(() => import("./pages/nft/NFTMarketplace"));
const CollectionDetail = lazy(() => import("./pages/nft/CollectionDetail"));
const NFTItemDetail   = lazy(() => import("./pages/nft/NFTItemDetail"));
const CreateNFT       = lazy(() => import("./pages/nft/CreateNFT"));
const MyNFTs          = lazy(() => import("./pages/nft/MyNFTs"));

const ZKSend    = lazy(() => import("./pages/zk/ZKSend"));
const ZKReceive = lazy(() => import("./pages/zk/ZKReceive"));
const ZKHistory = lazy(() => import("./pages/zk/ZKHistory"));
const ZKVerify  = lazy(() => import("./pages/zk/ZKVerify"));

const Settings      = lazy(() => import("./pages/settings/Settings"));
const Profile       = lazy(() => import("./pages/settings/Profile"));
const Notifications = lazy(() => import("./pages/settings/Notifications"));
const Networks      = lazy(() => import("./pages/settings/Networks"));
const Home          = lazy(() => import("./pages/Home"));
const NotFound      = lazy(() => import("./pages/NotFound"));
const Terms         = lazy(() => import("./pages/legal/Terms"));
const Privacy       = lazy(() => import("./pages/legal/Privacy"));

// ─── Page loading fallback ────────────────────────────────────────────────────
function PageFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "#04060C" }}>
      <div style={{ width: 24, height: 24, border: "2px solid rgba(0,245,212,0.2)", borderTopColor: "#00F5D4", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

const noNavPaths = ["/splash", "/welcome", "/create-wallet", "/confirm-seed",
  "/set-password", "/import-wallet", "/success", "/dex"];

function PageTransition({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ animation: "fadeIn 0.2s ease" }}>
      <style>{`@keyframes fadeIn{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:translateY(0)}}`}</style>
      {children}
    </div>
  );
}

// ─── AppLayout — must be inside BrowserRouter ─────────────────────────────────
function AppLayout() {
  const location = useLocation();
  const [theme, setTheme] = useState<"dark" | "light">(
    () => (localStorage.getItem("nautica-theme") as "dark" | "light") ?? "dark"
  );
  const hasMounted = useRef(false);

  useEffect(() => {
    document.documentElement.classList.remove("dark", "light");
    document.documentElement.classList.add(theme);
    localStorage.setItem("nautica-theme", theme);
  }, [theme]);

  useEffect(() => {
    if (!hasMounted.current) {
      hasMounted.current = true;
      setTimeout(() => window.__removeSplash?.(), 300);
    }
  }, []);

  const showNav = !noNavPaths.some((p) => location.pathname.startsWith(p));

  return (
    <div className={`min-h-screen ${theme === "dark" ? "bg-void" : "bg-white"}`}>
      {showNav && <TopNav theme={theme} setTheme={setTheme} />}
      <main id="main-content" tabIndex={-1} className={showNav ? "pt-16 pb-20 md:pb-0" : ""}>
        <PageTransition key={location.pathname}>
          <Suspense fallback={<PageFallback />}>
            <Routes location={location}>
              {/* Onboarding */}
              <Route path="/splash"        element={<Splash />} />
              <Route path="/welcome"       element={<Welcome />} />
              <Route path="/create-wallet" element={<CreateWallet />} />
              <Route path="/confirm-seed"  element={<ConfirmSeed />} />
              <Route path="/set-password"  element={<SetPassword />} />
              <Route path="/import-wallet" element={<ImportWallet />} />
              <Route path="/success"       element={<OnboardingSuccess />} />

              {/* Home */}
              <Route path="/" element={<Home />} />

              {/* Wallet */}
              <Route path="/wallet-home"  element={<WalletHome />} />
              <Route path="/send"         element={<Send />} />
              <Route path="/send-review"  element={<SendReview />} />
              <Route path="/receive"      element={<Receive />} />
              <Route path="/swap"         element={<Swap />} />
              <Route path="/swap-review"  element={<SwapReview />} />

              {/* DEX */}
              <Route path="/dex"           element={<DexTerminal />} />
              <Route path="/pools"         element={<Pools />} />
              <Route path="/add-liquidity" element={<AddLiquidity />} />

              {/* NFT */}
              <Route path="/nft"                  element={<NFTMarketplace />} />
              <Route path="/collection/:id"       element={<CollectionDetail />} />
              <Route path="/nft/:id"              element={<NFTItemDetail />} />
              <Route path="/create-nft"           element={<CreateNFT />} />
              <Route path="/my-nfts"              element={<MyNFTs />} />

              {/* ZK */}
              <Route path="/zk-send"    element={<ZKSend />} />
              <Route path="/zk-receive" element={<ZKReceive />} />
              <Route path="/zk-history" element={<ZKHistory />} />
              <Route path="/zk-verify"  element={<ZKVerify />} />

              {/* Settings */}
              <Route path="/settings"      element={<Settings />} />
              <Route path="/profile"       element={<Profile />} />
              <Route path="/notifications" element={<Notifications />} />
              <Route path="/networks"      element={<Networks />} />

              {/* Legal */}
              <Route path="/terms"   element={<Terms />}   />
              <Route path="/privacy" element={<Privacy />} />

              {/* 404 — must be last */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </PageTransition>
      </main>
      {showNav && <BottomNav />}
    </div>
  );
}

// ─── Root App ─────────────────────────────────────────────────────────────────
// BrowserRouter is the OUTERMOST wrapper so ErrorBoundary and ToastProvider
// are both inside Router context — <Link> works anywhere in the tree.
export default function App() {
  return (
    <BrowserRouter>
      <ErrorBoundary>
        <ToastProvider>
          <AppLayout />
        </ToastProvider>
      </ErrorBoundary>
    </BrowserRouter>
  );
}
