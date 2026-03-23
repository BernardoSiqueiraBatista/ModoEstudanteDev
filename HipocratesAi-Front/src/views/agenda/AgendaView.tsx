// AgendaView.tsx
import React, { useState } from 'react';
import AgendaHeader from '../../components/agenda/AgendaHeader';
import AgendaContent from './AgendaDayView';
import AgendaWeekContent from './AgendaWeekView';
import NewAppointmentModal from '../../components/agenda/NewAppointmentModal';
import { patients } from '../../data/PatientsData';

export default function AgendaView() {
  const [selectedView, setSelectedView] = useState<'dia' | 'semana'>('dia');
  const [isModalOpen, setIsModalOpen] = useState(false);

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
    // Lógica para salvar
    setIsModalOpen(false);
  };

  return (
    <div className="flex flex-col h-full">
      <AgendaHeader
        selectedView={selectedView}
        onViewChange={handleViewChange}
        onNewAppointment={handleNewAppointment}
        onSearch={() => console.log('Buscar')}
        onFilter={() => console.log('Filtrar')}
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