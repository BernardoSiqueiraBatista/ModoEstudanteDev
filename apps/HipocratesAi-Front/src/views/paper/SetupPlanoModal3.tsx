import { useEffect, useState } from 'react';
import SetupPlanoModal4 from './SetupPlanoModal4';

interface SetupPlanoModal3Props {
  open: boolean;
  onClose: () => void;
  onBack: () => void;
}

export default function SetupPlanoModal3({
  open,
  onClose,
  onBack,
}: SetupPlanoModal3Props) {
  const [openStep4, setOpenStep4] = useState(false);

  const [instructions, setInstructions] = useState(() => {
    return localStorage.getItem('setup-plano-instructions') || '';
  });
  const [horasDia, setHorasDia] = useState(() => {
    return Number(localStorage.getItem('setup-plano-horas-dia') || '2');
  });

  useEffect(() => {
    localStorage.setItem('setup-plano-instructions', instructions);
  }, [instructions]);

  useEffect(() => {
    localStorage.setItem('setup-plano-horas-dia', String(horasDia));
  }, [horasDia]);

  if (!open) return null;

  function handleNext() {
    setOpenStep4(true);
  }

  return (
    <>
      {/* STEP 3 */}
      {!openStep4 && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-[#001c3b]/10 backdrop-blur-sm">
          {/* BACKGROUND GLOW */}
          <div className="absolute top-[-10%] right-[-10%] w-[45%] h-[45%] bg-primary/10 blur-[120px] rounded-full pointer-events-none" />

          <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-tertiary/10 blur-[120px] rounded-full pointer-events-none" />

          {/* MODAL */}
          <div className="relative w-full max-w-[680px] overflow-hidden rounded-[2.5rem] border border-white/20 bg-white/75 backdrop-blur-[28px] shadow-[0_20px_50px_-12px_rgba(0,0,0,0.08)]">
            {/* Glow interno */}
            <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-primary/5 blur-[60px]" />

            <div className="relative z-10 p-6 md:p-10">
              {/* HEADER */}
              <header className="mb-10 flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-primary">
                    Processo de Inteligência
                  </span>

                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 animate-pulse rounded-full bg-cyan-400 shadow-[0_0_12px_rgba(34,211,238,0.9)]" />

                    <span className="text-[10px] font-semibold uppercase tracking-[0.1em] text-on-surface-variant">
                      Motor Hipócrates Ativo
                    </span>
                  </div>
                </div>

                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h1 className="text-3xl font-bold leading-none tracking-tight text-medical-navy md:text-[2.4rem]">
                      Configuração do Plano
                    </h1>

                    <p className="mt-2 text-sm text-on-surface-variant">
                      Etapa 3 de 4
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={onClose}
                    className="flex h-10 w-10 items-center justify-center rounded-full transition-all hover:bg-black/5 outline-none"
                  >
                    <span className="material-symbols-outlined text-on-surface-variant">
                      close
                    </span>
                  </button>
                </div>

                <p className="mt-2 text-sm leading-relaxed text-secondary">
                  Defina instruções específicas para personalizar o
                  comportamento da IA durante a criação do cronograma.
                </p>
              </header>

              {/* CONTENT */}
              <section className="flex flex-col gap-6">
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[20px] text-primary">
                      psychology
                    </span>

                    <label className="text-[15px] font-semibold text-on-surface">
                      Instruções da IA
                    </label>
                  </div>

                  {/* TEXTAREA */}
                  <div className="group relative">
                    <textarea
                      value={instructions}
                      onChange={(e) => setInstructions(e.target.value)}
                      placeholder="Focar em cardiologia preventiva e revisar protocolos de ACLS..."
                      className="h-48 w-full resize-none rounded-2xl border border-outline-variant/20 bg-white/60 p-5 text-on-surface backdrop-blur-md transition-all duration-300 placeholder:text-outline focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10"
                    />

                    <div className="pointer-events-none absolute inset-x-0 top-0 h-[1px] rounded-t-2xl bg-white/40" />
                  </div>

                  {/* INFO BOX */}
                  <div className="flex items-start gap-3 rounded-2xl border border-primary/10 bg-primary/5 p-4">
                    <span className="material-symbols-outlined text-[18px] text-primary">
                      info
                    </span>

                    <p className="text-sm leading-relaxed text-on-primary-fixed-variant">
                      Descreva objetivos específicos, áreas de dificuldade ou
                      temas prioritários. A IA utilizará essas informações para
                      otimizar o plano de estudos automaticamente.
                    </p>
                  </div>
                </div>

                {/* HORAS POR DIA */}
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[20px] text-primary">schedule</span>
                    <label className="text-[15px] font-semibold text-on-surface">
                      Horas de estudo por dia
                    </label>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {[1, 2, 3, 4, 6, 8].map((h) => (
                      <button
                        key={h}
                        type="button"
                        onClick={() => setHorasDia(h)}
                        className={`px-5 py-2 rounded-2xl text-sm font-bold transition-all border ${
                          horasDia === h
                            ? 'bg-primary text-white border-primary shadow-[0_4px_12px_rgba(0,90,168,0.3)]'
                            : 'bg-white/60 text-on-surface-variant border-outline-variant/20 hover:border-primary/40 hover:text-primary'
                        }`}
                      >
                        {h}h
                      </button>
                    ))}
                  </div>
                </div>
              </section>

              {/* FOOTER */}
              <footer className="mt-12 flex items-center justify-between border-t border-outline-variant/20 pt-8">
                <button
                  type="button"
                  onClick={onBack}
                  className="flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold text-secondary transition-all hover:bg-surface-container hover:text-medical-navy"
                >
                  <span className="material-symbols-outlined text-[20px]">
                    arrow_back
                  </span>

                  Anterior
                </button>

                <button
                  type="button"
                  onClick={handleNext}
                  className="flex items-center gap-2 rounded-full bg-primary px-8 py-3 text-sm font-bold uppercase tracking-[0.12em] text-white shadow-[0_6px_20px_rgba(0,90,168,0.35)] transition-all hover:-translate-y-0.5 active:scale-95"
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

      {/* STEP 4 */}
      {openStep4 && (
        <SetupPlanoModal4
          open={openStep4}
          onClose={() => {
            setOpenStep4(false);
            onClose();
          }}
          onBack={() => {
            setOpenStep4(false);
          }}
        />
      )}
    </>
  );
}