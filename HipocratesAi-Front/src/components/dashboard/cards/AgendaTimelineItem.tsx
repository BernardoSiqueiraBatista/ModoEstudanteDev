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
          pill: 'bg-slate-50 dark:bg-slate-800/50 border-slate-100 dark:border-white/5 text-slate-400 dark:text-slate-500',
          card: 'bg-white/40 dark:bg-white/[0.03] border-white dark:border-white/5',
        };
      case 'waiting':
        return {
          pill: 'bg-amber-50 dark:bg-amber-500/10 border-amber-100 dark:border-amber-500/20 text-amber-600 dark:text-amber-500',
          card: 'bg-white/40 dark:bg-white/[0.03] border-white dark:border-white/5',
        };
    }
  };

  const styles = getStatusStyles();
  const statusLabel = status === 'confirmed' ? 'Confirmado' : 'Aguardando';

  return (
    <div className="flex gap-8 group cursor-pointer" onClick={onClick}>
      <div className="w-14 py-4 flex flex-col items-end">
        <span className="text-xs font-bold text-slate-400 dark:text-slate-600">{time}</span>
      </div>
      <div className={`flex-1 p-6 rounded-[1.75rem] shadow-sm hover:shadow-lg hover:bg-white dark:hover:bg-white/[0.05] transition-all duration-300 ${styles.card}`}>
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-base font-semibold text-slate-900 dark:text-white">{patientName}</h3>
            <p className="text-xs text-slate-500 dark:text-slate-500 font-medium mt-1">{description}</p>
          </div>
          <span className={`status-pill ${styles.pill}`}>{statusLabel}</span>
        </div>
      </div>
    </div>
  );
}