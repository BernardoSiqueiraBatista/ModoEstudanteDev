import { useNavigate } from 'react-router-dom';
import type { RoutineBlock as RoutineBlockType } from '../../hooks/useRoutineGenerator';

const TYPE_META: Record<string, { dot: string; label: string }> = {
  study:     { dot: 'bg-primary',            label: 'Estudo teórico' },
  questions: { dot: 'bg-secondary',          label: 'Questões' },
  revision:  { dot: 'bg-tertiary-container', label: 'Revisão' },
  fixed:     { dot: 'bg-on-surface/30',      label: 'Compromisso fixo' },
};

function formatDuration(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (h === 0) return `${m}min`;
  if (m === 0) return `${h}h`;
  return `${h}h ${String(m).padStart(2, '0')}min`;
}

interface RoutineBlockProps {
  block: RoutineBlockType;
}

export default function RoutineBlock({ block }: RoutineBlockProps) {
  const navigate = useNavigate();
  const meta = TYPE_META[block.type] ?? TYPE_META.study!;

  return (
    <div className="liquid-glass rounded-2xl p-5 flex items-center gap-4">
      <div className={`w-3 h-3 rounded-full shrink-0 ${meta.dot}`} />

      <div className="flex-1 min-w-0">
        <p className="text-base font-semibold text-on-surface truncate">{block.label}</p>
        <p className="text-xs text-on-surface-variant capitalize">{meta.label}</p>
      </div>

      <span className="text-sm text-on-surface-variant shrink-0">
        {block.type === 'fixed' && block.start_time && block.end_time
          ? `${block.start_time} – ${block.end_time}`
          : formatDuration(block.duration_min)}
      </span>

      {block.type !== 'fixed' && (
        <button
          onClick={() => block.topic_id && navigate(`/questoes?topic=${block.topic_id}`)}
          className="text-primary text-sm font-bold flex items-center gap-1 hover:gap-2 transition-all shrink-0"
        >
          Iniciar
          <span className="material-symbols-outlined text-sm">arrow_forward</span>
        </button>
      )}
    </div>
  );
}
