import React, { useState } from 'react';
import NewConsultationHeader from '../../components/consulta/newConsulta/NewConsultationHeader';
import PatientSearchInput from '../../components/consulta/newConsulta/PatientSearchInput';
import PatientInfoCard from '../../components/consulta/newConsulta/PatientInfoCard';
import ClinicalContext from '../../components/consulta/newConsulta/ClinicalContext';
import StartConsultationButton from '../../components/consulta/newConsulta/StartConsultationButton';
import SecurityFooter from '../../components/consulta/newConsulta/SecurityFooter';

const mockPatient = {
  id: '1',
  name: 'Ana Beatriz Silveira',
  initials: 'AS',
  gender: 'Feminino',
  age: 29,
  recordNumber: 'P-2024-0891',
  lastConsultation: {
    date: '12 Out 2023',
    doctor: 'Dr. Ricardo',
  },
  status: 'ativo' as const,
};

export default function NewConsultationView() {
  const [searchValue, setSearchValue] = useState('Ana Beatriz Silveira');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(mockPatient);

  const handleSearch = (value: string) => {
    setSearchValue(value);
    console.log('Buscando paciente:', value);
  };

  const handleNewPatient = () => {
    console.log('Criar novo paciente');
  };

  const handleViewHistory = () => {
    console.log('Ver histórico completo');
  };

  const handleStartConsultation = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      console.log('Iniciando consulta para:', selectedPatient.name);
    }, 1500);
  };

  const clinicalData = {
    mainComplaint: 'Enxaqueca recorrente (3 dias) e fotofobia persistente.',
    recentAttachments: [{ name: 'Hemograma_Set23.pdf', icon: 'description' }],
  };

  return (
    <main className="flex-1 flex flex-col items-center justify-center px-6 py-6 bg-elite-white h-full overflow-y-auto">
      <NewConsultationHeader />
      
      {/* Card mais alto e espaçoso */}
      <div className="w-full max-w-2xl bg-white/65 backdrop-blur-3xl border border-white/80 rounded-2xl p-8 flex flex-col gap-6 shadow-xl overflow-visible">
        <div className="space-y-5">
          <PatientSearchInput
            value={searchValue}
            onChange={handleSearch}
            onNewPatient={handleNewPatient}
          />
          
          <PatientInfoCard
            name={selectedPatient.name}
            initials={selectedPatient.initials}
            gender={selectedPatient.gender}
            age={selectedPatient.age}
            recordNumber={selectedPatient.recordNumber}
            lastAccess={selectedPatient.lastConsultation.date}
            status="Prontuário Ativo"
          />
        </div>

        <ClinicalContext
          mainComplaint={clinicalData.mainComplaint}
          recentAttachments={clinicalData.recentAttachments}
          onViewHistory={handleViewHistory}
        />

        <StartConsultationButton
          onClick={handleStartConsultation}
          isLoading={isLoading}
        />
      </div>

      <SecurityFooter />
    </main>
  );
}