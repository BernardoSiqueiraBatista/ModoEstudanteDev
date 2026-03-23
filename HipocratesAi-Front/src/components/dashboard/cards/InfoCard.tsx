import React from 'react';

interface InfoCardProps {
  icon: string;
  iconBgColor: string;
  iconTextColor: string;
  label: string;
  value: string | number;
}

export default function InfoCard({
  icon,
  iconBgColor,
  iconTextColor,
  label,
  value,
}: InfoCardProps) {
  return (
    <div className="bg-surface p-4 rounded-xl border border-light flex items-center gap-4">
      <div
        className={`size-10 ${iconBgColor} ${iconTextColor} rounded-full flex items-center justify-center`}
      >
        <span className="material-icon">{icon}</span>
      </div>
      <div>
        <p className="text-caption text-subtitle font-medium">{label}</p>
        <p className="text-lg font-bold text-title">{value}</p>
      </div>
    </div>
  );
}
