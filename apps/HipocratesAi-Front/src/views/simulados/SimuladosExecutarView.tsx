import { useState, useEffect, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

interface Alternativa {
  ordem: number
  texto: string
}

interface Questao {
  id_questao: string
  texto: string
  alternativas: Alternativa[]
}

interface LocationState {
  questions: Questao[]
  nivel?: string
  especialidade?: string
}

const LEVEL_LABEL: Record<string, string> = { '1': 'Fácil', '2': 'Médio', '3': 'Difícil' }
const LETRA = ['A', 'B', 'C', 'D', 'E']

export default function ExecutarSimulado() {
  const location = useLocation()
  const navigate = useNavigate()
  const state = location.state as LocationState

  const questions: Questao[] = state?.questions ?? []
  const nivel = state?.nivel ?? '2'
  const especialidade = state?.especialidade ?? 'Geral'

  // minutos estimados: 1.5 min por questão
  const totalSeconds = Math.floor(questions.length * 1.5 * 60)

  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, number | null>>({})
  const [marked, setMarked] = useState<Record<string, boolean>>({})
  const [timeLeft, setTimeLeft] = useState(totalSeconds)
  const [showConfirm, setShowConfirm] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Timer
  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(intervalRef.current!)
          handleFinalize()
          return 0
        }
        return t - 1
      })
    }, 1000)
    return () => clearInterval(intervalRef.current!)
  }, [])

  const formatTime = (s: number) => {
    const h = Math.floor(s / 3600)
    const m = Math.floor((s % 3600) / 60)
    const sec = s % 60
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
  }

  const current = questions[currentIndex]

  const handleAnswer = (ordem: number) => {
    setAnswers((prev) => ({ ...prev, [current.id_questao]: ordem }))
  }

  const toggleMarked = () => {
    setMarked((prev) => ({ ...prev, [current.id_questao]: !prev[current.id_questao] }))
  }

  const handleFinalize = () => {
    clearInterval(intervalRef.current!)
    const formattedAnswers = questions.map((q) => ({
      questionID: q.id_questao,
      studentAnswer: answers[q.id_questao] ?? null,
    }))
    // Navega para a tela de encerramento — rota a ser preenchida depois
    navigate('/simulados/resultado', {
      state: {
        answers: formattedAnswers,
        questions,
      },
    })
  }

  const answeredCount = Object.values(answers).filter((v) => v !== null).length
  const markedCount = Object.values(marked).filter(Boolean).length
  const remaining = questions.length - answeredCount
  const progress = questions.length > 0 ? Math.round((answeredCount / questions.length) * 100) : 0

  if (!questions.length) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-surface text-on-surface">
        <p className="text-lg font-semibold">Nenhuma questão encontrada. Volte e tente novamente.</p>
      </div>
    )
  }

  return (
    <div className="bg-surface font-body text-on-surface antialiased overflow-hidden h-screen flex flex-col">

      {/* ── Header ── */}
      <header className="bg-white/70 backdrop-blur-md shadow-sm flex justify-between items-center w-full px-8 h-20 z-50 flex-shrink-0 border-b border-outline-variant/5">
        <div className="flex items-center gap-6">
          <div className="flex flex-col">
            <span className="text-lg font-black text-slate-800 tracking-tighter">SHIFT MODE</span>
            <span className="text-[10px] font-bold tracking-widest text-primary uppercase">Hipócrates.ai</span>
          </div>
          <div className="h-8 w-[1px] bg-outline-variant/30" />
          <div className="flex flex-col">
            <h1 className="text-on-surface font-bold text-lg tracking-tight">{especialidade}</h1>
            <span className="text-xs font-semibold text-on-surface-variant/70 uppercase tracking-wider">
              Nível: {LEVEL_LABEL[nivel] ?? nivel}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-8">
          {/* Timer */}
          <div className="flex items-center gap-4 bg-surface-container-low px-4 py-2 rounded-full border border-outline-variant/10">
            <div className="flex flex-col items-end">
              <span className="text-[10px] uppercase font-bold text-on-surface-variant tracking-widest leading-none">
                Tempo Restante
              </span>
              <span className={`text-lg font-mono font-bold tracking-tighter ${timeLeft < 300 ? 'text-tertiary' : 'text-on-surface'}`}>
                {formatTime(timeLeft)}
              </span>
            </div>
            <span className="material-symbols-outlined text-primary">timer</span>
          </div>

          {/* Finalizar */}
          <button
            onClick={() => setShowConfirm(true)}
            className="bg-gradient-to-r from-primary to-primary/80 text-white px-6 py-2.5 rounded-full font-bold text-sm shadow-md hover:opacity-90 transition-all flex items-center gap-2"
          >
            Finalizar Simulado
            <span className="material-symbols-outlined text-sm">done_all</span>
          </button>
        </div>
      </header>

      {/* ── Main ── */}
      <main className="flex flex-1 overflow-hidden">

        {/* ── Question Area ── */}
        <section className="flex-1 overflow-y-auto no-scrollbar p-10 flex flex-col gap-8 bg-surface">

          {/* Progress */}
          <div className="w-full max-w-4xl mx-auto space-y-2">
            <div className="flex justify-between text-[11px] font-bold text-on-surface-variant uppercase tracking-widest">
              <span>Questão {currentIndex + 1} de {questions.length}</span>
              <span>{progress}% concluído</span>
            </div>
            <div className="h-1.5 w-full bg-surface-container-high rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full shadow-[0_0_8px_rgba(51,102,204,0.3)] transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Question Card */}
          <div className="w-full max-w-4xl mx-auto bg-surface-container-lowest p-10 rounded-[2rem] shadow-sm border border-outline-variant/10">
            <div className="flex items-start gap-4 mb-8">
              <span className="bg-primary-container text-primary h-10 w-10 flex items-center justify-center rounded-xl font-bold text-lg flex-shrink-0">
                {currentIndex + 1}
              </span>
              <h2 className="text-xl font-bold text-on-surface tracking-tight leading-snug">
                {current.texto}
              </h2>
            </div>

            {marked[current.id_questao] && (
              <div className="mb-6 flex items-center gap-2 text-amber-600 bg-amber-50 border border-amber-200 rounded-xl px-4 py-2 text-sm font-semibold">
                <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>bookmark</span>
                Marcada para revisão
              </div>
            )}
          </div>

          {/* Alternatives */}
          <div className="w-full max-w-4xl mx-auto grid grid-cols-1 gap-4 mb-10">
            {current.alternativas.map((alt, i) => {
              const selected = answers[current.id_questao] === alt.ordem
              return (
                <button
                  key={alt.ordem}
                  onClick={() => handleAnswer(alt.ordem)}
                  className={`w-full text-left p-6 rounded-2xl border-2 transition-all flex items-center gap-6 shadow-sm active:scale-[0.99] ${
                    selected
                      ? 'bg-white border-primary ring-4 ring-primary/5 shadow-md'
                      : 'bg-white/70 backdrop-blur-sm border-transparent hover:border-primary/20 hover:bg-white'
                  }`}
                >
                  <div className={`h-10 w-10 flex-shrink-0 flex items-center justify-center rounded-full font-bold transition-colors ${
                    selected
                      ? 'bg-primary text-white'
                      : 'border-2 border-outline-variant/30 text-on-surface-variant group-hover:border-primary group-hover:text-primary'
                  }`}>
                    {LETRA[i]}
                  </div>
                  <span className={`font-medium ${selected ? 'text-on-surface font-bold' : 'text-on-surface'}`}>
                    {alt.texto}
                  </span>
                  {selected && (
                    <div className="ml-auto">
                      <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>
                        check_circle
                      </span>
                    </div>
                  )}
                </button>
              )
            })}
          </div>

          {/* Navigation */}
          <div className="w-full max-w-4xl mx-auto flex justify-between items-center py-6 mt-auto">
            <button
              onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
              disabled={currentIndex === 0}
              className="flex items-center gap-2 text-on-surface-variant font-bold hover:text-primary transition-colors px-4 py-2 rounded-xl disabled:opacity-30"
            >
              <span className="material-symbols-outlined">arrow_back</span>
              Anterior
            </button>

            <div className="flex gap-4">
              <button
                onClick={toggleMarked}
                className={`flex items-center gap-2 font-bold transition-colors px-6 py-2.5 rounded-full ${
                  marked[current.id_questao]
                    ? 'bg-amber-100 text-amber-600 border border-amber-300'
                    : 'bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest'
                }`}
              >
                <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: marked[current.id_questao] ? "'FILL' 1" : "'FILL' 0" }}>
                  bookmark
                </span>
                {marked[current.id_questao] ? 'Marcada' : 'Revisar Depois'}
              </button>

              {currentIndex < questions.length - 1 ? (
                <button
                  onClick={() => setCurrentIndex((i) => i + 1)}
                  className="flex items-center gap-2 bg-on-background text-white font-bold px-10 py-2.5 rounded-full hover:opacity-90 shadow-lg transition-all active:scale-95"
                >
                  Próxima
                  <span className="material-symbols-outlined">arrow_forward</span>
                </button>
              ) : (
                <button
                  onClick={() => setShowConfirm(true)}
                  className="flex items-center gap-2 bg-gradient-to-r from-primary to-blue-700 text-white font-bold px-10 py-2.5 rounded-full hover:opacity-90 shadow-lg transition-all active:scale-95"
                >
                  Finalizar
                  <span className="material-symbols-outlined">done_all</span>
                </button>
              )}
            </div>
          </div>
        </section>

        {/* ── Right Panel ── */}
        <aside className="w-80 bg-surface-container-low flex flex-col h-[calc(100vh-80px)] border-l border-outline-variant/10">
          <div className="p-6 flex flex-col h-full">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-sm font-black text-on-surface tracking-widest uppercase">Navegação</h3>
              <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded">
                {currentIndex + 1} / {questions.length}
              </span>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-2 mb-8">
              {[
                { value: answeredCount, label: 'Feitas', color: 'text-primary' },
                { value: markedCount,   label: 'Dúvidas', color: 'text-amber-500' },
                { value: remaining,     label: 'Faltam',  color: 'text-on-surface' },
              ].map((s) => (
                <div key={s.label} className="bg-white rounded-xl p-3 flex flex-col items-center justify-center shadow-sm">
                  <span className={`font-bold text-lg ${s.color}`}>{s.value}</span>
                  <span className="text-[9px] uppercase font-bold text-on-surface-variant/60">{s.label}</span>
                </div>
              ))}
            </div>

            {/* Grid of numbers */}
            <div className="flex-1 overflow-y-auto no-scrollbar">
              <div className="grid grid-cols-5 gap-2">
                {questions.map((q, i) => {
                  const isAnswered = answers[q.id_questao] != null
                  const isMarked   = marked[q.id_questao]
                  const isCurrent  = i === currentIndex

                  let cls = 'bg-white/40 border border-outline-variant/10 text-on-surface-variant hover:bg-white'
                  if (isCurrent)  cls = 'border-2 border-primary bg-white text-primary font-black shadow-md ring-4 ring-primary/10'
                  else if (isMarked)   cls = 'bg-amber-400 text-white shadow-sm'
                  else if (isAnswered) cls = 'bg-primary text-white shadow-sm'

                  return (
                    <button
                      key={q.id_questao}
                      onClick={() => setCurrentIndex(i)}
                      className={`aspect-square flex items-center justify-center rounded-lg font-bold text-xs cursor-pointer transition-all ${cls}`}
                    >
                      {i + 1}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Legenda */}
            <div className="mt-4 pt-4 border-t border-outline-variant/10 flex flex-col gap-2">
              {[
                { color: 'bg-primary', label: 'Respondida' },
                { color: 'bg-amber-400', label: 'Para revisar' },
                { color: 'bg-white border border-outline-variant/20', label: 'Não respondida' },
              ].map((l) => (
                <div key={l.label} className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-sm ${l.color}`} />
                  <span className="text-[10px] font-semibold text-on-surface-variant">{l.label}</span>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </main>

      {/* ── Modal de confirmação ── */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/30 backdrop-blur-sm" onClick={() => setShowConfirm(false)} />
          <div className="relative w-full max-w-md bg-white rounded-3xl p-8 shadow-2xl flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-6">
              <span className="material-symbols-outlined text-3xl text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>
                done_all
              </span>
            </div>
            <h2 className="text-2xl font-extrabold text-on-surface mb-2">Finalizar Simulado?</h2>
            <p className="text-on-surface-variant mb-2">
              Você respondeu <span className="font-bold text-primary">{answeredCount}</span> de <span className="font-bold">{questions.length}</span> questões.
            </p>
            {remaining > 0 && (
              <p className="text-sm text-tertiary font-semibold mb-6">
                ⚠ {remaining} questão{remaining > 1 ? 'ões' : ''} sem resposta.
              </p>
            )}
            <div className="w-full flex flex-col gap-3 mt-4">
              <button
                onClick={handleFinalize}
                className="w-full py-4 rounded-full bg-gradient-to-r from-primary to-blue-700 text-white font-bold shadow-lg hover:opacity-90 active:scale-95 transition-all"
              >
                Sim, finalizar agora
              </button>
              <button
                onClick={() => setShowConfirm(false)}
                className="w-full py-3 text-on-surface-variant font-semibold hover:text-on-surface transition-colors"
              >
                Continuar respondendo
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  )
}