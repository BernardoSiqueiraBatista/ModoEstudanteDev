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
  onClose,
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
    <div className="w-64 bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-slate-100 bg-slate-50">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-700">Filtrar por tipo</span>
          {selectedTypes.length > 0 && (
            <button
              onClick={handleReset}
              className="text-[10px] text-slate-400 hover:text-slate-600 transition-colors"
            >
              Limpar
            </button>
          )}
        </div>
      </div>

      {/* Options */}
      <div className="p-2">
        {EVENT_TYPES.map(type => {
          const isActive = selectedTypes.includes(type.value);
          return (
            <button
              key={type.value}
              onClick={() => handleTypeToggle(type.value)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all ${
                isActive
                  ? 'bg-primary/5 text-primary font-semibold'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
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
      <div className="px-4 py-3 border-t border-slate-100 bg-slate-50">
        <button
          onClick={handleApply}
          className="w-full py-2 bg-slate-900 text-white rounded-lg text-xs font-medium hover:bg-slate-800 transition-colors"
        >
          Aplicar
        </button>
      </div>
    </div>
  );
}
