import React from 'react';
import DateNavigator from '../../components/agenda/day/DateNavigator';
import CurrentTimeMarker from '../../components/agenda/day/CurrentTimeMarker';
import DayAgendaContainer from '../../components/agenda/day/DayAgendaContainer';
import type { Apontamento } from '../../data/WeekCalendarData';
import type { Patient } from '../../types/PatientTypes';
import { isToday } from '../../data/Dates';
import { useAuth } from '../../auth/AuthProvider';
import AuthDebugCard from '../../components/auth/AuthDebugCard';

const getCurrentTime = () => {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
};

export default function AgendaContent() {
  const { loading, user } = useAuth();

  const [currentTime, setCurrentTime] = React.useState(getCurrentTime());
  const [selectedDate, setSelectedDate] = React.useState(new Date());

  React.useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(getCurrentTime());
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  const handleViewPatient = (patient: Patient) => {
    console.log('Ver paciente:', patient);
  };

  const handleOpenConsulta = (apontamento: Apontamento) => {
    console.log('Abrir consulta:', apontamento);
  };

  const handleDateChange = (newDate: Date) => {
    setSelectedDate(newDate);
  };

  const isCurrentDayToday = isToday(selectedDate);

  const selectedDateString = [
    selectedDate.getFullYear(),
    String(selectedDate.getMonth() + 1).padStart(2, '0'),
    String(selectedDate.getDate()).padStart(2, '0'),
  ].join('-');

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50/30 px-10 py-10">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <AuthDebugCard />
        </div>

        <DateNavigator selectedDate={selectedDate} onDateChange={handleDateChange} />

        <div className="relative pl-24 mt-8">
          <div
            className="absolute left-[3.1rem] top-0 bottom-0 w-px"
            style={{
              background:
                'linear-gradient(180deg, transparent 0%, #e2e8f0 10%, #e2e8f0 90%, transparent 100%)',
            }}
          />

          {isCurrentDayToday && <CurrentTimeMarker time={currentTime} />}

          {loading ? (
            <div className="glass-effect rounded-2xl p-6">
              <p className="text-body-sm text-subtitle">Carregando autenticação...</p>
            </div>
          ) : !user ? (
            <div className="glass-effect rounded-2xl p-6">
              <p className="text-body-sm text-red-600">Usuário não autenticado.</p>
            </div>
          ) : (
            <DayAgendaContainer
              doctorUserId={user.id}
              selectedDate={selectedDateString}
              onViewPatient={handleViewPatient}
              onOpenConsulta={handleOpenConsulta}
            />
          )}
        </div>
      </div>
    </div>
  );
}
