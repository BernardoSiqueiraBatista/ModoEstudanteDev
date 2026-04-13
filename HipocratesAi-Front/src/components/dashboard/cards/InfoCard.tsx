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
      className="bg-white/85 dark:bg-glass-obsidian backdrop-blur-xl rounded-xl border border-gray-100 dark:border-white/10 p-4 cursor-pointer hover:shadow-md transition-all"
    >
      <div className="size-8 rounded-lg bg-gray-50 dark:bg-white/5 flex items-center justify-center mb-2 group-hover:bg-blue-600 transition-colors">
        <span className="material-icon text-base">{icon}</span>
      </div>
      <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">{label}</p>
      <p className="text-xl font-semibold text-gray-800 dark:text-white mt-0.5">{value}</p>
    </div>
  );
}
