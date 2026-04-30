import { useMemo } from 'react';
import { useAuth } from '../../auth/AuthProvider';
import { useDashboardStats } from '../../hooks/useDashboardStats';
import { useAppointmentsByDoctor } from '../../hooks/useAppointments';
import { useWeeklyActivePatientsTrend } from '../../hooks/useWeeklyActivePatientsTrend';
import { getTodayDateStringInSP } from '../../data/Dates';
import DashboardStats from '../../components/dashboard/DashboardStats';
import AgendaTimeline from '../../components/dashboard/AgendaTimeline';
import InsightCard from '../../components/dashboard/cards/InsightCard';
import InfoCard from '../../components/dashboard/cards/InfoCard';
import AIStatusCard from '../../components/dashboard/cards/AIStatusCard';
import ActivePatientsTrendCard from '../../components/dashboard/cards/ActivePatientsTrendCard';

const TIME_FORMATTER = new Intl.DateTimeFormat('pt-BR', {
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
  timeZone: 'America/Sao_Paulo',
});

const DATE_FORMATTER = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: 'long',
  weekday: 'long',
  timeZone: 'America/Sao_Paulo',
});

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

const GREETING_PHRASES = [
  'Tenha um excelente dia, doutor.',
  'Pronto para mais um dia transformando vidas.',
  'Que sua jornada hoje seja leve e produtiva.',
  'Os pacientes estão em boas mãos, doutor.',
  'Mais um dia para cuidar de quem precisa.',
  'Que hoje seja repleto de boas decisões clínicas.',
  'Saúde para cuidar e energia para acolher.',
  'Sua presença faz a diferença, doutor.',
  'Cada consulta é uma oportunidade de impactar.',
  'Bons diagnósticos e excelentes evoluções hoje.',
];

function getTimeOfDayEmoji(hour: number) {
  if (hour >= 5 && hour < 12) return '☀️';
  if (hour >= 12 && hour < 18) return '🌤️';
  if (hour >= 18 && hour < 22) return '🌆';
  return '🌙';
}

function getTimeOfDayGreeting(hour: number) {
  if (hour >= 5 && hour < 12) return 'Bom dia';
  if (hour >= 12 && hour < 18) return 'Boa tarde';
  return 'Boa noite';
}

function getFirstTwoNames(fullName: string) {
  const cleaned = fullName.replace(/^Dr[a]?\.?\s+/i, '').trim();
  const parts = cleaned.split(/\s+/);
  return parts.slice(0, 2).join(' ');
}

export default function DashboardView() {
  const { doctor, user } = useAuth();
  const { data, isError } = useDashboardStats();

  // "Hoje" calculado em São Paulo para evitar que o dia vire às 21h BRT
  // (caso o backend resolva "hoje" em UTC).
  const todayInSP = useMemo(() => getTodayDateStringInSP(), []);
  const { data: todayAppointments, isLoading: isLoadingAgenda } =
    useAppointmentsByDoctor({ doctorUserId: user?.id, date: todayInSP });

  const trend = useWeeklyActivePatientsTrend(user?.id);

  const doctorName = doctor?.full_name ?? 'Doutor';
  const greetingName = `Dr. ${getFirstTwoNames(doctorName)}`;

  const currentHour = useMemo(() => new Date().getHours(), []);
  const greetingEmoji = useMemo(() => getTimeOfDayEmoji(currentHour), [currentHour]);
  const greetingPrefix = useMemo(() => getTimeOfDayGreeting(currentHour), [currentHour]);

  const greetingPhrase = useMemo(
    () => GREETING_PHRASES[Math.floor(Math.random() * GREETING_PHRASES.length)],
    [],
  );

  const todayLabel = useMemo(() => {
    const parts = DATE_FORMATTER.formatToParts(new Date());
    const day = parts.find(p => p.type === 'day')?.value ?? '';
    const month = parts.find(p => p.type === 'month')?.value ?? '';
    const weekday = parts.find(p => p.type === 'weekday')?.value ?? '';
    return `${day} de ${capitalize(month)}, ${capitalize(weekday)}`;
  }, []);

  const stats = useMemo(() => {
    const consultasHoje = data?.consultasHoje ?? 0;
    const totalPacientes = data?.totalPacientes ?? 0;
    const pendencias = data?.pendencias ?? 0;
    const followUps = data?.followUps ?? 0;

    return [
      {
        label: 'Consultas Agendadas',
        value: consultasHoje,
        badge: consultasHoje > 0 ? `+${consultasHoje} hoje` : 'Hoje',
        badgeColor: 'text-emerald-500',
        dotColor: 'bg-[var(--electric-cyan)]',
        dotGlow: true,
      },
      {
        label: 'Pacientes Ativos',
        value: totalPacientes.toLocaleString('pt-BR'),
        badge: 'Total',
        badgeColor: 'text-slate-400',
        dotColor: 'bg-slate-200',
        dotGlow: false,
      },
      {
        label: 'Pendências',
        value: pendencias,
        badge: followUps > 0 ? `${followUps} Críticos` : 'Em dia',
        badgeColor: pendencias > 0 ? 'text-rose-500' : 'text-emerald-500',
        dotColor: pendencias > 0 ? 'bg-rose-400' : 'bg-emerald-500',
        dotGlow: pendencias > 0,
      },
    ];
  }, [data]);

  const agendaItems = useMemo(() => {
    if (!todayAppointments) return [];
    const now = Date.now();
    return todayAppointments
      .filter(item => item.status !== 'canceled')
      .map(item => {
        const startMs = new Date(item.startAt).getTime();
        const endMs = new Date(item.endAt).getTime();
        const isInProgress =
          item.status === 'scheduled' && now >= startMs && now < endMs;

        const status: 'confirmed' | 'waiting' | 'in_progress' = isInProgress
          ? 'in_progress'
          : item.status === 'done'
            ? 'confirmed'
            : 'waiting';

        return {
          id: item.id,
          time: TIME_FORMATTER.format(new Date(item.startAt)),
          patientName: item.patientName,
          description:
            item.type === 'urgencia'
              ? 'Urgência'
              : item.type === 'video'
                ? 'Teleconsulta'
                : item.type === 'compromisso'
                  ? 'Compromisso'
                  : 'Consulta',
          status,
        };
      });
  }, [todayAppointments]);

  return (
    <div className="dashboard-shell min-h-[calc(100vh-6rem)] -mt-24 pt-32 flex flex-col text-slate-900">
      <div className="flex-1 flex flex-col px-8 pb-8">
        <div className="mb-8 flex-shrink-0">
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            {greetingPrefix}, {greetingName} {greetingEmoji}
          </h1>
          <p className="text-sm text-slate-400 mt-1">{greetingPhrase}</p>
        </div>

        {isError ? (
          <div className="rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 text-sm px-5 py-4 mb-6">
            Não foi possível carregar os dados do dashboard. Tente novamente em instantes.
          </div>
        ) : null}

        <div className="mb-8">
          <DashboardStats stats={stats} />
        </div>

        <div className="grid grid-cols-12 gap-8">
          <div className="col-span-8 space-y-8">
            <ActivePatientsTrendCard
              data={trend.data}
              current={trend.current}
              deltaPct={trend.deltaPct}
              isLoading={trend.isLoading}
            />
            <div className="bubble-glass-vibrant p-10 min-h-[600px]">
              <div className="flex justify-between items-center mb-10">
                <div>
                  <h2 className="text-xl font-semibold text-[var(--medical-navy)]">
                    Agenda de Hoje
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">{todayLabel}</p>
                </div>
                <button
                  type="button"
                  className="px-5 py-2 text-[10px] font-bold text-[var(--medical-navy)] border border-slate-100 bg-white rounded-xl shadow-sm hover:shadow-md transition-all uppercase tracking-widest"
                >
                  Calendário Semanal
                </button>
              </div>

              {isLoadingAgenda ? (
                <div className="space-y-6">
                  {[0, 1, 2].map(i => (
                    <div
                      key={i}
                      className="h-20 rounded-[1.75rem] bg-slate-100 animate-pulse"
                    />
                  ))}
                </div>
              ) : (
                <AgendaTimeline items={agendaItems} />
              )}
            </div>
          </div>

          <div className="col-span-4 space-y-6">
            <InsightCard
              description={
                <>
                  A análise via{' '}
                  <span className="font-semibold text-[var(--medical-navy)]">
                    AI Hipócrates
                  </span>{' '}
                  está monitorando{' '}
                  <span className="font-bold text-[var(--electric-cyan)]">
                    {(data?.pacientesAtivos ?? 0).toLocaleString('pt-BR')}
                  </span>{' '}
                  pacientes ativos e identificou{' '}
                  <span className="font-bold text-[var(--electric-cyan)]">
                    {data?.followUps ?? 0}
                  </span>{' '}
                  follow-ups recomendados neste período.
                </>
              }
            />
            <div className="grid grid-cols-2 gap-4">
              <InfoCard
                icon="medication"
                label="Prescrições"
                value={data?.consultasHoje ?? 0}
              />
              <InfoCard
                icon="lab_research"
                label="Exames"
                value={data?.pendencias ?? 0}
              />
            </div>
            <AIStatusCard />
          </div>
        </div>
      </div>
    </div>
  );
}
