interface InfoCardProps {
  icon?: string;
  label: string;
  value: string | number;
  onClick?: () => void;
}

export default function InfoCard({ icon, label, value, onClick }: InfoCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="bubble-glass p-6 hover:shadow-lg transition-all cursor-pointer group text-left w-full"
    >
      <div className="size-10 rounded-xl bg-slate-50 flex items-center justify-center mb-4 group-hover:bg-[var(--medical-navy)] group-hover:text-white transition-colors">
        <span className="material-symbols-outlined text-xl">{icon ?? 'analytics'}</span>
      </div>
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
        {label}
      </p>
      <p className="text-2xl font-semibold text-[var(--medical-navy)] mt-1">{value}</p>
    </button>
  );
}
