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
        return 'text-green-500 bg-green-50';
      case 'danger':
        return 'text-red-500 bg-red-50';
      case 'neutral':
        return 'text-subtitle';
    }
  };

  return (
    <div className="bg-surface p-6 rounded-xl border border-light shadow-sm">
      <div className="flex justify-between items-start mb-4">
        <span className={`p-2 ${iconBgColor} ${iconTextColor} rounded-lg material-icon`}>
          {icon}
        </span>
        {badge && (
          <span
            className={`text-caption-bold px-2 py-1 rounded-full ${getBadgeStyles(badge.type)}`}
          >
            {badge.text}
          </span>
        )}
      </div>
      <p className="text-subtitle text-label-sm font-medium">{label}</p>
      <p className="text-heading-1 mt-1 text-title">{value}</p>
    </div>
  );
}
