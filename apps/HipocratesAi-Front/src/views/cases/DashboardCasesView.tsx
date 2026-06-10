import React, { useEffect, useState } from 'react';
import PopupIniciarCaseView from './PopupIniciarCaseView';

const STUDENT_ID = 'e1925b44-9694-477c-a496-5e638e4a9e25';
const API = 'http://localhost:3333';

interface Case {
  id: string;
  titulo: string;
  descricao: string;
  especialidade: string;
  dificuldade: 'facil' | 'media' | 'dificil';
  tempo_estimado_min: number;
}

interface Metrics {
  total_resolvidos: number;
  assertividade_media: number;
  tempo_medio_segundos: number;
  distribuicao_especialidade: { especialidade: string; total: number }[];
  evolucao: { periodo_atual: number; periodo_anterior: number; delta: number };
}

const DIFICULDADE_LABEL: Record<string, string> = { facil: 'Fácil', media: 'Médio', dificil: 'Difícil' };
const DIFICULDADE_COLOR: Record<string, string> = {
  facil: 'bg-cyan-50 text-cyan-700 border-cyan-200',
  media: 'bg-amber-50 text-amber-700 border-amber-200',
  dificil: 'bg-red-50 text-red-600 border-red-200',
};

export default function HipocratesDashboard() {
  const [cases, setCases] = useState<Case[]>([]);
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedCase, setSelectedCase] = useState<Case | null>(null);
  const [filterEspec, setFilterEspec] = useState<string>('Todos');

  useEffect(() => {
    Promise.all([
      fetch(`${API}/student/v1/cases`).then(r => r.json()),
      fetch(`${API}/student/v1/cases/metrics?student_id=${STUDENT_ID}`).then(r => r.json()),
    ])
      .then(([casesData, metricsData]) => {
        setCases(casesData.casos ?? []);
        setMetrics(metricsData);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const especialidades = ['Todos', ...Array.from(new Set(cases.map(c => c.especialidade)))];
  const filtered = filterEspec === 'Todos' ? cases : cases.filter(c => c.especialidade === filterEspec);

  const tempoMedio = metrics
    ? `${Math.floor(metrics.tempo_medio_segundos / 60)}m ${metrics.tempo_medio_segundos % 60}s`
    : '—';

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans pb-24 selection:bg-blue-100">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">

        {/* Header */}
        <header className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">Hipócrates Cases</h1>
            <p className="text-sm text-slate-500 mt-1">Simulações clínicas para treinamento diagnóstico</p>
          </div>
        </header>

        {/* Métricas */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between h-32">
            <div className="flex justify-between items-start">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Casos Resolvidos</span>
              <span className="material-symbols-outlined text-blue-500 text-[18px]">fact_check</span>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl font-bold text-slate-800 tracking-tight">
                {loading ? '—' : metrics?.total_resolvidos ?? 0}
              </span>
              <span className="text-xs font-semibold text-slate-400">total</span>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between h-32">
            <div className="flex justify-between items-start">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Assertividade</span>
              <span className="material-symbols-outlined text-emerald-500 text-[18px]">track_changes</span>
            </div>
            <div>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-bold text-slate-800 tracking-tight">
                  {loading ? '—' : `${metrics?.assertividade_media ?? 0}%`}
                </span>
                {metrics && metrics.evolucao.delta !== 0 && (
                  <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${metrics.evolucao.delta > 0 ? 'text-emerald-500 bg-emerald-50' : 'text-red-500 bg-red-50'}`}>
                    {metrics.evolucao.delta > 0 ? '+' : ''}{metrics.evolucao.delta}%
                  </span>
                )}
              </div>
              <div className="w-full bg-slate-100 h-1.5 rounded-full mt-2 overflow-hidden">
                <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${metrics?.assertividade_media ?? 0}%` }} />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between h-32">
            <div className="flex justify-between items-start">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Tempo Médio</span>
              <span className="material-symbols-outlined text-amber-500 text-[18px]">timer</span>
            </div>
            <span className="text-2xl font-bold text-slate-800 tracking-tight">{loading ? '—' : tempoMedio}</span>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between h-32">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Especialidades</span>
            <div className="flex items-center gap-3 mt-1">
              <div
                className="relative w-12 h-12 rounded-full flex-shrink-0 shadow-sm"
                style={{ background: 'conic-gradient(#2563eb 0% 55%, #10b981 55% 85%, #f59e0b 85% 100%)' }}
              >
                <div className="absolute inset-2 bg-white rounded-full" />
              </div>
              <div className="flex flex-col gap-1 w-full">
                {(metrics?.distribuicao_especialidade.slice(0, 3) ?? []).map((d, i) => (
                  <div key={i} className="flex items-center justify-between text-[10px] font-semibold text-slate-600">
                    <span>{d.especialidade}</span>
                    <span>{d.total}</span>
                  </div>
                ))}
                {(!metrics || metrics.distribuicao_especialidade.length === 0) && (
                  <span className="text-[10px] text-slate-400">Sem dados ainda</span>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Casos */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <h2 className="text-xl font-bold tracking-tight text-slate-800">Casos Disponíveis</h2>
              <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0">
                {especialidades.map(e => (
                  <button
                    key={e}
                    onClick={() => setFilterEspec(e)}
                    className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
                      filterEspec === e
                        ? 'bg-slate-800 text-white shadow-sm'
                        : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {e}
                  </button>
                ))}
              </div>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="bg-white rounded-2xl p-6 border border-slate-200 h-[220px] animate-pulse" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {filtered.map(c => (
                  <div
                    key={c.id}
                    className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-md hover:border-blue-200 transition-all flex flex-col justify-between min-h-[220px]"
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${DIFICULDADE_COLOR[c.dificuldade]}`}>
                          {DIFICULDADE_LABEL[c.dificuldade]}
                        </span>
                        <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">{c.especialidade}</span>
                      </div>
                      <h3 className="text-base font-bold text-slate-800 mb-2 leading-tight">{c.titulo}</h3>
                      <p className="text-sm text-slate-500 line-clamp-2 leading-relaxed">{c.descricao}</p>
                    </div>
                    <button
                      onClick={() => setSelectedCase(c)}
                      className="w-full mt-5 py-2.5 bg-blue-600 text-white text-xs font-bold uppercase tracking-wider rounded-xl hover:bg-blue-700 transition-colors shadow-sm"
                    >
                      Iniciar Caso
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Analytics */}
          <div className="lg:col-span-1 space-y-6">
            <h2 className="text-xl font-bold tracking-tight text-slate-800 hidden lg:block mb-4">Analytics</h2>
            <section className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
              <h3 className="text-sm font-bold text-slate-800 mb-4">Por Especialidade</h3>
              {metrics && metrics.distribuicao_especialidade.length > 0 ? (
                <div className="space-y-3">
                  {metrics.distribuicao_especialidade.map((d, i) => (
                    <div key={i}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="font-semibold text-slate-700">{d.especialidade}</span>
                        <span className="text-slate-500">{d.total} caso{d.total !== 1 ? 's' : ''}</span>
                      </div>
                      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="bg-blue-500 h-full rounded-full"
                          style={{ width: `${Math.min(100, (d.total / (metrics.total_resolvidos || 1)) * 100)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400 text-center py-4">Complete casos para ver sua distribuição.</p>
              )}
            </section>

            <section className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
              <h3 className="text-sm font-bold text-slate-800 mb-3">Este mês</h3>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                  <span className="material-symbols-outlined text-blue-600 text-[20px]">trending_up</span>
                </div>
                <div>
                  <p className="text-lg font-bold text-slate-800">{metrics?.evolucao.periodo_atual ?? 0} casos</p>
                  <p className="text-xs text-slate-500">
                    {metrics && metrics.evolucao.periodo_anterior > 0
                      ? `vs ${metrics.evolucao.periodo_anterior} no mês anterior`
                      : 'Comece a praticar!'}
                  </p>
                </div>
              </div>
            </section>
          </div>
        </div>
      </main>

      {selectedCase && (
        <PopupIniciarCaseView
          caseId={selectedCase.id}
          onClose={() => setSelectedCase(null)}
        />
      )}
    </div>
  );
}
