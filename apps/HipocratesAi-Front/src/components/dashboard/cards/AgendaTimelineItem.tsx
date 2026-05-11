interface AgendaTimelineItemProps {
  time: string;
  patientName: string;
  description: string;
  status: 'confirmed' | 'waiting' | 'in_progress';
  onClick?: () => void;
}

export default function AgendaTimelineItem({
  time,
  patientName,
  description,
  status,
  onClick,
}: AgendaTimelineItemProps) {
  const isActive = status === 'in_progress';

  const statusLabel =
    status === 'confirmed'
      ? 'Confirmado'
      : isActive
        ? 'Em Atendimento'
        : 'Aguardando';

  const pillClass =
    status === 'confirmed'
      ? 'bg-slate-50 border-slate-100 text-slate-400'
      : isActive
        ? 'bg-blue-50 border-blue-100 text-[var(--medical-navy)]'
        : 'bg-amber-50 border-amber-100 text-amber-600';

  const timeClass = isActive
    ? 'text-xs font-bold text-[var(--electric-cyan)]'
    : 'text-xs font-bold text-slate-400';

  const cardClass = isActive
    ? 'flex-1 p-6 bg-white rounded-[1.75rem] shadow-md border border-[var(--electric-cyan)]/20 relative overflow-hidden'
    : 'flex-1 p-6 bg-white/40 border border-white rounded-[1.75rem] shadow-sm hover:shadow-lg hover:bg-white transition-all duration-300';

  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full text-left flex gap-8 group cursor-pointer"
    >
      <div className="w-14 py-4 flex flex-col items-end flex-shrink-0">
        <span className={timeClass}>{time}</span>
      </div>
      <div className={cardClass}>
        {isActive && (
          <div className="absolute top-0 left-0 w-1 h-full bg-[var(--electric-cyan)]"></div>
        )}
        <div className="flex justify-between items-center">
          <div className="min-w-0">
            <h3 className="text-base font-semibold text-slate-900 truncate">
              {patientName}
            </h3>
            <p className="text-xs text-slate-500 font-medium mt-1 truncate">
              {description}
            </p>
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
            <span
              className={`px-3 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase border ${pillClass}`}
            >
              {statusLabel}
            </span>
            {isActive && (
              <div className="size-2 bg-[var(--electric-cyan)] rounded-full animate-pulse"></div>
            )}
          </div>
        </div>
      </div>
    </button>
  );
}
