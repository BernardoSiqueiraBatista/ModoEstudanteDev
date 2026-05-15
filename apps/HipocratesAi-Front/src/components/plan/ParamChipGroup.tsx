interface Option {
  label: string;
  value: string | number;
}

interface ParamChipGroupProps {
  label: string;
  options: Option[];
  value: string | number | null;
  onChange: (val: string | number) => void;
  hasError?: boolean;
}

export default function ParamChipGroup({ label, options, value, onChange, hasError }: ParamChipGroupProps) {
  return (
    <div className={`space-y-2 ${hasError ? 'ring-1 ring-error rounded-2xl p-2' : ''}`}>
      <p className="text-[0.6875rem] font-bold uppercase tracking-widest text-on-surface-variant">{label}</p>
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => {
          const active = value === opt.value;
          return (
            <button
              key={String(opt.value)}
              type="button"
              role="button"
              aria-pressed={active}
              onClick={() => onChange(opt.value)}
              className={`px-4 py-2 rounded-full text-sm transition-colors ${
                active
                  ? 'bg-primary text-on-primary font-semibold'
                  : 'bg-surface-container text-on-surface-variant border border-outline-variant hover:bg-surface-container-high font-medium'
              }`}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
