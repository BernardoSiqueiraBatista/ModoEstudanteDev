import React from 'react';
import { 
  monthNames, 
  dayNames, 
  dateToDayIndex, 
  formatDate, 
  isToday,
  nomeMesAtual,
  diaAtual,
  nomeDiaSemanaAtual 
} from '../../../data/Dates';
import { getEventsByDay, computedWeekEvents } from '../../../data/WeekCalendarData';

interface DateNavigatorProps {
  selectedDate?: Date;
  onDateChange?: (date: Date) => void;
  onPrevious?: () => void;
  onNext?: () => void;
  onToday?: () => void;
  showTodayButton?: boolean;
}

export default function DateNavigator({ 
  selectedDate: externalDate,
  onDateChange,
  onPrevious: externalOnPrevious,
  onNext: externalOnNext,
  onToday: externalOnToday,
  showTodayButton = true,
}: DateNavigatorProps) {
  // Estado interno
  const [internalDate, setInternalDate] = React.useState(new Date());
  
  // Usar data externa se fornecida
  const currentDate = externalDate || internalDate;
  const { month, day, weekDay, dayIndex } = formatDate(currentDate);

  // Calcular consultas do dia
  const totalConsultas = React.useMemo(() => {
    return getEventsByDay(computedWeekEvents, dayIndex).length;
  }, [dayIndex]);

  // Handlers
  const handlePrevious = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() - 1);
    
    if (onDateChange) {
      onDateChange(newDate);
    } else {
      setInternalDate(newDate);
    }
    externalOnPrevious?.();
  };

  const handleNext = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() + 1);
    
    if (onDateChange) {
      onDateChange(newDate);
    } else {
      setInternalDate(newDate);
    }
    externalOnNext?.();
  };

  const handleToday = () => {
    const today = new Date();
    
    if (onDateChange) {
      onDateChange(today);
    } else {
      setInternalDate(today);
    }
    externalOnToday?.();
  };

  const isCurrentDayToday = isToday(currentDate);

  return (
    <div className="flex items-center justify-between mb-12">
      <div className="flex items-center gap-6">
        <div className="text-center">
          <p className="text-caption-bold text-subtitle uppercase tracking-widest">{month}</p>
          <p className="text-4xl font-bold text-title">{day}</p>
        </div>
        <div className="h-10 w-px bg-slate-200"></div>
        <div>
          <h2 className="text-heading-2 text-title">{weekDay}</h2>
          <p className="text-subtitle text-body-sm">
            {totalConsultas} consulta{totalConsultas !== 1 ? 's' : ''} agendada{totalConsultas !== 1 ? 's' : ''} 
            para {isCurrentDayToday ? 'hoje' : 'este dia'}
          </p>
        </div>
      </div>

      <div className="flex gap-2">
        {showTodayButton && !isCurrentDayToday && (
          <button
            className="px-4 py-2 rounded-full border border-light flex items-center gap-2 text-subtitle hover:bg-surface transition-all"
            onClick={handleToday}
          >
            <span className="material-icon text-lg">today</span>
            <span className="text-caption-bold">HOJE</span>
          </button>
        )}

        <button
          className="size-10 rounded-full border border-light flex items-center justify-center text-subtitle hover:bg-surface transition-all"
          onClick={handlePrevious}
          aria-label="Dia anterior"
        >
          <span className="material-icon text-lg">chevron_left</span>
        </button>
        
        <button
          className="size-10 rounded-full border border-light flex items-center justify-center text-subtitle hover:bg-surface transition-all"
          onClick={handleNext}
          aria-label="Próximo dia"
        >
          <span className="material-icon text-lg">chevron_right</span>
        </button>
      </div>
    </div>
  );
}