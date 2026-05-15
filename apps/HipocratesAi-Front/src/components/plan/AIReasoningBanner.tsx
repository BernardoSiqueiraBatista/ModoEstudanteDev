interface AIReasoningBannerProps {
  text: string;
}

export default function AIReasoningBanner({ text }: AIReasoningBannerProps) {
  return (
    <div className="liquid-glass rounded-2xl border border-primary/20 px-6 py-4 flex items-start gap-3">
      <span
        className="material-symbols-outlined text-primary shrink-0 mt-0.5"
        style={{ fontVariationSettings: "'FILL' 1", fontSize: '18px' }}
      >
        auto_awesome
      </span>
      <p className="text-sm text-on-surface-variant italic">{text}</p>
    </div>
  );
}
