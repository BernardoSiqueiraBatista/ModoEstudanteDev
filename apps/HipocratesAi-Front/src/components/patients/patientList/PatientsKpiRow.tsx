import { useMemo } from 'react';
import { usePatients } from '../../../hooks/usePatients';

const STATS_LIMIT = 100;

interface KpiCardProps {
  label: string;
  value: string | number;
  badge?: { text: string; tone: 'neutral' | 'positive' | 'critical' };
  critical?: boolean;
}

function KpiCard({ label, value, badge, critical }: KpiCardProps) {
  const badgeClass =
    badge?.tone === 'positive'
      ? 'bg-blue-50 text-[#0066FF]'
      : badge?.tone === 'critical'
        ? 'bg-red-50 text-[#FF3B30]'
        : 'bg-slate-100 text-slate-500';

  return (
    <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
        {label}
      </p>
      <div className="flex items-end justify-between">
        <span
          className={`text-3xl font-semibold tabular-nums ${
            critical ? 'text-[#FF3B30]' : 'text-slate-900'
          }`}
        >
          {value}
        </span>
        {critical && (
          <span className="material-icon text-[#FF3B30] animate-pulse">
            priority_high
          </span>
        )}
        {badge && !critical && (
          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${badgeClass}`}>
            {badge.text}
          </span>
        )}
      </div>
    </div>
  );
}

function formatDelta(curr: number, prev: number): { text: string; tone: 'positive' | 'neutral' | 'critical' } | undefined {
  if (prev === 0 && curr === 0) return undefined;
  if (prev === 0) return { text: `+${curr}`, tone: 'positive' };
  const delta = ((curr - prev) / prev) * 100;
  const rounded = Math.round(delta * 10) / 10;
  const sign = rounded >= 0 ? '+' : '';
  return {
    text: `${sign}${rounded}%`,
    tone: rounded > 0 ? 'positive' : rounded < 0 ? 'critical' : 'neutral',
  };
}

export default function PatientsKpiRow() {
  const { data } = usePatients({ limit: STATS_LIMIT, page: 1, tab: 'all' });
  const patients = data?.data ?? [];

  const stats = useMemo(() => {
    const total = data?.pagination.total ?? patients.length;
    const ativos = patients.filter(p => p.status === 'ativo').length;
    const followup = patients.filter(
      p => p.status === 'followup' || p.status === 'pendente',
    ).length;

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    const newThisMonth = patients.filter(p => {
      const created = new Date(p.createdAt);
      return !Number.isNaN(created.getTime()) && created >= startOfMonth;
    }).length;

    const newLastMonth = patients.filter(p => {
      const created = new Date(p.createdAt);
      return (
        !Number.isNaN(created.getTime()) &&
        created >= startOfLastMonth &&
        created < startOfMonth
      );
    }).length;

    const ativosThisMonth = patients.filter(p => {
      if (p.status !== 'ativo') return false;
      const created = new Date(p.createdAt);
      return !Number.isNaN(created.getTime()) && created >= startOfMonth;
    }).length;

    const ativosLastMonth = patients.filter(p => {
      if (p.status !== 'ativo') return false;
      const created = new Date(p.createdAt);
      return (
        !Number.isNaN(created.getTime()) &&
        created >= startOfLastMonth &&
        created < startOfMonth
      );
    }).length;

    const criticalKeywords = ['crítico', 'critico', 'grave', 'severo', 'urgente'];
    const criticos = patients.filter(p => {
      const diag = (p.mainDiagnosis ?? '').toLowerCase();
      return criticalKeywords.some(k => diag.includes(k));
    }).length;

    return {
      total,
      ativos,
      ativosDelta: formatDelta(ativosThisMonth, ativosLastMonth),
      followup,
      criticos,
      newThisMonth,
      newDelta: formatDelta(newThisMonth, newLastMonth),
    };
  }, [patients, data?.pagination.total]);

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
      <KpiCard
        label="Total Ativos"
        value={stats.ativos.toLocaleString('pt-BR')}
        badge={stats.ativosDelta}
      />
      <KpiCard
        label="Follow-up / Pendente"
        value={stats.followup.toLocaleString('pt-BR')}
      />
      <KpiCard
        label="Críticos (Prioridade)"
        value={stats.criticos}
        critical={stats.criticos > 0}
      />
      <KpiCard
        label="Novos este Mês"
        value={stats.newThisMonth}
        badge={stats.newDelta}
      />
      <KpiCard
        label="Total Pacientes"
        value={stats.total.toLocaleString('pt-BR')}
      />
    </div>
  );
}
