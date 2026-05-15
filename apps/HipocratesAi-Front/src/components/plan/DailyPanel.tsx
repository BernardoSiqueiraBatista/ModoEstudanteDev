import type { DayKey, RoutineBlock as RoutineBlockType, SuggestionCard } from '../../hooks/useRoutineGenerator';
import RoutineBlock from './RoutineBlock';

const DAY_LABELS: Record<DayKey, string> = {
  monday:    'Segunda-feira',
  tuesday:   'Terça-feira',
  wednesday: 'Quarta-feira',
  thursday:  'Quinta-feira',
  friday:    'Sexta-feira',
  saturday:  'Sábado',
  sunday:    'Domingo',
};

const DAY_ORDER: DayKey[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

const BADGE_STYLES: Record<string, string> = {
  urgente:     'bg-primary/10 text-primary',
  simulado:    'bg-secondary-container text-on-secondary-container',
  recomendado: 'bg-surface-container-highest text-on-surface-variant',
};

interface DailyPanelProps {
  selectedDay: DayKey;
  onDayChange: (day: DayKey) => void;
  blocks: RoutineBlockType[];
  suggestions: SuggestionCard[];
}

export default function DailyPanel({ selectedDay, onDayChange, blocks, suggestions }: DailyPanelProps) {
  const currentIndex = DAY_ORDER.indexOf(selectedDay);
  const prevDay = currentIndex > 0 ? DAY_ORDER[currentIndex - 1] : null;
  const nextDay = currentIndex < DAY_ORDER.length - 1 ? DAY_ORDER[currentIndex + 1] : null;

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold text-on-surface">{DAY_LABELS[selectedDay]}</h3>
        <div className="flex items-center gap-2">
          <button
            onClick={() => prevDay && onDayChange(prevDay)}
            disabled={!prevDay}
            className="text-on-surface-variant hover:bg-surface-container rounded-xl px-3 py-2 flex items-center gap-1 text-sm disabled:opacity-30 transition-colors"
          >
            <span className="material-symbols-outlined text-sm">chevron_left</span>
            Anterior
          </button>
          <button
            onClick={() => nextDay && onDayChange(nextDay)}
            disabled={!nextDay}
            className="text-on-surface-variant hover:bg-surface-container rounded-xl px-3 py-2 flex items-center gap-1 text-sm disabled:opacity-30 transition-colors"
          >
            Próximo
            <span className="material-symbols-outlined text-sm">chevron_right</span>
          </button>
        </div>
      </div>

      {blocks.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 gap-3">
          <span
            className="material-symbols-outlined text-outline-variant"
            style={{ fontSize: '48px', fontVariationSettings: "'FILL' 1" }}
          >
            check_circle
          </span>
          <p className="text-on-surface-variant text-sm text-center">Dia livre — aproveite para descansar!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {blocks.map((block, i) => (
            <RoutineBlock key={i} block={block} />
          ))}
        </div>
      )}

      {suggestions.length > 0 && (
        <div className="space-y-4 pt-2">
          <div className="flex items-center gap-2">
            <span
              className="material-symbols-outlined text-primary"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              auto_awesome
            </span>
            <h4 className="text-lg font-bold text-on-surface">Sugestões de IA</h4>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {suggestions.map((s) => (
              <div
                key={s.id}
                className="group liquid-glass rounded-3xl p-8 border border-white/50 transition-all hover:-translate-y-1"
              >
                <div className="flex justify-between items-start mb-6">
                  <div className={`px-3 py-1 text-[0.6875rem] font-bold uppercase tracking-wider rounded-full ${BADGE_STYLES[s.badge] ?? BADGE_STYLES.recomendado}`}>
                    {s.badge}
                  </div>
                  <span className="material-symbols-outlined text-on-surface-variant">
                    {s.icon ?? 'school'}
                  </span>
                </div>
                <h3 className="text-xl font-bold text-on-surface mb-2">{s.title}</h3>
                <p className="text-on-surface-variant text-sm mb-6 leading-relaxed">{s.description}</p>
                <div className="flex items-center justify-end">
                  <button className="text-primary text-sm font-bold flex items-center gap-1 group-hover:gap-2 transition-all">
                    {s.action_label}
                    <span className="material-symbols-outlined text-sm">arrow_forward</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
