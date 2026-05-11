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
import { CheckCircle2, AlertTriangle, Info, XCircle } from 'lucide-react';
import {
  Alert,
  AlertContent,
  AlertDescription,
  AlertIcon,
  AlertTitle,
} from './Alert';

type ToastVariant = 'success' | 'destructive' | 'info' | 'warning' | 'primary';

interface ToastItem {
  id: string;
  variant: ToastVariant;
  title?: string;
  description?: string;
  durationMs: number;
}

type ToastInput = Omit<ToastItem, 'id' | 'durationMs'> & { durationMs?: number };

interface ToastContextValue {
  show: (toast: ToastInput) => string;
  success: (title: string, description?: string) => string;
  error: (title: string, description?: string) => string;
  info: (title: string, description?: string) => string;
  warning: (title: string, description?: string) => string;
  dismiss: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const VARIANT_ICON: Record<ToastVariant, ReactNode> = {
  success: <CheckCircle2 />,
  destructive: <XCircle />,
  info: <Info />,
  warning: <AlertTriangle />,
  primary: <Info />,
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const timersRef = useRef<Map<string, number>>(new Map());

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    const timer = timersRef.current.get(id);
    if (timer !== undefined) {
      window.clearTimeout(timer);
      timersRef.current.delete(id);
    }
  }, []);

  const show = useCallback(
    (toast: ToastInput) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const durationMs = toast.durationMs ?? 5000;
      const item: ToastItem = { id, durationMs, ...toast };
      setToasts((prev) => [...prev, item]);
      if (durationMs > 0) {
        const timer = window.setTimeout(() => dismiss(id), durationMs);
        timersRef.current.set(id, timer);
      }
      return id;
    },
    [dismiss],
  );

  useEffect(() => {
    const timers = timersRef.current;
    return () => {
      timers.forEach((t) => window.clearTimeout(t));
      timers.clear();
    };
  }, []);

  const value = useMemo<ToastContextValue>(
    () => ({
      show,
      dismiss,
      success: (title, description) =>
        show({ variant: 'success', title, description }),
      error: (title, description) =>
        show({ variant: 'destructive', title, description }),
      info: (title, description) => show({ variant: 'info', title, description }),
      warning: (title, description) =>
        show({ variant: 'warning', title, description }),
    }),
    [show, dismiss],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastViewport toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  );
}

function ToastViewport({
  toasts,
  onDismiss,
}: {
  toasts: ToastItem[];
  onDismiss: (id: string) => void;
}) {
  return (
    <div
      aria-live="polite"
      aria-atomic="true"
      className="pointer-events-none fixed top-4 right-4 z-[100] flex flex-col gap-3 w-[360px] max-w-[calc(100vw-2rem)]"
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          className="pointer-events-auto animate-toast-in"
          style={{ animation: 'toast-in 280ms cubic-bezier(0.22, 1, 0.36, 1) both' }}
        >
          <Alert
            variant={t.variant}
            appearance="light"
            size="md"
            close
            onClose={() => onDismiss(t.id)}
            className="shadow-[0_12px_32px_rgba(15,23,42,0.10)] backdrop-blur-md"
          >
            <AlertIcon>{VARIANT_ICON[t.variant]}</AlertIcon>
            <AlertContent>
              {t.title && <AlertTitle>{t.title}</AlertTitle>}
              {t.description && <AlertDescription>{t.description}</AlertDescription>}
            </AlertContent>
          </Alert>
        </div>
      ))}
    </div>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast deve ser usado dentro de <ToastProvider>');
  }
  return ctx;
}
