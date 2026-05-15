interface ErrorBannerProps {
  onRetry: () => void;
}

export default function ErrorBanner({ onRetry }: ErrorBannerProps) {
  return (
    <div className="liquid-glass rounded-2xl border border-error/30 px-6 py-4 bg-error-container/10 flex items-center gap-3">
      <span className="material-symbols-outlined text-error text-[20px] shrink-0">error_outline</span>
      <p className="text-sm text-on-surface-variant flex-1">
        Não conseguimos gerar sua rotina agora. Tente novamente.
      </p>
      <button
        onClick={onRetry}
        className="text-error font-bold text-sm underline whitespace-nowrap"
      >
        Tentar novamente
      </button>
    </div>
  );
}
