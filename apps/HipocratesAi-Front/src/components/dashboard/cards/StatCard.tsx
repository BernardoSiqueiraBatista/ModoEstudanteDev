interface StatCardProps {
  icon?: string;
  iconBgColor?: string;
  iconTextColor?: string;
  label: string;
  value: string | number;
  badge?: {
    text: string;
    type: 'success' | 'danger' | 'neutral';
  };
}

export default function StatCard({ label, value, badge }: StatCardProps) {
  const dotColor =
    badge?.type === 'danger'
      ? 'bg-red-500'
      : badge?.type === 'neutral'
        ? 'bg-slate-300'
        : 'bg-[var(--electric-cyan)] shadow-[0_0_8px_var(--electric-cyan)]';

  const badgeColor =
    badge?.type === 'danger'
      ? 'text-red-500'
      : badge?.type === 'neutral'
        ? 'text-slate-400'
        : 'text-cyan-600';

  return (
    <div className="rounded-2xl bg-white border border-slate-200/80 p-6 shadow-[0_8px_32px_rgba(15,23,42,0.04)]">
      <div className="flex items-center justify-between mb-6">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.18em]">
          {label}
        </span>
        <div className={`size-2 rounded-full ${dotColor}`}></div>
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-4xl font-bold text-slate-900 tracking-tight">{value}</span>
        {badge && <span className={`text-xs font-medium ${badgeColor}`}>{badge.text}</span>}
      </div>
    </div>
  );
}
