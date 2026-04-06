import React from 'react';
import TimelineCard from './TimelineCard';
import TimelineLine from './TimeLine';
import { getTimelineByPatientId } from '../../../../data/ClinicalData';

interface HistoricoTabProps {
  patientId: string;
}

export default function HistoricoTab({ patientId }: HistoricoTabProps) {
  // Busca os dados específicos deste paciente
  const events = getTimelineByPatientId(patientId);

  if (events.length === 0) {
    return (
      <div className="text-center py-12 text-elite-gray">
        <span className="material-symbols-outlined text-4xl mb-2">history</span>
        <p className="text-sm">Nenhum evento histórico encontrado para este paciente.</p>
      </div>
    );
  }

  return (
    <div className="relative">
      <TimelineLine />
      <div className="relative space-y-24 z-10">
        {events.map((event, index) => (
          <TimelineCard key={event.id} event={event} index={index} />
        ))}
      </div>
    </div>
  );
}