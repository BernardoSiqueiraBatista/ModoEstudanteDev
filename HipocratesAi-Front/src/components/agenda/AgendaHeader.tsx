import { useState, useEffect, useRef } from 'react';
import AgendaFilterDropdown from './AgendaFilterDropdown';
import type { FilterOptions } from './AgendaFilterDropdown';

interface AgendaHeaderProps {
  onNewConsulta?: () => void;
  onSearch?: (query: string) => void;
  onFilter?: (filters: FilterOptions) => void;
  selectedView?: 'dia' | 'semana';
  onViewChange?: (view: 'dia' | 'semana') => void;
  onNewAppointment?: () => void;
  activeFiltersCount?: number;
  currentFilters?: FilterOptions;
}

export default function AgendaHeader({
  onNewConsulta,
  onSearch,
  onFilter,
  selectedView: externalSelectedView = 'dia',
  onViewChange,
  onNewAppointment,
  activeFiltersCount = 0,
  currentFilters = { types: [] },
}: AgendaHeaderProps) {
  const [selectedView, setSelectedView] = useState<'dia' | 'semana'>(externalSelectedView);
  const [isAnimating, setIsAnimating] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const filterButtonRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, right: 0 });

  useEffect(() => {
    setSelectedView(externalSelectedView);
  }, [externalSelectedView]);

  // Atualiza posição do dropdown quando abre
  useEffect(() => {
    if (isFilterOpen && filterButtonRef.current) {
      const rect = filterButtonRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + 8,
        right: window.innerWidth - rect.right,
      });
    }
  }, [isFilterOpen]);

  // Fechar ao clicar fora
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
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isFilterOpen]);

  const handleViewChange = (view: 'dia' | 'semana') => {
    if (view === selectedView || isAnimating) return;
    
    setIsAnimating(true);
    setSelectedView(view);
    onViewChange?.(view);
    
    setTimeout(() => {
      setIsAnimating(false);
    }, 300);
  };

  const handleNewClick = () => {
    if (onNewAppointment) {
      onNewAppointment();
    } else {
      onNewConsulta?.();
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    onSearch?.(value);
  };

  const handleFilterApply = (filters: FilterOptions) => {
    onFilter?.(filters);
    setIsFilterOpen(false);
  };

  const handleFilterReset = () => {
    onFilter?.({ types: [] });
    setIsFilterOpen(false);
  };

  const toggleFilter = () => {
    setIsFilterOpen(!isFilterOpen);
  };

  return (
    <>
      <header className="flex items-center justify-between px-10 py-6 border-b border-light bg-surface/50 backdrop-blur-md sticky top-0 z-10">
        {/* Left Section - Title */}
        <div>
          <h1 className="text-heading-1 text-title transition-all duration-300">
            Agenda Médica
          </h1>
          <p className="text-caption text-subtitle mt-1">
            Sincronizado com Google Agenda
          </p>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-4">
          {/* Search Input */}
          <div className="glass-search flex items-center px-4 py-2 rounded-xl w-64 transition-all focus-within:w-80">
            <span className="material-icon text-subtitle text-lg mr-2">search</span>
            <input
              type="text"
              value={searchQuery}
              onChange={handleSearchChange}
              className="bg-transparent border-none outline-none focus:outline-none focus:ring-0 p-0 text-body-sm text-title placeholder:text-subtitle w-full"
              placeholder="Buscar consulta, paciente..."
            />
          </div>

          {/* Filter Button com badge */}
          <div className="relative" ref={filterButtonRef}>
            <button
              className={`p-2 rounded-xl transition-all duration-200 active:scale-95 ${
                activeFiltersCount > 0
                  ? 'text-primary bg-primary/10 hover:bg-primary/15'
                  : 'text-subtitle hover:text-primary hover:bg-primary/5'
              }`}
              onClick={toggleFilter}
              aria-label="Filtrar"
              title="Filtrar"
            >
              <span className="material-icon text-[20px] cursor-pointer">tune</span>
            </button>
            {activeFiltersCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-primary text-white text-[9px] font-bold rounded-full flex items-center justify-center px-1">
                {activeFiltersCount}
              </span>
            )}
          </div>

          {/* View Selector */}
          <div className="relative flex bg-slate-100 p-1 rounded-xl min-w-[200px]">
            <div
              className="absolute top-1 bottom-1 w-[calc(50%-0.25rem)] bg-surface shadow-sm rounded-lg transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]"
              style={{
                left: selectedView === 'dia' ? '0.25rem' : 'calc(50% + 0.25rem)',
              }}
            />
            
            <button
              className={`relative flex-1 px-4 py-1.5 text-caption-bold rounded-lg transition-all duration-200 ${
                selectedView === 'dia' 
                  ? 'text-title font-medium' 
                  : 'text-subtitle hover:text-title'
              } ${isAnimating ? 'pointer-events-none' : ''}`}
              onClick={() => handleViewChange('dia')}
              aria-pressed={selectedView === 'dia'}
              disabled={isAnimating}
            >
              <span className="relative z-10">Dia</span>
            </button>
            <button
              className={`relative flex-1 px-4 py-1.5 text-caption-bold rounded-lg transition-all duration-200 ${
                selectedView === 'semana' 
                  ? 'text-title font-medium' 
                  : 'text-subtitle hover:text-title'
              } ${isAnimating ? 'pointer-events-none' : ''}`}
              onClick={() => handleViewChange('semana')}
              aria-pressed={selectedView === 'semana'}
              disabled={isAnimating}
            >
              <span className="relative z-10">Semana</span>
            </button>
          </div>

          {/* New Appointment Button */}
          <button
            className="ml-2 bg-primary text-white px-5 py-2 rounded-xl text-label-sm font-semibold flex items-center gap-2 shadow-lg shadow-primary/20 hover:bg-blue-600 hover:shadow-xl hover:scale-105 active:scale-95 transition-all duration-200"
            onClick={handleNewClick}
          >
            <span className="material-icon text-lg">add</span>
            Nova Consulta
          </button>
        </div>
      </header>

      {/* Dropdown - Fixed position */}
      {isFilterOpen && (
        <div 
          ref={dropdownRef}
          className="fixed z-[200]"
          style={{
            top: dropdownPosition.top,
            right: dropdownPosition.right,
          }}
        >
          <AgendaFilterDropdown
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