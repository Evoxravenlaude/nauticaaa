import { Component, type ReactNode, type ErrorInfo } from 'react';

interface Props { children: ReactNode; fallback?: ReactNode; }
interface State { error: Error | null; }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[Nautica] Render error:', error, info.componentStack);
  }

  render() {
    if (!this.state.error) return this.props.children;
    if (this.props.fallback) return this.props.fallback;
    return (
      <div className="min-h-screen bg-[#04060C] flex flex-col items-center justify-center px-6 text-center">
        <svg width="48" height="48" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" className="mb-6 opacity-40" aria-hidden="true">
          <circle cx="32" cy="32" r="30" fill="#050A14"/>
          <circle cx="32" cy="32" r="29" fill="none" stroke="#00F5D4" strokeWidth="1.5" opacity="0.6"/>
          <text x="32" y="43" textAnchor="middle" fontFamily="Arial Black,sans-serif" fontWeight="900" fontSize="31" fill="#00F5D4">N</text>
        </svg>
        <h1 className="text-xl font-bold text-[#E8F0FF] mb-2">Something went wrong</h1>
        <p className="text-sm text-[#4A6080] mb-1 max-w-md" style={{ fontFamily: "'JetBrains Mono',monospace" }}>
          {this.state.error.message}
        </p>
        <p className="text-xs text-[#3A4A6A] mb-8" style={{ fontFamily: "'JetBrains Mono',monospace" }}>
          The error has been logged. Refreshing usually fixes this.
        </p>
        <div className="flex gap-3">
          <button
            onClick={() => window.location.reload()}
            className="px-5 py-2.5 bg-[#00F5D4] text-[#04060C] text-xs font-bold hover:brightness-110 transition-all"
          >
            Reload Page
          </button>
          {/* Use plain <a> not <Link> — ErrorBoundary lives outside the Router */}
          <a
            href="/"
            onClick={() => this.setState({ error: null })}
            className="px-5 py-2.5 border border-[#1A2540] text-[#7A8BA8] text-xs font-bold hover:border-[#243060] transition-all"
          >
            Go Home
          </a>
        </div>
      </div>
    );
  }
}
