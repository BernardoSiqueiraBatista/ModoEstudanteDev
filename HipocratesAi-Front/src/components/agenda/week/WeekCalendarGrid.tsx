import CalendarEvent from './Calendarevent';
import { computedWeekEvents, currentTimePosition } from '../../../data/WeekCalendarData';
import type { Apontamento } from '../../../data/WeekCalendarData';

interface WeekCalendarGridProps {
  timeSlots: string[];
  events?: Apontamento[]; // opcional, usa computedWeekEvents por padrão
  currentTimePosition?: number;
  todayIndex?: number;
  onEventClick?: (event: Apontamento) => void;
}

export default function WeekCalendarGrid({
  timeSlots,
  events = computedWeekEvents,
  currentTimePosition: propCurrentTimePosition = currentTimePosition,
  todayIndex,
  onEventClick,
}: WeekCalendarGridProps) {
  console.log(
    'Eventos recebidos:',
    events.map(e => ({
      title: e.title,
      top: e.top,
      height: e.height,
      patient: e.patient.name,
    }))
  );

  const effectiveTodayIndex =
    todayIndex ??
    (() => {
      const today = new Date();
      const jsDay = today.getDay();
      return jsDay === 0 ? 6 : jsDay - 1;
    })();

  return (
    <div className="calendar-grid relative">
      {/* Time Column */}
      <div className="flex flex-col">
        {timeSlots.map((time, index) => (
          <div
            key={index}
            className={`time-row text-caption-bold font-semibold flex items-start justify-center pt-2 ${
              propCurrentTimePosition && Math.abs(index * 80 - propCurrentTimePosition) < 40
                ? 'text-primary'
                : 'text-subtitle'
            }`}
          >
            {time}
          </div>
        ))}
      </div>

      {/* Day Columns */}
      {[0, 1, 2, 3, 4, 5, 6].map(dayIndex => {
        const isToday = dayIndex === effectiveTodayIndex;
        const isWeekend = dayIndex === 5 || dayIndex === 6;
        const dayEvents = events.filter(e => e.dayIndex === dayIndex);

        return (
          <div
            key={dayIndex}
            className={`border-r border-slate-50 relative ${
              isToday ? 'bg-primary/[0.01]' : ''
            } ${isWeekend ? 'bg-slate-50/30' : ''}`}
          >
            {/* Current Time Marker */}
            {isToday && propCurrentTimePosition && (
              <div
                className="absolute left-0 right-0 border-t-2 border-primary border-dashed z-10 flex items-center"
                style={{ top: `${propCurrentTimePosition}px` }}
              >
                <div className="size-2 rounded-full bg-primary -ml-1"></div>
              </div>
            )}

            {/* Events */}
            {dayEvents.map((event, index) => (
              <CalendarEvent
                key={`${event.title}-${event.startTime}-${index}`}
                title={event.title}
                startTime={event.startTime}
                endTime={event.endTime}
                type={event.type}
                description={event.description}
                top={event.top}
                height={event.height}
                onClick={() => onEventClick?.(event)}
              />
            ))}
          </div>
        );
      })}

      {/* Grid Lines Overlay */}
      <div className="absolute inset-0 pointer-events-none">
        {timeSlots.map((_, index) => (
          <div key={index} className="time-row border-b border-slate-50"></div>
        ))}
      </div>
    </div>
  );
}