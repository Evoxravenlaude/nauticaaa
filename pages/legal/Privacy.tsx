import { Link } from "react-router-dom";
import { ChevronLeft } from "lucide-react";

export default function Privacy() {
  return (
    <div className="min-h-screen bg-void px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <Link to="/" className="inline-flex items-center gap-2 text-text-secondary hover:text-text-primary mb-8 transition-colors">
          <ChevronLeft size={16} /> Back
        </Link>
        <h1 className="font-heading text-3xl text-text-primary mb-2">Privacy Policy</h1>
        <p className="font-mono text-xs text-text-tertiary mb-8">Last updated: May 2026</p>

        <div className="space-y-6 text-text-secondary text-sm leading-relaxed">
          <section>
            <h2 className="font-heading text-lg text-text-primary mb-2">Data We Collect</h2>
            <p>Nautica collects no personally identifiable information. Your wallet address is read locally from your connected wallet and is never sent to our servers.</p>
          </section>
          <section>
            <h2 className="font-heading text-lg text-text-primary mb-2">Third-Party APIs</h2>
            <p>API calls to Alchemy and 0x are proxied through our Cloudflare Worker — your wallet address is only included in requests where strictly necessary (e.g. fetching your NFTs). CoinGecko price calls contain no wallet data.</p>
          </section>
          <section>
            <h2 className="font-heading text-lg text-text-primary mb-2">Local Storage</h2>
            <p>Your encrypted wallet keystore and notification history are stored in your browser's localStorage. This data never leaves your device. Use Settings → Reset to clear it at any time.</p>
          </section>
          <section>
            <h2 className="font-heading text-lg text-text-primary mb-2">Analytics</h2>
            <p>We use Cloudflare Analytics (privacy-preserving, no cookies, no fingerprinting) to understand aggregate usage. No individual tracking.</p>
          </section>
          <section>
            <h2 className="font-heading text-lg text-text-primary mb-2">Contact</h2>
            <p>For privacy questions: <a href="https://github.com/Evoxravenlaude/Nautica/issues" target="_blank" rel="noreferrer" className="text-cyan hover:opacity-80">GitHub Issues</a></p>
          </section>
        </div>
      </div>
    </div>
  );
}
