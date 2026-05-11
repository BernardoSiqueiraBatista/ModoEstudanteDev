interface StatItem {
  label: string;
  value: number | string;
  badge?: string;
  badgeColor?: string;
  dotColor?: string;
  dotGlow?: boolean;
}

interface DashboardStatsProps {
  stats: StatItem[];
}

export default function DashboardStats({ stats }: DashboardStatsProps) {
  return (
    <div className="grid grid-cols-3 gap-6">
      {stats.map((stat, index) => (
        <div key={index} className="bubble-glass p-8 flex flex-col">
          <div className="flex justify-between items-start mb-4">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              {stat.label}
            </span>
            <div
              className={`size-2 rounded-full ${stat.dotColor || 'bg-slate-200'} ${
                stat.dotGlow && stat.dotColor?.includes('electric-cyan')
                  ? 'shadow-[0_0_8px_var(--electric-cyan)]'
                  : stat.dotGlow && stat.dotColor?.includes('rose')
                    ? 'shadow-[0_0_8px_rgba(248,113,113,0.5)]'
                    : ''
              }`}
            ></div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-semibold text-[var(--medical-navy)]">
              {stat.value}
            </span>
            {stat.badge && (
              <span
                className={`text-xs font-medium ${
                  stat.badgeColor || 'text-emerald-500'
                }`}
              >
                {stat.badge}
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
