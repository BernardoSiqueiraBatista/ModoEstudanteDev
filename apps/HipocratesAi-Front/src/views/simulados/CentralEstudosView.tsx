import type { DadosKpi } from '../../types/ModoEstudanteTypes';

interface CentralEstudosProps {
  dadosKpi: DadosKpi | null;
}

export default function CentralEstudos({ dadosKpi }: CentralEstudosProps) {
  const mockDadosKpi: DadosKpi = {
    scoreGeral: { valor: 842, texto: '+12 pts esta semana' },
    horasEstudo: { valor: 128, texto: 'Meta: 150h/mês' },
    casosClinicos: { valor: 42, texto: '95% de assertividade' },
    percentil: { valor: 3, texto: 'Global Elite Ranking' },
  };

  return (
    <div className="bg-background min-h-screen pb-20 font-body antialiased">
      <main className="max-w-[1200px] mx-auto pt-20 px-gutter">
        {/* Greeting */}
        <header className="mb-6">
          <h1 className="font-heading-1 text-heading-1 text-on-surface">
            Olá, Dr. Aris Thorne
          </h1>

          <p className="text-on-surface-variant opacity-70 mt-1 flex items-center gap-2">
            Seu progresso clínico está 14% acima da média...

            <span className="relative w-[6px] h-[6px] bg-[#1773cf] rounded-full after:content-[''] after:absolute after:inset-0 after:bg-[#1773cf] after:rounded-full after:animate-ping" />
          </p>
        </header>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {/* Score Geral */}
          <div className="bg-white/70 backdrop-blur-[40px] p-5 lg:p-6 rounded-[2rem] shadow-[0_20px_50px_-12px_rgba(0,0,0,0.04)] relative overflow-hidden">
            <div className="flex justify-between items-start mb-3">
              <span className="text-[10px] font-bold tracking-wider uppercase text-on-surface-variant opacity-60">
                Score Geral
              </span>

              <div className="w-2 h-2 rounded-full bg-primary shadow-[0_0_8px_rgba(0,90,168,0.4)]" />
            </div>

            <div className="font-heading-1 text-[2.2rem] text-primary leading-none">
              {mockDadosKpi.scoreGeral.valor}
            </div>

            <div className="text-xs font-bold text-primary-container mt-1.5">
              {mockDadosKpi.scoreGeral.texto}
            </div>
          </div>

          {/* Horas de Estudo */}
          <div className="bg-white/70 backdrop-blur-[40px] p-5 lg:p-6 rounded-[2rem] shadow-[0_20px_50px_-12px_rgba(0,0,0,0.04)] relative overflow-hidden">
            <div className="flex justify-between items-start mb-3">
              <span className="text-[10px] font-bold tracking-wider uppercase text-on-surface-variant opacity-60">
                Horas de Estudo
              </span>

              <div className="w-2 h-2 rounded-full bg-primary/40" />
            </div>

            <div className="font-heading-1 text-[2.2rem] text-primary leading-none">
              {mockDadosKpi.horasEstudo.valor}h
            </div>

            <div className="text-xs font-bold text-on-surface-variant mt-1.5 opacity-60">
              {mockDadosKpi.horasEstudo.texto}
            </div>
          </div>

          {/* Casos Clínicos */}
          <div className="bg-white/70 backdrop-blur-[40px] p-5 lg:p-6 rounded-[2rem] shadow-[0_20px_50px_-12px_rgba(0,0,0,0.04)] relative overflow-hidden">
            <div className="flex justify-between items-start mb-3">
              <span className="text-[10px] font-bold tracking-wider uppercase text-on-surface-variant opacity-60">
                Casos Clínicos
              </span>

              <div className="w-2 h-2 rounded-full bg-primary shadow-[0_0_8px_rgba(0,90,168,0.4)]" />
            </div>

            <div className="font-heading-1 text-[2.2rem] text-primary leading-none">
              {mockDadosKpi.casosClinicos.valor}
            </div>

            <div className="text-xs font-bold text-primary-container mt-1.5">
              {mockDadosKpi.casosClinicos.texto}
            </div>
          </div>

          {/* Percentil */}
          <div className="bg-white/70 backdrop-blur-[40px] p-5 lg:p-6 rounded-[2rem] shadow-[0_20px_50px_-12px_rgba(0,0,0,0.04)] relative overflow-hidden">
            <div className="flex justify-between items-start mb-3">
              <span className="text-[10px] font-bold tracking-wider uppercase text-on-surface-variant opacity-60">
                Percentil
              </span>

              <div className="w-2 h-2 rounded-full bg-primary/40" />
            </div>

            <div className="font-heading-1 text-[2.2rem] text-primary leading-none">
              Top {mockDadosKpi.percentil.valor}%
            </div>

            <div className="text-xs font-bold text-on-surface-variant mt-1.5 opacity-60">
              {mockDadosKpi.horasEstudo.texto}
            </div>
          </div>
        </div>

        {/* Main Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-6">
          {/* Agenda */}
          <div className="lg:col-span-2 bg-white/70 backdrop-blur-[40px] p-6 rounded-[2.5rem] shadow-[0_20px_50px_-12px_rgba(0,0,0,0.04)]">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-heading-2 text-heading-2 text-on-surface">
                Agenda de Hoje
              </h3>

              <button className="text-xs font-bold uppercase tracking-[0.05em] text-primary hover:opacity-70 transition-opacity">
                Ver Tudo
              </button>
            </div>

            <div className="space-y-3">
              {[
                {
                  hora: '08:30',
                  periodo: 'AM',
                  titulo: 'Revisão: Cardiologia Intensiva',
                  subtitulo: 'Módulo 4: Arritmias Complexas',
                },
                {
                  hora: '10:45',
                  periodo: 'AM',
                  titulo: 'Simulado de Casos Clínicos',
                  subtitulo: 'Foco em Diagnóstico por Imagem',
                },
                {
                  hora: '14:00',
                  periodo: 'PM',
                  titulo: 'Mentoria Individual (AI)',
                  subtitulo: 'Ajuste de Cronograma Semanal',
                },
              ].map((item, index) => (
                <div
                  key={index}
                  className="flex items-center gap-4 p-3 rounded-2xl hover:bg-white/40 transition-all border border-transparent hover:border-white/50 group"
                >
                  <div className="flex flex-col items-center justify-center bg-primary/5 rounded-xl w-12 h-12 text-primary">
                    <span className="text-[0.55rem] font-bold uppercase">
                      {item.hora}
                    </span>

                    <span className="text-base font-bold">
                      {item.periodo}
                    </span>
                  </div>

                  <div className="flex-1">
                    <h4 className="font-heading-3 text-base text-on-surface">
                      {item.titulo}
                    </h4>

                    <p className="text-xs text-on-surface-variant opacity-60">
                      {item.subtitulo}
                    </p>
                  </div>

                  <span className="material-symbols-outlined text-primary opacity-0 group-hover:opacity-100 transition-opacity text-sm">
                    arrow_forward_ios
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Donut Chart */}
          <div className="bg-white/70 backdrop-blur-[40px] p-6 rounded-[2.5rem] shadow-[0_20px_50px_-12px_rgba(0,0,0,0.04)] flex flex-col items-center text-center">
            <h3 className="font-heading-2 text-heading-2 text-on-surface mb-5 w-full text-left">
              Distribuição de Estudos
            </h3>

            <div className="relative w-40 h-40 mb-5">
              <svg
                className="w-full h-full rotate-[-90deg]"
                viewBox="0 0 36 36"
              >
                <circle
                  cx="18"
                  cy="18"
                  fill="none"
                  r="15.915"
                  stroke="#f2f3fc"
                  strokeWidth="3"
                />

                <circle
                  cx="18"
                  cy="18"
                  fill="none"
                  r="15.915"
                  stroke="#005aa8"
                  strokeDasharray="45 100"
                  strokeWidth="3"
                />

                <circle
                  cx="18"
                  cy="18"
                  fill="none"
                  r="15.915"
                  stroke="#1773cf"
                  strokeDasharray="30 100"
                  strokeDashoffset="-45"
                  strokeWidth="3"
                />

                <circle
                  cx="18"
                  cy="18"
                  fill="none"
                  r="15.915"
                  stroke="#a6c8ff"
                  strokeDasharray="25 100"
                  strokeDashoffset="-75"
                  strokeWidth="3"
                />
              </svg>

              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                <div className="font-heading-2 text-[1.8rem] text-primary">
                  82%
                </div>

                <div className="text-[7px] font-bold uppercase tracking-widest text-on-surface-variant opacity-60">
                  Consolidado
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Pontos Fortes */}
          <div className="bg-white/70 backdrop-blur-[40px] p-6 rounded-[2.5rem] shadow-[0_20px_50px_-12px_rgba(0,0,0,0.04)] border-l-4 border-primary">
            <div className="flex items-center gap-3 mb-5">
              <span className="material-symbols-outlined text-primary">
                verified
              </span>

              <h3 className="font-heading-2 text-heading-2 text-on-surface">
                Pontos Fortes
              </h3>
            </div>

            <ul className="space-y-3">
              {[
                'Raciocínio Diagnóstico em Emergências Médicas.',
                'Consistência em Farmacologia Cardiovascular.',
                'Interpretação Avançada de ECG e Monitorização.',
              ].map((item, index) => (
                <li key={index} className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2" />

                  <p className="text-sm text-on-surface-variant">{item}</p>
                </li>
              ))}
            </ul>
          </div>

          {/* Pontos de Atenção */}
          <div className="bg-white/70 backdrop-blur-[40px] p-6 rounded-[2.5rem] shadow-[0_20px_50px_-12px_rgba(0,0,0,0.04)] border-l-4 border-error">
            <div className="flex items-center gap-3 mb-5">
              <span className="material-symbols-outlined text-error">
                warning
              </span>

              <h3 className="font-heading-2 text-heading-2 text-on-surface">
                Pontos de Atenção
              </h3>
            </div>

            <ul className="space-y-3">
              {[
                'Baixo rendimento em Nefrologia Clínica (Módulo 3).',
                'Tempo médio de resposta em simulados elevado.',
                'Necessidade de revisão urgente: Equilíbrio Ácido-Básico.',
              ].map((item, index) => (
                <li key={index} className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-error mt-2" />

                  <p className="text-sm text-error font-medium">{item}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
}