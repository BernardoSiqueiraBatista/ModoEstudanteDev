import { useMemo } from 'react';
import { usePatients } from '../../../hooks/usePatients';

const STATS_LIMIT = 100;
const MONTH_LABELS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

interface StatusDonutProps {
  ativo: number;
  followup: number;
  pendente: number;
}

function StatusDonut({ ativo, followup, pendente }: StatusDonutProps) {
  const total = ativo + followup + pendente || 1;
  const ativoPct = Math.round((ativo / total) * 100);
  const followupPct = Math.round((followup / total) * 100);
  const pendentePct = Math.max(0, 100 - ativoPct - followupPct);

  return (
    <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-[0_8px_30px_rgba(0,0,0,0.04)] flex flex-col">
      <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6">
        Status dos Pacientes
      </h3>
      <div className="flex items-center justify-between flex-1 gap-4">
        <div className="relative size-32">
          <svg className="size-full" viewBox="0 0 36 36">
            <path
              className="text-slate-100"
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
            />
            <path
              className="text-[#0066FF]"
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              fill="none"
              stroke="currentColor"
              strokeDasharray={`${ativoPct}, 100`}
              strokeLinecap="round"
              strokeWidth="3"
            />
            <path
              className="text-slate-400"
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              fill="none"
              stroke="currentColor"
              strokeDasharray={`${followupPct}, 100`}
              strokeDashoffset={`-${ativoPct}`}
              strokeLinecap="round"
              strokeWidth="3"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-xl font-semibold text-slate-900 tabular-nums">
              {total}
            </span>
            <span className="text-[9px] text-slate-400 uppercase tracking-wider font-bold">
              Total
            </span>
          </div>
        </div>
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <div className="size-2 rounded-full bg-[#0066FF]"></div>
            <span className="text-[11px] text-slate-500 font-medium">
              Ativo ({ativoPct}%)
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="size-2 rounded-full bg-slate-400"></div>
            <span className="text-[11px] text-slate-500 font-medium">
              Follow-up ({followupPct}%)
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="size-2 rounded-full bg-slate-200"></div>
            <span className="text-[11px] text-slate-500 font-medium">
              Pendente ({pendentePct}%)
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

interface TopDiagnosesProps {
  items: { name: string; count: number; percent: number }[];
}

function TopDiagnoses({ items }: TopDiagnosesProps) {
  return (
    <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
      <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6">
        Principais Diagnósticos
      </h3>
      {items.length === 0 ? (
        <p className="text-sm text-slate-400 italic">
          Sem diagnósticos registrados ainda.
        </p>
      ) : (
        <div className="space-y-4">
          {items.map(item => (
            <div key={item.name}>
              <div className="flex justify-between text-[11px] mb-1 font-medium text-slate-600">
                <span className="truncate pr-2">{item.name}</span>
                <span className="tabular-nums">{item.percent}%</span>
              </div>
              <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                <div
                  className="h-full bg-[#0066FF] rounded-full transition-all duration-1000"
                  style={{ width: `${item.percent}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

interface AcquisitionChartProps {
  buckets: { label: string; count: number }[];
}

function AcquisitionChart({ buckets }: AcquisitionChartProps) {
  const max = Math.max(...buckets.map(b => b.count), 1);

  return (
    <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
      <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6">
        Aquisição (6 meses)
      </h3>
      <div className="h-28 flex items-end justify-between gap-1">
        {buckets.map((b, idx) => {
          const heightPct = Math.max(8, (b.count / max) * 100);
          const isLast = idx === buckets.length - 1;
          return (
            <div
              key={b.label}
              className="flex-1 bg-slate-50 rounded-t-sm relative group"
            >
              <div
                className={`absolute bottom-0 w-full rounded-t-sm transition-all ${
                  isLast
                    ? 'bg-[#0066FF] group-hover:bg-[#0066FF]'
                    : 'bg-[#0066FF]/20 group-hover:bg-[#0066FF]/40'
                }`}
                style={{ height: `${heightPct}%` }}
              />
            </div>
          );
        })}
      </div>
      <div className="flex justify-between mt-2 text-[9px] font-bold text-slate-300 uppercase tracking-tighter">
        {buckets.map(b => (
          <span key={b.label}>{b.label}</span>
        ))}
      </div>
    </div>
  );
}

export default function PatientsAnalytics() {
  const { data } = usePatients({ limit: STATS_LIMIT, page: 1, tab: 'all' });
  const patients = data?.data ?? [];

  const statusCounts = useMemo(() => {
    return {
      ativo: patients.filter(p => p.status === 'ativo').length,
      followup: patients.filter(p => p.status === 'followup').length,
      pendente: patients.filter(p => p.status === 'pendente').length,
    };
  }, [patients]);

  const diagnoses = useMemo(() => {
    const counts: Record<string, number> = {};
    patients.forEach(p => {
      const raw = p.mainDiagnosis?.trim();
      if (!raw) return;
      const key = raw.charAt(0).toUpperCase() + raw.slice(1).toLowerCase();
      counts[key] = (counts[key] ?? 0) + 1;
    });
    const total = Object.values(counts).reduce((acc, n) => acc + n, 0) || 1;
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4)
      .map(([name, count]) => ({
        name,
        count,
        percent: Math.round((count / total) * 100),
      }));
  }, [patients]);

  const acquisition = useMemo(() => {
    const now = new Date();
    const buckets: { label: string; count: number; year: number; month: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      buckets.push({
        label: MONTH_LABELS[d.getMonth()] ?? '',
        year: d.getFullYear(),
        month: d.getMonth(),
        count: 0,
      });
    }
    patients.forEach(p => {
      const created = new Date(p.createdAt);
      if (Number.isNaN(created.getTime())) return;
      const bucket = buckets.find(
        b => b.year === created.getFullYear() && b.month === created.getMonth(),
      );
      if (bucket) bucket.count += 1;
    });
    return buckets;
  }, [patients]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
      <StatusDonut {...statusCounts} />
      <TopDiagnoses items={diagnoses} />
      <AcquisitionChart buckets={acquisition} />
    </div>
  );
}
