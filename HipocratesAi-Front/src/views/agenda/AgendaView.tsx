import React, { useState } from 'react';
import AgendaHeader from '../../components/agenda/AgendaHeader';
import AgendaContent from './AgendaDayView';
import AgendaWeekContent from './AgendaWeekView';
import NewAppointmentModal from '../../components/agenda/NewAppointmentModal';
import type { FilterOptions } from '../../components/agenda/AgendaFilterDropdown';
import { patients } from '../../data/PatientsData';

export default function AgendaView() {
  const [selectedView, setSelectedView] = useState<'dia' | 'semana'>('dia');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeFilters, setActiveFilters] = useState<FilterOptions>({ types: [] });
  const [searchQuery, setSearchQuery] = useState('');

  const activeFiltersCount = activeFilters.types.length;

  const handleViewChange = (view: 'dia' | 'semana') => {
    setSelectedView(view);
  };

  const handleNewAppointment = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleSaveAppointment = (appointmentData: any) => {
    console.log('Nova consulta:', appointmentData);
    setIsModalOpen(false);
  };

  // Handler do filtro
  const handleFilterChange = (filters: FilterOptions) => {
    console.log('🎯 Filtros aplicados:', filters);
    setActiveFilters(filters);
    // TODO: Integrar com back-end quando disponível
  };

  const handleSearch = (query: string) => {
    console.log('🔍 Busca:', query);
    setSearchQuery(query);
    // TODO: Integrar com back-end quando disponível
  };

  return (
    <div className="flex flex-col h-full">
      <AgendaHeader
        selectedView={selectedView}
        onViewChange={handleViewChange}
        onNewAppointment={handleNewAppointment}
        onSearch={handleSearch}
        onFilter={handleFilterChange}
        activeFiltersCount={activeFiltersCount}
        currentFilters={activeFilters}
      />

      {selectedView === 'dia' ? (
        <AgendaContent />
      ) : (
        <AgendaWeekContent />
      )}

      <NewAppointmentModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSave={handleSaveAppointment}
        patients={patients}
      />
    </div>
  );
}