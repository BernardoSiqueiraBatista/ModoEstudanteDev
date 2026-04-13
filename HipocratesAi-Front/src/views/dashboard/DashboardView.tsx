import React, { useMemo } from 'react';
import DashboardHeader from '../../components/dashboard/DashboardHeader';
import StatCard from '../../components/dashboard/cards/StatCard';
import AgendaTimeline from '../../components/dashboard/AgendaTimeline';
import InsightCard from '../../components/dashboard/cards/InsightCard';
import InfoCard from '../../components/dashboard/cards/InfoCard';
import AIStatusCard from '../../components/dashboard/cards/AIStatusCard';
import { computedWeekEvents, getEventsByDay } from '../../data/WeekCalendarData';
import { patients } from '../../data/PatientsData';
import { dateToDayIndex } from '../../data/Dates';
import { useNavigate } from 'react-router-dom';

export default function DashboardView() {
  const navigate = useNavigate();

  const todayIndex = dateToDayIndex(new Date());

  const todayApontamentos = useMemo(() => {
    return getEventsByDay(computedWeekEvents, todayIndex);
  }, [todayIndex]);

  const stats = useMemo(() => {
    const consultasHoje = todayApontamentos.length;
    const pacientesAtivos = patients.filter(p => p.status === 'ativo').length;
    const pendentes = patients.filter(p => p.status === 'followup').length;
    const variacaoHoje = consultasHoje > 0 ? `${consultasHoje} hoje` : 'Nenhuma hoje';

    return {
      consultasHoje,
      pacientesAtivos,
      pendentes,
      variacaoHoje,
    };
  }, [todayApontamentos]);

  const timelineItems = useMemo(() => {
    const sortedApontamentos = [...todayApontamentos].sort((a, b) =>
      a.startTime.localeCompare(b.startTime)
    );

    return sortedApontamentos.map(apt => {
      let status: 'confirmed' | 'waiting' = 'confirmed';

      if (apt.type === 'urgencia') {
        status = 'waiting';
      }

      const getSpecialty = (description?: string) => {
        if (!description) return 'Consulta Geral';
        const parts = description.split('-');
        return parts.length > 1 ? parts[1].trim() : 'Consulta Geral';
      };

      const getDescription = () => {
        const specialty = getSpecialty(apt.description);
        const typeLabel =
          apt.type === 'consulta'
            ? 'Consulta'
            : apt.type === 'urgencia'
              ? 'Urgência'
              : apt.type === 'video'
                ? 'Vídeo'
                : 'Compromisso';
        return `${specialty} • ${typeLabel}`;
      };

      return {
        id: apt.patient.id,
        time: apt.startTime,
        patientName: apt.patient.name,
        description: getDescription(),
        status,
      };
    });
  }, [todayApontamentos]);

  const statsCards = [
    {
      label: 'Consultas Agendadas',
      value: stats.consultasHoje,
      badge: stats.variacaoHoje,
      badgeColor: stats.consultasHoje > 0 ? 'text-emerald-500' : 'text-slate-400',
      dotColor: 'bg-emerald-500 shadow-[0_0_8px_rgba(0,209,255,0.5)]',
    },
    {
      label: 'Pacientes Ativos',
      value: stats.pacientesAtivos,
      badge: 'Total',
      badgeColor: 'text-slate-400',
      dotColor: 'bg-slate-300',
    },
    {
      label: 'Pendências',
      value: stats.pendentes,
      badge: `${stats.pendentes} Follow-up${stats.pendentes !== 1 ? 's' : ''}`,
      badgeColor: 'text-red-500',
      dotColor: 'bg-red-400 shadow-[0_0_8px_rgba(248,113,113,0.5)]',
    },
  ];

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <DashboardHeader onSearch={query => console.log('Buscar:', query)} notificationCount={3} />

      <div className="flex-1 flex flex-col overflow-hidden px-8 pb-6">
        <div className="space-y-5 flex-1 flex flex-col overflow-hidden">
          {/* Stats Cards */}
          <div className="grid grid-cols-3 gap-5 flex-shrink-0">
            <StatCard
              icon="medical_information"
              iconBgColor="bg-blue-50"
              iconTextColor="text-blue-600"
              label="Consultas Agendadas"
              value={stats.consultasHoje}
              badge={{ text: stats.variacaoHoje, type: 'success' }}
            />
            <StatCard
              icon="groups"
              iconBgColor="bg-indigo-50"
              iconTextColor="text-indigo-600"
              label="Pacientes Ativos"
              value={stats.pacientesAtivos}
              badge={{ text: 'Total', type: 'neutral' }}
            />
            <StatCard
              icon="pending_actions"
              iconBgColor="bg-orange-50"
              iconTextColor="text-orange-600"
              label="Pendências"
              value={stats.pendentes}
              badge={{ text: `${stats.pendentes} Follow-up`, type: 'danger' }}
            />
          </div>

          {/* Main Grid */}
          <div className="grid grid-cols-12 gap-5 flex-1 min-h-0">
            {/* Timeline Section - 8 colunas */}
            <div className="col-span-8 flex flex-col min-h-0">
              <div className="bg-white/90 dark:bg-glass-obsidian/70 backdrop-blur-xl rounded-2xl border border-gray-200 dark:border-white/10 shadow-sm flex flex-col h-full overflow-hidden">
                <div className="flex justify-between items-center p-5 pb-2 flex-shrink-0 border-b border-gray-100 dark:border-white/5">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
                      Agenda de Hoje
                    </h2>
                    <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">
                      {new Date()
                        .toLocaleDateString('pt-BR', {
                          day: 'numeric',
                          month: 'long',
                          weekday: 'long',
                        })
                        .replace(/^./, str => str.toUpperCase())}
                    </p>
                  </div>
                  <button
                    onClick={() => navigate('/agenda')}
                    className="px-4 py-1.5 text-[10px] font-bold text-gray-600 dark:text-slate-300 border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 rounded-lg shadow-sm hover:shadow-md transition-all uppercase tracking-widest hover:bg-gray-50 dark:hover:bg-white/10"
                  >
                    Calendário Semanal
                  </button>
                </div>

                {/* Timeline com rolagem própria */}
                <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                  <AgendaTimeline
                    items={timelineItems}
                    onItemClick={index => {
                      const apontamento = todayApontamentos[index];
                      if (apontamento) {
                        console.log('Item clicado:', apontamento);
                        navigate(`/pacientes/${apontamento.patient.id}`);
                      }
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Right Section - 4 colunas */}
            <div className="col-span-4 flex flex-col gap-4 min-h-0 overflow-y-auto custom-scrollbar">
              <InsightCard
                description="A análise via AI Hipócrates detectou uma melhora de 15% na adesão terapêutica do grupo cardiovascular neste trimestre."
                onViewMore={() => console.log('Ver mais insights')}
              />

              <div className="grid grid-cols-2 gap-4">
                <InfoCard
                  icon="medication"
                  label="Prescrições"
                  value="142"
                  onClick={() => console.log('Ver prescrições')}
                />
                <InfoCard
                  icon="lab_research"
                  label="Exames"
                  value="31"
                  onClick={() => console.log('Ver exames')}
                />
              </div>

              <AIStatusCard />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
