import { Link } from "react-router-dom";
import { ChevronLeft } from "lucide-react";

export default function Terms() {
  return (
    <div className="min-h-screen bg-void px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <Link to="/" className="inline-flex items-center gap-2 text-text-secondary hover:text-text-primary mb-8 transition-colors">
          <ChevronLeft size={16} /> Back
        </Link>
        <h1 className="font-heading text-3xl text-text-primary mb-2">Terms of Service</h1>
        <p className="font-mono text-xs text-text-tertiary mb-8">Last updated: May 2026</p>

        <div className="space-y-6 text-text-secondary text-sm leading-relaxed">
          <section>
            <h2 className="font-heading text-lg text-text-primary mb-2">1. Nature of the Service</h2>
            <p>Nautica is a non-custodial Web3 interface. We do not hold your funds, private keys, or personal data. All transactions are executed directly on the Ethereum blockchain via your connected wallet.</p>
          </section>
          <section>
            <h2 className="font-heading text-lg text-text-primary mb-2">2. No Financial Advice</h2>
            <p>Nothing on this platform constitutes financial, investment, or legal advice. Token prices, APR estimates, and pool data are for informational purposes only. Always do your own research.</p>
          </section>
          <section>
            <h2 className="font-heading text-lg text-text-primary mb-2">3. Smart Contract Risk</h2>
            <p>Interactions with DeFi protocols (Uniswap, 0x, etc.) carry inherent smart contract risk. Nautica is a frontend interface and does not control or audit the underlying contracts.</p>
          </section>
          <section>
            <h2 className="font-heading text-lg text-text-primary mb-2">4. Prohibited Use</h2>
            <p>You may not use Nautica to circumvent sanctions, launder funds, or engage in market manipulation. Use of this interface constitutes agreement to these terms.</p>
          </section>
          <section>
            <h2 className="font-heading text-lg text-text-primary mb-2">5. Contact</h2>
            <p>For questions: <a href="https://github.com/Evoxravenlaude/Nautica/issues" target="_blank" rel="noreferrer" className="text-cyan hover:opacity-80">GitHub Issues</a></p>
          </section>
        </div>
      </div>
    </div>
  );
}
