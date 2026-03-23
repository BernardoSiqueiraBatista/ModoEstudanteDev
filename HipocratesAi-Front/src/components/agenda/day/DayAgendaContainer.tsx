import React, { useEffect, useMemo, useState } from 'react';
import AppointmentCard, { type AppointmentStatus } from './AppointmentCard';
import type { Apontamento } from '../../../data/WeekCalendarData';
import { fetchAppointmentsByDoctor } from '../../../service/appointments';
import { mapApiAppointmentsToWeekEvents } from '../../../mappers/appointments';
import type { Patient } from '../../../types/PatientTypes';

interface DayAgendaContainerProps {
  doctorUserId: string;
  selectedDate?: string;
  onViewPatient?: (patient: Patient) => void;
  onOpenConsulta?: (apontamento: Apontamento) => void;
}

function getTodayDateString() {
  const now = new Date();
  const year = now.getFullYear();
  const month = `${now.getMonth() + 1}`.padStart(2, '0');
  const day = `${now.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
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

export default function DayAgendaContainer({
  doctorUserId,
  selectedDate,
  onViewPatient,
  onOpenConsulta,
}: DayAgendaContainerProps) {
  const [appointments, setAppointments] = useState<Apontamento[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const date = useMemo(() => selectedDate ?? getTodayDateString(), [selectedDate]);

  useEffect(() => {
    let active = true;
  
    async function loadData() {
      if (!doctorUserId) {
        setAppointments([]);
        setError('doctorUserId não informado.');
        setLoading(false);
        return;
      }
  
      try {
        setLoading(true);
        setError(null);
  
        console.log('DayAgendaContainer date:', date);
        console.log('DayAgendaContainer doctorUserId:', doctorUserId);
  
        const apiData = await fetchAppointmentsByDoctor({
          date,
          doctorUserId,
        });
  
        if (!active) return;
  
        console.log('DayAgendaContainer apiData:', apiData);
  
        const mapped = mapApiAppointmentsToWeekEvents(apiData);
        setAppointments(mapped);
      } catch (err) {
        if (!active) return;
        setError(err instanceof Error ? err.message : 'Erro ao carregar agenda.');
      } finally {
        if (active) setLoading(false);
      }
    }
  
    loadData();
  
    return () => {
      active = false;
    };
  }, [date, doctorUserId]);

  if (loading) {
    return (
      <div className="glass-effect rounded-2xl p-6">
        <p className="text-body-sm text-subtitle">Carregando agenda...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass-effect rounded-2xl p-6">
        <p className="text-body-sm text-red-600">{error}</p>
      </div>
    );
  }

  if (appointments.length === 0) {
    return (
      <div className="glass-effect rounded-2xl p-6">
        <p className="text-body-sm text-subtitle">Nenhum agendamento para esta data.</p>
      </div>
    );
  }

  return (
    <div className="relative">
      {appointments.map((apontamento) => (
        <AppointmentCard
          key={apontamento.id ?? `${apontamento.patient.id}-${apontamento.startTime}-${apontamento.dayIndex}`}
          apontamento={apontamento}
          status={mapApontamentoStatus(apontamento)}
          onViewPatient={onViewPatient}
          onOpenConsulta={onOpenConsulta}
        />
      ))}
    </div>
  );
}