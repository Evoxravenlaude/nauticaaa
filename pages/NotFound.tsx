/**
 * 404 — Custom branded not-found page.
 * Shown for any unmatched route. Suggests common destinations
 * rather than just a dead end.
 */
import { Link, useLocation } from "react-router-dom";
import { Home, Search, Compass, ArrowLeft } from "lucide-react";

const SUGGESTIONS = [
  { label: "Marketplace",  to: "/nft",         Icon: Search  },
  { label: "Swap",         to: "/swap",        Icon: Compass },
  { label: "Pools",        to: "/pools",       Icon: Compass },
  { label: "Home",         to: "/",            Icon: Home    },
];

export default function NotFound() {
  const { pathname } = useLocation();

  return (
    <div className="min-h-screen bg-void flex flex-col items-center justify-center px-4">

      {/* Glitched N */}
      <div className="relative mb-8 select-none">
        <span
          className="font-heading text-[120px] leading-none text-text-primary opacity-5 block"
          aria-hidden
        >
          N
        </span>
        <span
          className="font-heading text-[120px] leading-none text-cyan absolute inset-0 flex items-center justify-center"
          style={{ clipPath: "inset(0 0 60% 0)", opacity: 0.7 }}
          aria-hidden
        >
          N
        </span>
        <span
          className="font-heading text-[120px] leading-none text-blue-400 absolute inset-0 flex items-center justify-center"
          style={{ clipPath: "inset(40% 0 0 0)", opacity: 0.5, transform: "translateX(4px)" }}
          aria-hidden
        >
          N
        </span>
        {/* 404 overlay */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="font-mono text-xl font-bold text-text-primary tracking-widest">404</span>
        </div>
      </div>

      {/* Message */}
      <h1 className="font-heading text-2xl text-text-primary text-center">
        Page not found
      </h1>
      <p className="mt-2 font-mono text-xs text-text-secondary text-center max-w-xs">
        <span className="text-text-tertiary">{pathname}</span> doesn't exist on this network.
      </p>

      {/* Divider */}
      <div className="w-32 h-[1px] bg-white/5 my-8" />

      {/* Suggestions */}
      <p className="font-mono text-[10px] text-text-tertiary mb-4 tracking-wider uppercase">
        Try one of these
      </p>
      <div className="grid grid-cols-2 gap-3 w-full max-w-xs">
        {SUGGESTIONS.map(({ label, to, Icon }) => (
          <Link
            key={to}
            to={to}
            className="flex items-center gap-2 p-3 bg-obsidian border border-white/5 hover:border-cyan/30 hover:text-cyan text-text-secondary font-mono text-xs transition-all group"
          >
            <Icon size={14} className="group-hover:text-cyan transition-colors" />
            {label}
          </Link>
        ))}
      </div>

      {/* Back link */}
      <button
        onClick={() => history.back()}
        className="mt-8 flex items-center gap-2 font-mono text-xs text-text-tertiary hover:text-text-secondary transition-colors"
      >
        <ArrowLeft size={12} />
        Go back
      </button>
    </div>
  );
}
