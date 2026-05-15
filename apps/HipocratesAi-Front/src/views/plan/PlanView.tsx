import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import RoutineConfigurator from '../../components/plan/RoutineConfigurator';
import AIReasoningBanner from '../../components/plan/AIReasoningBanner';
import ErrorBanner from '../../components/plan/ErrorBanner';
import DailyPanel from '../../components/plan/DailyPanel';
import { useRoutineGenerator, type DayKey, type RoutineBlock } from '../../hooks/useRoutineGenerator';

// ─── Week calendar (bubble cards) ────────────────────────────────────────────

const DAY_ORDER: DayKey[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const DAY_ABBR: Record<DayKey, string> = {
  monday: 'Seg', tuesday: 'Ter', wednesday: 'Qua', thursday: 'Qui',
  friday: 'Sex', saturday: 'Sáb', sunday: 'Dom',
};
const BLOCK_COLORS: Record<string, string> = {
  study:     'bg-primary/15 text-primary',
  questions: 'bg-secondary-container text-on-secondary-container',
  revision:  'bg-tertiary-container/20 text-on-tertiary-container',
  fixed:     'bg-on-surface/10 text-on-surface-variant',
};

function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  d.setDate(d.getDate() - (day === 0 ? 6 : day - 1));
  return d;
}

function getWeekLabel(date: Date): string {
  const start = getWeekStart(date);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  const opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long' };
  return `Semana de ${start.toLocaleDateString('pt-BR', opts)} a ${end.toLocaleDateString('pt-BR', opts)}`;
}

function getTodayKey(): DayKey {
  const map: DayKey[] = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  return map[new Date().getDay()]!;
}

interface BubbleCalendarProps {
  routineWeek: Record<DayKey, RoutineBlock[]> | null;
  selectedDay: DayKey;
  onSelectDay: (d: DayKey) => void;
  loading: boolean;
}

function BubbleCalendar({ routineWeek, selectedDay, onSelectDay, loading }: BubbleCalendarProps) {
  const weekStart = getWeekStart(new Date());

  return (
    <div className="grid grid-cols-7 gap-3">
      {DAY_ORDER.map((day, i) => {
        const date = new Date(weekStart);
        date.setDate(weekStart.getDate() + i);
        const dayNum = date.getDate();
        const isSelected = day === selectedDay;
        const blocks = routineWeek?.[day] ?? [];
        const visible = blocks.slice(0, 3);
        const overflow = blocks.length - 3;

        return (
          <button
            key={day}
            type="button"
            aria-selected={isSelected}
            onClick={() => onSelectDay(day)}
            className={`liquid-glass rounded-[2rem] p-3 md:p-5 flex flex-col items-center transition-all hover:-translate-y-1 ${
              isSelected ? 'ring-2 ring-primary shadow-lg shadow-primary/20' : ''
            } ${loading ? 'opacity-60' : ''}`}
          >
            <span className="text-[0.6rem] md:text-[0.6875rem] font-bold uppercase tracking-widest text-on-surface-variant mb-2 md:mb-4">
              {DAY_ABBR[day]}
            </span>
            <div className={`w-8 h-8 md:w-12 md:h-12 rounded-full flex items-center justify-center mb-3 md:mb-6 text-sm md:text-xl font-bold ${
              isSelected ? 'bg-primary text-on-primary' : 'bg-surface-container-high text-on-surface'
            }`}>
              {dayNum}
            </div>
            <div className="space-y-1.5 w-full">
              {loading ? (
                <>
                  <div className="h-2 w-full bg-surface-container-highest animate-pulse rounded-full" />
                  <div className="h-2 w-3/4 bg-surface-container-highest animate-pulse rounded-full" />
                  <div className="h-2 w-1/2 bg-surface-container-highest animate-pulse rounded-full" />
                </>
              ) : visible.length > 0 ? (
                <>
                  {visible.map((b, bi) => (
                    <div key={bi} className={`rounded-xl px-2 py-1 text-[0.5rem] md:text-[0.625rem] font-bold truncate ${BLOCK_COLORS[b.type] ?? BLOCK_COLORS.study}`}>
                      {b.label}
                    </div>
                  ))}
                  {overflow > 0 && (
                    <div className="bg-surface-container text-on-surface-variant rounded-full text-[0.5rem] md:text-[0.625rem] font-bold px-2 py-0.5 text-center">
                      +{overflow}
                    </div>
                  )}
                </>
              ) : (
                <>
                  <div className="h-1.5 w-full bg-surface-container/30 rounded-full" />
                  <div className="h-1.5 w-3/4 bg-surface-container/30 rounded-full" />
                </>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}

// ─── Main view ────────────────────────────────────────────────────────────────

export default function PlanView() {
  const navigate = useNavigate();
  const { routine, loading, error, generate, fetchCurrentRoutine, setError } = useRoutineGenerator();
  const [selectedDay, setSelectedDay] = useState<DayKey>(getTodayKey());

  useEffect(() => { fetchCurrentRoutine(); }, [fetchCurrentRoutine]);

  const today = new Date();

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-10 pb-32">

      {/* Header */}
      <section className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-on-surface">
            Plano de Estudos
          </h1>
          <p className="text-on-surface-variant text-base md:text-lg">{getWeekLabel(today)}</p>
        </div>

        {/* Ver calendário completo */}
        <button
          onClick={() => navigate('/plan/calendario')}
          className="shrink-0 flex items-center gap-2 px-5 py-2.5 bg-white border border-light rounded-full text-sm font-semibold text-on-surface hover:bg-surface-light transition-all active:scale-[0.98] shadow-sm"
        >
          <span className="material-symbols-outlined text-[18px] text-primary">calendar_month</span>
          Ver calendário completo
          <span className="material-symbols-outlined text-[16px] text-on-surface-variant">arrow_forward</span>
        </button>
      </section>

      {/* Bubble week calendar */}
      <section>
        <BubbleCalendar
          routineWeek={routine?.week ?? null}
          selectedDay={selectedDay}
          onSelectDay={setSelectedDay}
          loading={loading}
        />
      </section>

      {/* AI reasoning banner */}
      {routine?.ai_reasoning && !loading && !error && (
        <AIReasoningBanner text={routine.ai_reasoning} />
      )}

      {/* Error banner */}
      {error && <ErrorBanner onRetry={() => setError(null)} />}

      {/* Daily panel */}
      {routine && (
        <DailyPanel
          selectedDay={selectedDay}
          onDayChange={setSelectedDay}
          blocks={routine.week[selectedDay] ?? []}
          suggestions={routine.suggestions ?? []}
        />
      )}

      {/* Routine configurator */}
      <RoutineConfigurator loading={loading} onGenerate={generate} />

      {/* Configuração de plano */}
      <section>
        <div className="flex items-center gap-3 mb-8">
          <span className="material-symbols-outlined text-on-surface-variant">settings_suggest</span>
          <h2 className="text-2xl font-bold tracking-tight text-on-surface">Configuração de Plano</h2>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 bg-surface-container-low border-2 border-dashed border-outline-variant rounded-[2.5rem] p-12 flex flex-col items-center justify-center text-center space-y-4 hover:bg-surface-container-high transition-colors group cursor-pointer">
            <div className="w-16 h-16 bg-white rounded-full shadow flex items-center justify-center group-hover:scale-110 transition-transform">
              <span className="material-symbols-outlined text-primary text-3xl">upload_file</span>
            </div>
            <div>
              <h4 className="text-lg font-bold text-on-surface">Importar Cronograma Externo</h4>
              <p className="text-on-surface-variant text-sm">
                Arraste seu PDF de residência ou calendário MedCurso para sincronizar
              </p>
            </div>
          </div>
          <div className="liquid-glass rounded-[2.5rem] p-8 space-y-6">
            <h4 className="text-[0.6875rem] font-bold uppercase tracking-widest text-on-surface-variant">
              Nível de Atuação
            </h4>
            <div className="space-y-3">
              {(['Residente', 'Especialista', 'Acadêmico'] as const).map((level, i) => (
                <button
                  key={level}
                  className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all ${
                    i === 0
                      ? 'bg-primary text-on-primary font-semibold'
                      : 'bg-surface-container hover:bg-surface-container-high text-on-surface-variant font-medium'
                  }`}
                >
                  <span>{level}</span>
                  <span className="material-symbols-outlined" style={i === 0 ? { fontVariationSettings: "'FILL' 1" } : undefined}>
                    {i === 0 ? 'check_circle' : 'radio_button_unchecked'}
                  </span>
                </button>
              ))}
            </div>
            <button className="w-full py-4 bg-primary-container text-on-primary-container rounded-2xl font-bold text-sm tracking-wide uppercase hover:opacity-90 transition-opacity">
              Salvar Configurações
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
