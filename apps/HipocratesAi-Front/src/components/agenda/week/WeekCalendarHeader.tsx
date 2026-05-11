interface DayHeader {
  dayName: string;
  dayNumber: number;
  isToday?: boolean;
  isWeekend?: boolean;
}

interface WeekCalendarHeaderProps {
  days: DayHeader[];
}

export default function WeekCalendarHeader({ days }: WeekCalendarHeaderProps) {
  return (
    <div className="calendar-grid sticky top-0 bg-surface z-19 border-b border-subtle">
      {/* Time Column Header */}
      <div className="h-16 flex items-center justify-center border-r border-subtle">
        <span className="material-icon text-subtitle text-xl">schedule</span>
      </div>

      {/* Day Headers */}
      {days.map((day, index) => (
        <div
          key={index}
          className={`flex flex-col items-center justify-center h-16 border-r border-slate-50 relative ${
            day.isToday ? 'bg-primary/[0.02]' : ''
          } ${day.isWeekend ? 'bg-slate-50/50' : ''}`}
        >
          <span
            className={`text-caption-bold uppercase tracking-widest ${
              day.isToday ? 'text-primary' : 'text-subtitle'
            }`}
          >
            {day.dayName}
          </span>
          <span
            className={`text-xl font-bold ${
              day.isToday ? 'text-primary' : day.isWeekend ? 'text-subtitle' : 'text-title'
            }`}
          >
            {day.dayNumber}
          </span>
          {day.isToday && (
            <div className="size-1.5 bg-primary rounded-full absolute bottom-2"></div>
          )}
        </div>
      ))}
    </div>
  );
}
