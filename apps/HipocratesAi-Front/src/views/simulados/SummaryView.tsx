export default function SummaryView() {
  return (
    <div className="bg-white text-on-surface antialiased selection:bg-primary/10 min-h-screen">
      

      <main className="pt-32 pb-24 px-6 max-w-5xl mx-auto">
        {/* Title */}
        <div className="text-center mb-16 animate-in fade-in slide-in-from-top-4 duration-700">
          <div className="flex items-center justify-center gap-2 mb-4">
            <span
              className="material-symbols-outlined text-primary text-[20px]"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              check_circle
            </span>

            <span className="text-xs font-bold tracking-[0.2em] uppercase text-primary/80">
              Simulation Completed
            </span>
          </div>

          <h1 className="font-serif text-4xl md:text-5xl font-normal text-on-surface mb-4">
            Caso #482:{" "}
            <span className="italic">
              Insuficiência Cardíaca Agudizada
            </span>
          </h1>

          <p className="text-on-surface-variant/70 text-sm font-medium">
            14 de Outubro, 2023 • Dr. Carlos Eduardo
          </p>
        </div>

        {/* Metrics */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          {/* Aproveitamento */}
          <div className="bg-white/80 backdrop-blur-xl border border-outline-variant/60 p-8 rounded-3xl flex flex-col items-center justify-center shadow-soft text-center hover:shadow-glass transition-all duration-500">
            <div className="relative w-32 h-32 mb-6 flex items-center justify-center">
              <svg className="w-full h-full">
                <circle
                  className="text-slate-100"
                  cx="64"
                  cy="64"
                  fill="transparent"
                  r="58"
                  stroke="currentColor"
                  strokeWidth="6"
                />

                <circle
                  className="text-primary -rotate-90 origin-center transition-all duration-1000"
                  cx="64"
                  cy="64"
                  fill="transparent"
                  r="58"
                  stroke="currentColor"
                  strokeDasharray="364.4"
                  strokeDashoffset="54.6"
                  strokeLinecap="round"
                  strokeWidth="6"
                />
              </svg>

              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-3xl font-bold tracking-tighter text-on-surface">
                  85%
                </span>
              </div>
            </div>

            <h3 className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">
              Aproveitamento
            </h3>
          </div>

          {/* Questões */}
          <div className="bg-white/80 backdrop-blur-xl border border-outline-variant/60 p-8 rounded-3xl flex flex-col items-center justify-center shadow-soft text-center hover:shadow-glass transition-all duration-500">
            <div className="h-12 w-12 rounded-full bg-slate-50 flex items-center justify-center mb-6 text-primary">
              <span className="material-symbols-outlined">quiz</span>
            </div>

            <div className="text-4xl font-bold tracking-tighter mb-1">
              45
            </div>

            <h3 className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">
              Questões Totais
            </h3>
          </div>

          {/* Acertos */}
          <div className="bg-white/80 backdrop-blur-xl border border-outline-variant/60 p-8 rounded-3xl flex flex-col items-center justify-center shadow-soft text-center hover:shadow-glass transition-all duration-500">
            <div className="h-12 w-12 rounded-full bg-slate-50 flex items-center justify-center mb-6 text-primary">
              <span className="material-symbols-outlined">
                check_circle
              </span>
            </div>

            <div className="text-4xl font-bold tracking-tighter mb-1">
              38
            </div>

            <h3 className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">
              Acertos
            </h3>
          </div>
        </section>

        {/* Analysis */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-16">
          {/* Main Card */}
          <div className="lg:col-span-2 bg-white border border-outline-variant/60 rounded-[2.5rem] p-10 shadow-soft">
            <div className="flex items-center gap-3 mb-8">
              <span
                className="material-symbols-outlined text-primary"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                auto_awesome
              </span>

              <h2 className="text-xl font-bold tracking-tight">
                Resumo da Seção
              </h2>
            </div>

            <div className="text-on-surface-variant leading-relaxed space-y-6 text-[15px]">
              <p>
                O manejo clínico foi caracterizado por uma{" "}
                <strong className="text-on-surface">
                  rápida identificação da congestão pulmonar
                </strong>{" "}
                e início imediato de oxigenoterapia. O Dr. Carlos
                demonstrou excelente julgamento clínico ao optar pelo
                uso de diuréticos de alça intravenosos precocemente, o
                que resultou na estabilização hemodinâmica do paciente
                em tempo recorde.
              </p>

              <p>
                Contudo, houve um atraso na solicitação do
                ecocardiograma transtorácico inicial, o que poderia ter
                retardado o diagnóstico etiológico em um cenário real.
                A transição para terapia oral foi manejada com precisão,
                seguindo as diretrizes mais recentes da Sociedade
                Brasileira de Cardiologia.
              </p>
            </div>

            {/* Strengths & Review */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-12 pt-10 border-t border-outline-variant/40">
              {/* Pontos fortes */}
              <div>
                <h4 className="text-sm font-bold uppercase tracking-wider text-primary mb-4 flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px]">
                    verified
                  </span>

                  Pontos Fortes
                </h4>

                <ul className="space-y-3">
                  {[
                    "Diagnóstico diferencial de dispneia aguda.",
                    "Manejo farmacológico de ICA perfil B.",
                  ].map((item, index) => (
                    <li
                      key={index}
                      className="flex items-start gap-3 text-[14px]"
                    >
                      <span className="h-1.5 w-1.5 rounded-full bg-primary/40 mt-1.5 flex-shrink-0" />

                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Revisão */}
              <div>
                <h4 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-4 flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px]">
                    error
                  </span>

                  Focar Revisão
                </h4>

                <ul className="space-y-3">
                  {[
                    "Tempo para solicitação de exames de imagem.",
                    "Ajuste de dose de IECA no cenário de hipocalemia.",
                  ].map((item, index) => (
                    <li
                      key={index}
                      className="flex items-start gap-3 text-[14px]"
                    >
                      <span className="h-1.5 w-1.5 rounded-full bg-slate-300 mt-1.5 flex-shrink-0" />

                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-on-surface-variant/60 px-4">
              Sugestões de Próximos Passos
            </h3>

            {[
              {
                icon: "menu_book",
                title: "Review Cardiology Protocols",
                subtitle: "SBC 2023 Updates",
              },
              {
                icon: "smart_toy",
                title: "Deep Dive with Plantão AI",
                subtitle: "Ask about IECA contraindications",
              },
            ].map((item, index) => (
              <div
                key={index}
                className="bg-white border border-outline-variant/50 p-5 rounded-2xl flex items-center gap-4 hover:shadow-soft transition-all cursor-pointer group"
              >
                <div className="h-10 w-10 rounded-xl bg-slate-50 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all">
                  <span className="material-symbols-outlined text-[20px]">
                    {item.icon}
                  </span>
                </div>

                <div>
                  <p className="text-sm font-bold">{item.title}</p>

                  <p className="text-[11px] text-on-surface-variant/60 font-medium uppercase tracking-wider">
                    {item.subtitle}
                  </p>
                </div>
              </div>
            ))}

            {/* Milestone */}
            <div className="p-6 rounded-2xl bg-slate-900 text-white shadow-xl">
              <p className="text-[10px] font-bold uppercase tracking-widest text-white/50 mb-3">
                Próximo Marco
              </p>

              <p className="text-sm font-medium mb-4 leading-relaxed">
                Faltam 5 simulações para o nível{" "}
                <span className="text-primary brightness-150 font-bold">
                  Residente Avançado
                </span>
                .
              </p>

              <div className="w-full bg-white/10 h-1 rounded-full overflow-hidden">
                <div className="bg-primary h-full w-[60%] shadow-[0_0_8px_rgba(51,102,204,0.8)]" />
              </div>
            </div>
          </div>
        </section>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-8">
          <button className="w-full sm:w-auto px-10 py-4 rounded-full bg-primary text-white font-bold text-sm shadow-glass hover:shadow-primary/20 hover:-translate-y-0.5 transition-all active:scale-95">
            Ver Correção Detalhada
          </button>

          <button className="w-full sm:w-auto px-10 py-4 rounded-full bg-white border border-outline-variant/60 text-on-surface-variant font-bold text-sm hover:bg-slate-50 transition-all active:scale-95">
            Voltar para a Central
          </button>
        </div>
      </main>
    </div>
  );
}