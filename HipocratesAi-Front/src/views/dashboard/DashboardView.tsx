import DashboardHeader from '../../components/dashboard/DashboardHeader';
import StatCard from '../../components/dashboard/cards/StatCard';
import AgendaTimeline from '../../components/dashboard/AgendaTimeline';
import InsightCard from '../../components/dashboard/cards/InsightCard';
import InfoCard from '../../components/dashboard/cards/InfoCard';
import AIStatusCard from '../../components/dashboard/cards/AIStatusCard';
import { computedWeekEvents } from '../../data/WeekCalendarData';
import {patients} from '../../data/PatientsData';
import { dateToDayIndex } from '../../data/Dates'; // ÚNICA MUDANÇA: importar utilidade
import type { Apontamento } from '../../data/WeekCalendarData';
import { useNavigate } from 'react-router-dom';

// Função para calcular métricas do dashboard
const calculateMetrics = (apontamentos: Apontamento[]) => {
  // MUDANÇA: usar dateToDayIndex em vez da função manual
  const todayIndex = dateToDayIndex(new Date());
  const todayApontamentos = apontamentos.filter(apt => apt.dayIndex === todayIndex);
  
  // Contar consultas de hoje (todos os tipos, exceto compromisso)
  const consultasHoje = todayApontamentos.filter(
    apt => apt.type === 'consulta' || apt.type === 'urgencia' || apt.type === 'video'
  ).length;

  // Contar pacientes ativos (status 'ativo')
  const pacientesAtivos = patients.filter(p => p.status === 'ativo').length;

  // Contar follow-ups pendentes (status 'followup')
  const followupsPendentes = patients.filter(p => p.status === 'followup').length;

  return {
    consultasHoje,
    pacientesAtivos,
    followupsPendentes,
    todayApontamentos,
  };
};

export default function Dashboard() {
  const navigate = useNavigate();
  const metrics = calculateMetrics(computedWeekEvents);

  return (
    <div className="flex h-screen w-full bg-background-light">
      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-y-auto">
        {/* Header */}
        <DashboardHeader notificationCount={1} />

        {/* Content Grid */}
        <div className="p-8 max-w-7xl mx-auto w-full grid grid-cols-12 gap-6">
          {/* Stats Section */}
          <div className="col-span-12 grid grid-cols-3 gap-6">
            <StatCard
              icon="medical_information"
              iconBgColor="bg-blue-50"
              iconTextColor="text-blue-600"
              label="Consultas hoje"
              value={metrics.consultasHoje.toString()}
              badge={{ text: '+12%', type: 'success' }}
            />
            <StatCard
              icon="groups"
              iconBgColor="bg-indigo-50"
              iconTextColor="text-indigo-600"
              label="Pacientes ativos"
              value={metrics.pacientesAtivos.toString()}
              badge={{ text: 'Estável', type: 'neutral' }}
            />
            <StatCard
              icon="pending_actions"
              iconBgColor="bg-orange-50"
              iconTextColor="text-orange-600"
              label="Follow-ups pendentes"
              value={metrics.followupsPendentes.toString()}
              badge={{ text: '8 pendentes', type: 'danger' }}
            />
          </div>

          {/* Timeline Section */}
          <div className="col-span-8">
            <AgendaTimeline
              apontamentos={metrics.todayApontamentos}
              selectedDayIndex={dateToDayIndex(new Date())} // MUDANÇA: usar utilidade
              onViewComplete={() => navigate('/agenda/dia')}
              onViewPatient={(patient) => {
                console.log('Ver paciente:', patient);
                // Navegar para página do paciente
                // navigate(`/pacientes/${patient.id}`);
              }}
            />
          </div>

          {/* Insights Section */}
          <div className="col-span-4 flex flex-col gap-6">
            <InsightCard
              description="Sua taxa de conversão de exames aumentou 15% esta semana. O sistema AI detectou uma tendência de melhora nos pacientes diabéticos em acompanhamento."
              onViewMore={() => console.log('Ver mais insights')}
            />

            {/* Small Info Cards */}
            <div className="grid grid-cols-1 gap-4">
              <InfoCard
                icon="medication"
                iconBgColor="bg-green-50"
                iconTextColor="text-green-600"
                label="Novas Prescrições"
                value="142"
              />
              <InfoCard
                icon="lab_panel"
                iconBgColor="bg-purple-50"
                iconTextColor="text-purple-600"
                label="Resultados Pendentes"
                value="31"
              />
            </div>

            {/* AI Status */}
            <AIStatusCard />
          </div>
        </div>
      </main>
    </div>
  );
}
