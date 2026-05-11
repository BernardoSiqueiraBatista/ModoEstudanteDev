import React from 'react';
import DateNavigator from '../../components/agenda/day/DateNavigator';
import DayAgendaContainer from '../../components/agenda/day/DayAgendaContainer';
import type { Apontamento } from '../../data/WeekCalendarData';
import type { Patient } from '../../types/PatientTypes';
import type { FilterOptions } from '../../components/agenda/AgendaFilterDropdown';
import { isToday, getDateStringInSP } from '../../data/Dates';
import { useAuth } from '../../auth/AuthProvider';

const getCurrentTime = () => {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
};

interface AgendaContentProps {
  onOpenConsulta?: (apontamento: Apontamento) => void;
  activeFilters?: FilterOptions;
}

export default function AgendaContent({
  onOpenConsulta,
  activeFilters,
}: AgendaContentProps = {}) {
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
    onOpenConsulta?.(apontamento);
  };

  const handleDateChange = (newDate: Date) => {
    setSelectedDate(newDate);
  };

  const isCurrentDayToday = isToday(selectedDate);

  const selectedDateString = getDateStringInSP(selectedDate);

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50/30 px-10 py-10">
      <div className="max-w-4xl mx-auto">
        <DateNavigator selectedDate={selectedDate} onDateChange={handleDateChange} />

        <div className="relative pl-24 mt-8">
          <div
            className="absolute left-[3.1rem] top-0 bottom-0 w-px"
            style={{
              background:
                'linear-gradient(180deg, transparent 0%, #e2e8f0 10%, #e2e8f0 90%, transparent 100%)',
            }}
          />

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
              showCurrentTime={isCurrentDayToday}
              currentTime={currentTime}
              activeFilters={activeFilters}
              onViewPatient={handleViewPatient}
              onOpenConsulta={handleOpenConsulta}
            />
          )}
        </div>
      </div>
    </div>
  );
}
