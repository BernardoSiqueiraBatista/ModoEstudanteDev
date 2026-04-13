import React from 'react';

interface AgendaTimelineItemProps {
  time: string;
  patientName: string;
  description: string;
  status: 'confirmed' | 'waiting';
  onClick?: () => void;
}

export default function AgendaTimelineItem({
  time,
  patientName,
  description,
  status,
  onClick,
}: AgendaTimelineItemProps) {
  const getStatusStyles = () => {
    switch (status) {
      case 'confirmed':
        return {
          pill: 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-400',
          card: 'bg-white dark:bg-white/[0.03] border-emerald-200/50 dark:border-emerald-500/20 hover:border-emerald-300 dark:hover:border-emerald-500/40',
          icon: 'check_circle',
        };
      case 'waiting':
        return {
          pill: 'bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/30 text-amber-700 dark:text-amber-400',
          card: 'bg-white dark:bg-white/[0.03] border-amber-200/50 dark:border-amber-500/20 hover:border-amber-300 dark:hover:border-amber-500/40',
          icon: 'schedule',
        };
    }
  };

  const styles = getStatusStyles();
  const statusLabel = status === 'confirmed' ? 'Confirmado' : 'Aguardando';

  return (
    <div className="flex gap-4 group cursor-pointer mb-3 last:mb-0" onClick={onClick}>
      <div className="w-14 py-2 flex flex-col items-end">
        <span className="text-[11px] font-bold text-gray-500 dark:text-slate-500">{time}</span>
        <div className="w-1.5 h-1.5 rounded-full bg-gray-300 dark:bg-slate-600 mt-1"></div>
      </div>
      <div
        className={`flex-1 p-3 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 border ${styles.card}`}
      >
        <div className="flex justify-between items-center">
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-gray-800 dark:text-white">{patientName}</h3>
            <p className="text-[11px] text-gray-500 dark:text-slate-500 font-medium mt-0.5">
              {description}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${styles.pill}`}
            >
              {statusLabel}
            </span>
            <span className="material-icon text-base text-gray-400 dark:text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity">
              chevron_right
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
