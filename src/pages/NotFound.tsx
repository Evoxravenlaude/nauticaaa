import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#04060C] flex flex-col items-center justify-center px-6 text-center">
      <svg width="56" height="56" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" className="mb-8 opacity-30" aria-hidden="true">
        <circle cx="32" cy="32" r="30" fill="#050A14"/>
        <circle cx="32" cy="32" r="29" fill="none" stroke="#00F5D4" strokeWidth="1.5"/>
        <text x="32" y="43" textAnchor="middle" fontFamily="Arial Black,sans-serif" fontWeight="900" fontSize="31" fill="#00F5D4">N</text>
      </svg>
      <div className="text-[120px] font-black text-[#0C1220] leading-none mb-4" style={{ fontFamily: "'JetBrains Mono',monospace" }}>404</div>
      <h1 className="text-2xl font-bold text-[#E8F0FF] mb-3">Page not found</h1>
      <p className="text-sm text-[#4A6080] mb-10 max-w-sm">
        This route doesn't exist in the Nautica terminal. It may have been moved or the link is broken.
      </p>
      <div className="flex flex-wrap gap-3 justify-center">
        <Link to="/" className="px-6 py-3 bg-[#00F5D4] text-[#04060C] text-sm font-bold hover:brightness-110 transition-all">Go Home</Link>
        <Link to="/dex" className="px-6 py-3 border border-[#1A2540] text-[#7A8BA8] text-sm font-bold hover:border-[#243060] transition-all">Open Terminal</Link>
        <Link to="/nft" className="px-6 py-3 border border-[#1A2540] text-[#7A8BA8] text-sm font-bold hover:border-[#243060] transition-all">Marketplace</Link>
      </div>
    </div>
  );
}
