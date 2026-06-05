import { useRef, useState } from 'react';

const STUDENT_ID = 'e1925b44-9694-477c-a496-5e638e4a9e25';
const API = 'http://localhost:3333';

const CICLOS = [
  { nome: 'Semanal',    icon: 'calendar_view_week', value: 'semanal'     },
  { nome: 'Mensal',     icon: 'calendar_month',      value: 'mensal'      },
  { nome: 'Trimestral', icon: 'grid_view',           value: 'trimestral'  },
  { nome: 'Anual',      icon: 'calendar_today',      value: 'anual'       },
];

const CATEGORIAS = [
  { nome: 'Especialização', value: 'especializacao', icon: 'school'          },
  { nome: 'Urgência',       value: 'urgencia',       icon: 'emergency'       },
  { nome: 'Atualização',    value: 'atualizacao',    icon: 'refresh'         },
  { nome: 'Certificação',   value: 'certificacao',   icon: 'verified'        },
  { nome: 'Geral',          value: 'geral',          icon: 'menu_book'       },
];

export default function Step2({ onNext, onBack, onClose }: { onNext: () => void; onBack: () => void; onClose: () => void }) {
  const [ciclo, setCiclo] = useState('mensal');
  const [categoria, setCategoria] = useState('geral');
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'done' | 'error'>('idle');
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleFileChange(file: File) {
    setUploadFile(file);
    setUploadStatus('uploading');
    try {
      const form = new FormData();
      form.append('file', file);
      form.append('student_id', STUDENT_ID);
      const res = await fetch(`${API}/student/v1/study-plans/uploads`, { method: 'POST', body: form });
      if (!res.ok) throw new Error();
      const data = await res.json();
      localStorage.setItem('setup-plano-upload-id', data.upload_id);
      setUploadStatus('done');
    } catch {
      setUploadStatus('error');
    }
  }

  function handleNext() {
    localStorage.setItem('setup-plano-ciclo', ciclo);
    localStorage.setItem('setup-plano-categoria', categoria);
    onNext();
  }

  return (
    <>
      {/* HEADER FIXO */}
      <div className="p-6 md:px-10 md:pt-8 md:pb-4 shrink-0 relative z-10 border-b border-outline-variant/10">
        <header className="flex flex-col gap-2">
          
          <div className="flex items-start justify-between gap-4">
            <div>
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-medical-navy">Configuração do Plano</h2>
          <p className="text-sm text-on-surface-variant mt-1">Etapa 2 de 4</p>
          <div className="flex items-center gap-1.5">
            <div className="h-2.5 w-2.5 rounded-full border border-gray-400 bg-transparent" />
            <div className="h-2.5 w-2.5 rounded-full bg-primary" />
            <div className="h-2.5 w-2.5 rounded-full border border-gray-400 bg-transparent" />
            <div className="h-2.5 w-2.5 rounded-full border border-gray-400 bg-transparent" />
        </div>
        </div>
            <button type="button" onClick={onClose} className="w-10 h-10 rounded-full hover:bg-black/5 transition-colors flex items-center justify-center outline-none">
              <span className="material-symbols-outlined text-on-surface-variant">close</span>
            </button>
          </div>
        </header>
      </div>

      {/* CONTEÚDO COM SCROLL */}
      <div className="flex-1 overflow-y-auto px-6 md:px-10 py-6 relative z-10">
        <section className="space-y-8">
          <div>
            <label className="block mb-4 text-[10px] uppercase tracking-[0.22em] font-bold text-on-surface-variant">
              Duração e Ciclo
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {CICLOS.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setCiclo(c.value)}
                  className={`group flex flex-col items-center justify-center p-4 rounded-2xl transition-all duration-300 border outline-none active:scale-95 ${
                    ciclo === c.value
                      ? 'bg-primary/10 border-primary shadow-[0_10px_30px_rgba(0,90,168,0.15)]'
                      : 'bg-white/60 border-white/40 hover:border-primary/40 hover:bg-primary/5'
                  }`}
                >
                  <span className={`material-symbols-outlined mb-2 transition-colors ${ciclo === c.value ? 'text-primary' : 'text-outline group-hover:text-primary'}`}>
                    {c.icon}
                  </span>
                  <span className={`text-sm font-semibold transition-colors ${ciclo === c.value ? 'text-primary' : 'text-on-surface-variant group-hover:text-primary'}`}>
                    {c.nome}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block mb-4 text-[10px] uppercase tracking-[0.22em] font-bold text-on-surface-variant">
              Categoria do Plano
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {CATEGORIAS.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setCategoria(c.value)}
                  className={`group flex items-center gap-3 p-3.5 rounded-2xl transition-all duration-300 border outline-none active:scale-95 ${
                    categoria === c.value
                      ? 'bg-primary/10 border-primary shadow-[0_8px_24px_rgba(0,90,168,0.12)]'
                      : 'bg-white/60 border-white/40 hover:border-primary/40 hover:bg-primary/5'
                  }`}
                >
                  <span className={`material-symbols-outlined text-[20px] transition-colors ${categoria === c.value ? 'text-primary' : 'text-outline group-hover:text-primary'}`}>
                    {c.icon}
                  </span>
                  <span className={`text-sm font-semibold transition-colors ${categoria === c.value ? 'text-primary' : 'text-on-surface-variant group-hover:text-primary'}`}>
                    {c.nome}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </section>

        <div className="mt-8 pt-6 border-t border-outline-variant/20">
          <label className="block mb-1.5 text-[10px] uppercase tracking-[0.22em] font-bold text-on-surface-variant">
            Material de Contexto
          </label>
          <p className="text-xs text-outline mb-4">
            Anexe um PDF, DOCX ou imagem para que a IA use como referência ao montar o cronograma.
            <span className="ml-1 text-outline/70">(opcional)</span>
          </p>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl border transition-all ${
              uploadStatus === 'done' ? 'border-green-300 bg-green-50' :
              uploadStatus === 'error' ? 'border-red-300 bg-red-50' :
              'border-dashed border-outline-variant/40 hover:border-primary/40 hover:bg-primary/5'
            }`}
          >
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
              uploadStatus === 'done' ? 'bg-green-100' :
              uploadStatus === 'error' ? 'bg-red-100' : 'bg-surface-container-high'
            }`}>
              <span className={`material-symbols-outlined text-[20px] ${
                uploadStatus === 'done' ? 'text-green-600' :
                uploadStatus === 'error' ? 'text-red-500' :
                uploadStatus === 'uploading' ? 'text-primary animate-spin' : 'text-outline'
              }`}>
                {uploadStatus === 'done' ? 'check_circle' : uploadStatus === 'uploading' ? 'progress_activity' : 'upload_file'}
              </span>
            </div>
            <div className="text-left min-w-0">
              <p className={`text-sm font-semibold truncate ${
                uploadStatus === 'done' ? 'text-green-700' :
                uploadStatus === 'error' ? 'text-red-600' : 'text-on-surface-variant'
              }`}>
                {uploadStatus === 'done' ? uploadFile?.name :
                 uploadStatus === 'uploading' ? 'Enviando arquivo...' :
                 uploadStatus === 'error' ? 'Erro no envio — clique para tentar novamente' :
                 'Clique para selecionar arquivo'}
              </p>
              {uploadStatus === 'idle' && (
                <p className="text-xs text-outline mt-0.5">PDF, DOCX ou imagem · até 20 MB</p>
              )}
            </div>
          </button>
          <input ref={fileRef} type="file" accept=".pdf,.docx,image/*" className="hidden"
            onChange={e => { const f = e.target.files?.[0]; if (f) handleFileChange(f); }} />
        </div>
      </div>

      {/* FOOTER FIXO */}
      <div className="p-6 md:px-10 py-5 border-t border-outline-variant/10 bg-white/30 backdrop-blur-xl shrink-0 relative z-10">
        <footer className="flex items-center justify-between">
            <div className="flex flex-col items-center gap-3">
                <button type="button" onClick={onBack} className="flex items-center gap-2 px-6 py-3 rounded-full text-sm font-semibold text-secondary hover:text-medical-navy hover:bg-surface-container transition-all">
                <span className="material-symbols-outlined text-[20px]">arrow_back</span>
                Anterior
                </button>
            </div>
          <button type="button" onClick={handleNext} className="flex items-center gap-2 px-8 py-3 rounded-full bg-primary text-white text-sm font-bold tracking-[0.12em] uppercase shadow-[0_6px_20px_rgba(0,90,168,0.35)] hover:-translate-y-0.5 active:scale-95 transition-all">
            Próximo
          </button>
        </footer>
      </div>
    </>
  );
}