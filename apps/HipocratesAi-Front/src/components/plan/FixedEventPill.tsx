import type { FixedEvent } from '../../hooks/useRoutineGenerator';

interface FixedEventPillProps {
  event: FixedEvent;
  onRemove: () => void;
}

export default function FixedEventPill({ event, onRemove }: FixedEventPillProps) {
  return (
    <div className="inline-flex items-center gap-2 bg-tertiary-container/20 text-on-tertiary-container rounded-full px-3 py-1.5 text-xs font-medium">
      <span className="font-bold">{event.name}</span>
      <span className="text-on-surface-variant/50">·</span>
      <span>{event.day}</span>
      <span className="text-on-surface-variant/50">·</span>
      <span>{event.startTime} – {event.endTime}</span>
      <button
        onClick={onRemove}
        aria-label={`Remover ${event.name}`}
        className="ml-1 text-on-surface-variant hover:text-error transition-colors leading-none"
      >
        ×
      </button>
    </div>
  );
}
