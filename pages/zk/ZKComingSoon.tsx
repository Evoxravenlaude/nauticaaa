/**
 * ZKComingSoon — shared component used by all ZK pages.
 * Shows what the feature will do, what's needed to build it,
 * and links to learn more. Honest, on-brand, no fake animations.
 */
import { Link } from "react-router-dom";
import { Shield, ChevronLeft, ExternalLink, Clock } from "lucide-react";

interface ZKFeature {
  label: string;
  done: boolean;
}

interface ZKComingSoonProps {
  title: string;
  description: string;
  backTo?: string;
  backLabel?: string;
  features: ZKFeature[];
  learnMoreUrl?: string;
}

export function ZKComingSoon({
  title,
  description,
  backTo = "/",
  backLabel = "Back",
  features,
  learnMoreUrl,
}: ZKComingSoonProps) {
  return (
    <div className="min-h-screen bg-void px-4 py-6">
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-10">
          <Link to={backTo} className="text-text-secondary hover:text-text-primary transition-colors">
            <ChevronLeft size={20} />
          </Link>
          <div className="flex items-center gap-2">
            <Shield size={18} className="text-cyan" />
            <h1 className="font-heading text-xl text-text-primary">{title}</h1>
          </div>
        </div>

        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1 border border-cyan/20 bg-cyan/5 mb-8">
          <Clock size={12} className="text-cyan" />
          <span className="font-mono text-xs text-cyan tracking-wider">PHASE 2 — PARTIALLY LIVE</span>
        </div>

        {/* Description */}
        <p className="text-text-secondary text-sm leading-relaxed mb-10">{description}</p>

        {/* Progress checklist */}
        <div className="mb-10">
          <p className="font-mono text-xs text-text-secondary mb-4">BUILD PROGRESS</p>
          <div className="space-y-3">
            {features.map((f, i) => (
              <div key={i} className="flex items-center gap-3">
                <div
                  className={`w-5 h-5 border flex items-center justify-center flex-shrink-0 ${
                    f.done
                      ? "border-cyan bg-cyan/10"
                      : "border-white/10 bg-obsidian"
                  }`}
                >
                  {f.done && (
                    <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                      <path d="M1 4L3.5 6.5L9 1" stroke="#00FFEA" strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                  )}
                </div>
                <span className={`font-mono text-xs ${f.done ? "text-text-primary" : "text-text-tertiary"}`}>
                  {f.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-white/5 mb-8" />

        {/* What is ZK — educational */}
        <div className="p-4 bg-obsidian border border-white/5 mb-6">
          <p className="font-mono text-xs text-text-secondary mb-3">WHAT IS ZERO-KNOWLEDGE?</p>
          <p className="text-text-secondary text-xs leading-relaxed">
            A zero-knowledge proof lets one party prove they know a value — or that a transaction is
            valid — without revealing any underlying data. In Nautica this means sending tokens
            privately: the blockchain sees the proof, not the sender, recipient, or amount.
          </p>
        </div>

        {learnMoreUrl && (
          <a
            href={learnMoreUrl}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 font-mono text-xs text-cyan hover:opacity-80 transition-opacity mb-8"
          >
            Learn about Semaphore ZK protocol <ExternalLink size={12} />
          </a>
        )}

        {/* Notify CTA */}
        <div className="p-4 bg-cyan/5 border border-cyan/20">
          <p className="font-mono text-xs text-cyan mb-1">WANT EARLY ACCESS?</p>
          <p className="text-text-secondary text-xs mb-3">
            ZK private transfers are scheduled for Phase 2. Follow the repo for updates.
          </p>
          <a
            href="https://github.com/Evoxravenlaude/Nautica"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 font-mono text-xs text-cyan border border-cyan/30 px-4 py-2 hover:bg-cyan/10 transition-colors"
          >
            Watch on GitHub <ExternalLink size={11} />
          </a>
        </div>
      </div>
    </div>
  );
}
