import { useRef, useState } from 'react';
import SetupPlanoModal3 from './SetupPlanoModal3';

const STUDENT_ID = 'e1925b44-9694-477c-a496-5e638e4a9e25';
const API = 'http://localhost:3333';

interface SetupPlanoModal2Props {
  open: boolean;
  onClose: () => void;
  onBack: () => void;
  onNext?: () => void;
}

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

export default function SetupPlanoModal2({ open, onClose, onBack }: SetupPlanoModal2Props) {
  const [openStep3, setOpenStep3] = useState(false);
  const [ciclo, setCiclo] = useState('mensal');
  const [categoria, setCategoria] = useState('geral');
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'done' | 'error'>('idle');
  const fileRef = useRef<HTMLInputElement>(null);

  if (!open) return null;

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
    setOpenStep3(true);
  }

  return (
    <>
      {!openStep3 && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-medical-navy/10 backdrop-blur-sm">
          <div className="absolute top-[-10%] right-[-10%] w-[45%] h-[45%] bg-primary/10 blur-[120px] rounded-full pointer-events-none" />
          <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-tertiary/10 blur-[120px] rounded-full pointer-events-none" />

          <div className="relative w-full max-w-[640px] overflow-hidden rounded-[2.5rem] border border-white/20 bg-white/75 backdrop-blur-[28px] shadow-[0_20px_50px_-12px_rgba(0,0,0,0.08)]">
            <div className="p-6 md:p-10">
              <header className="flex flex-col gap-2 mb-8">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase tracking-[0.22em] font-bold text-primary">Processo de Inteligência</span>
                  <div className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_12px_rgba(34,211,238,0.9)] animate-pulse" />
                </div>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h1 className="text-3xl md:text-[2.4rem] leading-none font-bold tracking-tight text-medical-navy">Configuração do Plano</h1>
                    <p className="text-sm text-on-surface-variant mt-2">Etapa 2 de 4</p>
                  </div>
                  <button type="button" onClick={onClose} className="w-10 h-10 rounded-full hover:bg-black/5 transition-colors flex items-center justify-center outline-none">
                    <span className="material-symbols-outlined text-on-surface-variant">close</span>
                  </button>
                </div>
                <p className="text-sm leading-relaxed text-secondary mt-2">
                  Defina a estrutura temporal e a categoria do seu plano.
                </p>
              </header>

              <section className="space-y-8">
                {/* DURAÇÃO */}
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

                {/* CATEGORIA */}
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

              {/* UPLOAD DE CONTEXTO */}
              <div className="mt-2 pt-6 border-t border-outline-variant/20">
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

              <footer className="flex items-center justify-between mt-10 pt-8 border-t border-outline-variant/20">
                <button type="button" onClick={onBack} className="flex items-center gap-2 px-6 py-3 rounded-full text-sm font-semibold text-secondary hover:text-medical-navy hover:bg-surface-container transition-all">
                  <span className="material-symbols-outlined text-[20px]">arrow_back</span>
                  Anterior
                </button>
                <button type="button" onClick={handleNext} className="flex items-center gap-2 px-8 py-3 rounded-full bg-primary text-white text-sm font-bold tracking-[0.12em] uppercase shadow-[0_6px_20px_rgba(0,90,168,0.35)] hover:-translate-y-0.5 active:scale-95 transition-all">
                  Próximo
                  <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
                </button>
              </footer>
            </div>
          </div>
        </div>
      )}

      {openStep3 && (
        <SetupPlanoModal3
          open={openStep3}
          onClose={() => { setOpenStep3(false); onClose(); }}
          onBack={() => setOpenStep3(false)}
        />
      )}
    </>
  );
}
