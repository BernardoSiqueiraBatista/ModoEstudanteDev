import { Fragment, useMemo } from 'react';
import AppointmentCard, { type AppointmentStatus } from './AppointmentCard';
import CurrentTimeMarker from './CurrentTimeMarker';
import type { Apontamento } from '../../../data/WeekCalendarData';
import { useAppointmentsByDoctor } from '../../../hooks/useAppointments';
import { mapApiAppointmentsToWeekEvents } from '../../../mappers/appointments';
import type { Patient } from '../../../types/PatientTypes';
import type { FilterOptions } from '../AgendaFilterDropdown';
import { getTodayDateStringInSP } from '../../../data/Dates';

interface DayAgendaContainerProps {
  doctorUserId: string;
  selectedDate?: string;
  showCurrentTime?: boolean;
  currentTime?: string;
  activeFilters?: FilterOptions;
  onViewPatient?: (patient: Patient) => void;
  onOpenConsulta?: (apontamento: Apontamento) => void;
}

function mapApontamentoStatus(apontamento: Apontamento): AppointmentStatus {
  switch (apontamento.type) {
    case 'consulta':
      return 'aguardando';
    case 'urgencia':
      return 'confirmado';
    case 'compromisso':
      return 'nao-iniciado';
    case 'video':
      return 'video';
    default:
      return 'aguardando';
  }
}

function timeToMinutes(time: string) {
  const [hh, mm] = time.split(':').map(Number);
  return (hh ?? 0) * 60 + (mm ?? 0);
}

export default function DayAgendaContainer({
  doctorUserId,
  selectedDate,
  showCurrentTime = false,
  currentTime,
  activeFilters,
  onViewPatient,
  onOpenConsulta,
}: DayAgendaContainerProps) {
  const date = useMemo(() => selectedDate ?? getTodayDateStringInSP(), [selectedDate]);

  const { data, isLoading, error } = useAppointmentsByDoctor({ doctorUserId, date });

  const appointments = useMemo<Apontamento[]>(() => {
    const all = (data ? mapApiAppointmentsToWeekEvents(data) : [])
      .slice()
      .sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));
    const types = activeFilters?.types ?? [];
    if (types.length === 0) return all;
    return all.filter((a) => types.includes(a.type));
  }, [data, activeFilters]);

  // Índice onde o marker deve ser inserido: antes do primeiro apontamento
  // cujo horário de início é >= horário atual.
  const markerIndex = useMemo(() => {
    if (!showCurrentTime || !currentTime) return -1;
    const nowMin = timeToMinutes(currentTime);
    const idx = appointments.findIndex(a => timeToMinutes(a.startTime) >= nowMin);
    // Se todos já passaram, marker vai ao final
    return idx === -1 ? appointments.length : idx;
  }, [appointments, currentTime, showCurrentTime]);

  if (isLoading) {
    return (
      <div className="glass-effect rounded-2xl p-6">
        <p className="text-body-sm text-subtitle">Carregando agenda...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass-effect rounded-2xl p-6">
        <p className="text-body-sm text-red-600">
          {error instanceof Error ? error.message : 'Erro ao carregar agenda.'}
        </p>
      </div>
    );
  }

  if (appointments.length === 0) {
    return (
      <>
        {showCurrentTime && currentTime && <CurrentTimeMarker time={currentTime} />}
        <div className="glass-effect rounded-2xl p-6">
          <p className="text-body-sm text-subtitle">Nenhum agendamento para esta data.</p>
        </div>
      </>
    );
  }

  return (
    <div className="relative">
      {appointments.map((apontamento, index) => (
        <Fragment
          key={
            apontamento.id ??
            `${apontamento.patient.id}-${apontamento.startTime}-${apontamento.dayIndex}`
          }
        >
          {index === markerIndex && currentTime && (
            <CurrentTimeMarker time={currentTime} />
          )}
          <AppointmentCard
            apontamento={apontamento}
            status={mapApontamentoStatus(apontamento)}
            onViewPatient={onViewPatient}
            onOpenConsulta={onOpenConsulta}
          />
        </Fragment>
      ))}
      {markerIndex === appointments.length && currentTime && (
        <CurrentTimeMarker time={currentTime} />
      )}
    </div>
  );
}
