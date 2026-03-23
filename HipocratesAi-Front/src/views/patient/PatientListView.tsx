import React, { useState } from 'react';
import PatientsHeader from '../../components/patients/PatientsHeader';
import PatientsTable from '../../components/patients/PatientsTable';
import StatsFooter from '../../components/patients/PatientsFooter';
import NewPatientModal from '../../components/patients/NewPatientModal';
import { patients as initialPatients } from '../../data/PatientsData';
import { statsData } from '../../data/PatientsStats';
import type { Patient } from '../../types/PatientTypes';

export default function PatientsContent() {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [patientsList, setPatientsList] = useState(initialPatients);

  const handlePatientClick = (patient: Patient) => {
    console.log('Ver detalhes do paciente:', patient);
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    console.log('Buscar:', query);
  };

  const handleNewPatient = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleSavePatient = (patientData: Omit<Patient, 'id' | 'initials' | 'recordNumber' | 'lastConsultation'>) => {
    // Gerar ID único
    const newId = (patientsList.length + 1).toString();
    
    // Gerar iniciais
    const initials = patientData.name
      .split(' ')
      .map(n => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();

    // Gerar número de prontuário
    const year = new Date().getFullYear();
    const recordNumber = `#HP-${year}-${String(patientsList.length + 1).padStart(4, '0')}`;

    // Criar novo paciente com os campos opcionais
    const newPatient: Patient = {
      id: newId,
      name: patientData.name,
      initials,
      gender: patientData.gender,
      age: patientData.age,
      recordNumber,
      lastConsultation: {
        date: 'Nunca',
        doctor: 'Não realizada',
      },
      status: 'ativo',
      mainDiagnosis: patientData.mainDiagnosis,
      observations: patientData.observations,
    };

    // Adicionar à lista
    //setPatientsList(prev => [newPatient, ...prev]);
    
    console.log('✅ NOVO PACIENTE CADASTRADO:', newPatient);
  };

  const itemsPerPage = 10;
  const totalPages = Math.ceil(patientsList.length / itemsPerPage);

  return (
    <main className="flex-1 px-16 pt-12 pb-24">
      <PatientsHeader
        onSearch={handleSearch}
        onNewPatient={handleNewPatient}
      />

      <PatientsTable
        patients={patientsList}
        currentPage={currentPage}
        totalPages={totalPages}
        totalPatients={patientsList.length}
        onPageChange={setCurrentPage}
        onPatientClick={handlePatientClick}
      />

      <StatsFooter stats={statsData} />

      <NewPatientModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSave={handleSavePatient}
      />
    </main>
  );
}