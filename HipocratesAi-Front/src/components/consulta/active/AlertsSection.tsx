import React from 'react';
import type { Alert } from '../../../data/ConsultationData';

interface AlertsSectionProps {
  alerts: Alert[];
}

export default function AlertsSection({ alerts }: AlertsSectionProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-ultra px-1">Alerts</h3>
      {alerts.map(alert => (
        <div
          key={alert.id}
          className="bg-luxury-peach dark:bg-[#1a1512] border border-luxury-peach-border dark:border-white/5 p-6 rounded-[2rem] flex gap-5"
        >
          <span className="material-symbols-outlined text-luxury-peach-text dark:text-orange-300/60 !text-[20px]">
            priority_high
          </span>
          <div>
            <p className="text-[9px] font-bold text-luxury-peach-text dark:text-orange-300/60 uppercase tracking-widest mb-2">
              {alert.title}
            </p>
            <p className="text-sm text-slate-600 dark:text-slate-400 font-light leading-relaxed">
              {alert.description}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
