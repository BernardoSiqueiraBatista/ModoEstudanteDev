import { useEffect, useState } from 'react';

const STUDENT_ID = 'e1925b44-9694-477c-a496-5e638e4a9e25';
const API = 'http://localhost:3333';

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

export default function Step1({ onNext, onClose }: { onNext: () => void; onClose: () => void }) {
  const [areas, setAreas] = useState<Area[]>(FALLBACK_AREAS);
  const [customInput, setCustomInput] = useState('');

  useEffect(() => {
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
  }, []);

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
    onNext();
  }

  return (
    <>
      {/* HEADER FIXO */}
      <div className="flex items-start justify-between p-6 md:px-10 md:py-8 border-b border-outline-variant/10 shrink-0 relative z-10">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-medical-navy">Configuração do Plano</h2>
          <p className="text-sm text-on-surface-variant mt-1">Etapa 1 de 4</p>
          <div className="flex items-center gap-1.5">
            <div className="h-2.5 w-2.5 rounded-full bg-primary" />
            <div className="h-2.5 w-2.5 rounded-full border border-gray-400 bg-transparent" />
            <div className="h-2.5 w-2.5 rounded-full border border-gray-400 bg-transparent" />
            <div className="h-2.5 w-2.5 rounded-full border border-gray-400 bg-transparent" />
        </div>
        </div>
        <button onClick={onClose} className="w-10 h-10 rounded-full hover:bg-black/5 transition-colors flex items-center justify-center">
          <span className="material-symbols-outlined text-on-surface-variant">close</span>
        </button>
      </div>

      {/* CONTEÚDO COM SCROLL */}
      <div className="flex-1 overflow-y-auto px-6 md:px-10 py-6 relative z-10">
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
                className={`relative w-full group flex items-center justify-between p-4 rounded-[1.7rem] transition-all duration-300 hover:-translate-y-0.5 active:scale-[0.985] ${
                area.checked
                    ? 'bg-white shadow-[0_10px_35px_rgba(0,90,168,0.15)]'
                    : 'bg-[#f1f5f9] hover:bg-white shadow-sm'
                }`}
            >
                <div className="flex items-center gap-3">
                
                <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-all duration-300 ${
                    area.checked
                    ? 'bg-primary shadow-[0_4px_14px_rgba(0,90,168,0.35)]' 
                    : 'bg-white ring-1 ring-black/10' 
                }`}>
                    {area.checked && (
                    <span className="material-symbols-outlined text-white text-[13px] font-bold">
                        check
                    </span>
                    )}
                </div>

                <span className="font-semibold text-on-surface">
                    {area.nome}
                </span>
                </div>
            </button>
            ))}

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

      {/* FOOTER FIXO */}
        <div className="flex items-center justify-between px-6 md:px-8 py-5 border-t border-outline-variant/10 bg-white/30 backdrop-blur-xl">
        <div className="flex items-center gap-2">
        </div>
        <button
          onClick={handleNext}
          disabled={!areas.some(a => a.checked)}
          className="px-7 py-3 rounded-full bg-primary hover:bg-primary/90 text-white text-sm font-bold tracking-[0.12em] uppercase shadow-[0_4px_14px_rgba(0,90,168,0.3)] hover:-translate-y-0.5 active:scale-95 transition-all disabled:opacity-50"
        >
          Próximo
        </button>
      </div>
    </>
  );
}