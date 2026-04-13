import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import NewConsultationHeader from '../../components/consulta/newConsulta/NewConsultationHeader';
import PatientSearchInput from '../../components/consulta/newConsulta/PatientSearchInput';
import PatientInfoCard from '../../components/consulta/newConsulta/PatientInfoCard';
import ClinicalContext from '../../components/consulta/newConsulta/ClinicalContext';
import StartConsultationButton from '../../components/consulta/newConsulta/StartConsultationButton';
import SecurityFooter from '../../components/consulta/newConsulta/SecurityFooter';
import { patients } from '../../data/PatientsData';
import type { Patient } from '../../types/PatientTypes';

export default function NewConsultationView() {
  const navigate = useNavigate();
  const [searchValue, setSearchValue] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [searchResults, setSearchResults] = useState<Patient[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Buscar pacientes baseado no termo de busca
  useEffect(() => {
    if (searchValue.trim().length === 0) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }

    const query = searchValue.toLowerCase();
    const results = patients.filter(
      patient =>
        patient.name.toLowerCase().includes(query) ||
        patient.recordNumber.toLowerCase().includes(query)
    );

    setSearchResults(results);
    setShowResults(results.length > 0);
  }, [searchValue]);

  const handleSearchChange = (value: string) => {
    setSearchValue(value);
    if (selectedPatient) {
      setSelectedPatient(null);
    }
  };

  const handleSelectPatient = (patient: Patient) => {
    setSelectedPatient(patient);
    setSearchValue(patient.name);
    setShowResults(false);
  };

  const handlePatientClick = () => {
    if (selectedPatient) {
      navigate(`/pacientes/${selectedPatient.id}`);
    }
  };

  const handleViewHistory = () => {
    if (selectedPatient) {
      navigate(`/pacientes/${selectedPatient.id}`);
    }
  };

  const handleStartConsultation = () => {
    if (!selectedPatient) {
      alert('Selecione um paciente antes de iniciar a consulta.');
      return;
    }

    setIsLoading(true);

    // Simular carregamento e navegar para consulta ativa
    setTimeout(() => {
      setIsLoading(false);
      navigate(`/consulta/ativa/${selectedPatient.id}`);
    }, 1500);
  };

  const getClinicalDataForPatient = () => {
    if (!selectedPatient) {
      return { mainComplaint: '', recentAttachments: [] };
    }

    const patientClinicalData: Record<string, any> = {
      '1': {
        mainComplaint:
          'Hipertensão - Acompanhamento de rotina. Paciente relata episódios de cefaleia occipital.',
        recentAttachments: [{ name: 'Exame_Hipertensao.pdf', icon: 'description' }],
      },
      '2': {
        mainComplaint:
          'Diabetes tipo 2 - Controle glicêmico. Paciente nega sintomas de hipoglicemia.',
        recentAttachments: [{ name: 'Glicemia_Jan2024.pdf', icon: 'description' }],
      },
    };

    return (
      patientClinicalData[selectedPatient.id] || {
        mainComplaint: `${selectedPatient.mainDiagnosis || 'Consulta geral'} - Paciente em acompanhamento.`,
        recentAttachments: [],
      }
    );
  };

  const patientClinicalData = getClinicalDataForPatient();

  return (
    <main className="flex-1 flex flex-col items-center justify-start relative px-6 py-6 bg-white h-full overflow-y-auto">
      <NewConsultationHeader />

      <div className="w-full max-w-2xl bg-white/80 backdrop-blur-sm border border-gray-100 rounded-2xl p-6 flex flex-col gap-5 shadow-sm mb-6">
        <div className="space-y-4">
          <PatientSearchInput
            value={searchValue}
            onChange={handleSearchChange}
            searchResults={searchResults}
            onSelectPatient={handleSelectPatient}
            showResults={showResults}
          />

          {selectedPatient && (
            <div
              onClick={handlePatientClick}
              className="cursor-pointer transition-opacity hover:opacity-80"
            >
              <PatientInfoCard
                name={selectedPatient.name}
                initials={selectedPatient.initials}
                gender={selectedPatient.gender}
                age={selectedPatient.age}
                recordNumber={selectedPatient.recordNumber}
                lastAccess={selectedPatient.lastConsultation.date}
                status={
                  selectedPatient.status === 'ativo'
                    ? 'Prontuário Ativo'
                    : selectedPatient.status === 'followup'
                      ? 'Em Acompanhamento'
                      : 'Pendente'
                }
                mainDiagnosis={selectedPatient.mainDiagnosis}
              />
            </div>
          )}
        </div>

        {selectedPatient && (
          <>
            <ClinicalContext
              mainComplaint={patientClinicalData.mainComplaint}
              recentAttachments={patientClinicalData.recentAttachments}
              onViewHistory={handleViewHistory}
            />

            <StartConsultationButton onClick={handleStartConsultation} isLoading={isLoading} />
          </>
        )}
      </div>

      <SecurityFooter />
    </main>
  );
}
