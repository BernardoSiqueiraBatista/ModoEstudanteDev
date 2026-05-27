import { useState } from 'react';

export default function Flashcard() {
  const [open, setOpen] = useState(true);
  const [revealed, setRevealed] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [wrongCount, setWrongCount] = useState(0);
  const [message, setMessage] = useState('');

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-slate-900/10 backdrop-blur-sm p-4">
      {/* BACKGROUND GLOW */}
      <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/10 blur-[120px] rounded-full pointer-events-none" />

      <div className="absolute bottom-[-10%] left-[-10%] w-[35%] h-[35%] bg-cyan-200/30 blur-[120px] rounded-full pointer-events-none" />

      {/* MODAL */}
      <div className="relative w-full max-w-4xl h-[85vh] max-h-[820px] overflow-hidden rounded-[2.5rem] border border-white/60 bg-white/80 backdrop-blur-[24px] shadow-[0_40px_80px_-15px_rgba(0,0,0,0.1)] flex flex-col">
        {/* HEADER */}
        <div className="flex items-start justify-between px-8 pt-8 pb-4">
          <div className="flex flex-col gap-1">
            <h2 className="text-[11px] font-bold tracking-[0.2em] uppercase text-slate-400">
              Farmacologia Flashcards
            </h2>

            <p className="text-sm font-medium text-slate-400">
              Com base em sua última aula
            </p>
          </div>

          <button
            type="button"
            onClick={() => setOpen(false)}
            className="w-9 h-9 rounded-full hover:bg-white/60 transition-colors flex items-center justify-center"
          >
            <span className="material-symbols-outlined text-slate-400 text-[22px]">
              close
            </span>
          </button>
        </div>

        {/* CONTENT */}
        <div className="relative flex flex-1 flex-col items-center justify-center px-8">
          {/* COUNTER */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 text-[11px] font-bold tracking-[0.2em] uppercase text-slate-300">
            1 / 70
          </div>

          {/* FLASHCARD */}
          <div className="relative w-full max-w-xl aspect-[1.4/1] rounded-[2.5rem] bg-white shadow-[0_20px_40px_-12px_rgba(0,0,0,0.05)] flex flex-col items-center justify-center p-12 text-center">
            {/* TOP LEFT */}
            <div className="absolute top-8 left-8">
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-300">
                Conceito
              </span>
            </div>

            {/* TOP RIGHT */}
            <div className="absolute top-8 right-8">
              <span className="material-symbols-outlined text-slate-300 hover:text-slate-500 cursor-pointer transition-colors">
                more_vert
              </span>
            </div>

            {!revealed ? (
              <>
                <h3 className="max-w-md text-2xl md:text-3xl font-medium leading-snug text-slate-800">
                  Qual o mecanismo de ação dos{' '}
                  <span className="text-blue-600 italic font-semibold">
                    Inibidores da ECA
                  </span>{' '}
                  na insuficiência cardíaca?
                </h3>

                <button
                  type="button"
                  onClick={() => setRevealed(true)}
                  className="mt-12 flex items-center gap-2 rounded-full border border-slate-200/60 bg-slate-50/80 px-6 py-2.5 text-xs font-semibold text-slate-500 backdrop-blur-sm transition-all hover:bg-slate-100"
                >
                  <span className="material-symbols-outlined text-lg">
                    visibility
                  </span>

                  Revelar Resposta
                </button>
              </>
            ) : (
              <>
                <div className="mb-5 flex items-center gap-2 rounded-full bg-blue-50 px-4 py-2">
                  <span className="material-symbols-outlined text-blue-600 text-[18px]">
                    lightbulb
                  </span>

                  <span className="text-[11px] font-bold uppercase tracking-[0.15em] text-blue-600">
                    Resposta
                  </span>
                </div>

                <p className="max-w-lg text-base leading-relaxed text-slate-700">
                  Os Inibidores da ECA reduzem a formação de angiotensina II,
                  diminuindo a vasoconstrição e a retenção de sódio. Isso reduz
                  a pós-carga e melhora o débito cardíaco na insuficiência
                  cardíaca.
                </p>
              </>
            )}
          </div>

          {/* NAVIGATION */}
          <div className="mt-10 flex items-center gap-6">
            {/* PREV */}
            <button
              type="button"
              className="w-12 h-12 rounded-full border border-white/70 bg-white/60 backdrop-blur-md shadow-[0_4px_12px_rgba(0,0,0,0.03)] flex items-center justify-center text-slate-400 transition-all hover:scale-105 hover:text-slate-600"
            >
              <span className="material-symbols-outlined">
                arrow_back
              </span>
            </button>

            {/* FEEDBACK */}
            <div className="flex items-center gap-3">
              {/* WRONG */}
              <button
                type="button"
                onClick={() => setWrongCount(wrongCount + 1)}
                className="group flex items-center gap-2 rounded-full border border-white/70 bg-white/60 px-5 py-2.5 text-slate-500 backdrop-blur-md shadow-[0_4px_12px_rgba(0,0,0,0.03)] transition-all hover:border-red-100 hover:bg-red-50 hover:text-red-500"
              >
                <span className="material-symbols-outlined text-red-400 group-hover:text-red-500 transition-colors">
                  close
                </span>

                <span className="text-xs font-bold">
                  {wrongCount}
                </span>
              </button>

              {/* CORRECT */}
              <button
                type="button"
                onClick={() => setCorrectCount(correctCount + 1)}
                className="group flex items-center gap-2 rounded-full border border-white/70 bg-white/60 px-5 py-2.5 text-slate-500 backdrop-blur-md shadow-[0_4px_12px_rgba(0,0,0,0.03)] transition-all hover:border-emerald-100 hover:bg-emerald-50 hover:text-emerald-500"
              >
                <span className="text-xs font-bold">
                  {correctCount}
                </span>

                <span
                  className="material-symbols-outlined text-emerald-400 group-hover:text-emerald-500 transition-colors"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  check
                </span>
              </button>
            </div>

            {/* NEXT */}
            <button
              type="button"
              className="w-12 h-12 rounded-full border border-white/70 bg-white/80 backdrop-blur-md shadow-[0_4px_12px_rgba(0,0,0,0.03)] flex items-center justify-center text-slate-400 transition-all hover:scale-105 hover:text-slate-600"
            >
              <span className="material-symbols-outlined">
                arrow_forward
              </span>
            </button>
          </div>
        </div>

        {/* FOOTER */}
        <div className="px-8 pb-8 pt-4">
          {/* INPUT */}
          <div className="relative flex items-center gap-2 rounded-2xl border border-slate-200/60 bg-white/50 p-1.5 shadow-sm transition-all focus-within:border-blue-200 focus-within:shadow-md">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Solicite uma alteração ou tire uma dúvida..."
              className="flex-1 bg-transparent px-4 py-2 text-sm text-slate-600 placeholder:text-slate-400 outline-none"
            />

            <button
              type="button"
              className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-white shadow-lg shadow-blue-600/20 transition-all hover:bg-blue-700"
            >
              <span className="text-sm font-bold">
                Gerar
              </span>

              <span
                className="material-symbols-outlined text-xl"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                bolt
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}