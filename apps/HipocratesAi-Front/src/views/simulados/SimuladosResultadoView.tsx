export default function SimuladosResultadoView() {
  return (
    <div className="min-h-screen bg-surface text-on-surface font-body relative overflow-hidden">
      {/* Decorative Blur */}
      <div className="fixed -bottom-24 -left-24 w-96 h-96 bg-secondary/5 rounded-full blur-[100px] -z-10" />
      <div className="fixed -top-24 -right-24 w-96 h-96 bg-secondary/5 rounded-full blur-[100px] -z-10" />

      <main className="pt-24 pb-20 px-6 max-w-7xl mx-auto min-h-screen flex flex-col items-center">
        {/* Hero */}
        <section className="w-full text-center mb-16 mt-8">
          <div className="inline-flex items-center justify-center p-4 mb-6 rounded-full bg-secondary-container/30 text-secondary">
            <span
              className="material-symbols-outlined text-4xl"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              check_circle
            </span>
          </div>

          <h1 className="text-5xl font-extrabold tracking-tighter mb-4 text-on-surface">
            Simulado Finalizado com Sucesso
          </h1>

          <p className="text-on-surface-variant text-lg max-w-2xl mx-auto">
            Sua jornada de residência continua. Analise seu desempenho detalhadamente
            para focar onde realmente importa.
          </p>
        </section>

        {/* Metrics */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full mb-16">
          {/* Total */}
          <div className="bg-white/70 backdrop-blur-2xl rounded-3xl p-8 shadow-[0_12px_40px_rgba(41,52,58,0.06)] flex flex-col items-center justify-center text-center group hover:scale-[1.02] transition-transform duration-300">
            <span className="text-xs font-medium uppercase tracking-widest text-on-surface-variant mb-4">
              Total de Questões
            </span>

            <span className="text-5xl font-bold text-on-surface mb-2">
              50
            </span>

            <span className="text-on-surface-variant font-medium">
              Questões Finalizadas
            </span>
          </div>

          {/* Acertos */}
          <div className="bg-white/70 backdrop-blur-2xl rounded-3xl p-8 shadow-[0_12px_40px_rgba(41,52,58,0.06)] flex flex-col items-center justify-center text-center group hover:scale-[1.02] transition-transform duration-300">
            <span className="text-xs font-medium uppercase tracking-widest text-on-surface-variant mb-4">
              Acertos Totais
            </span>

            <span className="text-5xl font-bold text-secondary mb-2">
              42
            </span>

            <span className="text-on-surface-variant font-medium">
              Respostas Corretas
            </span>
          </div>

          {/* Aproveitamento */}
          <div className="bg-white/70 backdrop-blur-2xl rounded-3xl p-8 shadow-[0_12px_40px_rgba(41,52,58,0.06)] flex flex-col items-center justify-center text-center relative overflow-hidden group hover:scale-[1.02] transition-transform duration-300">
            <div className="absolute inset-0 opacity-5 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-secondary to-transparent" />

            <span className="text-xs font-medium uppercase tracking-widest text-on-surface-variant mb-4">
              Aproveitamento Final
            </span>

            <div className="relative flex items-center justify-center">
              <svg className="w-32 h-32 transform -rotate-90">
                <circle
                  className="text-surface-container-high"
                  cx="64"
                  cy="64"
                  fill="transparent"
                  r="58"
                  stroke="currentColor"
                  strokeWidth="8"
                />

                <circle
                  className="text-secondary"
                  cx="64"
                  cy="64"
                  fill="transparent"
                  r="58"
                  stroke="currentColor"
                  strokeDasharray="364.42"
                  strokeDashoffset="58.3"
                  strokeWidth="8"
                />
              </svg>

              <span className="absolute text-3xl font-extrabold text-on-surface">
                84%
              </span>
            </div>

            <span className="mt-4 text-on-surface-variant font-medium">
              Acima da média geral
            </span>
          </div>
        </section>

        {/* Analysis */}
        <section className="w-full max-w-5xl mb-16">
          <div className="bg-white/70 backdrop-blur-2xl rounded-3xl p-10 shadow-[0_12px_40px_rgba(41,52,58,0.06)] relative overflow-hidden">
            <div className="flex items-start gap-8 flex-col lg:flex-row">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-6">
                  <span
                    className="material-symbols-outlined text-secondary"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    analytics
                  </span>

                  <h2 className="text-2xl font-bold tracking-tight text-on-surface">
                    Performance Analysis
                  </h2>
                </div>

                <p className="text-on-surface-variant leading-relaxed text-lg mb-8">
                  Seu desempenho em{' '}
                  <span className="font-bold text-on-surface">
                    Ginecologia e Obstetrícia
                  </span>{' '}
                  foi exemplar, com 100% de aproveitamento nos temas de pré-natal.
                  Notamos uma oportunidade de melhoria em{' '}
                  <span className="font-bold text-on-surface">
                    Cirurgia Geral
                  </span>
                  , especificamente em trauma abdominal. O foco em revisar os
                  protocolos ATLS de 10ª edição será o seu diferencial para a
                  próxima etapa.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Fortes */}
                  <div className="bg-surface-container-low p-5 rounded-2xl">
                    <h4 className="text-xs uppercase tracking-widest text-secondary font-bold mb-3 flex items-center gap-2">
                      <span className="material-symbols-outlined text-sm">
                        trending_up
                      </span>
                      Pontos Fortes
                    </h4>

                    <ul className="space-y-2 text-on-surface-variant text-sm">
                      <li className="flex items-center gap-2">
                        <div className="w-1 h-1 rounded-full bg-secondary" />
                        Ginecologia & Obstetrícia
                      </li>

                      <li className="flex items-center gap-2">
                        <div className="w-1 h-1 rounded-full bg-secondary" />
                        Pediatria (Infectologia)
                      </li>
                    </ul>
                  </div>

                  {/* Revisão */}
                  <div className="bg-surface-container-low p-5 rounded-2xl">
                    <h4 className="text-xs uppercase tracking-widest text-on-surface-variant font-bold mb-3 flex items-center gap-2">
                      <span className="material-symbols-outlined text-sm">
                        priority_high
                      </span>
                      Focar Revisão
                    </h4>

                    <ul className="space-y-2 text-on-surface-variant text-sm">
                      <li className="flex items-center gap-2">
                        <div className="w-1 h-1 rounded-full bg-outline" />
                        Cirurgia Geral (Trauma)
                      </li>

                      <li className="flex items-center gap-2">
                        <div className="w-1 h-1 rounded-full bg-outline" />
                        Nefrologia (IRA)
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Image */}
              <div className="w-full lg:w-72 h-72 rounded-2xl overflow-hidden relative group">
                <img
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  src="https://lh3.googleusercontent.com/aida/ADBb0uh99ANy2CBpUb84u2lGxwAO2ECWPnAmDALsh4qDi9cIysJrT_I-BfNrXupStycpQTo-_4QdGOZSlWNKKB1nfxfr5vx0CYVpwtpF0Zzk35iMm3nxxEjEPZSfkpf8pNAi2EQzSvRtxaM_-yIZWF7MC4qWugeMhDGSSRoI7re3_ONPEHqNvMXKIQx5HARf8VjYRrLTJB6xjkeFmNUhTfwKuRnpuwn-z2fejfjQ68uu8QjkrdpIfIeiraxJgLncSBgfKSlNOGVzCq9Vtl0"
                  alt="Analytics"
                />

                <div className="absolute inset-0 bg-gradient-to-t from-secondary/40 to-transparent" />
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="flex flex-col sm:flex-row items-center gap-4 w-full justify-center">
          <button className="w-full sm:w-auto px-10 py-5 bg-secondary text-on-secondary rounded-full font-bold text-lg shadow-[0_8px_32px_rgba(82,96,115,0.2)] hover:scale-105 active:scale-95 transition-all duration-300 flex items-center justify-center gap-3">
            Ver Correção Detalhada

            <span className="material-symbols-outlined">
              arrow_forward
            </span>
          </button>

          <button className="w-full sm:w-auto px-10 py-5 bg-transparent border-2 border-secondary/20 text-secondary rounded-full font-bold text-lg hover:bg-secondary/5 transition-all duration-300">
            Voltar para a Central de Simulados
          </button>
        </section>
      </main>
    </div>
  );
}