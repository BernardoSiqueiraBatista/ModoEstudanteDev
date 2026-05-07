import { useState, useEffect } from 'react'

interface Performance {
  taxaAcertos: number        // 0–1
  questoesResolvidas: number
  tempoEstudo: number        // segundos
}

// ── Utilitários ──────────────────────────────────────────────
function formatTempo(segundos: number) {
  const h = Math.floor(segundos / 3600)
  const m = Math.floor((segundos % 3600) / 60)
  return h > 0 ? `${h}h ${m}m` : `${m}m`
}

// Simula um studentID vindo do contexto de autenticação
const STUDENT_ID : string = "e1925b44-9694-477c-a496-5e638e4a9e25"

async function fetchPerformance(id: string): Promise<Performance> {
  const res = await fetch(`http://localhost:3333/student/performance/${id}`)
  if (!res.ok) throw new Error(`Erro ${res.status}: ${res.statusText}`)
  console.log(res.body);
  return res.json()
}

// ── Componente de barra animada ──────────────────────────────
function AnimatedBar({ value, delay = 0 }: { value: number; delay?: number }) {
  const [width, setWidth] = useState(0)
  useEffect(() => {
    const t = setTimeout(() => setWidth(value), delay)
    return () => clearTimeout(t)
  }, [value, delay])
  return (
    <div className="h-2.5 w-full bg-surface-container rounded-full overflow-hidden">
      <div
        className="h-full bg-primary rounded-full transition-all duration-700 ease-out"
        style={{ width: `${width}%` }}
      />
    </div>
  )
}

// ── Componente de número animado ─────────────────────────────
function CountUp({ target, suffix = '', decimals = 0 }: { target: number; suffix?: string; decimals?: number }) {
  const [val, setVal] = useState(0)
  useEffect(() => {
    let start = 0
    const step = target / 60
    const timer = setInterval(() => {
      start += step
      if (start >= target) { setVal(target); clearInterval(timer) }
      else setVal(start)
    }, 16)
    return () => clearInterval(timer)
  }, [target])
  return <>{val.toFixed(decimals)}{suffix}</>
}

// ── Página principal ─────────────────────────────────────────
export default function PerformanceMap() {
  const [data, setData]       = useState<Performance | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState<string | null>(null)

  useEffect(() => {
    fetchPerformance(STUDENT_ID)
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  // ── Loading ──
  if (loading) return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-surface gap-4">
      <svg className="animate-spin h-10 w-10 text-primary" viewBox="0 0 24 24" fill="none">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
      </svg>
      <p className="text-on-surface-variant font-semibold tracking-wide">Carregando performance…</p>
    </div>
  )

  // ── Erro ──
  if (error) return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-surface gap-4">
      <span className="material-symbols-outlined text-5xl text-tertiary">error</span>
      <p className="text-on-surface font-bold text-lg">Falha ao carregar dados</p>
      <p className="text-on-surface-variant text-sm">{error}</p>
      <button
        onClick={() => { setError(null); setLoading(true); fetchPerformance(STUDENT_ID).then(setData).catch((e) => setError(e.message)).finally(() => setLoading(false)) }}
        className="mt-2 px-6 py-2.5 rounded-full bg-primary text-white font-bold hover:opacity-90 transition"
      >
        Tentar novamente
      </button>
    </div>
  )

  if (!data) return null

  const taxaPct        = Math.round(data.taxaAcertos * 100)
  const tempoFormatado = formatTempo(data.tempoEstudo)

  // domínios fictícios (futuramente podem vir do back)
  const dominios = [
    { label: 'Cardiologia',    pct: 88 },
    { label: 'Neurologia',     pct: 74 },
    { label: 'Endocrinologia', pct: 62 },
    { label: 'Pediatria',      pct: 81 },
  ]

  const conquistas = [
    { icon: 'assignment_turned_in', bg: 'bg-primary-container',   color: 'text-on-primary-fixed-variant', titulo: 'Simulado Concluído',       sub: 'ENAMED 2024' },
    { icon: 'medical_services',     bg: 'bg-secondary-container', color: 'text-on-secondary-container',   titulo: 'Mestre em Cardiologia',    sub: 'Módulo 1 finalizado' },
    { icon: 'bolt',                 bg: 'bg-amber-100',           color: 'text-amber-600',                titulo: 'Consistência de 30 dias',  sub: 'Meta batida: Junho' },
  ]

  return (
    <div className="min-h-screen bg-surface font-body text-on-surface antialiased">

      {/* ── Header fixo ── */}
      <header className="bg-white/70 backdrop-blur-xl sticky top-0 z-50 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border-b border-outline-variant/10">
        <div className="flex justify-between items-center px-8 h-16 w-full max-w-[1440px] mx-auto">
          <div className="flex items-center gap-3">
            <span className="text-xl font-black tracking-tighter text-slate-900">ShiftMap</span>
            <span className="text-[10px] font-bold tracking-widest text-primary uppercase bg-primary/10 px-2 py-0.5 rounded-full">
              Hipócrates.ai
            </span>
          </div>
          <nav className="hidden md:flex items-center space-x-8">
            {['Dashboard', 'Especialidades', 'Marcos', 'Analytics'].map((item, i) => (
              <a
                key={item}
                href="#"
                className={`font-semibold transition-all duration-200 ${i === 0 ? 'text-primary border-b-2 border-primary' : 'text-slate-500 hover:text-slate-900'}`}
              >
                {item}
              </a>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            <button className="p-2 text-slate-500 hover:bg-slate-100 rounded-full transition">
              <span className="material-symbols-outlined">notifications</span>
            </button>
            <button className="p-2 text-slate-500 hover:bg-slate-100 rounded-full transition">
              <span className="material-symbols-outlined">settings</span>
            </button>
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white font-bold text-sm ring-2 ring-primary/20">
              A
            </div>
          </div>
        </div>
      </header>

      {/* ── Conteúdo ── */}
      <main className="max-w-[1440px] mx-auto px-8 py-12">

        {/* Título */}
        <header className="mb-12">
          <h1 className="text-[2.25rem] font-extrabold tracking-tight text-on-background leading-tight">
            Mapa de Performance Acadêmica
          </h1>
          <p className="text-on-surface-variant font-medium mt-1">
            Análise longitudinal da sua jornada de aprendizado.
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">

          {/* ── Card: Taxa de Acertos ── */}
          <div className="md:col-span-4 glass-card p-8 rounded-[2rem] flex flex-col justify-between">
            <div>
              <span className="text-xs font-bold tracking-widest uppercase text-on-surface-variant opacity-60">
                Taxa Global de Acerto
              </span>
              <div className="text-5xl font-black mt-2 text-primary">
                <CountUp target={taxaPct} suffix="%" />
              </div>
            </div>
            {/* Mini barchart decorativo */}
            <div className="mt-8 h-12 w-full flex items-end gap-1">
              {[0.5, 0.75, 0.65, 1, 0.8, 0.9, 0.7].map((h, i) => (
                <div
                  key={i}
                  className="bg-primary rounded-full w-full transition-all"
                  style={{ height: `${h * 100}%`, opacity: 0.2 + h * 0.8 }}
                />
              ))}
            </div>
          </div>

          {/* ── Card: Questões Resolvidas ── */}
          <div className="md:col-span-4 glass-card p-8 rounded-[2rem] flex flex-col justify-between">
            <div>
              <span className="text-xs font-bold tracking-widest uppercase text-on-surface-variant opacity-60">
                Questões Resolvidas
              </span>
              <div className="text-5xl font-black mt-2 text-on-background">
                <CountUp target={data.questoesResolvidas} />
              </div>
            </div>
            <div className="mt-4 flex items-center text-primary font-bold text-sm">
              <span className="material-symbols-outlined text-sm mr-1">trending_up</span>
              Evolução contínua
            </div>
          </div>

          {/* ── Card: Tempo de Estudo ── */}
          <div className="md:col-span-4 glass-card p-8 rounded-[2rem] flex flex-col justify-between">
            <div>
              <span className="text-xs font-bold tracking-widest uppercase text-on-surface-variant opacity-60">
                Tempo de Estudo
              </span>
              <div className="text-5xl font-black mt-2 text-on-background">
                {tempoFormatado}
              </div>
            </div>
            <div className="mt-4 flex items-center text-on-surface-variant font-medium text-sm">
              Foco médio: 92%
            </div>
          </div>

          {/* ── Análise por domínio ── */}
          <div className="md:col-span-7 glass-card p-10 rounded-[2.5rem]">
            <h3 className="text-lg font-bold mb-8 text-on-background">Análise por Domínio Cognitivo</h3>
            <div className="space-y-6">
              {dominios.map(({ label, pct }, i) => (
                <div key={label} className="space-y-2">
                  <div className="flex justify-between items-end">
                    <span className="text-sm font-semibold text-on-surface-variant">{label}</span>
                    <span className="text-lg font-bold text-primary">{pct}%</span>
                  </div>
                  <AnimatedBar value={pct} delay={i * 120} />
                </div>
              ))}
            </div>
          </div>

          {/* ── Consistência de aprendizado ── */}
          <div className="md:col-span-5 glass-card p-10 rounded-[2.5rem] relative overflow-hidden">
            <h3 className="text-lg font-bold mb-8 text-on-background">Consistência de Aprendizado</h3>
            <div className="flex flex-col h-[280px] justify-between">
              <div className="flex items-center justify-between w-full h-40">
                <svg className="w-full h-full" viewBox="0 0 400 150">
                  <defs>
                    <linearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#3366cc" stopOpacity="0.15" />
                      <stop offset="100%" stopColor="#3366cc" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  <path
                    d="M0,120 Q50,110 100,80 T200,60 T300,40 T400,20"
                    fill="url(#lineGrad)"
                    stroke="none"
                  />
                  <path
                    d="M0,120 Q50,110 100,80 T200,60 T300,40 T400,20"
                    fill="none"
                    stroke="#3366cc"
                    strokeWidth="3"
                    strokeLinecap="round"
                  />
                  {[[0,120],[100,80],[200,60],[300,40],[400,20]].map(([cx,cy],i) => (
                    <circle key={i} cx={cx} cy={cy} r="5" fill="#fff" stroke="#3366cc" strokeWidth="2.5" />
                  ))}
                </svg>
              </div>
              <div className="flex justify-between text-[10px] font-bold text-on-surface-variant uppercase tracking-widest pt-4">
                {['Jan','Fev','Mar','Abr','Mai','Jun'].map((m) => <span key={m}>{m}</span>)}
              </div>
            </div>
          </div>

          {/* ── Conquistas ── */}
          <div className="md:col-span-12">
            <h3 className="text-lg font-bold mb-6 text-on-background">Conquistas & Marcos</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {conquistas.map(({ icon, bg, color, titulo, sub }) => (
                <div
                  key={titulo}
                  className="glass-card p-6 rounded-[2rem] flex items-center gap-5 hover:bg-surface-bright transition-colors cursor-default group"
                >
                  <div className={`w-14 h-14 rounded-2xl ${bg} flex items-center justify-center ${color} group-hover:scale-110 transition-transform`}>
                    <span className="material-symbols-outlined text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                      {icon}
                    </span>
                  </div>
                  <div>
                    <p className="font-bold text-on-background">{titulo}</p>
                    <p className="text-xs text-on-surface-variant">{sub}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </main>

      <style>{`
        .glass-card {
          background: rgba(255,255,255,0.7);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          box-shadow: 0 8px 32px 0 rgba(0,0,0,0.02);
          border: 1px solid rgba(255,255,255,0.4);
        }
        .material-symbols-outlined {
          font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
        }
      `}</style>
    </div>
  )
}