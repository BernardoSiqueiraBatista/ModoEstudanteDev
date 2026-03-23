import React from 'react';
import { type Apontamento } from '../../data/WeekCalendarData';
import { type Patient } from '../../types/PatientTypes';

interface AgendaTimelineProps {
  apontamentos: Apontamento[]; // Agora recebe Apontamentos
  selectedDayIndex?: number; // Dia selecionado (opcional)
  onViewComplete?: () => void;
  onViewPatient?: (patient: Patient) => void;
}

// Mapeamento de EventType para o formato da timeline
const mapTypeToTimelineStatus = (type: Apontamento['type']): 'confirmed' | 'waiting' | 'current' => {
  const map = {
    consulta: 'confirmed',
    urgencia: 'waiting',
    compromisso: 'waiting',
    video: 'confirmed',
  };
  return map[type] as 'confirmed' | 'waiting' | 'current';
};

// Função para obter o horário atual
const getCurrentTime = () => {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
};

export default function AgendaTimeline({ 
  apontamentos, 
  selectedDayIndex,
  onViewComplete,
  onViewPatient 
}: AgendaTimelineProps) {
  const [currentTime, setCurrentTime] = React.useState(getCurrentTime());

  // Atualizar horário atual a cada minuto
  React.useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(getCurrentTime());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  // Filtrar apontamentos por dia (se selectedDayIndex for fornecido)
  const filteredApontamentos = React.useMemo(() => {
    if (selectedDayIndex !== undefined) {
      return apontamentos
        .filter(apt => apt.dayIndex === selectedDayIndex)
        .sort((a, b) => a.startTime.localeCompare(b.startTime));
    }
    return apontamentos.sort((a, b) => a.startTime.localeCompare(b.startTime));
  }, [apontamentos, selectedDayIndex]);

  // Encontrar o índice do horário atual
  const currentTimeIndex = filteredApontamentos.findIndex(
    apt => apt.startTime > currentTime
  );

  // Separar apontamentos antes e depois do horário atual
  const beforeNow = currentTimeIndex === -1 
    ? filteredApontamentos 
    : filteredApontamentos.slice(0, currentTimeIndex);
    
  const afterNow = currentTimeIndex === -1 
    ? [] 
    : filteredApontamentos.slice(currentTimeIndex);

  const getStatusBadge = (type: Apontamento['type']) => {
    const status = mapTypeToTimelineStatus(type);
    
    switch (status) {
      case 'confirmed':
        return (
          <span className="px-3 py-1 bg-primary text-white text-caption-bold rounded-full">
            Confirmado
          </span>
        );
      case 'waiting':
        return (
          <span className="px-3 py-1 bg-slate-200 text-subtitle text-caption-bold rounded-full">
            Aguardando
          </span>
        );
      case 'current':
        return null;
    }
  };

  const getAppointmentStyles = (type: Apontamento['type']) => {
    const status = mapTypeToTimelineStatus(type);
    
    switch (status) {
      case 'confirmed':
        return 'bg-primary/5 border-primary/20';
      case 'waiting':
        return 'bg-surface-light border-light';
      case 'current':
        return 'border-t-2 border-primary border-dashed pt-4';
    }
  };

  // Extrair especialidade da description
  const getSpecialty = (description?: string) => {
    if (!description) return 'Consulta Geral';
    const parts = description.split('-');
    return parts.length > 1 ? parts[1].trim() : 'Consulta Geral';
  };

  return (
    <div className="bg-surface rounded-xl border border-light shadow-sm overflow-hidden h-full flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-subtle flex justify-between items-center">
        <h2 className="text-heading-2 text-title flex items-center gap-2">
          <span className="material-icon text-primary">event_note</span>
          Agenda de Hoje
        </h2>
        <button
          className="text-primary text-label-sm font-semibold hover:underline cursor-pointer"
          onClick={onViewComplete}
        >
          Ver completa
        </button>
      </div>

      {/* Timeline */}
      <div className="p-6 flex-1 overflow-y-auto">
        <div className="space-y-0">
          {/* Apontamentos antes do horário atual */}
          {beforeNow.map((apontamento) => (
            <div key={`${apontamento.patient.id}-${apontamento.startTime}`} className="flex gap-6 pb-6 relative">
              {/* Time Column */}
              <div className="flex flex-col items-center">
                <div className="text-caption-bold w-12 text-right text-subtitle">
                  {apontamento.startTime}
                </div>
                <div className="w-[2px] h-full bg-subtle my-2"></div>
              </div>

              {/* Content */}
              <div
                className={`flex-1 p-4 rounded-xl border ${getAppointmentStyles(apontamento.type)} cursor-pointer hover:shadow-md transition-all`}
                onClick={() => onViewPatient?.(apontamento.patient)}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-heading-3 text-title">{apontamento.patient.name}</h3>
                    <p className="text-body-sm text-subtitle">
                      {apontamento.type} • {getSpecialty(apontamento.description)}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-caption text-subtitle">
                        {apontamento.patient.gender} • {apontamento.patient.age} anos
                      </span>
                      <span className={`text-caption px-2 py-0.5 rounded-full ${
                        apontamento.patient.status === 'ativo' ? 'bg-green-50 text-green-600' :
                        apontamento.patient.status === 'followup' ? 'bg-blue-50 text-blue-600' :
                        'bg-yellow-50 text-yellow-600'
                      }`}>
                        {apontamento.patient.status}
                      </span>
                    </div>
                  </div>
                  {getStatusBadge(apontamento.type)}
                </div>
              </div>
            </div>
          ))}

          {/* Current Time Marker */}
          {currentTimeIndex !== -1 && (
            <div className="flex gap-6 pb-6 relative">
              <div className="flex flex-col items-center">
                <div className="text-caption-bold w-12 text-right text-primary">
                  {currentTime}
                </div>
                <div className="w-2 h-2 rounded-full bg-primary ring-4 ring-primary/20 my-2"></div>
              </div>
              <div className="flex-1 border-t-2 border-primary border-dashed pt-4">
                <p className="text-primary text-caption-bold tracking-widest">AGORA</p>
              </div>
            </div>
          )}

          {/* Apontamentos depois do horário atual */}
          {afterNow.map((apontamento) => (
            <div key={`${apontamento.patient.id}-${apontamento.startTime}`} className="flex gap-6 pb-6 relative">
              {/* Time Column */}
              <div className="flex flex-col items-center">
                <div className="text-caption-bold w-12 text-right text-subtitle">
                  {apontamento.startTime}
                </div>
                <div className="w-[2px] h-full bg-subtle my-2"></div>
              </div>

              {/* Content */}
              <div
                className={`flex-1 p-4 rounded-xl border ${getAppointmentStyles(apontamento.type)} cursor-pointer hover:shadow-md transition-all`}
                onClick={() => onViewPatient?.(apontamento.patient)}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-heading-3 text-title">{apontamento.patient.name}</h3>
                    <p className="text-body-sm text-subtitle">
                      {apontamento.type} • {getSpecialty(apontamento.description)}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-caption text-subtitle">
                        {apontamento.patient.gender} • {apontamento.patient.age} anos
                      </span>
                      <span className={`text-caption px-2 py-0.5 rounded-full ${
                        apontamento.patient.status === 'ativo' ? 'bg-green-50 text-green-600' :
                        apontamento.patient.status === 'followup' ? 'bg-blue-50 text-blue-600' :
                        'bg-yellow-50 text-yellow-600'
                      }`}>
                        {apontamento.patient.status}
                      </span>
                    </div>
                  </div>
                  {getStatusBadge(apontamento.type)}
                </div>
              </div>
            </div>
          ))}

          {/* Mensagem se não houver consultas */}
          {filteredApontamentos.length === 0 && (
            <div className="text-center py-12">
              <span className="material-icon text-4xl text-subtitle mb-3">event_busy</span>
              <p className="text-body text-subtitle">Nenhuma consulta agendada</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
