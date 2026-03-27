import React from 'react';

interface InfoCardProps {
  icon: string;
  label: string;
  value: string | number;
  onClick?: () => void;
}

export default function InfoCard({ icon, label, value, onClick }: InfoCardProps) {
  return (
    <div
      onClick={onClick}
      className="bubble-glass p-6 hover:shadow-lg transition-all cursor-pointer group bg-white/85 dark:bg-glass-obsidian backdrop-blur-xl rounded-[2.25rem] border border-white dark:border-white/10"
    >
      <div className="size-10 rounded-xl bg-slate-50 dark:bg-white/5 flex items-center justify-center mb-4 group-hover:bg-[var(--medical-navy)] dark:group-hover:bg-electric-cyan group-hover:text-white transition-colors">
        <span className="material-icon text-xl">{icon}</span>
      </div>
      <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
        {label}
      </p>
      <p className="text-2xl font-semibold text-[var(--medical-navy)] dark:text-white mt-1">{value}</p>
    </div>
  );
}
