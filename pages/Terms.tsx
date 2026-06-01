import { Link } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';

const SECTIONS = [
  {
    title: '1. Acceptance of Terms',
    body: `By accessing or using Nautica ("the Platform"), you agree to be bound by these Terms of Service. If you do not agree to these terms, do not use the Platform. Nautica is a non-custodial Web3 interface — we do not hold your assets, private keys, or personal data.`,
  },
  {
    title: '2. Non-Custodial Nature',
    body: `Nautica is a decentralised application (dApp) that provides an interface for interacting with smart contracts deployed on public blockchains. We do not custody funds, execute transactions on your behalf, or have access to your private keys. All transactions are signed locally in your wallet and broadcast directly to the network.`,
  },
  {
    title: '3. ZK Privacy Features',
    body: `The ZK Shield feature is powered by Railgun, an independent privacy protocol. Nautica does not operate, control, or have access to Railgun's smart contracts or proving infrastructure. Use of ZK features is subject to applicable laws in your jurisdiction. It is your responsibility to ensure compliance with local regulations including AML/KYC requirements.`,
  },
  {
    title: '4. Prohibited Activities',
    body: `You may not use Nautica to: (a) launder money or circumvent sanctions; (b) interact with sanctioned wallets or contracts; (c) violate any applicable law or regulation; (d) attempt to exploit, hack, or degrade the Platform; (e) impersonate any person or entity.`,
  },
  {
    title: '5. No Financial Advice',
    body: `Nothing on the Platform constitutes financial, investment, legal, or tax advice. DeFi protocols carry significant risk including smart contract bugs, market volatility, impermanent loss, and total loss of funds. You are solely responsible for your financial decisions.`,
  },
  {
    title: '6. Supported Jurisdictions',
    body: `The Platform is not available to residents of, or persons located in, jurisdictions where its use would be prohibited or restricted, including the United States (where certain DeFi activities are regulated), OFAC-sanctioned countries, and other restricted territories. By using the Platform, you represent that you are not in a restricted jurisdiction.`,
  },
  {
    title: '7. Intellectual Property',
    body: `The Nautica name, logo, interface design, and underlying code are proprietary. You may not copy, reproduce, or distribute any part of the Platform without written permission. Open-source components are governed by their respective licences.`,
  },
  {
    title: '8. Disclaimer of Warranties',
    body: `The Platform is provided "as is" without warranties of any kind. We do not guarantee uptime, accuracy of pricing data, or fitness for a particular purpose. Blockchain networks can be congested, hard-forked, or experience outages beyond our control.`,
  },
  {
    title: '9. Limitation of Liability',
    body: `To the maximum extent permitted by law, Nautica and its contributors shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including loss of profits or funds, arising from your use of the Platform.`,
  },
  {
    title: '10. Modifications',
    body: `We may update these Terms at any time. Continued use of the Platform after changes constitutes acceptance. Material changes will be communicated via the Platform interface.`,
  },
];

export default function Terms() {
  return (
    <div className="min-h-screen bg-[#04060C]" style={{ fontFamily:"'Inter',sans-serif" }}>
      <div className="max-w-3xl mx-auto px-5 py-12">
        <div className="flex items-center gap-3 mb-8">
          <Link to="/" className="text-[#4A6080] hover:text-[#E8F0FF] transition-colors"><ChevronLeft size={18}/></Link>
          <div>
            <h1 className="text-2xl font-bold text-[#E8F0FF]">Terms of Service</h1>
            <p className="text-[11px] text-[#3A4A6A] font-mono mt-0.5">Last updated: {new Date().toLocaleDateString('en', { month:'long', day:'numeric', year:'numeric' })}</p>
          </div>
        </div>

        <div className="bg-[#0C1220] border border-[#00F5D4]/20 p-4 mb-8 text-sm text-[#7A8BA8] leading-relaxed">
          <strong className="text-[#00F5D4]">Important:</strong> Nautica is a non-custodial DeFi interface. We never hold your funds. All smart contract interactions are your own. Read these terms carefully before using the Platform.
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
          <Link to="/privacy" className="hover:text-[#00F5D4] transition-colors">Privacy Policy</Link>
          <Link to="/" className="hover:text-[#00F5D4] transition-colors">← Back to App</Link>
        </div>
      </div>
    </div>
  );
}
