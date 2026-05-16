import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const STUDENT_ID = 'e1925b44-9694-477c-a496-5e638e4a9e25';

interface PerformanceData {
  taxaAcertos: number;
  questoesResolvidas: number;
  tempoEstudo: number;
}

function formatStudyTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h === 0) return `${m}min`;
  return `${h}h ${String(m).padStart(2, '0')}min`;
}

export default function SimuladosDashboardView() {
  const navigate = useNavigate();
  const [perf, setPerf] = useState<PerformanceData | null>(null);

  useEffect(() => {
    fetch(`http://localhost:3333/student/performance/${STUDENT_ID}`)
      .then(r => r.ok ? r.json() : null)
      .then(json => { if (json?.data) setPerf(json.data); })
      .catch(() => { });
  }, []);

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-12">

      {/* Header */}
      <section className="space-y-1">
        <h2 className="text-3xl font-bold tracking-tight text-on-surface">7
          Desempenho e Simulados
        </h2>
        <p className="text-on-surface-variant max-w-2xl">
          Bom dia, Dr. O seu foco intelectual hoje está direcionado à excelência clínica.
        </p>
      </section>

      {/* Cards */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">

        {/* Card 1 */}
        <div className="liquid-glass rounded-3xl p-8 shadow border flex flex-col items-center text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-primary-container/30 flex items-center justify-center">
            <span className="material-symbols-outlined text-primary">
              analytics
            </span>
          </div>

          <div>
            <p className="text-[0.65rem] font-bold uppercase tracking-widest text-on-surface-variant">
              Questões Resolvidas
            </p>
            <h3 className="text-4xl font-black">
              {perf ? perf.questoesResolvidas.toLocaleString('pt-BR') : '—'}
            </h3>
          </div>

          <div className="text-[10px] px-3 py-1 bg-primary/10 text-primary rounded-full">
            Total acumulado
          </div>
        </div>

        {/* Card 2 */}
        <div className="liquid-glass rounded-3xl p-8 shadow border flex flex-col items-center text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
            <span
              className="material-symbols-outlined text-primary"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              verified
            </span>
          </div>

          <div>
            <p className="text-[0.65rem] font-bold uppercase tracking-widest text-on-surface-variant">
              Taxa de Acerto
            </p>
            <h3 className="text-4xl font-black">
              {perf ? `${(perf.taxaAcertos * 100).toFixed(1)}%` : '—'}
            </h3>
          </div>

          <div className="flex gap-1">
            <div className="h-1 w-8 bg-primary rounded-full"></div>
            <div className="h-1 w-8 bg-primary rounded-full"></div>
            <div className="h-1 w-8 bg-primary rounded-full"></div>
            <div className="h-1 w-8 bg-gray-200 rounded-full"></div>
          </div>
        </div>

        {/* Card 3 */}
        <div className="liquid-glass rounded-3xl p-8 shadow border flex flex-col items-center text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-secondary-container/30 flex items-center justify-center">
            <span className="material-symbols-outlined text-secondary">
              schedule
            </span>
          </div>

          <div>
            <p className="text-[0.65rem] font-bold uppercase tracking-widest text-on-surface-variant">
              Tempo em Estudo
            </p>
            <h3 className="text-4xl font-black">
              {perf ? formatStudyTime(perf.tempoEstudo) : '—'}
            </h3>
          </div>

          <p className="text-[10px] text-on-surface-variant">
            {perf && perf.questoesResolvidas > 0
              ? `Média de ${Math.round(perf.tempoEstudo / perf.questoesResolvidas)}s por questão`
              : 'Sem dados ainda'}
          </p>
        </div>

      </section>

      {/* Grid principal */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">

        {/* Análise Cognitiva */}
        <section className="lg:col-span-3 space-y-6">
          <div className="flex justify-between items-end">
            <h3 className="text-xl font-bold">Análise Cognitiva</h3>
            <span className="text-[10px] font-bold text-primary cursor-pointer">
              Ver Detalhes
            </span>
          </div>

          <div className="bg-surface-container-low rounded-3xl p-8 space-y-6">

            {[
              { nome: "Cardiologia", valor: 88 },
              { nome: "Neurologia", valor: 74 },
              { nome: "Endocrinologia", valor: 62 },
              { nome: "Gastroenterologia", valor: 68 },
              { nome: "Nefrologia", valor: 54 },
            ].map((item) => (
              <div key={item.nome} className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>{item.nome}</span>
                  <span className="font-bold">{item.valor}%</span>
                </div>

                <div className="h-2 bg-white rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full"
                    style={{ width: `${item.valor}%` }}
                  />
                </div>
              </div>
            ))}

            <div className="pt-4 border-t">
              <div className="flex gap-3 p-4 rounded-xl bg-white">
                <span className="material-symbols-outlined text-primary">
                  psychology
                </span>
                <p className="text-sm text-gray-600">
                  Seu desempenho em Nefrologia caiu. Recomendamos foco em distúrbios hidroeletrolíticos.
                </p>
              </div>
            </div>

          </div>
        </section>

        {/* Agenda */}
        <section className="lg:col-span-2 space-y-6">
          <h3 className="text-xl font-bold">Agenda Sugerida</h3>

          {[
            { hora: "14:00", titulo: "Distúrbios Ácido-Base" },
            { hora: "17:30", titulo: "Diabetes Tipo 2" },
            { hora: "09:00", titulo: "Revisão Clínica" },
          ].map((item, i) => (
            <div key={i} className="p-5 bg-white rounded-2xl shadow">
              <div className="flex justify-between">
                <span className="font-bold">{item.hora}</span>
              </div>
              <h4 className="font-semibold mt-2">{item.titulo}</h4>
            </div>
          ))}
        </section>

      </div>

      {/* Simulado rápido */}
      <section className="pb-12">
        <div className="flex justify-center py-8">
          <div className="relative flex w-full max-w-2xl flex-col items-center space-y-6 overflow-hidden rounded-[3rem] border border-white/60 bg-white/70 p-10 text-center shadow-xl backdrop-blur-xl">
            <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-blue-600 to-blue-800 shadow-2xl">
              <span className="material-symbols-outlined text-4xl text-white">
                rocket_launch
              </span>
            </div>

            <div>
              <h4 className="mb-2 text-3xl font-black tracking-tight">
                Área de Simulados Rápidos
              </h4>

              <p className="max-w-md text-sm leading-relaxed text-slate-500">
                Personalize seu treino por especialidade, tempo ou
                dificuldade.
              </p>
            </div>

            <button
              onClick={() => navigate("/simulados/rapido")}
              className="flex items-center justify-center gap-3 rounded-2xl bg-blue-600 px-8 py-4 text-sm font-bold uppercase tracking-[0.2em] text-white shadow-xl transition-all hover:-translate-y-1 active:scale-95"
            >
              <span>Ir para Simulados</span>

              <span className="material-symbols-outlined text-lg">
                arrow_forward
              </span>
            </button>
          </div>
        </div>
      </section>

    </div>
  );
}