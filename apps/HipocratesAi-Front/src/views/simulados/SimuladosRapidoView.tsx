import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const NIVEL_MAP: Record<string, string> = { 'Fácil': '1', 'Médio': '2', 'Difícil': '3' }
const NIVEL_LABEL: Record<string, string> = { '1': 'Fácil', '2': 'Médio', '3': 'Difícil' }

const specialties = [
  { icon: 'cardiology',  title: 'Cardiologia', description: 'Foco em ECG, Insuficiência Cardíaca e Valvopatias.' },
  { icon: 'child_care',  title: 'Pediatria',   description: 'Desenvolvimento, Imunização e Emergências pediátricas.' },
  { icon: 'neurology',   title: 'Neurologia',  description: 'AVC, Cefaleias e Doenças Neurodegenerativas.' },
  { icon: 'female',      title: 'Ginecologia', description: 'Pré-natal, Ciclo Menstrual e Oncologia Pélvica.' },
]

const institutions = [
  { name: 'ENAMED',  subtitle: 'Exame Nacional', icon: 'history_edu' },
  { name: 'USP',     subtitle: 'São Paulo',       icon: 'school' },
  { name: 'UNICAMP', subtitle: 'Campinas',         icon: 'architecture' },
  { name: 'ENARE',   subtitle: 'Nacional',         icon: 'account_balance' },
]

interface ModalConfig { especialidade: string; questoes: string; nivel: string }

async function fetchQuestoes(limit: number, level?: number, category?: number) {
  const params = new URLSearchParams()
  params.set('limit', String(limit))
  if (level !== undefined) params.set('level', String(level))
  if (category !== undefined) params.set('category', String(category))
  const res = await fetch(`http://localhost:3333/student/questions?${params}`)
  if (!res.ok) throw new Error(`Erro ${res.status}: ${res.statusText}`)
  return res.json() as Promise<{ count: number; questions: any[] }>
}

export default function SimuladoRapido() {
  const navigate = useNavigate()
  const [intensidade, setIntensidade] = useState('Fácil')
  const [questoes, setQuestoes] = useState('50')
  const [aiInput, setAiInput] = useState('')
  const [modal, setModal] = useState<ModalConfig | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function openModal(especialidade: string) {
    setError(null)
    setModal({ especialidade, questoes, nivel: NIVEL_MAP[intensidade] })
  }

  function closeModal() {
    if (loading) return
    setModal(null)
    setError(null)
  }

  async function handleStart() {
    if (!modal) return
    setError(null)
    setLoading(true)
    try {
      const data = await fetchQuestoes(Number(modal.questoes), Number(modal.nivel), 1)
      navigate('/simulados/executar', {
        state: { questions: data.questions, nivel: modal.nivel, especialidade: modal.especialidade },
      })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao buscar questões.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="bg-surface text-on-surface font-body selection:bg-secondary/20"
      style={{ backgroundImage: 'radial-gradient(at 0% 0%, rgba(0,209,255,0.03) 0px, transparent 40%), radial-gradient(at 100% 100%, rgba(26,54,93,0.02) 0px, transparent 40%)' }}
    >
      <main className="pl-64 min-h-screen">
        <div className="px-10 py-4 max-w-7xl mx-auto space-y-12">

          {/* Header & Filtros */}
          <section className="space-y-8">
            <div className="flex flex-col gap-2">
              <h1 className="text-4xl font-bold text-primary tracking-tight font-display">Simulados Rápidos</h1>
              <p className="text-slate-400 font-medium text-sm">Configure seu treinamento e inicie uma simulação de alta precisão.</p>
            </div>

            <div className="flex flex-wrap gap-10 items-end">
              <div className="space-y-4">
                <label className="text-[10px] uppercase tracking-[0.2em] font-bold text-slate-400 px-1">Intensidade</label>
                <div className="flex gap-2 p-1.5 liquid-glass rounded-2xl">
                  {['Fácil', 'Médio', 'Difícil'].map((level) => (
                    <button
                      key={level}
                      onClick={() => setIntensidade(level)}
                      className={`px-6 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${
                        intensidade === level ? 'bg-white text-primary shadow-sm border border-slate-50' : 'hover:bg-white/40 text-slate-400'
                      }`}
                    >{level}</button>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <label className="text-[10px] uppercase tracking-[0.2em] font-bold text-slate-400 px-1">Questões</label>
                <div className="flex gap-2 p-1.5 liquid-glass rounded-2xl">
                  {['25', '50', '100'].map((q) => (
                    <button
                      key={q}
                      onClick={() => setQuestoes(q)}
                      className={`px-5 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${
                        questoes === q ? 'bg-white text-primary shadow-sm border border-slate-50' : 'hover:bg-white/40 text-slate-400'
                      }`}
                    >{q}</button>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* Grid de especialidades */}
          <section className="space-y-8">
            <div className="flex items-center justify-between">
              <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">Por Especialidade</h2>
              <button className="text-[10px] font-bold uppercase tracking-widest text-secondary flex items-center gap-1 hover:underline">
                Ver todas <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {specialties.map((spec) => (
                <div key={spec.title} className="liquid-glass bubble-interactive rounded-[2.5rem] p-8 flex flex-col h-[340px]">
                  <div className="size-12 rounded-2xl bg-secondary/10 flex items-center justify-center mb-8">
                    <span className="material-symbols-outlined text-secondary text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                      {spec.icon}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-primary mb-3 font-display">{spec.title}</h3>
                  <p className="text-xs text-slate-400 leading-relaxed flex-1 font-medium">{spec.description}</p>
                  <button
                    onClick={() => openModal(spec.title)}
                    className="w-full py-4 bg-primary text-white rounded-2xl font-bold text-[10px] uppercase tracking-[0.2em] hover:shadow-xl hover:shadow-primary/20 transition-all active:scale-[0.98]"
                  >
                    Iniciar
                  </button>
                </div>
              ))}
            </div>
          </section>

          {/* Provas Antigas */}
          <section className="space-y-8">
            <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">Provas Antigas & Instituições</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {institutions.map((inst) => (
                <div key={inst.name} className="liquid-glass bubble-interactive rounded-3xl p-6 flex items-center justify-between group cursor-pointer">
                  <div className="flex flex-col">
                    <span className="text-base font-bold text-primary font-display">{inst.name}</span>
                    <span className="text-[8px] font-bold text-slate-400 tracking-widest uppercase mt-1">{inst.subtitle}</span>
                  </div>
                  <span className="material-symbols-outlined text-slate-200 group-hover:text-secondary transition-colors">{inst.icon}</span>
                </div>
              ))}
            </div>
          </section>

          {/* Gerador AI */}
          <section className="mt-20">
            <div className="liquid-glass p-12 rounded-[3rem] space-y-8 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-80 h-80 bg-secondary/5 blur-[100px] -mr-32 -mt-32 rounded-full pointer-events-none" />
              <div className="flex items-center gap-5">
                <div className="size-12 rounded-2xl bg-primary flex items-center justify-center text-white shadow-lg shadow-primary/20">
                  <span className="material-symbols-outlined text-2xl">psychology</span>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-primary font-display">Gerador AI Hipócrates</h3>
                  <p className="text-xs text-slate-400 font-medium mt-1">Descreva o caso clínico ou tema específico para gerar um simulado personalizado.</p>
                </div>
              </div>
              <div className="relative group">
                <input
                  className="w-full bg-white border border-slate-100 rounded-[2rem] py-8 px-10 pr-40 focus:ring-4 focus:ring-secondary/10 focus:border-secondary/20 text-sm font-medium placeholder:text-slate-300 transition-all shadow-sm outline-none"
                  placeholder="Ex: 'Paciente de 45 anos com dor precordial súbita e irradiação para dorso...'"
                  type="text"
                  value={aiInput}
                  onChange={(e) => setAiInput(e.target.value)}
                />
                <button className="absolute right-4 top-1/2 -translate-y-1/2 px-10 py-4 bg-primary text-white rounded-2xl font-bold text-[10px] uppercase tracking-widest shadow-xl shadow-primary/20 hover:opacity-90 transition-all active:scale-95">
                  Gerar
                </button>
              </div>
              <div className="flex items-center gap-5">
                <span className="text-[10px] font-bold text-slate-400 tracking-widest uppercase">Sugestões:</span>
                <div className="flex gap-3 flex-wrap">
                  {['Trauma Abdominal', 'Emergências Obstétricas', 'Drogas Vasoativas'].map((s) => (
                    <button
                      key={s}
                      onClick={() => setAiInput(s)}
                      className="text-[10px] font-bold text-primary px-5 py-2 rounded-xl bg-slate-50 border border-slate-100 hover:bg-white hover:shadow-sm transition-all uppercase tracking-widest"
                    >{s}</button>
                  ))}
                </div>
              </div>
            </div>
          </section>
        </div>
        <div className="h-20" />
      </main>

      {/* ── Modal de confirmação ── */}
      {modal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/20 backdrop-blur-sm" onClick={closeModal} />

          <div className="relative w-full max-w-md bg-white/90 backdrop-blur-2xl rounded-3xl p-10 shadow-2xl flex flex-col items-center text-center animate-in fade-in zoom-in-95 duration-200">

            {/* Fechar */}
            <button
              onClick={closeModal}
              className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
            >
              <span className="material-symbols-outlined text-lg">close</span>
            </button>

            {/* Ícone */}
            <div className="w-16 h-16 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mb-6">
              <span className="material-symbols-outlined text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>monitor_heart</span>
            </div>

            <h2 className="text-2xl font-extrabold tracking-tight text-slate-800 mb-1">{modal.especialidade}</h2>
            <p className="text-sm text-slate-400 mb-8">Simulado focado em condutas clínicas e raciocínio diagnóstico.</p>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-3 w-full mb-8">
              {[
                { value: modal.questoes,                              label: 'Questões' },
                { value: `${Math.floor(Number(modal.questoes) * 1.5)}`, label: 'Minutos'  },
                { value: NIVEL_LABEL[modal.nivel] ?? modal.nivel,    label: 'Nível'    },
              ].map((s) => (
                <div key={s.label} className="bg-slate-50 border border-slate-100 p-4 rounded-2xl flex flex-col items-center gap-1">
                  <span className="text-primary font-bold text-lg">{s.value}</span>
                  <span className="text-[9px] uppercase font-bold tracking-widest text-slate-400">{s.label}</span>
                </div>
              ))}
            </div>

            {/* Erro */}
            {error && (
              <div className="w-full mb-4 px-4 py-3 rounded-2xl bg-red-50 text-red-600 text-sm font-semibold border border-red-100">
                {error}
              </div>
            )}

            {/* Ações */}
            <div className="w-full flex flex-col gap-3">
              <button
                onClick={handleStart}
                disabled={loading}
                className="w-full py-4 rounded-full bg-gradient-to-r from-primary to-blue-700 text-white font-bold shadow-lg hover:opacity-90 active:scale-95 transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                    Carregando questões...
                  </>
                ) : 'Começar Agora'}
              </button>
              <button
                onClick={closeModal}
                disabled={loading}
                className="w-full py-3 text-slate-400 font-semibold hover:text-slate-600 transition-colors text-sm disabled:opacity-40"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .liquid-glass {
          background: rgba(255,255,255,0.85);
          backdrop-filter: blur(24px) saturate(160%);
          -webkit-backdrop-filter: blur(24px) saturate(160%);
          border: 1px solid rgba(255,255,255,1);
          box-shadow: 0 20px 50px -12px rgba(26,54,93,0.04), inset 0 2px 4px rgba(255,255,255,1);
        }
        .bubble-interactive { transition: all 0.4s cubic-bezier(0.175,0.885,0.32,1.275); }
        .bubble-interactive:hover {
          transform: translateY(-4px);
          box-shadow: 0 30px 60px -15px rgba(26,54,93,0.08), inset 0 2px 4px rgba(255,255,255,1);
          background: rgba(255,255,255,0.95);
        }
        @keyframes fade-in { from { opacity: 0 } to { opacity: 1 } }
        @keyframes zoom-in-95 { from { transform: scale(0.95) } to { transform: scale(1) } }
        .animate-in { animation: fade-in 0.2s ease, zoom-in-95 0.2s ease; }
      `}</style>
    </div>
  )
}
