import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

interface AnswerDetail {
  questionID: string
  correct: boolean
  correctAnswer?: number
}

interface ExamResult {
  totalNumberQuestions: number
  correctAnswers: number
  hitPercentage: number
  details: AnswerDetail[]
}

interface LocationState {
  answers: { questionID: string; id_answer: number | null }[]
  questions: any[]
}

const STUDENT_ID = 'e1925b44-9694-477c-a496-5e638e4a9e25';

export default function SimuladosResultadoView() {
  const location = useLocation()
  const navigate = useNavigate()
  const state = location.state as LocationState

  const [result, setResult] = useState<ExamResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const controller = new AbortController()

    async function submitExam() {
      try {
        const res = await fetch(`http://localhost:3333/student/exams/${STUDENT_ID}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            answers: state.answers,
          }),
          signal: controller.signal,
        })
        if (!res.ok) throw new Error(`Erro ${res.status}`)
        const data = await res.json()
        setResult(data)
      } catch (e: any) {
        if (e.name === 'AbortError') return
        setError(e instanceof Error ? e.message : 'Erro ao enviar respostas.')
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    }

    if (state?.answers) {
      submitExam()
    } else {
      setError('Nenhuma resposta encontrada.')
      setLoading(false)
    }

    return () => controller.abort()
  }, [])

  const percentage = result?.hitPercentage ?? 0
  const circumference = 2 * Math.PI * 58 // raio 58
  const dashOffset = circumference - (percentage / 100) * circumference

  if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-surface text-on-surface">
        <div className="flex flex-col items-center gap-4">
          <svg className="animate-spin h-10 w-10 text-primary" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
          <p className="font-semibold text-on-surface-variant">Calculando seu resultado...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-surface text-on-surface">
        <div className="flex flex-col items-center gap-4 text-center px-6">
          <span className="material-symbols-outlined text-5xl text-error">error</span>
          <p className="font-semibold text-error">{error}</p>
          <button onClick={() => navigate('/simulados')} className="mt-4 px-6 py-3 bg-primary text-white rounded-full font-bold">
            Voltar aos Simulados
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-surface text-on-surface font-body relative overflow-hidden">
      <div className="fixed -bottom-24 -left-24 w-96 h-96 bg-secondary/5 rounded-full blur-[100px] -z-10" />
      <div className="fixed -top-24 -right-24 w-96 h-96 bg-secondary/5 rounded-full blur-[100px] -z-10" />

      <main className="pt-24 pb-20 px-6 max-w-7xl mx-auto min-h-screen flex flex-col items-center">
        {/* Hero */}
        <section className="w-full text-center mb-16 mt-8">
          <div className="inline-flex items-center justify-center p-4 mb-6 rounded-full bg-secondary-container/30 text-secondary">
            <span className="material-symbols-outlined text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>
              check_circle
            </span>
          </div>
          <h1 className="text-5xl font-extrabold tracking-tighter mb-4 text-on-surface">
            Simulado Finalizado com Sucesso
          </h1>
          <p className="text-on-surface-variant text-lg max-w-2xl mx-auto">
            Analise seu desempenho detalhadamente para focar onde realmente importa.
          </p>
        </section>

        {/* Metrics */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full mb-16">
          <div className="bg-white/70 backdrop-blur-2xl rounded-3xl p-8 shadow-[0_12px_40px_rgba(41,52,58,0.06)] flex flex-col items-center justify-center text-center">
            <span className="text-xs font-medium uppercase tracking-widest text-on-surface-variant mb-4">Total de Questões</span>
            <span className="text-5xl font-bold text-on-surface mb-2">{result?.totalNumberQuestions}</span>
            <span className="text-on-surface-variant font-medium">Questões Finalizadas</span>
          </div>

          <div className="bg-white/70 backdrop-blur-2xl rounded-3xl p-8 shadow-[0_12px_40px_rgba(41,52,58,0.06)] flex flex-col items-center justify-center text-center">
            <span className="text-xs font-medium uppercase tracking-widest text-on-surface-variant mb-4">Acertos Totais</span>
            <span className="text-5xl font-bold text-secondary mb-2">{result?.correctAnswers}</span>
            <span className="text-on-surface-variant font-medium">Respostas Corretas</span>
          </div>

          <div className="bg-white/70 backdrop-blur-2xl rounded-3xl p-8 shadow-[0_12px_40px_rgba(41,52,58,0.06)] flex flex-col items-center justify-center text-center relative overflow-hidden">
            <span className="text-xs font-medium uppercase tracking-widest text-on-surface-variant mb-4">Aproveitamento Final</span>
            <div className="relative flex items-center justify-center">
              <svg className="w-32 h-32 transform -rotate-90">
                <circle className="text-surface-container-high" cx="64" cy="64" fill="transparent" r="58" stroke="currentColor" strokeWidth="8" />
                <circle
                  className="text-secondary"
                  cx="64" cy="64" fill="transparent" r="58"
                  stroke="currentColor"
                  strokeWidth="8"
                  strokeDasharray={circumference}
                  strokeDashoffset={dashOffset}
                  style={{ transition: 'stroke-dashoffset 1s ease' }}
                />
              </svg>
              <span className="absolute text-3xl font-extrabold text-on-surface">
                {percentage.toFixed(0)}%
              </span>
            </div>
            <span className="mt-4 text-on-surface-variant font-medium">
              {percentage >= 60 ? 'Acima da média geral' : 'Abaixo da média geral'}
            </span>
          </div>
        </section>

        {/* CTAs */}
        <section className="flex flex-col sm:flex-row items-center gap-4 w-full justify-center">
          <button
            onClick={() => navigate('/simulados')}
            className="w-full sm:w-auto px-10 py-5 bg-transparent border-2 border-secondary/20 text-secondary rounded-full font-bold text-lg hover:bg-secondary/5 transition-all duration-300"
          >
            Voltar para a Central de Simulados
          </button>
        </section>
      </main>
    </div>
  )
}