import { useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';

interface Message {
  id: number;
  role: 'user' | 'ai';
  content: string;
}

export default function LabEstudosView() {
  const { id } = useParams();

  const [message, setMessage] = useState('');

  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      role: 'ai',
      content:
        'Olá, Dr. Clinical. Analisei as 12 fontes do seu laboratório sobre Cardiologia Clínica. Como posso ajudar seu estudo hoje? Posso resumir diretrizes, explicar mecanismos fisiopatológicos ou criar flashcards baseados nas suas notas.',
    },
    {
      id: 2,
      role: 'user',
      content:
        'Quais são as principais mudanças no manejo da Insuficiência Cardíaca com Fração de Ejeção Preservada (ICpFE) segundo a nova diretriz da AHA?',
    },
    {
      id: 3,
      role: 'ai',
      content:
        'Com base na Diretriz_AHA_2023.pdf (pg. 45-52), os destaques são: SGLT2i como Classe 1, maior foco em comorbidades e permanência dos MRAs/ARNIs para grupos específicos.',
    },
  ]);

  const paperData = useMemo(() => {
    const papers: Record<string, any> = {
      '1': {
        title: 'Fundamentos de Cardiologia Clínica',
        docs: 12,
      },
      '2': {
        title: 'Sequenciamento Oncológico',
        docs: 8,
      },
      '3': {
        title: 'Mapeamento Cognitivo',
        docs: 16,
      },
      '4': {
        title: 'Análise Laboratorial Avançada',
        docs: 5,
      },
    };

    return (
      papers[id || '1'] || {
        title: 'Laboratório de Estudos',
        docs: 10,
      }
    );
  }, [id]);

  function handleSend() {
    if (!message.trim()) return;

    setMessages((prev) => [
      ...prev,
      {
        id: Date.now(),
        role: 'user',
        content: message,
      },
    ]);

    setMessage('');
  }

  return (
    <div className="h-screen overflow-hidden bg-[#f7f9fc] text-slate-800">
      {/* TOPBAR */}
      <header className="fixed top-0 left-0 right-0 z-50 h-16 border-b border-slate-200/60 bg-white/70 backdrop-blur-xl px-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <span className="text-lg font-black tracking-tight text-primary">
            Modo Plantão Lab
          </span>

          <div className="h-6 w-px bg-slate-200" />

          <h1 className="font-semibold tracking-tight text-slate-900">
            {paperData.title}
          </h1>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative hidden md:block">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
              search
            </span>

            <input
              type="text"
              placeholder="Pesquisar no laboratório..."
              className="w-64 rounded-full border-none bg-slate-100 py-2 pl-10 pr-4 text-sm outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <button className="rounded-full p-2 text-slate-500 transition-all hover:bg-slate-100">
            <span className="material-symbols-outlined">
              notifications
            </span>
          </button>

          <button className="rounded-full p-2 text-slate-500 transition-all hover:bg-slate-100">
            <span className="material-symbols-outlined">
              account_circle
            </span>
          </button>
        </div>
      </header>

      {/* LAYOUT */}
      <div className="flex h-full pt-16">
        {/* SIDEBAR */}
        <aside className="w-64 border-r border-slate-200/60 bg-slate-50/80 backdrop-blur-2xl px-4 py-6 flex flex-col">
          {/* PROFILE */}
          <div className="mb-6 flex items-center gap-3 px-2">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white shadow-sm">
              <span className="material-symbols-outlined text-primary">
                person
              </span>
            </div>

            <div>
              <p className="text-sm font-bold text-slate-800">
                Dr. Clinical
              </p>

              <p className="text-xs font-medium text-primary">
                On Shift
              </p>
            </div>
          </div>

          {/* NAV */}
          <nav className="space-y-1">
            {[
              ['folder_open', 'Library'],
              ['biotech', 'Laboratory'],
              ['assignment_ind', 'Patients'],
              ['settings', 'Settings'],
            ].map(([icon, label], index) => (
              <button
                key={label}
                className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm transition-all ${
                  index === 1
                    ? 'bg-white text-primary shadow-sm font-semibold'
                    : 'text-slate-600 hover:translate-x-1 hover:text-primary'
                }`}
              >
                <span className="material-symbols-outlined">
                  {icon}
                </span>

                {label}
              </button>
            ))}
          </nav>

          <div className="mt-auto border-t border-slate-200/60 pt-4">
            <button className="flex w-full items-center gap-3 px-4 py-3 text-sm text-slate-600 transition-all hover:translate-x-1 hover:text-primary">
              <span className="material-symbols-outlined">
                help_outline
              </span>

              Help Center
            </button>
          </div>
        </aside>

        {/* MAIN CHAT */}
        <section className="flex flex-1 flex-col bg-[#f7f9fc]">
          {/* CHAT */}
          <div className="flex-1 overflow-y-auto px-12 py-10 space-y-8">
            {messages.map((msg) =>
              msg.role === 'ai' ? (
                <div
                  key={msg.id}
                  className="flex max-w-[90%] flex-col gap-2"
                >
                  <div className="mb-1 flex items-center gap-2 opacity-60">
                    <span className="material-symbols-outlined text-[16px] text-primary">
                      auto_awesome
                    </span>

                    <span className="text-[10px] font-bold uppercase tracking-[0.2em]">
                      IA DO LABORATÓRIO
                    </span>
                  </div>

                  <div className="rounded-[2rem] rounded-tl-sm border border-white/40 bg-white/70 p-6 backdrop-blur-xl shadow-[0_4px_24px_rgba(0,0,0,0.02)]">
                    <p className="text-[15px] leading-relaxed text-slate-800">
                      {msg.content}
                    </p>

                    {msg.id === 3 && (
                      <div className="mt-6 flex gap-3 overflow-x-auto">
                        <button className="whitespace-nowrap rounded-full bg-primary/10 px-4 py-2 text-[10px] font-bold uppercase tracking-[0.15em] text-primary transition-all hover:bg-primary/20">
                          Gerar Mapa Mental
                        </button>

                        <button className="whitespace-nowrap rounded-full bg-primary/10 px-4 py-2 text-[10px] font-bold uppercase tracking-[0.15em] text-primary transition-all hover:bg-primary/20">
                          Criar Flashcards
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div
                  key={msg.id}
                  className="ml-auto flex max-w-[85%] flex-col gap-2 items-end"
                >
                  <div className="rounded-[2rem] rounded-tr-sm bg-slate-800 p-6 shadow-xl">
                    <p className="text-[15px] font-medium leading-relaxed text-white">
                      {msg.content}
                    </p>
                  </div>
                </div>
              )
            )}
          </div>

          {/* INPUT */}
          <div className="p-8">
            <div className="mx-auto flex max-w-3xl items-center rounded-[2rem] border border-white/60 bg-white/70 px-4 py-3 backdrop-blur-xl shadow-[0_20px_60px_rgba(0,0,0,0.06)]">
              <button className="flex h-10 w-10 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-slate-100">
                <span className="material-symbols-outlined">
                  attach_file
                </span>
              </button>

              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Pergunte sobre suas fontes..."
                className="flex-1 bg-transparent px-4 text-[15px] outline-none placeholder:text-slate-400"
              />

              <div className="flex items-center gap-1">
                <button className="flex h-10 w-10 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-slate-100">
                  <span className="material-symbols-outlined">
                    mic
                  </span>
                </button>

                <button
                  onClick={handleSend}
                  className="ml-1 flex h-11 w-11 items-center justify-center rounded-full bg-primary text-white shadow-lg shadow-primary/25 transition-all hover:scale-105 active:scale-95"
                >
                  <span className="material-symbols-outlined">
                    send
                  </span>
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* RIGHT PANEL */}
        <aside className="w-[320px] overflow-hidden border-l border-slate-200/60 bg-slate-50/50 flex flex-col">
          {/* HEADER */}
          <div className="flex items-center justify-between p-6">
            <h2 className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500">
              Materiais Gerados
            </h2>

            <span className="material-symbols-outlined text-primary/40">
              auto_fix_high
            </span>
          </div>

          {/* CONTENT */}
          <div className="flex-1 overflow-y-auto px-5 pb-6 space-y-4">
            {/* CARD */}
            <button className="group w-full rounded-2xl border border-slate-100 bg-white p-4 text-left transition-all hover:border-primary/20 hover:shadow-lg">
              <div className="flex items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50 text-slate-400 transition-colors group-hover:bg-blue-50 group-hover:text-primary">
                  <span className="material-symbols-outlined">
                    graphic_eq
                  </span>
                </div>

                <div className="flex-1">
                  <h3 className="text-xs font-bold text-slate-800">
                    Resumo em Áudio
                  </h3>

                  <div className="mt-1.5 flex items-center gap-2">
                    <div className="h-1 flex-1 overflow-hidden rounded-full bg-slate-100">
                      <div className="h-full w-2/3 bg-primary" />
                    </div>

                    <span className="text-[9px] font-bold text-primary">
                      12:30
                    </span>
                  </div>
                </div>
              </div>
            </button>

            {/* CARD */}
            <button className="group w-full rounded-2xl border border-slate-100 bg-white p-4 text-left transition-all hover:border-primary/20 hover:shadow-lg">
              <div className="flex items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50 text-slate-400 transition-colors group-hover:bg-blue-50 group-hover:text-primary">
                  <span className="material-symbols-outlined">
                    hub
                  </span>
                </div>

                <div className="flex-1">
                  <h3 className="text-xs font-bold text-slate-800">
                    Mapa Mental
                  </h3>

                  <p className="mt-0.5 text-[10px] text-slate-400">
                    Fisiopatologia ICpFE
                  </p>
                </div>
              </div>
            </button>

            {/* CARD */}
            <button className="group w-full rounded-2xl border border-slate-100 bg-white p-4 text-left transition-all hover:border-primary/20 hover:shadow-lg">
              <div className="flex items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50 text-slate-400 transition-colors group-hover:bg-blue-50 group-hover:text-primary">
                  <span className="material-symbols-outlined">
                    style
                  </span>
                </div>

                <div className="flex-1">
                  <h3 className="text-xs font-bold text-slate-800">
                    Flashcards
                  </h3>

                  <p className="mt-0.5 text-[10px] text-slate-400">
                    48 cards disponíveis
                  </p>
                </div>

                <span className="rounded-lg bg-primary/10 px-2 py-1 text-[9px] font-bold uppercase tracking-tight text-primary">
                  24 Novos
                </span>
              </div>
            </button>

            {/* QUICK ACTIONS */}
            <div className="mt-6 border-t border-slate-200/60 pt-6">
              <h4 className="mb-4 text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500">
                Ações Rápidas
              </h4>

              <div className="grid gap-2">
                {[
                  ['hub', 'Gerar Mapa Mental'],
                  ['style', 'Criar Flashcards'],
                  ['summarize', 'Resumir Conteúdo'],
                  ['list_alt', 'Extrair Condutas'],
                  ['quiz', 'Gerar Lista de Questões'],
                ].map(([icon, label]) => (
                  <button
                    key={label}
                    className="group flex w-full items-center gap-4 rounded-2xl border border-slate-100 bg-white p-4 text-left transition-all hover:border-primary hover:bg-primary"
                  >
                    <span className="material-symbols-outlined text-primary transition-colors group-hover:text-white">
                      {icon}
                    </span>

                    <span className="text-[13px] font-semibold text-slate-700 transition-colors group-hover:text-white">
                      {label}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}