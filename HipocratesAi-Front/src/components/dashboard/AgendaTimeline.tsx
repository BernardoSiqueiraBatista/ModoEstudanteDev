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
      <div className="text-center py-8">
        <span className="material-icon text-3xl text-gray-300 dark:text-slate-600 mb-2">
          event_busy
        </span>
        <p className="text-sm text-gray-400 dark:text-slate-500">
          Nenhuma consulta agendada para hoje
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
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
