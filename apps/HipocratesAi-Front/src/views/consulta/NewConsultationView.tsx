import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import NewConsultationHeader from '../../components/consulta/newConsulta/NewConsultationHeader';
import PatientSearchInput from '../../components/consulta/newConsulta/PatientSearchInput';
import PatientInfoCard from '../../components/consulta/newConsulta/PatientInfoCard';
import ClinicalContext from '../../components/consulta/newConsulta/ClinicalContext';
import StartConsultationButton from '../../components/consulta/newConsulta/StartConsultationButton';
import SecurityFooter from '../../components/consulta/newConsulta/SecurityFooter';
import { usePatients } from '../../hooks/usePatients';
import { useCreateConsultation } from '../../hooks/useConsultations';
import type { PatientApiItem } from '@hipo/contracts';
import { useToast } from '../../components/ui/ToastProvider';

function useDebounced<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(t);
  }, [value, delayMs]);
  return debounced;
}

export default function NewConsultationView() {
  const navigate = useNavigate();
  const toast = useToast();
  const [searchValue, setSearchValue] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<PatientApiItem | null>(null);
  const [showResults, setShowResults] = useState(false);

  const debouncedSearch = useDebounced(searchValue.trim(), 250);
  const { data: results } = usePatients({
    search: debouncedSearch || undefined,
    limit: 10,
    page: 1,
    tab: 'all',
  });
  const createConsultation = useCreateConsultation();

  useEffect(() => {
    setShowResults(Boolean(debouncedSearch && !selectedPatient));
  }, [debouncedSearch, selectedPatient]);

  const handleSearchChange = (value: string) => {
    setSearchValue(value);
    if (selectedPatient) setSelectedPatient(null);
  };

  const handleSelectPatient = (patient: PatientApiItem) => {
    setSelectedPatient(patient);
    setSearchValue(patient.name);
    setShowResults(false);
  };

  const handlePatientClick = () => {
    if (selectedPatient) navigate(`/pacientes/${selectedPatient.id}`);
  };

  const handleViewHistory = () => {
    if (selectedPatient) navigate(`/pacientes/${selectedPatient.id}`);
  };

  const handleStartConsultation = async () => {
    if (!selectedPatient) {
      toast.warning(
        'Paciente não selecionado',
        'Selecione um paciente antes de iniciar a consulta.',
      );
      return;
    }
    try {
      const res = await createConsultation.mutateAsync({ patientId: selectedPatient.id });
      navigate(`/consulta/ativa/${res.consultation.id}`);
    } catch (e) {
      toast.error(
        'Erro ao iniciar consulta',
        e instanceof Error ? e.message : 'Tente novamente em instantes.',
      );
    }
  };

  const clinicalContext = selectedPatient
    ? {
        mainComplaint:
          selectedPatient.mainDiagnosis ?? 'Sem queixa principal registrada.',
        recentAttachments: [] as Array<{ name: string; icon: string }>,
      }
    : { mainComplaint: '', recentAttachments: [] };

  return (
    <main className="flex-1 flex flex-col items-center justify-start relative px-6 py-6 bg-white h-full overflow-y-auto">
      <NewConsultationHeader />

      <div className="w-full max-w-2xl bg-white/80 backdrop-blur-sm border border-gray-100 rounded-2xl p-6 flex flex-col gap-5 shadow-sm mb-6">
        <div className="space-y-4">
          <PatientSearchInput
            value={searchValue}
            onChange={handleSearchChange}
            searchResults={results?.data ?? []}
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
                lastAccess={selectedPatient.lastConsultation?.date ?? '—'}
                status={
                  selectedPatient.status === 'ativo'
                    ? 'Prontuário Ativo'
                    : selectedPatient.status === 'followup'
                      ? 'Em Acompanhamento'
                      : 'Pendente'
                }
                mainDiagnosis={selectedPatient.mainDiagnosis ?? undefined}
              />
            </div>
          )}
        </div>

        {selectedPatient && (
          <>
            <ClinicalContext
              mainComplaint={clinicalContext.mainComplaint}
              recentAttachments={clinicalContext.recentAttachments}
              onViewHistory={handleViewHistory}
            />

            <StartConsultationButton
              onClick={handleStartConsultation}
              isLoading={createConsultation.isPending}
            />
          </>
        )}
      </div>

      <SecurityFooter />
    </main>
  );
}
