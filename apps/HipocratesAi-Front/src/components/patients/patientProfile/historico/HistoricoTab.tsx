import TimelineCard from './TimelineCard';
import TimelineLine from './TimeLine';
import { usePatientTimeline } from '../../../../hooks/usePatientClinicalData';

interface HistoricoTabProps {
  patientId: string;
}

export default function HistoricoTab({ patientId }: HistoricoTabProps) {
  const { data, isLoading, error } = usePatientTimeline(patientId);

  if (isLoading) {
    return <div className="text-center py-12 text-elite-gray text-sm">Carregando histórico...</div>;
  }

  if (error) {
    return (
      <div className="text-center py-12 text-red-600 text-sm">
        {error instanceof Error ? error.message : 'Erro ao carregar histórico.'}
      </div>
    );
  }

  const events = data ?? [];

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
