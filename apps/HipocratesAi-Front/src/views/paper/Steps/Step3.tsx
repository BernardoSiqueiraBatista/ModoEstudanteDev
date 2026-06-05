import { useEffect, useState } from 'react';

export default function Step3({ onNext, onBack, onClose }: { onNext: () => void; onBack: () => void; onClose: () => void }) {
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

  return (
    <>
      {/* HEADER FIXO */}
      <div className="p-6 md:px-10 md:pt-8 md:pb-4 shrink-0 relative z-10 border-b border-outline-variant/10">
        <header className="flex flex-col gap-2">
          
          <div className="flex items-start justify-between gap-4">
            <div>
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-medical-navy">Configuração do Plano</h2>
          <p className="text-sm text-on-surface-variant mt-1">Etapa 3 de 4</p>
          <div className="flex items-center gap-1.5">
            <div className="h-2.5 w-2.5 rounded-full border border-gray-400 bg-transparent" />
            <div className="h-2.5 w-2.5 rounded-full border border-gray-400 bg-transparent" />
            <div className="h-2.5 w-2.5 rounded-full border bg-primary" />
            <div className="h-2.5 w-2.5 rounded-full border border-gray-400 bg-transparent" />
        </div>
        </div>
            <button type="button" onClick={onClose} className="flex h-10 w-10 items-center justify-center rounded-full transition-all hover:bg-black/5 outline-none">
              <span className="material-symbols-outlined text-on-surface-variant">close</span>
            </button>
          </div>
        </header>
      </div>

      {/* CONTEÚDO COM SCROLL */}
      <div className="flex-1 overflow-y-auto px-6 md:px-10 py-6 relative z-10">
        <section className="flex flex-col gap-6">
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[20px] text-primary">psychology</span>
              <label className="text-[15px] font-semibold text-on-surface">Instruções da IA</label>
            </div>
            <div className="group relative">
              <textarea
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                placeholder="Focar em cardiologia preventiva e revisar protocolos de ACLS..."
                className="h-48 w-full resize-none rounded-2xl border border-outline-variant/20 bg-white/60 p-5 text-on-surface backdrop-blur-md transition-all duration-300 placeholder:text-outline focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10"
              />
              <div className="pointer-events-none absolute inset-x-0 top-0 h-[1px] rounded-t-2xl bg-white/40" />
            </div>
            <div className="flex items-start gap-3 rounded-2xl border border-primary/10 bg-primary/5 p-4">
              <span className="material-symbols-outlined text-[18px] text-primary">info</span>
              <p className="text-sm leading-relaxed text-on-primary-fixed-variant">
                Descreva objetivos específicos, áreas de dificuldade ou temas prioritários. A IA utilizará essas informações para otimizar o plano de estudos automaticamente.
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[20px] text-primary">schedule</span>
              <label className="text-[15px] font-semibold text-on-surface">Horas de estudo por dia</label>
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
      </div>

      {/* FOOTER FIXO */}
      <div className="p-6 md:px-10 py-5 border-t border-outline-variant/10 bg-white/30 backdrop-blur-xl shrink-0 relative z-10">
        <footer className="flex items-center justify-between">
          <button type="button" onClick={onBack} className="flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold text-secondary transition-all hover:bg-surface-container hover:text-medical-navy">
            <span className="material-symbols-outlined text-[20px]">arrow_back</span>
            Anterior
          </button>
          <button type="button" onClick={onNext} className="flex items-center gap-2 rounded-full bg-primary px-8 py-3 text-sm font-bold uppercase tracking-[0.12em] text-white shadow-[0_6px_20px_rgba(0,90,168,0.35)] transition-all hover:-translate-y-0.5 active:scale-95">
            Próximo
            <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
          </button>
        </footer>
      </div>
    </>
  );
}