export type EventType = 'consulta' | 'urgencia' | 'compromisso' | 'video';
export type Status = 'current' | 'waiting' | 'confirmed';

interface CalendarEventProps {
  title: string;
  startTime: string;
  endTime: string;
  type: EventType;
  description?: string;
  top: number;
  height: number;
  isActive?: boolean; //destacar evento atual
  onClick?: () => void;
}

export default function CalendarEvent({
  title,
  startTime,
  endTime,
  type,
  description,
  top,
  height,
  isActive, // NOVO
  onClick,
}: CalendarEventProps) {
  const getEventStyles = () => {
    // Base styles por tipo
    const baseStyles = {
      consulta: 'bg-blue-50 border-blue-100 text-blue-600',
      urgencia: 'bg-orange-50 border-orange-100 text-orange-600',
      compromisso: 'bg-slate-50 border-slate-200 text-slate-500',
      video: 'bg-indigo-50 border-indigo-100 text-indigo-600',
    };

    const baseStyle = baseStyles[type] || baseStyles.consulta;

    // Se estiver ativo (acontecendo agora), adiciona destaque
    if (isActive) {
      return `${baseStyle} ring-2 ring-primary ring-opacity-50 shadow-md`;
    }

    return baseStyle;
  };

  return (
    <div
      className={`absolute left-1 right-1 ${getEventStyles()} border rounded-xl p-3 shadow-sm flex flex-col cursor-pointer hover:shadow-md transition-all`}
      style={{ top: `${top}px`, height: `${height}px` }}
      onClick={onClick}
    >
      <span className="text-caption-bold uppercase">
        {startTime} - {endTime}
      </span>
      <span className="text-caption font-bold text-title mt-1 truncate">{title}</span>
      {description && (
        <span className="text-caption text-subtitle mt-auto truncate">{description}</span>
      )}
    </div>
  );
}
