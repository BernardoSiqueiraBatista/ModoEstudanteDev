import { useState } from 'react';
import AgendaHeader from '../../components/agenda/AgendaHeader';
import AgendaContent from './AgendaDayView';
import AgendaWeekContent from './AgendaWeekView';
import NewAppointmentModal from '../../components/agenda/NewAppointmentModal';
import OpenConsultationModal from '../../components/agenda/OpenConsultationModal';
import type { FilterOptions } from '../../components/agenda/AgendaFilterDropdown';
import type { Apontamento } from '../../data/WeekCalendarData';
import { usePatients } from '../../hooks/usePatients';
import { useCreateAppointment } from '../../hooks/useAppointments';
import { useAuth } from '../../auth/AuthProvider';
import { useToast } from '../../components/ui/ToastProvider';

function combineDateTime(date: string, time: string): string {
  // Backend espera ISO com offset. Usamos local timezone do navegador.
  const local = new Date(`${date}T${time}:00`);
  const offsetMin = -local.getTimezoneOffset();
  const sign = offsetMin >= 0 ? '+' : '-';
  const pad = (n: number) => String(Math.floor(Math.abs(n))).padStart(2, '0');
  const hh = pad(offsetMin / 60);
  const mm = pad(offsetMin % 60);
  return `${date}T${time}:00${sign}${hh}:${mm}`;
}

export default function AgendaView() {
  const { user } = useAuth();
  const toast = useToast();
  const [selectedView, setSelectedView] = useState<'dia' | 'semana'>('dia');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeFilters, setActiveFilters] = useState<FilterOptions>({ types: [] });
  const [openConsultaApontamento, setOpenConsultaApontamento] = useState<Apontamento | null>(null);

  const { data: patientsData } = usePatients({ limit: 100, page: 1, tab: 'all' });
  const createAppointment = useCreateAppointment();

  const activeFiltersCount = activeFilters.types.length;

  const handleViewChange = (view: 'dia' | 'semana') => {
    setSelectedView(view);
  };

  const handleSaveAppointment = async (appointmentData: {
    patientId: string;
    date: string;
    startTime: string;
    endTime: string;
    type: 'consulta' | 'urgencia' | 'video' | 'compromisso';
    description?: string;
  }) => {
    if (!user?.id) {
      toast.error('Sessão expirada', 'Usuário não autenticado.');
      return;
    }
    try {
      await createAppointment.mutateAsync({
        patientId: appointmentData.patientId,
        doctorUserId: user.id,
        startAt: combineDateTime(appointmentData.date, appointmentData.startTime),
        endAt: combineDateTime(appointmentData.date, appointmentData.endTime),
        type: appointmentData.type,
        description: appointmentData.description ?? null,
        source: 'manual',
      });
      setIsModalOpen(false);
      toast.success('Consulta agendada', 'O apontamento foi criado com sucesso.');
    } catch (e) {
      toast.error(
        'Erro ao criar consulta',
        e instanceof Error ? e.message : 'Tente novamente em instantes.',
      );
    }
  };

  const handleFilterChange = (filters: FilterOptions) => {
    setActiveFilters(filters);
  };

  const handleSearch = (_query: string) => {
    // TODO: integrar busca à listagem da semana/dia
  };

  const handleOpenConsulta = (apontamento: Apontamento) => {
    setOpenConsultaApontamento(apontamento);
  };

  return (
    <div className="flex flex-col h-full">
      <AgendaHeader
        selectedView={selectedView}
        onViewChange={handleViewChange}
        onNewAppointment={() => setIsModalOpen(true)}
        onSearch={handleSearch}
        onFilter={handleFilterChange}
        activeFiltersCount={activeFiltersCount}
        currentFilters={activeFilters}
      />

      {selectedView === 'dia' ? (
        <AgendaContent
          onOpenConsulta={handleOpenConsulta}
          activeFilters={activeFilters}
        />
      ) : (
        <AgendaWeekContent
          onOpenConsulta={handleOpenConsulta}
          activeFilters={activeFilters}
        />
      )}

      <NewAppointmentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveAppointment}
        patients={patientsData?.data ?? []}
      />

      <OpenConsultationModal
        isOpen={openConsultaApontamento !== null}
        apontamento={openConsultaApontamento}
        onClose={() => setOpenConsultaApontamento(null)}
      />
    </div>
  );
}
