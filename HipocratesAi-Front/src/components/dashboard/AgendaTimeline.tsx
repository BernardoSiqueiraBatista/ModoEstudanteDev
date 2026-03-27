import React from 'react';
import AgendaTimelineItem from './cards/AgendaTimelineItem';

interface AgendaTimelineProps {
  items: Array<{
    id: string;
    time: string;
    patientName: string;
    description: string;
    status: 'confirmed' | 'waiting';
  }>;
  onItemClick?: (index: number) => void;
}

export default function AgendaTimeline({ items, onItemClick }: AgendaTimelineProps) {
  if (items.length === 0) {
    return (
      <div className="text-center py-12">
        <span className="material-icon text-4xl text-slate-400 dark:text-slate-500 mb-3">event_busy</span>
        <p className="text-body text-slate-500 dark:text-slate-500">Nenhuma consulta agendada para hoje</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {items.map((item, index) => (
        <AgendaTimelineItem
          key={item.id}
          time={item.time}
          patientName={item.patientName}
          description={item.description}
          status={item.status}
          onClick={() => onItemClick?.(index)}
        />
      ))}
    </div>
  );
}