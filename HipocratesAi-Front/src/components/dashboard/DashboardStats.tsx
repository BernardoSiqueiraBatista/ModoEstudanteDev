import React from 'react';

interface StatItem {
  label: string;
  value: number | string;
  badge?: string;
  badgeColor?: string;
  dotColor?: string;
}

interface DashboardStatsProps {
  stats: StatItem[];
}

export default function DashboardStats({ stats }: DashboardStatsProps) {
  return (
    <div className="grid grid-cols-3 gap-6">
      {stats.map((stat, index) => (
        <div
          key={index}
          className="bubble-glass p-8 flex flex-col bg-white/85 dark:bg-glass-obsidian backdrop-blur-xl rounded-[2.25rem] border border-white dark:border-white/10 shadow-sm"
        >
          <div className="flex justify-between items-start mb-4">
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
              {stat.label}
            </span>
            <div
              className={`size-2 rounded-full ${stat.dotColor || 'bg-slate-200 dark:bg-slate-700'}`}
            ></div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-semibold text-[var(--medical-navy)] dark:text-white">
              {stat.value}
            </span>
            {stat.badge && (
              <span
                className={`text-xs font-medium ${stat.badgeColor || 'text-emerald-500 dark:text-emerald-400'}`}
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
