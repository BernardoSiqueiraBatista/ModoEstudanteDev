import { useMemo } from 'react';
import WeekCalendarHeader from '../../components/agenda/week/WeekCalendarHeader';
import WeekCalendarGrid from '../../components/agenda/week/WeekCalendarGrid';
import type { Apontamento } from '../../types/PatientTypes';
import type { FilterOptions } from '../../components/agenda/AgendaFilterDropdown';
import {
  weekDays,
  computedWeekEvents, // AGORA com pacientes
  timeSlots,
  currentTimePosition,
} from '../../data/WeekCalendarData';

interface AgendaWeekContentProps {
  onOpenConsulta?: (apontamento: Apontamento) => void;
  activeFilters?: FilterOptions;
}

export default function AgendaWeekContent({
  onOpenConsulta,
  activeFilters,
}: AgendaWeekContentProps = {}) {
  const todayIndex = weekDays.findIndex(day => day.isToday);

  const filteredEvents = useMemo(() => {
    const types = activeFilters?.types ?? [];
    if (types.length === 0) return computedWeekEvents;
    return computedWeekEvents.filter((e) => types.includes(e.type));
  }, [activeFilters]);

  const handleEventClick = (event: Apontamento) => {
    onOpenConsulta?.(event);
  };

  return (
    <>
      <div className="flex-1 overflow-auto bg-surface">
        <WeekCalendarHeader days={weekDays} />
        <WeekCalendarGrid
          timeSlots={timeSlots}
          events={filteredEvents}
          currentTimePosition={currentTimePosition}
          todayIndex={todayIndex}
          onEventClick={handleEventClick}
        />
      </div>
    </>
  );
}
