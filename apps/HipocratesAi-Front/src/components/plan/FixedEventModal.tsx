import { useEffect, useRef, useState } from 'react';
import type { FixedEvent } from '../../hooks/useRoutineGenerator';

const DAYS = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'];

interface FixedEventModalProps {
  onAdd: (event: FixedEvent) => void;
  onClose: () => void;
}

export default function FixedEventModal({ onAdd, onClose }: FixedEventModalProps) {
  const [name, setName] = useState('');
  const [day, setDay] = useState('Segunda');
  const [startTime, setStartTime] = useState('07:00');
  const [endTime, setEndTime] = useState('19:00');
  const firstRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    firstRef.current?.focus();
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  function handleAdd() {
    if (!name.trim()) return;
    onAdd({ name: name.trim(), day, startTime, endTime });
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

          <div>
            <label className="text-[0.6875rem] font-bold uppercase tracking-widest text-on-surface-variant block mb-1">
              Dia da semana
            </label>
            <select
              value={day}
              onChange={(e) => setDay(e.target.value)}
              className="select w-full bg-surface-container rounded-2xl px-4 py-3 text-sm text-on-surface outline-none focus:ring-2 focus:ring-primary/30"
            >
              {DAYS.map((d) => <option key={d}>{d}</option>)}
            </select>
          </div>

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
            disabled={!name.trim()}
            className="bg-primary text-on-primary px-6 py-3 rounded-2xl font-bold text-sm disabled:opacity-50 transition-opacity"
          >
            Adicionar
          </button>
        </div>
      </div>
    </div>
  );
}
