import React, { useState, useMemo } from 'react';
import PatientsHeader from '../../components/patients/patientList/PatientsHeader';
import PatientsTable from '../../components/patients/patientList/PatientsTable';
import StatsFooter from '../../components/patients/patientList/PatientsFooter';
import NewPatientModal from '../../components/patients/patientList/NewPatientModal';
import { patients as initialPatients } from '../../data/PatientsData';
import { statsData } from '../../data/PatientsStats';
import type { Patient } from '../../types/PatientTypes';

const ITEMS_PER_PAGE = 4;

export default function PatientsContent() {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [patientsList, setPatientsList] = useState(initialPatients);

  // Filtrar pacientes baseado na busca
  const filteredPatients = useMemo(() => {
    if (!searchQuery.trim()) return patientsList;
    
    const query = searchQuery.toLowerCase();
    return patientsList.filter(patient => 
      patient.name.toLowerCase().includes(query) ||
      patient.recordNumber.toLowerCase().includes(query)
    );
  }, [patientsList, searchQuery]);

  // Calcular total de páginas
  const totalPages = useMemo(() => {
    return Math.ceil(filteredPatients.length / ITEMS_PER_PAGE);
  }, [filteredPatients]);

  // Paginar os pacientes
  const paginatedPatients = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return filteredPatients.slice(startIndex, endIndex);
  }, [filteredPatients, currentPage]);

  // Resetar para primeira página quando a busca mudar
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1);
  };

  const handlePatientClick = (patient: Patient) => {
    console.log('Ver detalhes do paciente:', patient);
    // Navegar para página de detalhes
    // navigate(`/pacientes/${patient.id}`);
  };

  const handleEditPatient = (patient: Patient) => {
    console.log('✏️ Editar paciente:', patient);
    // TODO: Abrir modal de edição com os dados do paciente
    // setIsEditModalOpen(true);
    // setSelectedPatient(patient);
  };

  const handleDeletePatient = (patient: Patient) => {
    console.log('🗑️ Deletar paciente:', patient);
    // TODO: Confirmar exclusão e deletar
    // if (confirm(`Tem certeza que deseja deletar o paciente ${patient.name}?`)) {
    //   setPatientsList(prev => prev.filter(p => p.id !== patient.id));
    // }
  };

  const handleNewPatient = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleSavePatient = (patientData: any) => {
    const newId = (patientsList.length + 1).toString();
    
    const initials = patientData.name
      .split(' ')
      .map((n: string) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();

    const year = new Date().getFullYear();
    const recordNumber = `P-${year}-${String(patientsList.length + 1).padStart(4, '0')}`;

    const newPatient: Patient = {
      id: newId,
      name: patientData.name,
      initials,
      gender: patientData.gender,
      age: patientData.age,
      recordNumber,
      lastConsultation: {
        date: new Date().toLocaleDateString('pt-BR'),
        doctor: 'Dr. Hipócrates',
      },
      status: 'ativo',
      mainDiagnosis: patientData.mainDiagnosis,
      observations: patientData.observations,
    };

    setPatientsList(prev => [newPatient, ...prev]);
    setCurrentPage(1);
    
    console.log('✅ NOVO PACIENTE CADASTRADO:', newPatient);
    setIsModalOpen(false);
  };

  return (
    <main className="flex-1 px-16 pt-12 pb-24">
      <PatientsHeader
        onSearch={handleSearch}
        onNewPatient={handleNewPatient}
      />

      <PatientsTable
        patients={paginatedPatients}
        currentPage={currentPage}
        totalPages={totalPages}
        totalPatients={filteredPatients.length}
        onPageChange={setCurrentPage}
        onPatientClick={handlePatientClick}
        onEditPatient={handleEditPatient}
        onDeletePatient={handleDeletePatient}
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