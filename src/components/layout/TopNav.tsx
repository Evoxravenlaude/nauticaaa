import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Search, Bell, Menu, X, Sun, Moon } from "lucide-react";
import { ConnectButton } from "@rainbow-me/rainbowkit";

interface TopNavProps {
  theme: "dark" | "light";
  setTheme: (t: "dark" | "light") => void;
}

const navLinks = [
  { label: "Home",        path: "/" },
  { label: "DEX",         path: "/dex" },
  { label: "Marketplace", path: "/nft" },
  { label: "ZK Proofs",   path: "/zk-send" },
  { label: "Pools",       path: "/pools" },
];

export default function TopNav({ theme, setTheme }: TopNavProps) {
  const [scrolled,    setScrolled]    = useState(false);
  const [mobileOpen,  setMobileOpen]  = useState(false);
  const [searchOpen,  setSearchOpen]  = useState(false);
  const location = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => { setMobileOpen(false); }, [location.pathname]);

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? "backdrop-blur-md bg-[#04060C]/90 border-b border-[#1A2540]" : "bg-transparent"}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <img
              src="/logo.png"
              alt="Nautica"
              className="w-9 h-9 object-contain group-hover:opacity-80 transition-opacity"
              style={{ filter: "brightness(1.05)" }}
            />
            <span className="font-bold text-base tracking-wider text-[#E8F0FF] group-hover:text-[#00F5D4] transition-colors">
              NAUTICA
            </span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`px-4 py-2 text-sm transition-colors ${location.pathname === link.path ? "text-[#00F5D4]" : "text-[#7A8BA8] hover:text-[#E8F0FF]"}`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-2">
            <button onClick={() => setSearchOpen(!searchOpen)} className="p-2 text-[#4A6080] hover:text-[#00F5D4] transition-colors" aria-label="Search">
              <Search size={18} />
            </button>
            <button onClick={() => setTheme(theme === "dark" ? "light" : "dark")} className="p-2 text-[#4A6080] hover:text-[#00F5D4] transition-colors" aria-label="Toggle theme">
              {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <Link to="/notifications" className="p-2 text-[#4A6080] hover:text-[#00F5D4] relative">
              <Bell size={18} />
              <span className="absolute top-1 right-1 w-2 h-2 bg-[#FFB347] rounded-full" />
            </Link>
            <div className="hidden sm:block">
              <ConnectButton chainStatus="icon" showBalance={false} accountStatus="address" />
            </div>
            <button onClick={() => setMobileOpen(!mobileOpen)} className="md:hidden p-2 text-[#7A8BA8]" aria-label="Menu">
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </div>

      {/* Search overlay */}
      {searchOpen && (
        <div className="absolute top-full left-0 right-0 backdrop-blur-md bg-[#04060C]/95 border-t border-[#1A2540] p-4">
          <input
            type="text"
            placeholder="Search tokens, NFTs, addresses…"
            className="w-full bg-[#0C1220] border border-[#1A2540] px-4 py-3 text-[#E8F0FF] text-sm font-mono placeholder:text-[#3A4A6A] focus:outline-none focus:border-[#00F5D4]/40"
            autoFocus
          />
        </div>
      )}

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden backdrop-blur-md bg-[#04060C]/95 border-t border-[#1A2540]">
          <div className="px-4 py-3 space-y-1">
            {navLinks.map((link) => (
              <Link key={link.path} to={link.path}
                className={`block px-4 py-3 text-sm ${location.pathname === link.path ? "text-[#00F5D4]" : "text-[#7A8BA8]"}`}>
                {link.label}
              </Link>
            ))}
            <div className="px-4 py-3">
              <ConnectButton chainStatus="icon" showBalance={false} accountStatus="address" />
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
