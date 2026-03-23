import WeekCalendarHeader from '../../components/agenda/week/WeekCalendarHeader';
import WeekCalendarGrid from '../../components/agenda/week/WeekCalendarGrid';
import type { Apontamento } from '../../types/PatientTypes';
import {
  weekDays,
  computedWeekEvents, // AGORA com pacientes
  timeSlots,
  currentTimePosition,
} from '../../data/WeekCalendarData';

export default function AgendaWeekContent() {
  const todayIndex = weekDays.findIndex(day => day.isToday);

  const handleEventClick = (event: Apontamento) => {
    console.log('Evento clicado:', event);
    console.log('Paciente:', event.patient);
    // Aqui você pode abrir modal, navegar, etc.
  };

  return (
    <>
      <div className="flex-1 overflow-auto bg-surface">
        <WeekCalendarHeader days={weekDays} />
        <WeekCalendarGrid
          timeSlots={timeSlots}
          events={computedWeekEvents}
          currentTimePosition={currentTimePosition}
          todayIndex={todayIndex}
          onEventClick={handleEventClick}
        />
      </div>
    </>
  );
}