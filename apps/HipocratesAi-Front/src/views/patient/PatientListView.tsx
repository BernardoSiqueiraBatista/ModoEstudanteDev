import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PatientsHeader from '../../components/patients/patientList/PatientsHeader';
import PatientsKpiRow from '../../components/patients/patientList/PatientsKpiRow';
import PatientsAnalytics from '../../components/patients/patientList/PatientsAnalytics';
import PatientsTable from '../../components/patients/patientList/PatientsTable';
import PatientsInsightsFooter from '../../components/patients/patientList/PatientsInsightsFooter';
import NewPatientModal from '../../components/patients/patientList/NewPatientModal';
import EditPatientModal from '../../components/patients/patientList/EditPatientModal';
import {
  EMPTY_PATIENTS_FILTER,
  type PatientsFilterOptions,
} from '../../components/patients/patientList/PatientsFilterDropdown';
import {
  useCreatePatient,
  useDeletePatient,
  usePatients,
  useUpdatePatient,
} from '../../hooks/usePatients';
import type { CreatePatientDto, PatientApiItem, UpdatePatientDto } from '@hipo/contracts';
import { useToast } from '../../components/ui/ToastProvider';
import { useConfirm } from '../../components/ui/ConfirmationProvider';

const PAGE_SIZE = 8;

export default function PatientsContent() {
  const navigate = useNavigate();
  const toast = useToast();
  const confirm = useConfirm();
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPatient, setEditingPatient] = useState<PatientApiItem | null>(null);
  const [activeFilters, setActiveFilters] = useState<PatientsFilterOptions>(
    EMPTY_PATIENTS_FILTER,
  );

  const { data, isLoading, error } = usePatients({
    page: currentPage,
    limit: PAGE_SIZE,
    search: searchQuery.trim() || undefined,
    tab: 'all',
  });

  const createMutation = useCreatePatient();
  const deleteMutation = useDeletePatient();
  const updateMutation = useUpdatePatient(editingPatient?.id ?? '');

  const rawPatients = data?.data ?? [];

  const patients = useMemo<PatientApiItem[]>(() => {
    let list = rawPatients.slice();

    if (activeFilters.sex.length > 0) {
      list = list.filter(p => {
        const sex = (p.sex ?? '').toLowerCase();
        return activeFilters.sex.some(f => sex === f);
      });
    }

    if (activeFilters.ageRanges.length > 0) {
      list = list.filter(p => {
        const age = p.age;
        return activeFilters.ageRanges.some(range => {
          if (range === '0-17') return age <= 17;
          if (range === '18-39') return age >= 18 && age <= 39;
          if (range === '40-59') return age >= 40 && age <= 59;
          return age >= 60;
        });
      });
    }

    if (activeFilters.sortBy) {
      const collator = new Intl.Collator('pt-BR', { sensitivity: 'base' });
      list.sort((a, b) => {
        switch (activeFilters.sortBy) {
          case 'name-asc':
            return collator.compare(a.name, b.name);
          case 'name-desc':
            return collator.compare(b.name, a.name);
          case 'age-asc':
            return a.age - b.age;
          case 'age-desc':
            return b.age - a.age;
          default:
            return 0;
        }
      });
    }

    return list;
  }, [rawPatients, activeFilters]);

  const activeFiltersCount =
    activeFilters.sex.length +
    activeFilters.ageRanges.length +
    (activeFilters.sortBy ? 1 : 0);

  const totalPatients = data?.pagination.total ?? 0;
  const totalPages = data?.pagination.totalPages ?? 0;

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1);
  };

  const handlePatientClick = (patient: PatientApiItem) => {
    navigate(`/pacientes/${patient.id}`);
  };

  const handleEditPatient = (patient: PatientApiItem) => {
    setEditingPatient(patient);
  };

  const handleUpdatePatient = async (payload: UpdatePatientDto) => {
    if (!editingPatient) return;
    await updateMutation.mutateAsync(payload);
  };

  const handleDeletePatient = async (patient: PatientApiItem) => {
    const ok = await confirm({
      tone: 'destructive',
      title: 'Excluir paciente?',
      description: `Esta ação remove permanentemente o prontuário de ${patient.name} e não pode ser desfeita.`,
      confirmLabel: 'Excluir',
      cancelLabel: 'Manter',
    });
    if (!ok) return;
    try {
      await deleteMutation.mutateAsync(patient.id);
      toast.success('Paciente excluído', `${patient.name} foi removido.`);
    } catch (e) {
      toast.error(
        'Erro ao excluir paciente',
        e instanceof Error ? e.message : 'Tente novamente.',
      );
    }
  };

  const handleSavePatient = async (payload: CreatePatientDto) => {
    await createMutation.mutateAsync(payload);
    setCurrentPage(1);
  };

  return (
    <main className="flex-1 px-12 pt-10 pb-20 max-w-[1600px] mx-auto w-full">
      <PatientsHeader
        onSearch={handleSearch}
        onNewPatient={() => setIsModalOpen(true)}
        onFilter={filters => {
          setActiveFilters(filters);
          setCurrentPage(1);
        }}
        activeFiltersCount={activeFiltersCount}
        currentFilters={activeFilters}
      />

      <PatientsKpiRow />

      <PatientsAnalytics />

      {error && (
        <div className="my-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error instanceof Error ? error.message : 'Erro ao carregar pacientes.'}
        </div>
      )}

      {isLoading && patients.length === 0 ? (
        <div className="bg-white border border-slate-100 rounded-2xl p-12 text-center text-slate-500 shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
          Carregando pacientes...
        </div>
      ) : (
        <PatientsTable
          patients={patients}
          currentPage={currentPage}
          totalPages={totalPages}
          totalPatients={totalPatients}
          onPageChange={setCurrentPage}
          onPatientClick={handlePatientClick}
          onEditPatient={handleEditPatient}
          onDeletePatient={handleDeletePatient}
        />
      )}

      <PatientsInsightsFooter />

      <NewPatientModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSavePatient}
      />

      <EditPatientModal
        isOpen={editingPatient !== null}
        onClose={() => setEditingPatient(null)}
        patient={editingPatient}
        onSave={handleUpdatePatient}
      />
    </main>
  );
}
