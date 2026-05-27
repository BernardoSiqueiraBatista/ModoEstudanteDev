import { useEffect, useState } from 'react';
import SetupPlanoModal2 from './SetupPlanoModal2';

const STUDENT_ID = 'e1925b44-9694-477c-a496-5e638e4a9e25';
const API = 'http://localhost:3333';

interface SetupPlanoModalProps {
  open: boolean;
  onClose: () => void;
}

interface Area {
  nome: string;
  urgente: boolean;
  checked: boolean;
}

const FALLBACK_AREAS: Area[] = [
  { nome: 'Cardiologia', urgente: false, checked: true },
  { nome: 'Pediatria', urgente: false, checked: false },
  { nome: 'Emergência', urgente: false, checked: false },
  { nome: 'Neurologia', urgente: false, checked: false },
  { nome: 'Clínica Médica', urgente: false, checked: false },
  { nome: 'Cirurgia', urgente: false, checked: false },
];

export default function SetupPlanoModal({ open, onClose }: SetupPlanoModalProps) {
  const [openStep2, setOpenStep2] = useState(false);
  const [areas, setAreas] = useState<Area[]>(FALLBACK_AREAS);
  const [customInput, setCustomInput] = useState('');

  useEffect(() => {
    if (!open) return;
    fetch(`${API}/student/v1/students/${STUDENT_ID}/focus-areas`)
      .then(r => r.json())
      .then(json => {
        if (Array.isArray(json.areas) && json.areas.length > 0) {
          setAreas(json.areas.slice(0, 8).map((a: { nome: string; deficiente: boolean }) => ({
            nome: a.nome,
            urgente: a.deficiente,
            checked: a.deficiente,
          })));
        }
      })
      .catch(() => {});
  }, [open]);

  if (!open) return null;

  function toggleArea(nome: string) {
    setAreas(prev => prev.map(a => a.nome === nome ? { ...a, checked: !a.checked } : a));
  }

  function addCustomArea() {
    const nome = customInput.trim();
    if (!nome) return;
    if (areas.some(a => a.nome.toLowerCase() === nome.toLowerCase())) {
      setAreas(prev => prev.map(a => a.nome.toLowerCase() === nome.toLowerCase() ? { ...a, checked: true } : a));
    } else {
      setAreas(prev => [...prev, { nome, urgente: false, checked: true }]);
    }
    setCustomInput('');
  }

  function handleNext() {
    const checked = areas.filter(a => a.checked).map(a => a.nome);
    localStorage.setItem('setup-plano-areas', JSON.stringify(checked.length > 0 ? checked : ['Clínica Médica']));
    setOpenStep2(true);
  }

  return (
    <>
      {!openStep2 && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-[#001c3b]/10 backdrop-blur-sm p-4">
          <div className="absolute top-[-10%] right-[-10%] w-[45%] h-[45%] bg-primary/10 blur-[120px] rounded-full pointer-events-none" />
          <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-tertiary/10 blur-[120px] rounded-full pointer-events-none" />

          <div className="relative w-full max-w-[560px] max-h-[90vh] overflow-hidden rounded-[2.5rem] border border-white/20 bg-white/70 backdrop-blur-[40px] shadow-[0_20px_50px_-12px_rgba(0,0,0,0.08)] flex flex-col">
            <div className="flex items-start justify-between p-6 md:p-8 border-b border-outline-variant/10">
              <div>
                <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-medical-navy">Configuração do Plano</h2>
                <p className="text-sm text-on-surface-variant mt-1">Etapa 1 de 4</p>
              </div>
              <button onClick={onClose} className="w-10 h-10 rounded-full hover:bg-black/5 transition-colors flex items-center justify-center">
                <span className="material-symbols-outlined text-on-surface-variant">close</span>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 md:px-8 py-6">
              <div className="mb-6">
                <h3 className="text-lg font-bold text-on-surface mb-2">Áreas de Foco</h3>
                <p className="text-sm text-on-surface-variant leading-relaxed">
                  Selecione as especialidades médicas prioritárias para o seu cronograma.
                </p>
              </div>

              <div className="space-y-3">
                {areas.map((area) => (
                  <button
                    key={area.nome}
                    onClick={() => toggleArea(area.nome)}
                    className={`relative w-full group overflow-hidden flex items-center justify-between p-4 rounded-[1.7rem] backdrop-blur-2xl transition-all duration-300 hover:-translate-y-0.5 active:scale-[0.985] ${
                      area.checked
                        ? 'bg-white/80 shadow-[0_10px_35px_rgba(0,90,168,0.10)]'
                        : 'bg-white/55 hover:bg-white/75 shadow-[0_8px_30px_rgba(15,23,42,0.05)]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-all duration-300 shadow-sm ${
                        area.checked
                          ? 'bg-gradient-to-br from-primary to-[#1773cf] shadow-[0_4px_14px_rgba(0,90,168,0.35)]'
                          : 'bg-white/80 ring-1 ring-black/5'
                      }`}>
                        {area.checked && <span className="material-symbols-outlined text-white text-[13px]">check</span>}
                      </div>
                      <span className="font-semibold text-on-surface">
                        {area.nome}
                      </span>
                    </div>
                  </button>
                ))}

                {/* Adicionar área customizada */}
                <div className="flex gap-2 pt-2">
                  <input
                    type="text"
                    value={customInput}
                    onChange={e => setCustomInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && addCustomArea()}
                    placeholder="Adicionar outra área..."
                    className="flex-1 rounded-2xl border border-outline-variant/20 bg-white/50 px-4 py-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
                  />
                  <button
                    onClick={addCustomArea}
                    disabled={!customInput.trim()}
                    className="px-4 py-3 rounded-2xl bg-primary text-white text-sm font-bold disabled:opacity-40 transition-all hover:bg-primary/90 active:scale-95"
                  >
                    <span className="material-symbols-outlined text-[18px]">add</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between px-6 md:px-8 py-5 border-t border-outline-variant/10 bg-white/30 backdrop-blur-xl">
              <div className="flex items-center gap-2">
                <div className="h-1.5 w-7 rounded-full bg-primary" />
                <div className="h-1.5 w-2 rounded-full bg-outline-variant/40" />
                <div className="h-1.5 w-2 rounded-full bg-outline-variant/40" />
                <div className="h-1.5 w-2 rounded-full bg-outline-variant/40" />
              </div>
              <button
                onClick={handleNext}
                disabled={!areas.some(a => a.checked)}
                className="px-7 py-3 rounded-full bg-primary hover:bg-primary/90 text-white text-sm font-bold tracking-[0.12em] uppercase shadow-[0_4px_14px_rgba(0,90,168,0.3)] hover:-translate-y-0.5 active:scale-95 transition-all disabled:opacity-50"
              >
                Próximo
              </button>
            </div>
          </div>
        </div>
      )}

      {openStep2 && (
        <SetupPlanoModal2
          open={openStep2}
          onClose={() => { setOpenStep2(false); onClose(); }}
          onBack={() => setOpenStep2(false)}
          onNext={() => {}}
        />
      )}
    </>
  );
}
