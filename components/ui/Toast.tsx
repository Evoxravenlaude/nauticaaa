import { useState, useEffect, useCallback, createContext, useContext, type ReactNode } from 'react';
import { Check, X, Loader2, ExternalLink, AlertTriangle } from 'lucide-react';

export type ToastType = 'pending' | 'success' | 'error' | 'info';

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  description?: string;
  txHash?: string;
  duration?: number;
}

interface ToastContextValue {
  toasts: Toast[];
  toast: (t: Omit<Toast, 'id'>) => string;
  updateToast: (id: string, updates: Partial<Toast>) => void;
  dismissToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback((t: Omit<Toast, 'id'>) => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    setToasts(prev => [...prev, { ...t, id }]);
    if (t.type !== 'pending' && t.duration !== 0) {
      setTimeout(() => setToasts(prev => prev.filter(x => x.id !== id)), t.duration ?? 5000);
    }
    return id;
  }, []);

  const updateToast = useCallback((id: string, updates: Partial<Toast>) => {
    setToasts(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
    if (updates.type && updates.type !== 'pending') {
      setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), updates.duration ?? 6000);
    }
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, toast, updateToast, dismissToast }}>
      {children}
      <ToastContainer toasts={toasts} dismiss={dismissToast} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside ToastProvider');
  return ctx;
}

const ICONS: Record<ToastType, ReactNode> = {
  pending: <Loader2 size={16} className="animate-spin text-[#00F5D4]" />,
  success: <Check size={16} className="text-emerald-400" />,
  error:   <AlertTriangle size={16} className="text-rose-400" />,
  info:    <div className="w-4 h-4 rounded-full border-2 border-[#00F5D4]" />,
};

const BORDERS: Record<ToastType, string> = {
  pending: 'border-[#00F5D4]/30',
  success: 'border-emerald-400/30',
  error:   'border-rose-400/30',
  info:    'border-[#243060]',
};

function ToastItem({ t, dismiss }: { t: Toast; dismiss: (id: string) => void }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => { requestAnimationFrame(() => setVisible(true)); }, []);
  const etherscanUrl = t.txHash ? `https://etherscan.io/tx/${t.txHash}` : null;

  return (
    <div className={`flex items-start gap-3 bg-[#0C1220] border ${BORDERS[t.type]} p-4 shadow-2xl min-w-[280px] max-w-sm transition-all duration-300 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}>
      <div className="mt-0.5 flex-shrink-0">{ICONS[t.type]}</div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-semibold text-[#E8F0FF]">{t.title}</div>
        {t.description && <div className="text-xs text-[#4A6080] mt-0.5">{t.description}</div>}
        {etherscanUrl && (
          <a href={etherscanUrl} target="_blank" rel="noreferrer"
            className="flex items-center gap-1 mt-1.5 text-[10px] text-[#00F5D4] hover:opacity-80"
            style={{ fontFamily: "'JetBrains Mono',monospace" }}>
            View on Etherscan <ExternalLink size={10} />
          </a>
        )}
      </div>
      <button onClick={() => dismiss(t.id)} className="text-[#3A4A6A] hover:text-[#7A8BA8] flex-shrink-0">
        <X size={14} />
      </button>
    </div>
  );
}

function ToastContainer({ toasts, dismiss }: { toasts: Toast[]; dismiss: (id: string) => void }) {
  if (!toasts.length) return null;
  return (
    <div className="fixed bottom-20 right-4 z-[100] flex flex-col gap-2 md:bottom-6">
      {toasts.map(t => <ToastItem key={t.id} t={t} dismiss={dismiss} />)}
    </div>
  );
}
