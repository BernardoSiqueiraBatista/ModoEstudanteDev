import { useState } from 'react';

const STUDENT_ID = 'e1925b44-9694-477c-a496-5e638e4a9e25';
const API = 'http://localhost:3333';

interface SetupPlanoModal4Props {
  open: boolean;
  onClose: () => void;
  onBack: () => void;
  onFinish?: () => void;
}

export default function SetupPlanoModal4({
  open,
  onClose,
  onBack,
  onFinish,
}: SetupPlanoModal4Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  const savedAreas: string[] = JSON.parse(localStorage.getItem('setup-plano-areas') || '[]');
  const savedCiclo: string = localStorage.getItem('setup-plano-ciclo') || 'mensal';
  const savedInstructions: string = localStorage.getItem('setup-plano-instructions') || '';
  const savedHorasDia: number = Number(localStorage.getItem('setup-plano-horas-dia') || '2');
  const savedCategoria: string = localStorage.getItem('setup-plano-categoria') || 'geral';
  const savedUploadId: string | null = localStorage.getItem('setup-plano-upload-id');
  const titulo = savedAreas.length > 0
    ? `Plano de ${savedAreas.slice(0, 2).join(' e ')}`
    : 'Plano de Estudos';

  async function handleFinish() {
    setLoading(true);
    setError(null);
    try {
      const instrucoes = savedInstructions.trim().length >= 3
        ? savedInstructions.trim()
        : 'Foco em residência médica e revisão clínica geral.';

      const res = await fetch(`${API}/student/v1/study-plans`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_id: STUDENT_ID,
          titulo,
          categoria: savedCategoria,
          duracao: savedCiclo,
          areas_foco: savedAreas.length > 0 ? savedAreas : ['Clínica Médica'],
          instrucoes,
          horas_dia: savedHorasDia,
          considerar_performance: false,
          ...(savedUploadId ? { uploads: [savedUploadId] } : {}),
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.mensagem?.[0]?.message ?? body?.erro ?? `Erro ${res.status}`);
      }

      localStorage.removeItem('setup-plano-areas');
      localStorage.removeItem('setup-plano-ciclo');
      localStorage.removeItem('setup-plano-instructions');
      localStorage.removeItem('setup-plano-horas-dia');
      localStorage.removeItem('setup-plano-categoria');
      localStorage.removeItem('setup-plano-upload-id');

      if (onFinish) {
        onFinish();
      } else {
        onClose();
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao criar plano.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-medical-navy/10 backdrop-blur-sm">
      {/* BACKGROUND GLOW */}
      <div className="absolute top-[-10%] right-[-10%] w-[45%] h-[45%] bg-primary/10 blur-[120px] rounded-full pointer-events-none" />

      <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-tertiary/10 blur-[120px] rounded-full pointer-events-none" />

      {/* MODAL */}
      <div className="relative w-full max-w-[640px] overflow-hidden rounded-[2.5rem] border border-white/20 bg-white/75 backdrop-blur-[28px] shadow-[0_20px_50px_-12px_rgba(0,0,0,0.08)]">
        {/* Glow interno */}
        <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-primary/5 blur-[60px]" />

        <div className="relative z-10 p-6 md:p-10">
          {/* HEADER */}
          <header className="flex flex-col gap-2 mb-8">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase tracking-[0.22em] font-bold text-primary">
                Processo de Inteligência
              </span>

              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_12px_rgba(34,211,238,0.9)] animate-pulse" />

                <span className="text-[10px] uppercase tracking-[0.1em] font-semibold text-on-surface-variant">
                  Motor Hipócrates Ativo
                </span>
              </div>
            </div>

            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="text-3xl md:text-[2.2rem] leading-none font-bold tracking-tight text-medical-navy">
                  Finalização do Plano
                </h1>

                <p className="text-sm text-on-surface-variant mt-2">
                  Etapa 4 de 4
                </p>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="w-10 h-10 rounded-full hover:bg-black/5 transition-all flex items-center justify-center outline-none"
              >
                <span className="material-symbols-outlined text-on-surface-variant">
                  close
                </span>
              </button>
            </div>

            <p className="text-sm leading-relaxed text-secondary mt-2">
              Seu plano personalizado foi estruturado com base nos objetivos e
              diretrizes definidas anteriormente.
            </p>
          </header>

          {/* CONTENT */}
          <section className="space-y-5">
            {/* GRID */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* CARD */}
              <div className="rounded-[1.5rem] border border-white/40 bg-white/60 backdrop-blur-md p-4 shadow-[0_10px_30px_rgba(0,0,0,0.03)]">
                <span className="block mb-3 text-[10px] uppercase tracking-[0.18em] font-bold text-secondary">
                  Foco Clínico
                </span>

                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-primary/10 flex items-center justify-center">
                    <span className="material-symbols-outlined text-primary">
                      local_hospital
                    </span>
                  </div>

                  <div>
                    <h3 className="font-bold text-medical-navy text-sm">
                      {savedAreas.length > 0 ? savedAreas[0] : 'Clínica Médica'}
                    </h3>

                    <p className="text-xs text-secondary">
                      {savedAreas.length > 1 ? `+ ${savedAreas.length - 1} área(s)` : 'Área principal'}
                    </p>
                  </div>
                </div>
              </div>

              {/* CARD */}
              <div className="rounded-[1.5rem] border border-white/40 bg-white/60 backdrop-blur-md p-4 shadow-[0_10px_30px_rgba(0,0,0,0.03)]">
                <span className="block mb-3 text-[10px] uppercase tracking-[0.18em] font-bold text-secondary">
                  Ciclo
                </span>

                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-primary/10 flex items-center justify-center">
                    <span className="material-symbols-outlined text-primary">
                      calendar_month
                    </span>
                  </div>

                  <div>
                    <h3 className="font-bold text-medical-navy text-sm">
                      {savedCiclo.charAt(0).toUpperCase() + savedCiclo.slice(1)}
                    </h3>

                    <p className="text-xs text-secondary">
                      Rotina planejada
                    </p>
                  </div>
                </div>
              </div>

              {/* CARD */}
              <div className="rounded-[1.5rem] border border-white/40 bg-white/60 backdrop-blur-md p-4 shadow-[0_10px_30px_rgba(0,0,0,0.03)]">
                <span className="block mb-3 text-[10px] uppercase tracking-[0.18em] font-bold text-secondary">
                  Dedicação
                </span>

                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-primary/10 flex items-center justify-center">
                    <span className="material-symbols-outlined text-primary">
                      speed
                    </span>
                  </div>

                  <div>
                    <h3 className="font-bold text-medical-navy text-sm">
                      {savedHorasDia}h por dia
                    </h3>

                    <p className="text-xs text-secondary">
                      {savedHorasDia >= 6 ? 'Rotina intensa' : savedHorasDia >= 3 ? 'Rotina moderada' : 'Rotina leve'}
                    </p>
                  </div>
                </div>
              </div>

              {/* CARD */}
              <div className="rounded-[1.5rem] border border-white/40 bg-white/60 backdrop-blur-md p-4 shadow-[0_10px_30px_rgba(0,0,0,0.03)]">
                <span className="block mb-3 text-[10px] uppercase tracking-[0.18em] font-bold text-secondary">
                  Início
                </span>

                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-primary/10 flex items-center justify-center">
                    <span className="material-symbols-outlined text-primary">
                      calendar_today
                    </span>
                  </div>

                  <div>
                    <h3 className="font-bold text-medical-navy text-sm">
                      Imediatamente
                    </h3>

                    <p className="text-xs text-secondary">
                      Plano pronto
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* ERRO */}
            {error && (
              <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-600 font-semibold">
                {error}
              </div>
            )}
          </section>

          {/* FOOTER */}
          <footer className="mt-10 pt-6 border-t border-outline-variant/20 flex flex-col md:flex-row items-center justify-between gap-4">
            <button
              type="button"
              onClick={onBack}
              className="w-full md:w-auto flex items-center justify-center gap-2 px-6 py-3 rounded-full text-sm font-semibold text-secondary hover:text-medical-navy hover:bg-surface-container transition-all"
            >
              <span className="material-symbols-outlined text-[20px]">
                arrow_back
              </span>

              Anterior
            </button>

            <button
              type="button"
              onClick={handleFinish}
              disabled={loading}
              className="w-full md:w-auto flex items-center justify-center gap-2 px-8 py-3 rounded-full bg-primary text-white text-sm font-bold tracking-[0.12em] uppercase shadow-[0_6px_20px_rgba(0,90,168,0.35)] hover:-translate-y-0.5 active:scale-95 transition-all disabled:opacity-70"
            >
              {loading ? (
                <>
                  Gerando Plano...

                  <span className="material-symbols-outlined animate-spin text-[20px]">
                    progress_activity
                  </span>
                </>
              ) : (
                <>
                  Concluir

                  <span className="material-symbols-outlined text-[20px]">
                    check_circle
                  </span>
                </>
              )}
            </button>
          </footer>
        </div>
      </div>
    </div>
  );
}
