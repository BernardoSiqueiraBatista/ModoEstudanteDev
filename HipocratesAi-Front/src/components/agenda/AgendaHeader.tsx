import { useState, useEffect } from 'react';

interface AgendaHeaderProps {
  onNewConsulta?: () => void;
  onSearch?: () => void;
  onFilter?: () => void;
  selectedView?: 'dia' | 'semana';
  onViewChange?: (view: 'dia' | 'semana') => void;
  onNewAppointment?: () => void; // Para abrir modal de agendamento
}

export default function AgendaHeader({
  onNewConsulta,
  onSearch,
  onFilter,
  selectedView: externalSelectedView = 'dia',
  onViewChange,
  onNewAppointment,
}: AgendaHeaderProps) {
  // Estado interno para controlar a animação
  const [selectedView, setSelectedView] = useState<'dia' | 'semana'>(externalSelectedView);
  const [isAnimating, setIsAnimating] = useState(false);

  // Sincroniza com o estado externo
  useEffect(() => {
    setSelectedView(externalSelectedView);
  }, [externalSelectedView]);

  const handleViewChange = (view: 'dia' | 'semana') => {
    if (view === selectedView || isAnimating) return;
    
    setIsAnimating(true);
    setSelectedView(view);
    onViewChange?.(view);
    
    // Remove o estado de animação após a transição
    setTimeout(() => {
      setIsAnimating(false);
    }, 300);
  };

  const handleNewClick = () => {
    // Prioriza o onNewAppointment se existir, senão usa onNewConsulta
    if (onNewAppointment) {
      onNewAppointment();
    } else {
      onNewConsulta?.();
    }
  };

  return (
    <header className="flex items-center justify-between px-10 py-6 border-b border-light bg-surface/50 backdrop-blur-md sticky top-0 z-10">
      {/* Left Section - Title and Sync Status */}
      <div>
        <h1 className="text-heading-1 text-title transition-all duration-300">
          Agenda Médica
        </h1>
        <p className="text-caption text-subtitle mt-1">
          Sincronizado com Google Agenda
        </p>
      </div>

      {/* Right Section - View Selector and Actions */}
      <div className="flex items-center gap-6">
        {/* View Selector with Animated Switch */}
        <div className="relative flex bg-slate-100 p-1 rounded-xl min-w-[200px]">
          {/* Animated Background Slider */}
          <div
            className="absolute top-1 bottom-1 w-[calc(50%-0.25rem)] bg-surface shadow-sm rounded-lg transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]"
            style={{
              left: selectedView === 'dia' ? '0.25rem' : 'calc(50% + 0.25rem)',
            }}
          />
          
          {/* Buttons */}
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

        {/* Search Button */}
        <button
          className="p-2 text-subtitle hover:text-primary hover:bg-primary/5 rounded-xl transition-all duration-200 active:scale-95"
          onClick={onSearch}
          aria-label="Buscar"
          title="Buscar"
        >
          <span className="material-icon text-[20px]">search</span>
        </button>

        {/* Filter Button */}
        <button
          className="p-2 text-subtitle hover:text-primary hover:bg-primary/5 rounded-xl transition-all duration-200 active:scale-95"
          onClick={onFilter}
          aria-label="Filtrar"
          title="Filtrar"
        >
          <span className="material-icon text-[20px]">tune</span>
        </button>

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
  );
}