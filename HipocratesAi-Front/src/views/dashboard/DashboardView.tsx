import React, { useMemo } from 'react';
import DashboardHeader from '../../components/dashboard/DashboardHeader';
import DashboardStats from '../../components/dashboard/DashboardStats';
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

  // Pegar o índice do dia atual
  const todayIndex = dateToDayIndex(new Date());
  
  // Filtrar apontamentos de hoje
  const todayApontamentos = useMemo(() => {
    return getEventsByDay(computedWeekEvents, todayIndex);
  }, [todayIndex]);

  // Calcular métricas para os cards
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

  // Mapear apontamentos para o formato da timeline
  const timelineItems = useMemo(() => {
    const sortedApontamentos = [...todayApontamentos].sort((a, b) => 
      a.startTime.localeCompare(b.startTime)
    );
    
    return sortedApontamentos.map((apt) => {
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
        const typeLabel = apt.type === 'consulta' ? 'Consulta' : 
                         apt.type === 'urgencia' ? 'Urgência' : 
                         apt.type === 'video' ? 'Vídeo' : 'Compromisso';
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
      badgeColor: stats.consultasHoje > 0 ? 'text-emerald-500 dark:text-emerald-400' : 'text-slate-400 dark:text-slate-500',
      dotColor: 'bg-[var(--electric-cyan)] shadow-[0_0_8px_rgba(0,209,255,0.5)]',
    },
    {
      label: 'Pacientes Ativos',
      value: stats.pacientesAtivos,
      badge: 'Total',
      badgeColor: 'text-slate-400 dark:text-slate-500',
      dotColor: 'bg-slate-200 dark:bg-slate-700',
    },
    {
      label: 'Pendências',
      value: stats.pendentes,
      badge: `${stats.pendentes} Follow-up${stats.pendentes !== 1 ? 's' : ''}`,
      badgeColor: stats.pendentes > 0 ? 'text-red-500 dark:text-red-400' : 'text-slate-400 dark:text-slate-500',
      dotColor: 'bg-red-400 shadow-[0_0_8px_rgba(248,113,113,0.5)]',
    },
  ];

  return (
    <div className="flex-1 flex flex-col overflow-y-auto">
      <DashboardHeader
        onSearch={(query) => console.log('Buscar:', query)}
        notificationCount={3}
      />

      <div className="px-8 pb-10 w-full space-y-8">
        <DashboardStats stats={statsCards} />

        <div className="grid grid-cols-12 gap-8">
          {/* Timeline Section */}
          <div className="col-span-8">
            <div className="bubble-glass-vibrant p-10 min-h-[600px] bg-white/90 dark:bg-glass-obsidian/70 backdrop-blur-xl rounded-[3rem] border border-white dark:border-white/10 shadow-sm">
              <div className="flex justify-between items-center mb-10">
                <div>
                  <h2 className="text-xl font-semibold text-[var(--medical-navy)] dark:text-white">Agenda de Hoje</h2>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                    {new Date().toLocaleDateString('pt-BR', {
                      day: 'numeric',
                      month: 'long',
                      weekday: 'long',
                    }).replace(/^./, str => str.toUpperCase())}
                  </p>
                </div>
                <button
                  onClick={() => navigate('/agenda')}
                  className="px-5 py-2 text-[10px] font-bold text-[var(--medical-navy)] dark:text-slate-300 border border-slate-100 dark:border-white/10 bg-white dark:bg-white/5 rounded-xl shadow-sm hover:shadow-md transition-all uppercase tracking-widest hover:bg-white/10"
                >
                  Calendário Semanal
                </button>
              </div>

              <AgendaTimeline
                items={timelineItems}
                onItemClick={(index) => {
                  const apontamento = todayApontamentos[index];
                  if (apontamento) {
                    console.log('Item clicado:', apontamento);
                    navigate(`/pacientes/${apontamento.patient.id}`);
                  }
                }}
              />
            </div>
          </div>

          {/* Right Section */}
          <div className="col-span-4 space-y-6">
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
  );
}
