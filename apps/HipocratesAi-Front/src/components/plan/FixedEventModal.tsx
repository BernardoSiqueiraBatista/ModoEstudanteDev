import { useEffect, useRef, useState } from 'react';
import type { FixedEvent } from '../../hooks/useRoutineGenerator';

const DAYS: { full: string; short: string }[] = [
  { full: 'Segunda', short: 'S' },
  { full: 'Terça',   short: 'T' },
  { full: 'Quarta',  short: 'Q' },
  { full: 'Quinta',  short: 'Q' },
  { full: 'Sexta',   short: 'S' },
  { full: 'Sábado',  short: 'S' },
  { full: 'Domingo', short: 'D' },
];

interface FixedEventModalProps {
  onAdd: (event: FixedEvent) => void;
  onClose: () => void;
}

export default function FixedEventModal({ onAdd, onClose }: FixedEventModalProps) {
  const [name, setName]           = useState('');
  const [days, setDays]           = useState<string[]>(['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta']);
  const [startTime, setStartTime] = useState('07:00');
  const [endTime, setEndTime]     = useState('19:00');
  const firstRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    firstRef.current?.focus();
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  function toggleDay(full: string) {
    setDays((prev) =>
      prev.includes(full) ? prev.filter((d) => d !== full) : [...prev, full]
    );
  }

  function handleAdd() {
    if (!name.trim() || days.length === 0) return;
    onAdd({ name: name.trim(), days, startTime, endTime });
    onClose();
  }

  return (
    <div
      className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-start justify-center p-4 pt-24"
      role="dialog"
      aria-modal="true"
      aria-label="Adicionar compromisso fixo"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-surface rounded-3xl p-8 w-full max-w-sm shadow-2xl space-y-6">
        <h3 className="text-lg font-bold text-on-surface">Adicionar compromisso fixo</h3>

        <div className="space-y-4">
          {/* Nome */}
          <div>
            <label className="text-[0.6875rem] font-bold uppercase tracking-widest text-on-surface-variant block mb-1">
              Nome
            </label>
            <input
              ref={firstRef}
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex.: Plantão, Aula de Cirurgia"
              className="w-full bg-surface-container rounded-2xl px-4 py-3 text-sm text-on-surface placeholder:text-on-surface-variant/50 outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>

          {/* Seletor de dias */}
          <div>
            <label className="text-[0.6875rem] font-bold uppercase tracking-widest text-on-surface-variant block mb-2">
              Dias da semana
            </label>
            <div className="flex gap-1.5">
              {DAYS.map(({ full, short }) => {
                const selected = days.includes(full);
                return (
                  <button
                    key={full}
                    type="button"
                    title={full}
                    onClick={() => toggleDay(full)}
                    className={`w-9 h-9 rounded-full text-xs font-bold transition-all ${
                      selected
                        ? 'bg-primary text-on-primary shadow-sm'
                        : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
                    }`}
                  >
                    {short}
                  </button>
                );
              })}
            </div>
            {days.length === 0 && (
              <p className="text-xs text-error mt-1">Selecione ao menos um dia.</p>
            )}
          </div>

          {/* Horários */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[0.6875rem] font-bold uppercase tracking-widest text-on-surface-variant block mb-1">
                Início
              </label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full bg-surface-container rounded-2xl px-4 py-3 text-sm text-on-surface outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <div>
              <label className="text-[0.6875rem] font-bold uppercase tracking-widest text-on-surface-variant block mb-1">
                Fim
              </label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full bg-surface-container rounded-2xl px-4 py-3 text-sm text-on-surface outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
          </div>
        </div>

        <div className="flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="text-on-surface-variant hover:bg-surface-container px-6 py-3 rounded-2xl transition-colors text-sm"
          >
            Cancelar
          </button>
          <button
            onClick={handleAdd}
            disabled={!name.trim() || days.length === 0}
            className="bg-primary text-on-primary px-6 py-3 rounded-2xl font-bold text-sm disabled:opacity-50 transition-opacity"
          >
            Adicionar
          </button>
        </div>
      </div>
    </div>
  );
}
