import { Link } from 'react-router-dom';
import { ChevronLeft, Shield } from 'lucide-react';

const SECTIONS = [
  {
    title: '1. Information We Do Not Collect',
    body: `Nautica is a non-custodial, client-side application. We do not collect, store, or process: your name or identity, private keys or seed phrases, email addresses or phone numbers, payment information, or IP addresses tied to wallet activity. Your wallet interactions occur directly between your browser and the blockchain.`,
  },
  {
    title: '2. On-Chain Data',
    body: `Blockchain transactions are public by nature. Any transaction you submit is permanently recorded on the relevant public blockchain and is visible to anyone. The ZK Shield feature (powered by Railgun) provides cryptographic privacy for certain transaction types — sender, recipient, and amounts are shielded — but the existence of a shielding transaction is still on-chain.`,
  },
  {
    title: '3. Third-Party APIs',
    body: `To provide live market data and NFT metadata, the Platform interacts with third-party services including Alchemy (NFT API), CoinGecko (price data), 0x Protocol (swap quotes), Reservoir (NFT marketplace), and Uniswap subgraph (liquidity data). These services may log request metadata per their own privacy policies. API calls are proxied through our Cloudflare Worker where possible to avoid exposing your IP to multiple third parties.`,
  },
  {
    title: '4. Wallet Connection',
    body: `When you connect your wallet, the Platform reads your public address and on-chain balances. This data is processed locally in your browser and is not transmitted to any Nautica-controlled server. We use RainbowKit and wagmi for wallet connectivity — both are open-source and widely audited.`,
  },
  {
    title: '5. Local Storage',
    body: `The Platform stores your theme preference (dark/light mode) in your browser's localStorage. No sensitive data is stored locally. You can clear this at any time via your browser settings.`,
  },
  {
    title: '6. Cloudflare',
    body: `The Platform is hosted on Cloudflare Workers. Cloudflare may collect standard infrastructure metrics (request counts, error rates) for availability monitoring. No personally identifiable information is passed to Cloudflare by the Platform. See Cloudflare's Privacy Policy for details.`,
  },
  {
    title: '7. Cookies',
    body: `The Platform does not use cookies for tracking or advertising. Cloudflare may set technical cookies for DDoS protection and performance optimisation.`,
  },
  {
    title: '8. ZK Privacy Technology',
    body: `When using ZK Shield, zero-knowledge proofs are generated entirely in your browser using Railgun's open-source circuit libraries. No proof data is transmitted to Nautica servers. The Railgun relayer network facilitates on-chain submission — see Railgun's documentation for their privacy model.`,
  },
  {
    title: '9. Your Rights',
    body: `Because we do not collect personal data, there is no personal data held by Nautica to access, correct, or delete. Your blockchain transactions are immutable by design. To manage your on-chain privacy, use the ZK Shield feature.`,
  },
  {
    title: '10. Contact',
    body: `For privacy-related questions, reach out via the official Nautica GitHub repository or community channels. We do not operate a support email to avoid centralising communications.`,
  },
];

export default function Privacy() {
  return (
    <div className="min-h-screen bg-[#04060C]" style={{ fontFamily:"'Inter',sans-serif" }}>
      <div className="max-w-3xl mx-auto px-5 py-12">
        <div className="flex items-center gap-3 mb-8">
          <Link to="/" className="text-[#4A6080] hover:text-[#E8F0FF] transition-colors"><ChevronLeft size={18}/></Link>
          <div>
            <h1 className="text-2xl font-bold text-[#E8F0FF]">Privacy Policy</h1>
            <p className="text-[11px] text-[#3A4A6A] font-mono mt-0.5">Last updated: {new Date().toLocaleDateString('en', { month:'long', day:'numeric', year:'numeric' })}</p>
          </div>
        </div>

        <div className="bg-purple-400/5 border border-purple-400/20 p-4 mb-8 flex items-start gap-3">
          <Shield size={16} className="text-purple-400 flex-shrink-0 mt-0.5"/>
          <p className="text-sm text-[#7A8BA8] leading-relaxed">
            <strong className="text-purple-400">Privacy-first by design.</strong> Nautica is a non-custodial dApp. We do not collect personal data, run servers with user databases, or track your activity. Your data stays in your wallet and on the blockchain.
          </p>
        </div>

        <div className="space-y-8">
          {SECTIONS.map(s => (
            <div key={s.title}>
              <h2 className="text-base font-bold text-[#E8F0FF] mb-3">{s.title}</h2>
              <p className="text-sm text-[#7A8BA8] leading-relaxed">{s.body}</p>
            </div>
          ))}
        </div>

        <div className="mt-12 pt-8 border-t border-[#1A2540] flex flex-wrap gap-4 text-xs font-mono text-[#3A4A6A]">
          <Link to="/terms" className="hover:text-[#00F5D4] transition-colors">Terms of Service</Link>
          <Link to="/" className="hover:text-[#00F5D4] transition-colors">← Back to App</Link>
        </div>
      </div>
    </div>
  );
}
