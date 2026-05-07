import { useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'

interface Alternativa {
  ordem: number
  texto: string
}

interface Questao {
  id_questao: string
  texto: string
  alternativas: Alternativa[]
}

const LEVEL_LABEL: Record<string, string> = { '1': 'Fácil', '2': 'Médio', '3': 'Difícil' }

async function fetchQuestoes(limit: number, level: number, category: number) {
  const res = await fetch(`/student/questions?limit=${limit}&level=${level}&category=${category}`)
  if (!res.ok) throw new Error(`Erro ${res.status}: ${res.statusText}`)
  return res.json() as Promise<{ count: number; questions: Questao[] }>
}

export default function ExecucaoSimulado() {

  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
 

  const q     = searchParams.get('questoes')      ?? '10'
  const nivel = searchParams.get('nivel')         ?? '2'
  const espec = searchParams.get('especialidade') ?? 'Geral'
  const cat   = searchParams.get('categoria')     ?? '1'

  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState<string | null>(null)

  async function handleStart() {
    setError(null)
    setLoading(true)
    try {
      const data = await fetchQuestoes(Number(q), Number(nivel), Number(cat))
      // navega para a tela de execução passando as questões via state
      navigate('/simulado/executar', { state: { questions: data.questions } })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao buscar questões.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-slate-900/10 backdrop-blur-md" />

      {/* Modal */}
      <div className="relative w-full max-w-lg bg-surface-container-lowest/80 backdrop-blur-2xl rounded-3xl p-8 md:p-12 shadow-[0_32px_64px_rgba(0,0,0,0.12)] flex flex-col items-center text-center">

        {/* Decorative */}
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <span className="material-symbols-outlined text-9xl">ecg</span>
        </div>

        {/* Icon */}
        <div className="w-20 h-20 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-8 shadow-sm">
          <span
            className="material-symbols-outlined text-4xl"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            monitor_heart
          </span>
        </div>

        <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-on-surface mb-4">
          Iniciar Simulado: {espec}
        </h2>
        <p className="text-on-surface-variant text-base md:text-lg mb-10 max-w-md leading-relaxed">
          Simulado focado em condutas clínicas e raciocínio diagnóstico. Desenvolvido para médicos residentes e plantonistas.
        </p>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 md:gap-4 w-full mb-12">
          {[
            { value: q,                               label: 'Questões' },
            { value: `${Math.floor(Number(q) * 1.5)}`, label: 'Minutos'  },
            { value: LEVEL_LABEL[nivel] ?? nivel,     label: 'Nível'    },
          ].map((s) => (
            <div key={s.label} className="bg-surface-container/40 border border-white/20 p-4 rounded-2xl flex flex-col items-center gap-1">
              <span className="text-primary font-bold text-lg">{s.value}</span>
              <span className="text-[10px] uppercase font-bold tracking-widest text-on-surface-variant">{s.label}</span>
            </div>
          ))}
        </div>

        {/* Error */}
        {error && (
          <div className="w-full mb-6 px-4 py-3 rounded-2xl bg-error/10 text-error text-sm font-semibold">
            {error}
          </div>
        )}

        {/* Actions */}
        <div className="w-full flex flex-col gap-4">
          <button
            onClick={handleStart}
            disabled={loading}
            className="w-full py-5 px-8 rounded-full bg-gradient-to-r from-primary to-blue-700 text-white font-bold text-lg shadow-lg shadow-primary/20 active:scale-95 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-3"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                Carregando questões...
              </>
            ) : (
              'Começar Agora'
            )}
          </button>

          <button
            onClick={() => navigate(-1)}
            className="w-full py-4 text-on-surface-variant font-semibold hover:text-on-surface transition-colors"
          >
            Voltar
          </button>
        </div>
      </div>
    </div>
  )
}