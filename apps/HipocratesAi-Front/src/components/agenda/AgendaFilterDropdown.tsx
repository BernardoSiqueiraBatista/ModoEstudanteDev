import React from 'react';
import type { EventType } from './week/Calendarevent';

export type FilterOptions = {
  types: EventType[];
};

interface AgendaFilterDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (filters: FilterOptions) => void;
  onReset: () => void;
  currentFilters: FilterOptions;
}

const EVENT_TYPES: { value: EventType; label: string; icon: string }[] = [
  { value: 'consulta', label: 'Consulta', icon: 'stethoscope' },
  { value: 'urgencia', label: 'Urgência', icon: 'emergency' },
  { value: 'compromisso', label: 'Compromisso', icon: 'event' },
  { value: 'video', label: 'Vídeo', icon: 'videocam' },
];

export default function AgendaFilterDropdown({
  isOpen,
  onClose: _onClose,
  onApply,
  onReset,
  currentFilters,
}: AgendaFilterDropdownProps) {
  const [selectedTypes, setSelectedTypes] = React.useState<EventType[]>(currentFilters.types);

  React.useEffect(() => {
    if (isOpen) {
      setSelectedTypes(currentFilters.types);
    }
  }, [isOpen, currentFilters.types]);

  const handleTypeToggle = (type: EventType) => {
    if (selectedTypes.includes(type)) {
      setSelectedTypes(selectedTypes.filter(t => t !== type));
    } else {
      setSelectedTypes([...selectedTypes, type]);
    }
  };

  const handleApply = () => {
    onApply({ types: selectedTypes });
  };

  const handleReset = () => {
    setSelectedTypes([]);
    onReset();
  };

  if (!isOpen) return null;

  return (
    <div className="w-64 bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden filter-dropdown-enter">
      {/* Options */}
      <div className="p-2">
        {EVENT_TYPES.map((type, idx) => {
          const isActive = selectedTypes.includes(type.value);
          return (
            <button
              key={type.value}
              onClick={() => handleTypeToggle(type.value)}
              className={`filter-item-enter w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                isActive
                  ? 'bg-primary/5 text-primary font-semibold'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
              style={{ animationDelay: `${60 + idx * 35}ms` }}
            >
              <span
                className={`material-icon text-lg ${isActive ? 'text-primary' : 'text-slate-400'}`}
              >
                {type.icon}
              </span>
              <span className={`text-sm ${isActive ? 'font-semibold' : 'font-normal'}`}>
                {type.label}
              </span>
              {isActive && (
                <span className="ml-auto material-icon text-sm text-primary">check_circle</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-slate-100 bg-slate-50 flex items-center gap-2">
        <button
          onClick={handleReset}
          disabled={selectedTypes.length === 0}
          className="flex-1 py-2 rounded-lg text-xs font-medium text-slate-600 bg-white border border-slate-200 hover:bg-slate-100 hover:border-slate-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:border-slate-200 active:scale-[0.98] transition-colors flex items-center justify-center gap-1.5"
        >
          <span className="material-icon text-sm">filter_alt_off</span>
          Limpar filtro
        </button>
        <button
          onClick={handleApply}
          className="flex-1 py-2 bg-slate-900 text-white rounded-lg text-xs font-medium hover:bg-slate-800 transition-colors active:scale-[0.98]"
        >
          Aplicar
        </button>
      </div>
    </div>
  );
}
