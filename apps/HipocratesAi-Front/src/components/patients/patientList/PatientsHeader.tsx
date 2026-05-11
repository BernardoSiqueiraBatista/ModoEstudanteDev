import React, { useEffect, useRef, useState } from 'react';
import PatientsFilterDropdown, {
  type PatientsFilterOptions,
} from './PatientsFilterDropdown';

interface PatientsHeaderProps {
  onSearch?: (query: string) => void;
  onNewPatient?: () => void;
  onFilter?: (filters: PatientsFilterOptions) => void;
  activeFiltersCount?: number;
  currentFilters?: PatientsFilterOptions;
}

export default function PatientsHeader({
  onNewPatient,
  onFilter,
  activeFiltersCount = 0,
  currentFilters = { sex: [], ageRanges: [], sortBy: null },
}: PatientsHeaderProps) {
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const filterButtonRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, right: 0 });

  useEffect(() => {
    if (isFilterOpen && filterButtonRef.current) {
      const rect = filterButtonRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + 8,
        right: window.innerWidth - rect.right,
      });
    }
  }, [isFilterOpen]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      const isClickInsideButton = filterButtonRef.current?.contains(target);
      const isClickInsideDropdown = dropdownRef.current?.contains(target);
      if (!isClickInsideButton && !isClickInsideDropdown && isFilterOpen) {
        setIsFilterOpen(false);
      }
    };
    if (isFilterOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isFilterOpen]);

  const handleFilterApply = (filters: PatientsFilterOptions) => {
    onFilter?.(filters);
    setIsFilterOpen(false);
  };

  const handleFilterReset = () => {
    onFilter?.({ sex: [], ageRanges: [], sortBy: null });
    setIsFilterOpen(false);
  };

  return (
    <>
      <header className="flex items-center justify-between mb-10">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900 mb-1">
            Painel Clínico
          </h1>
          <p className="text-slate-400 font-light">
            Gestão inteligente de fluxo e indicadores de saúde.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative" ref={filterButtonRef}>
            <button
              type="button"
              onClick={() => setIsFilterOpen(s => !s)}
              aria-label="Filtrar pacientes"
              title="Filtrar"
              className={`p-2.5 rounded-xl transition-all duration-200 active:scale-95 border ${
                activeFiltersCount > 0
                  ? 'text-[var(--medical-navy)] bg-slate-50 border-slate-200'
                  : 'text-slate-400 hover:text-slate-700 hover:bg-slate-50 border-transparent'
              }`}
            >
              <span className="material-icon text-[20px] cursor-pointer">tune</span>
            </button>
            {activeFiltersCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-[var(--medical-navy)] text-white text-[9px] font-bold rounded-full flex items-center justify-center px-1">
                {activeFiltersCount}
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={onNewPatient}
            className="bg-[var(--medical-navy)] text-white px-6 py-2.5 rounded-xl text-sm font-medium flex items-center gap-2 hover:bg-slate-800 transition-colors"
          >
            <span className="material-icon text-lg">add</span>
            Novo Paciente
          </button>
        </div>
      </header>

      {isFilterOpen && (
        <div
          ref={dropdownRef}
          className="fixed z-[200]"
          style={{ top: dropdownPosition.top, right: dropdownPosition.right }}
        >
          <PatientsFilterDropdown
            isOpen={isFilterOpen}
            onClose={() => setIsFilterOpen(false)}
            onApply={handleFilterApply}
            onReset={handleFilterReset}
            currentFilters={currentFilters}
          />
        </div>
      )}
    </>
  );
}
