import { useState } from 'react';
import ParamChipGroup from './ParamChipGroup';
import FixedEventModal from './FixedEventModal';
import FixedEventPill from './FixedEventPill';
import type { FixedEvent, GenerateParams } from '../../hooks/useRoutineGenerator';

const MAX_BRIEFING = 500;

interface RoutineConfiguratorProps {
  loading: boolean;
  onGenerate: (params: GenerateParams) => void;
}

export default function RoutineConfigurator({ loading, onGenerate }: RoutineConfiguratorProps) {
  const [briefing, setBriefing] = useState('');
  const [hoursPerDay, setHoursPerDay] = useState<number | null>(null);
  const [priority, setPriority] = useState<'questions' | 'revision' | 'reading' | null>(null);
  const [usePerformanceData, setUsePerformanceData] = useState<string>('true');
  const [fixedEvents, setFixedEvents] = useState<FixedEvent[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [briefingError, setBriefingError] = useState(false);
  const [hoursError, setHoursError] = useState(false);

  function handleGenerate() {
    let valid = true;
    if (briefing.length < 10) { setBriefingError(true); valid = false; } else setBriefingError(false);
    if (!hoursPerDay) { setHoursError(true); valid = false; } else setHoursError(false);
    if (!valid) return;
    onGenerate({
      briefing,
      hoursPerDay: hoursPerDay!,
      priority: priority ?? 'questions',
      usePerformanceData: usePerformanceData === 'true',
      fixedEvents,
    });
  }

  return (
    <section className="space-y-6">
      <div className="flex items-start gap-3">
        <span
          className="material-symbols-outlined text-primary text-3xl shrink-0 mt-0.5"
          style={{ fontVariationSettings: "'FILL' 1" }}
        >
          auto_awesome
        </span>
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-on-surface">Configure sua rotina</h2>
          <p className="text-on-surface-variant text-sm mt-0.5">
            Conte como você quer organizar sua semana e deixe a IA montar seu plano.
          </p>
        </div>
      </div>

      {/* Briefing */}
      <div className={`liquid-glass rounded-3xl p-6 space-y-2 ${briefingError ? 'ring-2 ring-error' : ''}`}>
        <p className="text-[0.6875rem] font-bold uppercase tracking-widest text-on-surface-variant">
          Descreva sua semana
        </p>
        <div className="relative">
          <textarea
            value={briefing}
            onChange={(e) => {
              if (e.target.value.length <= MAX_BRIEFING) setBriefing(e.target.value);
              if (briefingError && e.target.value.length >= 10) setBriefingError(false);
            }}
            placeholder="Ex.: Quero focar em clínica médica essa semana, tenho plantão na quinta e preciso revisar os temas que errei..."
            disabled={loading}
            rows={4}
            className="w-full bg-transparent resize-none text-on-surface placeholder:text-on-surface-variant/50 text-sm outline-none disabled:opacity-60 pb-5"
          />
          <span className="absolute bottom-0 right-0 text-xs text-on-surface-variant">
            {briefing.length} / {MAX_BRIEFING}
          </span>
        </div>
      </div>

      {/* Chips */}
      <div className="liquid-glass rounded-3xl p-6 space-y-5">
        <ParamChipGroup
          label="Horas de estudo/dia"
          options={[
            { label: '2h', value: 2 },
            { label: '3h', value: 3 },
            { label: '4h', value: 4 },
            { label: '+5h', value: 5 },
          ]}
          value={hoursPerDay}
          onChange={(v) => { setHoursPerDay(v as number); setHoursError(false); }}
          hasError={hoursError}
        />

        <ParamChipGroup
          label="Prioridade"
          options={[
            { label: 'Questões', value: 'questions' },
            { label: 'Revisão', value: 'revision' },
            { label: 'Leitura', value: 'reading' },
          ]}
          value={priority}
          onChange={(v) => setPriority(v as 'questions' | 'revision' | 'reading')}
        />

        <ParamChipGroup
          label="Desempenho nas questões"
          options={[
            { label: '✓ Levar em conta acertos/erros', value: 'true' },
            { label: 'Ignorar', value: 'false' },
          ]}
          value={usePerformanceData}
          onChange={(v) => setUsePerformanceData(v as string)}
        />
      </div>

      {/* Fixed events */}
      <div className="space-y-3">
        <button
          type="button"
          onClick={() => setShowModal(true)}
          disabled={loading}
          className="w-full flex items-center gap-2 border border-dashed border-outline-variant rounded-2xl px-4 py-3 text-sm text-on-surface-variant hover:bg-surface-container-low transition-colors disabled:opacity-60"
        >
          <span className="material-symbols-outlined text-[18px]">event</span>
          + Adicionar compromisso fixo
        </button>

        {fixedEvents.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {fixedEvents.map((ev, idx) => (
              <FixedEventPill
                key={idx}
                event={ev}
                onRemove={() => setFixedEvents((prev) => prev.filter((_, i) => i !== idx))}
              />
            ))}
          </div>
        )}
      </div>

      {/* Generate button */}
      <button
        type="button"
        onClick={handleGenerate}
        disabled={loading}
        className="w-full py-5 bg-gradient-to-r from-primary to-primary-dim text-on-primary font-bold text-lg rounded-3xl shadow-lg shadow-primary/20 flex items-center justify-center gap-3 hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-70 disabled:cursor-not-allowed"
      >
        {loading ? (
          <>
            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
            Gerando sua rotina...
          </>
        ) : (
          <>
            <span
              className="material-symbols-outlined text-[24px]"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              auto_awesome
            </span>
            Gerar minha rotina
          </>
        )}
      </button>

      {showModal && (
        <FixedEventModal
          onAdd={(ev) => setFixedEvents((prev) => [...prev, ev])}
          onClose={() => setShowModal(false)}
        />
      )}
    </section>
  );
}
