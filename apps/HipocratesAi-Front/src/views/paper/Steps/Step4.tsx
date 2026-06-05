import { useState } from 'react';

const STUDENT_ID = 'e1925b44-9694-477c-a496-5e638e4a9e25';
const API = 'http://localhost:3333';

export default function Step4({ onBack, onClose, onFinish }: { onBack: () => void; onClose: () => void; onFinish: () => void }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const savedAreas: string[] = JSON.parse(localStorage.getItem('setup-plano-areas') || '[]');
  const savedCiclo: string = localStorage.getItem('setup-plano-ciclo') || 'mensal';
  const savedInstructions: string = localStorage.getItem('setup-plano-instructions') || '';
  const savedHorasDia: number = Number(localStorage.getItem('setup-plano-horas-dia') || '2');
  const savedCategoria: string = localStorage.getItem('setup-plano-categoria') || 'geral';
  const savedUploadId: string | null = localStorage.getItem('setup-plano-upload-id');
  const titulo = savedAreas.length > 0 ? `Plano de ${savedAreas.slice(0, 2).join(' e ')}` : 'Plano de Estudos';

  async function handleFinish() {
    setLoading(true);
    setError(null);
    try {
      const instrucoes = savedInstructions.trim().length >= 3 ? savedInstructions.trim() : 'Foco em residência médica e revisão clínica geral.';
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

      ['setup-plano-areas', 'setup-plano-ciclo', 'setup-plano-instructions', 'setup-plano-horas-dia', 'setup-plano-categoria', 'setup-plano-upload-id'].forEach(k => localStorage.removeItem(k));
      onFinish();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao criar plano.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {/* HEADER FIXO */}
      <div className="p-6 md:px-10 md:pt-8 md:pb-4 shrink-0 relative z-10 border-b border-outline-variant/10">
        <header className="flex flex-col gap-2">
          
          <div className="flex items-start justify-between gap-4">
            <div>
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-medical-navy">Finalização do Plano</h2>
          <p className="text-sm text-on-surface-variant mt-1">Etapa 4 de 4</p>
          <div className="flex items-center gap-1.5">
            <div className="h-2.5 w-2.5 rounded-full border border-gray-400 bg-transparent" /> 
            <div className="h-2.5 w-2.5 rounded-full border border-gray-400 bg-transparent" />
            <div className="h-2.5 w-2.5 rounded-full border border-gray-400 bg-transparent" />
            <div className="h-2.5 w-2.5 rounded-full bg-primary" />
        </div>
        </div>
            <button type="button" onClick={onClose} className="w-10 h-10 rounded-full hover:bg-black/5 transition-all flex items-center justify-center outline-none">
              <span className="material-symbols-outlined text-on-surface-variant">close</span>
            </button>
          </div>
        </header>
      </div>

      {/* CONTEÚDO COM SCROLL */}
      <div className="flex-1 overflow-y-auto px-6 md:px-10 py-6 relative z-10">
        <section className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* CARDS IDÊNTICOS AO ORIGINAL */}
            <div className="rounded-[1.5rem] border border-white/40 bg-white/60 backdrop-blur-md p-4 shadow-[0_10px_30px_rgba(0,0,0,0.03)]">
              <span className="block mb-3 text-[10px] uppercase tracking-[0.18em] font-bold text-secondary">Foco Clínico</span>
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-primary/10 flex items-center justify-center">
                  <span className="material-symbols-outlined text-primary">local_hospital</span>
                </div>
                <div>
                  <h3 className="font-bold text-medical-navy text-sm">{savedAreas.length > 0 ? savedAreas[0] : 'Clínica Médica'}</h3>
                  <p className="text-xs text-secondary">{savedAreas.length > 1 ? `+ ${savedAreas.length - 1} área(s)` : 'Área principal'}</p>
                </div>
              </div>
            </div>

            <div className="rounded-[1.5rem] border border-white/40 bg-white/60 backdrop-blur-md p-4 shadow-[0_10px_30px_rgba(0,0,0,0.03)]">
              <span className="block mb-3 text-[10px] uppercase tracking-[0.18em] font-bold text-secondary">Ciclo</span>
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-primary/10 flex items-center justify-center">
                  <span className="material-symbols-outlined text-primary">calendar_month</span>
                </div>
                <div>
                  <h3 className="font-bold text-medical-navy text-sm">{savedCiclo.charAt(0).toUpperCase() + savedCiclo.slice(1)}</h3>
                  <p className="text-xs text-secondary">Rotina planejada</p>
                </div>
              </div>
            </div>

            <div className="rounded-[1.5rem] border border-white/40 bg-white/60 backdrop-blur-md p-4 shadow-[0_10px_30px_rgba(0,0,0,0.03)]">
              <span className="block mb-3 text-[10px] uppercase tracking-[0.18em] font-bold text-secondary">Dedicação</span>
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-primary/10 flex items-center justify-center">
                  <span className="material-symbols-outlined text-primary">speed</span>
                </div>
                <div>
                  <h3 className="font-bold text-medical-navy text-sm">{savedHorasDia}h por dia</h3>
                  <p className="text-xs text-secondary">{savedHorasDia >= 6 ? 'Rotina intensa' : savedHorasDia >= 3 ? 'Rotina moderada' : 'Rotina leve'}</p>
                </div>
              </div>
            </div>

            <div className="rounded-[1.5rem] border border-white/40 bg-white/60 backdrop-blur-md p-4 shadow-[0_10px_30px_rgba(0,0,0,0.03)]">
              <span className="block mb-3 text-[10px] uppercase tracking-[0.18em] font-bold text-secondary">Início</span>
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-primary/10 flex items-center justify-center">
                  <span className="material-symbols-outlined text-primary">calendar_today</span>
                </div>
                <div>
                  <h3 className="font-bold text-medical-navy text-sm">Imediatamente</h3>
                  <p className="text-xs text-secondary">Plano pronto</p>
                </div>
              </div>
            </div>
          </div>

          {error && (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-600 font-semibold">{error}</div>
          )}
        </section>
      </div>

      {/* FOOTER FIXO */}
      <div className="p-6 md:px-10 py-5 border-t border-outline-variant/10 bg-white/30 backdrop-blur-xl shrink-0 relative z-10">
        <footer className="flex flex-col md:flex-row items-center justify-between gap-4">
          <button type="button" onClick={onBack} className="w-full md:w-auto flex items-center justify-center gap-2 px-6 py-3 rounded-full text-sm font-semibold text-secondary hover:text-medical-navy hover:bg-surface-container transition-all">
            <span className="material-symbols-outlined text-[20px]">arrow_back</span>
            Anterior
          </button>
          <button type="button" onClick={handleFinish} disabled={loading} className="w-full md:w-auto flex items-center justify-center gap-2 px-8 py-3 rounded-full bg-primary text-white text-sm font-bold tracking-[0.12em] uppercase shadow-[0_6px_20px_rgba(0,90,168,0.35)] hover:-translate-y-0.5 active:scale-95 transition-all disabled:opacity-70">
            {loading ? (
              <>
                Gerando Plano...
                <span className="material-symbols-outlined animate-spin text-[20px]">progress_activity</span>
              </>
            ) : (
              <>
                Concluir
                <span className="material-symbols-outlined text-[20px]">check_circle</span>
              </>
            )}
          </button>
        </footer>
      </div>
    </>
  );
}