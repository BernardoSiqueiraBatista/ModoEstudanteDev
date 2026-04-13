import React from 'react';

interface StatCardProps {
  icon: string;
  iconBgColor: string;
  iconTextColor: string;
  label: string;
  value: string | number;
  badge?: {
    text: string;
    type: 'success' | 'danger' | 'neutral';
  };
}

export default function StatCard({
  icon,
  iconBgColor,
  iconTextColor,
  label,
  value,
  badge,
}: StatCardProps) {
  const getBadgeStyles = (type: 'success' | 'danger' | 'neutral') => {
    switch (type) {
      case 'success':
        return 'text-emerald-500 bg-emerald-50';
      case 'danger':
        return 'text-red-500 bg-red-50';
      case 'neutral':
        return 'text-gray-400 bg-gray-50';
    }
  };

  return (
    <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
      <div className="flex justify-between items-start mb-3">
        <div className={`p-2 ${iconBgColor} ${iconTextColor} rounded-lg`}>
          <span className="material-icon text-lg">{icon}</span>
        </div>
        {badge && (
          <span
            className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${getBadgeStyles(badge.type)}`}
          >
            {badge.text}
          </span>
        )}
      </div>
      <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wider">{label}</p>
      <p className="text-2xl font-semibold text-gray-800 mt-1">{value}</p>
    </div>
  );
}
