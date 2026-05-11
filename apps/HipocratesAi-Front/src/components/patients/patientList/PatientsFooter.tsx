import type { PatientStats } from '../../../types/PatientTypes';

interface StatsFooterProps {
  stats: PatientStats;
}

export default function StatsFooter({ stats }: StatsFooterProps) {
  return (
    <footer className="mt-16 grid grid-cols-4 gap-6">
      {/* AI Precision */}
      <div className="p-6 rounded-3xl bg-white/40 border border-white/60">
        <p className="text-caption-bold text-subtitle uppercase tracking-widest mb-1">
          Precisão AI
        </p>
        <div className="flex items-end gap-2">
          <span className="text-2xl font-semibold text-title">{stats.aiPrecision}</span>
          <span className="text-caption text-green-500 font-bold mb-1">{stats.aiChange}</span>
        </div>
      </div>

      {/* New Justifications */}
      <div className="p-6 rounded-3xl bg-white/40 border border-white/60">
        <p className="text-caption-bold text-subtitle uppercase tracking-widest mb-1">
          Novas Justificativas
        </p>
        <span className="text-2xl font-semibold text-title">{stats.newJustifications}</span>
      </div>

      {/* Avg Response Time */}
      <div className="p-6 rounded-3xl bg-white/40 border border-white/60">
        <p className="text-caption-bold text-subtitle uppercase tracking-widest mb-1">
          Tempo Médio Resposta
        </p>
        <span className="text-2xl font-semibold text-title">{stats.avgResponseTime}</span>
      </div>

      {/* System Status */}
      <div className="p-6 rounded-3xl bg-slate-900 text-white flex items-center justify-between">
        <div>
          <p className="text-caption-bold text-slate-400 uppercase tracking-widest mb-1">
            Status Sistema
          </p>
          <span className="text-label-sm font-medium">{stats.systemStatus}</span>
        </div>
        <span className="material-icon text-green-400">verified_user</span>
      </div>
    </footer>
  );
}
