import { useEffect, useState } from 'react';
import { useAuth } from '../../auth/AuthProvider';

const STUDENT_ID = 'e1925b44-9694-477c-a496-5e638e4a9e25';
const API = 'http://localhost:3333';

interface DashboardData {
  kpis: {
    scoreGeral: number;
    percentil: string;
    questoesResolvidas: number;
    horasEstudoSemana: number;
    casosClinicosTotal: number;
    casosClinicosAssertividade: number;
  };
  distribuicao: { area: string; percentual: number }[];
  ultimoInsight: {
    pontos_fortes: { titulo?: string; text?: string }[];
    pontos_atencao: { titulo?: string; text?: string; severidade?: string }[];
  } | null;
}

export default function CentralEstudos() {
  const { doctor } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);

  useEffect(() => {
    fetch(`${API}/student/${STUDENT_ID}/dashboard`)
      .then(r => r.json())
      .then(setData)
      .catch(() => {});
  }, []);

  const displayName = doctor?.full_name ?? 'Dr.';
  const kpis = data?.kpis;

  return (
    <div className="bg-background min-h-screen pb-20 font-body antialiased">
      <main className="max-w-[1200px] mx-auto pt-6 px-gutter">
        {/* Greeting */}
        <header className="mb-6">
          <h1 className="font-heading-1 text-heading-1 text-on-surface">
            Olá, {displayName}
          </h1>
          <p className="text-on-surface-variant opacity-70 mt-1 flex items-center gap-2">
            {kpis
              ? `Score atual: ${kpis.scoreGeral} pts · ${kpis.percentil}`
              : 'Carregando seu progresso...'}
            <span className="relative w-[6px] h-[6px] bg-[#1773cf] rounded-full after:content-[''] after:absolute after:inset-0 after:bg-[#1773cf] after:rounded-full after:animate-ping" />
          </p>
        </header>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white/70 backdrop-blur-[40px] p-5 lg:p-6 rounded-[2rem] shadow-[0_20px_50px_-12px_rgba(0,0,0,0.04)] relative overflow-hidden">
            <div className="flex justify-between items-start mb-3">
              <span className="text-[10px] font-bold tracking-wider uppercase text-on-surface-variant opacity-60">Score Geral</span>
              <div className="w-2 h-2 rounded-full bg-primary shadow-[0_0_8px_rgba(0,90,168,0.4)]" />
            </div>
            <div className="font-heading-1 text-[2.2rem] text-primary leading-none">
              {kpis ? kpis.scoreGeral : '—'}
            </div>
            <div className="text-xs font-bold text-primary-container mt-1.5">
              {kpis ? kpis.percentil : '—'}
            </div>
          </div>

          <div className="bg-white/70 backdrop-blur-[40px] p-5 lg:p-6 rounded-[2rem] shadow-[0_20px_50px_-12px_rgba(0,0,0,0.04)] relative overflow-hidden">
            <div className="flex justify-between items-start mb-3">
              <span className="text-[10px] font-bold tracking-wider uppercase text-on-surface-variant opacity-60">Horas esta semana</span>
              <div className="w-2 h-2 rounded-full bg-primary/40" />
            </div>
            <div className="font-heading-1 text-[2.2rem] text-primary leading-none">
              {kpis ? `${kpis.horasEstudoSemana}h` : '—'}
            </div>
            <div className="text-xs font-bold text-on-surface-variant mt-1.5 opacity-60">
              Questões: {kpis ? kpis.questoesResolvidas.toLocaleString('pt-BR') : '—'}
            </div>
          </div>

          <div className="bg-white/70 backdrop-blur-[40px] p-5 lg:p-6 rounded-[2rem] shadow-[0_20px_50px_-12px_rgba(0,0,0,0.04)] relative overflow-hidden">
            <div className="flex justify-between items-start mb-3">
              <span className="text-[10px] font-bold tracking-wider uppercase text-on-surface-variant opacity-60">Casos Clínicos</span>
              <div className="w-2 h-2 rounded-full bg-primary shadow-[0_0_8px_rgba(0,90,168,0.4)]" />
            </div>
            <div className="font-heading-1 text-[2.2rem] text-primary leading-none">
              {kpis ? kpis.casosClinicosTotal : '—'}
            </div>
            <div className="text-xs font-bold text-primary-container mt-1.5">
              {kpis && kpis.casosClinicosTotal > 0
                ? `${(kpis.casosClinicosAssertividade * 100).toFixed(0)}% assertividade`
                : 'Sem dados'}
            </div>
          </div>

          <div className="bg-white/70 backdrop-blur-[40px] p-5 lg:p-6 rounded-[2rem] shadow-[0_20px_50px_-12px_rgba(0,0,0,0.04)] relative overflow-hidden">
            <div className="flex justify-between items-start mb-3">
              <span className="text-[10px] font-bold tracking-wider uppercase text-on-surface-variant opacity-60">Questões Resolvidas</span>
              <div className="w-2 h-2 rounded-full bg-primary/40" />
            </div>
            <div className="font-heading-1 text-[2.2rem] text-primary leading-none">
              {kpis ? kpis.questoesResolvidas.toLocaleString('pt-BR') : '—'}
            </div>
            <div className="text-xs font-bold text-on-surface-variant mt-1.5 opacity-60">
              Total acumulado
            </div>
          </div>
        </div>

        {/* Main Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-6">
          {/* Distribuição de Estudos */}
          <div className="lg:col-span-2 bg-white/70 backdrop-blur-[40px] p-6 rounded-[2.5rem] shadow-[0_20px_50px_-12px_rgba(0,0,0,0.04)]">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-heading-2 text-heading-2 text-on-surface">Distribuição de Estudos</h3>
            </div>
            {data?.distribuicao && data.distribuicao.length > 0 ? (
              <div className="space-y-4">
                {data.distribuicao.slice(0, 5).map(item => (
                  <div key={item.area} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-on-surface font-medium">{item.area}</span>
                      <span className="font-bold text-primary">{item.percentual}%</span>
                    </div>
                    <div className="h-2 bg-surface-container-high rounded-full overflow-hidden">
                      <div className="h-full bg-primary rounded-full" style={{ width: `${item.percentual}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <span className="material-symbols-outlined text-4xl text-outline mb-3">bar_chart</span>
                <p className="text-sm text-on-surface-variant">Faça seu primeiro simulado para ver a distribuição.</p>
              </div>
            )}
          </div>

          {/* Score visual */}
          <div className="bg-white/70 backdrop-blur-[40px] p-6 rounded-[2.5rem] shadow-[0_20px_50px_-12px_rgba(0,0,0,0.04)] flex flex-col items-center text-center">
            <h3 className="font-heading-2 text-heading-2 text-on-surface mb-5 w-full text-left">Score Hipócrates</h3>
            <div className="relative w-40 h-40 mb-5">
              <svg className="w-full h-full rotate-[-90deg]" viewBox="0 0 36 36">
                <circle cx="18" cy="18" fill="none" r="15.915" stroke="#f2f3fc" strokeWidth="3" />
                <circle
                  cx="18" cy="18" fill="none" r="15.915"
                  stroke="#005aa8"
                  strokeDasharray={`${kpis ? Math.min(kpis.scoreGeral / 10, 100) : 0} 100`}
                  strokeWidth="3"
                />
              </svg>
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                <div className="font-heading-2 text-[1.8rem] text-primary">{kpis ? kpis.scoreGeral : '—'}</div>
                <div className="text-[7px] font-bold uppercase tracking-widest text-on-surface-variant opacity-60">de 1000</div>
              </div>
            </div>
            <p className="text-sm text-on-surface-variant">{kpis?.percentil ?? ''}</p>
          </div>
        </div>

        {/* Insights */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="bg-white/70 backdrop-blur-[40px] p-6 rounded-[2.5rem] shadow-[0_20px_50px_-12px_rgba(0,0,0,0.04)] border-l-4 border-primary">
            <div className="flex items-center gap-3 mb-5">
              <span className="material-symbols-outlined text-primary">verified</span>
              <h3 className="font-heading-2 text-heading-2 text-on-surface">Pontos Fortes</h3>
            </div>
            {data?.ultimoInsight?.pontos_fortes && data.ultimoInsight.pontos_fortes.length > 0 ? (
              <ul className="space-y-3">
                {data.ultimoInsight.pontos_fortes.slice(0, 3).map((item, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                    <p className="text-sm text-on-surface-variant">{item.titulo ?? item.text ?? String(item)}</p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-on-surface-variant opacity-60">
                Gere um insight para ver seus pontos fortes.
              </p>
            )}
          </div>

          <div className="bg-white/70 backdrop-blur-[40px] p-6 rounded-[2.5rem] shadow-[0_20px_50px_-12px_rgba(0,0,0,0.04)] border-l-4 border-error">
            <div className="flex items-center gap-3 mb-5">
              <span className="material-symbols-outlined text-error">warning</span>
              <h3 className="font-heading-2 text-heading-2 text-on-surface">Pontos de Atenção</h3>
            </div>
            {data?.ultimoInsight?.pontos_atencao && data.ultimoInsight.pontos_atencao.length > 0 ? (
              <ul className="space-y-3">
                {data.ultimoInsight.pontos_atencao.slice(0, 3).map((item, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-error mt-2 flex-shrink-0" />
                    <p className="text-sm text-error font-medium">{item.titulo ?? item.text ?? String(item)}</p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-on-surface-variant opacity-60">
                Gere um insight para ver os pontos de atenção.
              </p>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
