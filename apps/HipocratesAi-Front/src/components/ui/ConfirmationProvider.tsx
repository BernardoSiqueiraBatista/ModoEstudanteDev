import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import {
  AlertTriangle,
  Trash2,
  CheckCircle2,
  Info,
  HelpCircle,
  X,
} from 'lucide-react';

type ConfirmTone = 'destructive' | 'warning' | 'info' | 'success' | 'primary';

interface ConfirmOptions {
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: ConfirmTone;
  icon?: ReactNode;
}

interface PendingConfirmation extends ConfirmOptions {
  id: string;
  resolve: (value: boolean) => void;
}

interface ConfirmationContextValue {
  confirm: (opts: ConfirmOptions) => Promise<boolean>;
}

const ConfirmationContext = createContext<ConfirmationContextValue | null>(null);

const TONE_STYLES: Record<
  ConfirmTone,
  {
    iconBg: string;
    iconColor: string;
    iconRing: string;
    confirmBtn: string;
    defaultIcon: ReactNode;
  }
> = {
  destructive: {
    iconBg: 'bg-rose-50',
    iconColor: 'text-rose-600',
    iconRing: 'ring-rose-100',
    confirmBtn:
      'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-600/25',
    defaultIcon: <Trash2 className="size-7" strokeWidth={1.75} />,
  },
  warning: {
    iconBg: 'bg-amber-50',
    iconColor: 'text-amber-600',
    iconRing: 'ring-amber-100',
    confirmBtn:
      'bg-amber-500 hover:bg-amber-600 text-white shadow-amber-500/25',
    defaultIcon: <AlertTriangle className="size-7" strokeWidth={1.75} />,
  },
  info: {
    iconBg: 'bg-violet-50',
    iconColor: 'text-violet-600',
    iconRing: 'ring-violet-100',
    confirmBtn:
      'bg-violet-600 hover:bg-violet-700 text-white shadow-violet-600/25',
    defaultIcon: <Info className="size-7" strokeWidth={1.75} />,
  },
  success: {
    iconBg: 'bg-emerald-50',
    iconColor: 'text-emerald-600',
    iconRing: 'ring-emerald-100',
    confirmBtn:
      'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/25',
    defaultIcon: <CheckCircle2 className="size-7" strokeWidth={1.75} />,
  },
  primary: {
    iconBg: 'bg-blue-50',
    iconColor: 'text-[var(--medical-navy)]',
    iconRing: 'ring-blue-100',
    confirmBtn:
      'bg-[var(--medical-navy)] hover:bg-slate-900 text-white shadow-[var(--medical-navy)]/25',
    defaultIcon: <HelpCircle className="size-7" strokeWidth={1.75} />,
  },
};

export function ConfirmationProvider({ children }: { children: ReactNode }) {
  const [pending, setPending] = useState<PendingConfirmation | null>(null);

  const confirm = useCallback((opts: ConfirmOptions) => {
    return new Promise<boolean>((resolve) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      setPending({ id, ...opts, resolve });
    });
  }, []);

  const handleResolve = useCallback(
    (value: boolean) => {
      if (!pending) return;
      pending.resolve(value);
      setPending(null);
    },
    [pending],
  );

  const value = useMemo<ConfirmationContextValue>(() => ({ confirm }), [confirm]);

  return (
    <ConfirmationContext.Provider value={value}>
      {children}
      <ConfirmationDialog
        pending={pending}
        onConfirm={() => handleResolve(true)}
        onCancel={() => handleResolve(false)}
      />
    </ConfirmationContext.Provider>
  );
}

function ConfirmationDialog({
  pending,
  onConfirm,
  onCancel,
}: {
  pending: PendingConfirmation | null;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const [mounted, setMounted] = useState(false);
  const [shown, setShown] = useState(false);
  const cancelBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (pending) {
      setMounted(true);
      const t = window.requestAnimationFrame(() => setShown(true));
      return () => window.cancelAnimationFrame(t);
    }
    setShown(false);
    const t = window.setTimeout(() => setMounted(false), 280);
    return () => window.clearTimeout(t);
  }, [pending]);

  // Focus inicial no botão Cancelar (a11y / segurança)
  useEffect(() => {
    if (shown && pending) {
      const t = window.setTimeout(() => cancelBtnRef.current?.focus(), 80);
      return () => window.clearTimeout(t);
    }
  }, [shown, pending]);

  // ESC cancela, ENTER confirma (apenas quando aberto)
  useEffect(() => {
    if (!pending) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onCancel();
      } else if (e.key === 'Enter' && !e.isComposing) {
        e.preventDefault();
        onConfirm();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [pending, onCancel, onConfirm]);

  if (!mounted || !pending) return null;

  const tone = pending.tone ?? 'destructive';
  const styles = TONE_STYLES[tone];

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center p-6 bg-slate-900/30 backdrop-blur-md"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-title"
      aria-describedby={pending.description ? 'confirm-description' : undefined}
      style={{
        opacity: shown ? 1 : 0,
        transition: 'opacity 240ms cubic-bezier(0.22, 1, 0.36, 1)',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
    >
      <div
        className="relative w-full max-w-md"
        style={{
          opacity: shown ? 1 : 0,
          transform: shown
            ? 'translateY(0) scale(1)'
            : 'translateY(12px) scale(0.94)',
          transition:
            'opacity 280ms cubic-bezier(0.22, 1, 0.36, 1), transform 320ms cubic-bezier(0.22, 1, 0.36, 1)',
        }}
      >
        {/* Liquid-glass capsule */}
        <div className="relative rounded-[28px] bg-white/85 backdrop-blur-2xl backdrop-saturate-150 ring-1 ring-white/60 shadow-[0_24px_80px_rgba(15,23,42,0.22),inset_0_1px_0_rgba(255,255,255,0.7)] overflow-hidden">
          {/* Botão close discreto */}
          <button
            type="button"
            onClick={onCancel}
            aria-label="Fechar"
            className="absolute top-4 right-4 size-8 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-900/5 transition-colors flex items-center justify-center z-10"
          >
            <X className="size-4" />
          </button>

          <div className="px-8 pt-9 pb-6 flex flex-col items-center text-center gap-4">
            {/* Ícone com halo */}
            <div
              className={`relative flex items-center justify-center size-16 rounded-2xl ring-8 ${styles.iconRing} ${styles.iconBg} ${styles.iconColor}`}
              style={{
                animation: shown
                  ? 'confirm-icon-in 380ms cubic-bezier(0.22, 1, 0.36, 1) both'
                  : undefined,
              }}
            >
              {pending.icon ?? styles.defaultIcon}
            </div>

            {/* Título + descrição */}
            <div className="space-y-1.5">
              <h3
                id="confirm-title"
                className="text-lg font-bold text-slate-900 tracking-tight"
              >
                {pending.title}
              </h3>
              {pending.description && (
                <p
                  id="confirm-description"
                  className="text-sm text-slate-500 leading-relaxed"
                >
                  {pending.description}
                </p>
              )}
            </div>
          </div>

          {/* Footer com botões */}
          <div className="px-6 pb-6 grid grid-cols-2 gap-3">
            <button
              ref={cancelBtnRef}
              type="button"
              onClick={onCancel}
              className="px-5 py-3 rounded-xl text-sm font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 active:scale-[0.98] transition-all duration-200"
            >
              {pending.cancelLabel ?? 'Cancelar'}
            </button>
            <button
              type="button"
              onClick={onConfirm}
              className={`px-5 py-3 rounded-xl text-sm font-semibold shadow-lg active:scale-[0.98] transition-all duration-200 ${styles.confirmBtn}`}
            >
              {pending.confirmLabel ?? 'Confirmar'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function useConfirm() {
  const ctx = useContext(ConfirmationContext);
  if (!ctx) {
    throw new Error('useConfirm deve ser usado dentro de <ConfirmationProvider>');
  }
  return ctx.confirm;
}
