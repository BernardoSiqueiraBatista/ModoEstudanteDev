import { useState } from 'react';
import SetupPlanoModal3 from './SetupPlanoModal3';

interface SetupPlanoModal2Props {
  open: boolean;
  onClose: () => void;
  onBack: () => void;
  onNext?: () => void;
}

export default function SetupPlanoModal2({
  open,
  onClose,
  onBack,
}: SetupPlanoModal2Props) {
  const [openStep3, setOpenStep3] = useState(false);

  const [cicloSelecionado, setCicloSelecionado] =
    useState<string>('Mensal');

  if (!open) return null;

  const ciclos = [
    {
      nome: 'Semanal',
      icon: 'calendar_view_week',
    },
    {
      nome: 'Mensal',
      icon: 'calendar_month',
    },
    {
      nome: 'Trimestral',
      icon: 'grid_view',
    },
    {
      nome: 'Anual',
      icon: 'calendar_today',
    },
  ];

  function handleNext() {
    setOpenStep3(true);
  }

  return (
    <>
      {/* ETAPA 2 */}
      {!openStep3 && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-medical-navy/10 backdrop-blur-sm">
          {/* BACKGROUND GLOW */}
          <div className="absolute top-[-10%] right-[-10%] w-[45%] h-[45%] bg-primary/10 blur-[120px] rounded-full pointer-events-none" />

          <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-tertiary/10 blur-[120px] rounded-full pointer-events-none" />

          {/* MODAL */}
          <div className="relative w-full max-w-[640px] overflow-hidden rounded-[2.5rem] border border-white/20 bg-white/75 backdrop-blur-[28px] shadow-[0_20px_50px_-12px_rgba(0,0,0,0.08)]">
            <div className="p-6 md:p-10">
              {/* HEADER */}
              <header className="flex flex-col gap-2 mb-10">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase tracking-[0.22em] font-bold text-primary">
                    Processo de Inteligência
                  </span>

                  <div className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_12px_rgba(34,211,238,0.9)] animate-pulse" />
                </div>

                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h1 className="text-3xl md:text-[2.4rem] leading-none font-bold tracking-tight text-medical-navy">
                      Configuração do Plano
                    </h1>

                    <p className="text-sm text-on-surface-variant mt-2">
                      Etapa 2 de 4
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={onClose}
                    className="w-10 h-10 rounded-full hover:bg-black/5 transition-colors flex items-center justify-center outline-none border-none focus:outline-none"
                  >
                    <span className="material-symbols-outlined text-on-surface-variant">
                      close
                    </span>
                  </button>
                </div>

                <p className="text-sm leading-relaxed text-secondary mt-2">
                  Defina a estrutura temporal e forneça a base acadêmica para
                  sua personalização.
                </p>
              </header>

              {/* DURAÇÃO */}
              <section className="space-y-8">
                <div>
                  <label className="block mb-4 text-[10px] uppercase tracking-[0.22em] font-bold text-on-surface-variant">
                    Duração e Ciclo
                  </label>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {ciclos.map((ciclo) => {
                      const ativo =
                        cicloSelecionado === ciclo.nome;

                      return (
                        <button
                          key={ciclo.nome}
                          type="button"
                          onClick={() =>
                            setCicloSelecionado(ciclo.nome)
                          }
                          className={`group flex flex-col items-center justify-center p-4 rounded-2xl transition-all duration-300 border outline-none focus:outline-none active:scale-95
                          ${
                            ativo
                              ? 'bg-primary/10 border-primary shadow-[0_10px_30px_rgba(0,90,168,0.15)]'
                              : 'bg-white/60 border-white/40 hover:border-primary/40 hover:bg-primary/5'
                          }`}
                        >
                          <span
                            className={`material-symbols-outlined mb-2 transition-colors
                            ${
                              ativo
                                ? 'text-primary'
                                : 'text-outline group-hover:text-primary'
                            }`}
                          >
                            {ciclo.icon}
                          </span>

                          <span
                            className={`text-sm font-semibold transition-colors
                            ${
                              ativo
                                ? 'text-primary'
                                : 'text-on-surface-variant group-hover:text-primary'
                            }`}
                          >
                            {ciclo.nome}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* UPLOAD */}
                <div>
                  <label className="block mb-4 text-[10px] uppercase tracking-[0.22em] font-bold text-on-surface-variant">
                    Base de Conhecimento
                  </label>

                  <div className="relative group">
                    <div className="border-2 border-dashed border-outline-variant rounded-[2rem] p-10 flex flex-col items-center justify-center bg-white/40 hover:bg-white/70 hover:border-primary transition-all cursor-pointer">
                      <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                        <span className="material-symbols-outlined text-primary text-4xl">
                          upload_file
                        </span>
                      </div>

                      <h3 className="text-lg font-bold text-medical-navy mb-1 text-center">
                        Anexar materiais de base
                      </h3>

                      <p className="text-sm text-secondary text-center">
                        PDFs, editais, exercícios e resumos clínicos
                      </p>
                    </div>

                    <input
                      type="file"
                      multiple
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                  </div>
                </div>
              </section>

              {/* FOOTER */}
              <footer className="flex items-center justify-between mt-12 pt-8 border-t border-outline-variant/20">
                <button
                  type="button"
                  onClick={onBack}
                  className="flex items-center gap-2 px-6 py-3 rounded-full text-sm font-semibold text-secondary hover:text-medical-navy hover:bg-surface-container transition-all"
                >
                  <span className="material-symbols-outlined text-[20px]">
                    arrow_back
                  </span>

                  Anterior
                </button>

                <button
                  type="button"
                  onClick={handleNext}
                  className="flex items-center gap-2 px-8 py-3 rounded-full bg-primary text-white text-sm font-bold tracking-[0.12em] uppercase shadow-[0_6px_20px_rgba(0,90,168,0.35)] hover:-translate-y-0.5 active:scale-95 transition-all"
                >
                  Próximo

                  <span className="material-symbols-outlined text-[20px]">
                    arrow_forward
                  </span>
                </button>
              </footer>
            </div>
          </div>
        </div>
      )}

      {/* ETAPA 3 */}
      {openStep3 && (
        <SetupPlanoModal3
          open={openStep3}
          onClose={() => {
            setOpenStep3(false);
            onClose();
          }}
          onBack={() => {
            setOpenStep3(false);
          }}
        />
      )}
    </>
  );
}