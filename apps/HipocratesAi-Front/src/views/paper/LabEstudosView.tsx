import { useEffect, useRef, useState, useCallback } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { useAuth } from '../../auth/AuthProvider';

const STUDENT_ID = 'e1925b44-9694-477c-a496-5e638e4a9e25';
const API = 'http://localhost:3333';

interface Message {
  id: number | string;
  role: 'user' | 'ai';
  content: string;
}

interface Source {
  id: string;
  titulo: string;
  tipo: string;
  status: string;
}

interface SessionState {
  id: string;
  titulo: string;
}

type QuickAction = {
  id: string;
  icon: string;
  label: string;
};

const QUICK_ACTIONS: QuickAction[] = [
  { id: 'mapa', icon: 'hub', label: 'Gerar Mapa Mental' },
  { id: 'flashcards', icon: 'style', label: 'Criar Flashcards' },
  { id: 'resumo', icon: 'summarize', label: 'Resumir Conteúdo' },
  { id: 'condutas', icon: 'list_alt', label: 'Extrair Condutas' },
  { id: 'questoes', icon: 'quiz', label: 'Gerar Lista de Questões' },
];

export default function LabEstudosView() {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const { doctor } = useAuth();
  const sessionFromState = location.state as SessionState | null;

  const [sessionTitle, setSessionTitle] = useState(sessionFromState?.titulo ?? 'Laboratório de Estudos');
  const [sources, setSources] = useState<Source[]>([]);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Quick Action Popup States
  const [activeAction, setActiveAction] = useState<QuickAction | null>(null);
  const [actionDetails, setActionDetails] = useState('');

  // Source adding
  const [showAddSource, setShowAddSource] = useState(false);
  const [addMode, setAddMode] = useState<'file' | 'url'>('url');
  const [urlInput, setUrlInput] = useState('');
  const [urlTipo, setUrlTipo] = useState<'link' | 'youtube'>('link');
  const [fileInput, setFileInput] = useState<File | null>(null);
  const [addingSource, setAddingSource] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const loadSources = useCallback(() => {
    if (!id) return;
    fetch(`${API}/student/${STUDENT_ID}/paperlab/sessions/${id}/sources`)
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (Array.isArray(data)) setSources(data); })
      .catch(() => {});
  }, [id]);

async function handleAddSource() {
    if (!id) return;
    setAddingSource(true);
    try {
      const form = new FormData();
      if (addMode === 'url') {
        const isYoutube = urlInput.includes('youtube.com') || urlInput.includes('youtu.be');
        const tipo = isYoutube ? 'youtube' : urlTipo;
        form.append('tipo', tipo);
        form.append('titulo', urlInput);
        form.append('url', urlInput);
      } else if (fileInput) {
        const ext = fileInput.name.split('.').pop()?.toLowerCase() ?? '';
        const tipo = ext === 'pdf' ? 'pdf' : ext === 'docx' ? 'docx' : 'image';
        form.append('tipo', tipo);
        form.append('titulo', fileInput.name);
        form.append('file', fileInput);
      }
      const res = await fetch(`${API}/student/${STUDENT_ID}/paperlab/sessions/${id}/sources`, {
        method: 'POST',
        body: form,
      });
      if (!res.ok) throw new Error();
      setUrlInput('');
      setFileInput(null);
      setShowAddSource(false);
      loadSources();
    } catch {
    } finally {
      setAddingSource(false);
    }
  }

  useEffect(() => {
    if (!id) return;

    fetch(`${API}/student/${STUDENT_ID}/paperlab/sessions/${id}`)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.titulo) setSessionTitle(data.titulo);
        if (Array.isArray(data?.sources)) setSources(data.sources);
      })
      .catch(() => {});

    loadSources();

    fetch(`${API}/student/${STUDENT_ID}/paperlab/sessions/${id}/chat`)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        const history = Array.isArray(data?.messages) ? data.messages : (Array.isArray(data) ? data : []);
        if (history.length > 0) {
          setMessages(history.map((m: any, i: number) => ({
            id: m.id ?? i,
            role: m.role === 'assistant' ? 'ai' : m.role,
            content: m.content,
          })));
        } else {
          const name = doctor?.full_name ? `Dr. ${doctor.full_name.split(' ')[0]}` : 'Dr.';
          setMessages([{
            id: 0,
            role: 'ai',
            content: `Olá, ${name}. Este é seu laboratório "${sessionTitle}". Adicione fontes e farei uma análise profunda para ajudar seu estudo.`,
          }]);
        }
      })
      .catch(() => {});
  }, [id, loadSources]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Função centralizada para enviar mensagens (usada pelo input e pelo popup)
  async function sendMessage(text: string) {
    if (!text || sending || !id) return;

    setMessages(prev => [...prev, { id: Date.now(), role: 'user', content: text }]);
    setMessage('');
    setSending(true);

    try {
      const res = await fetch(`${API}/student/${STUDENT_ID}/paperlab/sessions/${id}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pergunta: text }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      const reply = data.resposta ?? data.content ?? data.message ?? 'Sem resposta.';
      setMessages(prev => [...prev, { id: Date.now() + 1, role: 'ai', content: reply }]);
    } catch {
      setMessages(prev => [...prev, { id: Date.now() + 1, role: 'ai', content: 'Erro ao processar sua pergunta. Tente novamente.' }]);
    } finally {
      setSending(false);
    }
  }

  function handleSend() {
    sendMessage(message.trim());
  }

  function handleExecuteQuickAction() {
    if (!activeAction) return;
    
    // Constrói o prompt mesclando a ação com as instruções adicionais (se houverem)
    const basePrompt = `Por favor, ${activeAction.label.toLowerCase()} com base nas fontes deste notebook.`;
    const finalPrompt = actionDetails.trim() 
      ? `${basePrompt} Instruções adicionais: ${actionDetails.trim()}`
      : basePrompt;

    sendMessage(finalPrompt);
    
    // Fecha e limpa o popup
    setActiveAction(null);
    setActionDetails('');
  }

  const displayName = doctor?.full_name ?? 'Dr.';

  return (
    <div className="flex flex-col bg-[#f7f9fc] text-slate-800" style={{ minHeight: 'calc(100vh - 96px)' }}>
      
      {/* POPUP DE AÇÃO RÁPIDA */}
      {activeAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm px-4">
          {/* Backdrop (clicar fora para fechar) */}
          <div className="absolute inset-0 z-0 cursor-pointer" onClick={() => setActiveAction(null)} />
          
          <div className="relative z-10 w-full max-w-md bg-white rounded-3xl shadow-[0_32px_64px_rgba(0,0,0,0.15)] p-6 flex flex-col gap-4 animate-in fade-in zoom-in duration-200">
            
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100 shadow-sm">
                <span className="material-symbols-outlined text-[24px]">{activeAction.icon}</span>
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 tracking-tight">{activeAction.label}</h3>
                <p className="text-xs text-slate-500 font-medium">Configure os detalhes da sua requisição</p>
              </div>
            </div>
            
            <div className="mt-2">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-widest mb-2 block">
                Instruções adicionais (Opcional)
              </label>
              <textarea 
                value={actionDetails}
                onChange={(e) => setActionDetails(e.target.value)}
                placeholder="Ex: Focar apenas no capítulo 3, extrair posologias, usar formato de tabela..."
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all resize-none h-28 placeholder:text-slate-400"
              />
            </div>

            <div className="flex items-center justify-end gap-3 mt-4 pt-5 border-t border-slate-100">
              <button 
                onClick={() => setActiveAction(null)}
                className="px-5 py-2.5 text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors uppercase tracking-wider"
              >
                Cancelar
              </button>
              <button 
                onClick={handleExecuteQuickAction}
                className="px-6 py-2.5 bg-blue-600 text-white text-xs font-bold uppercase tracking-wider rounded-xl hover:bg-blue-700 hover:-translate-y-0.5 transition-all shadow-sm flex items-center gap-2"
              >
                <span>Executar</span>
                <span className="material-symbols-outlined text-[16px]">send</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PAGE TITLE */}
      <div className="px-6 py-4 border-b border-slate-200/60 bg-white/70 backdrop-blur-xl flex items-center gap-4">
        <span className="text-sm font-black tracking-tight text-blue-600">Plantão Lab</span>
        <div className="h-4 w-px bg-slate-200" />
        <h1 className="font-semibold tracking-tight text-slate-900 truncate max-w-sm text-sm">{sessionTitle}</h1>
      </div>

      {/* LAYOUT */}
      <div className="flex flex-1 overflow-hidden" style={{ height: 'calc(100vh - 96px - 57px)' }}>
        {/* SIDEBAR ESQUERDA (FONTES) */}
        <aside className="w-64 border-r border-slate-200/60 bg-slate-50/80 backdrop-blur-2xl px-4 py-6 flex flex-col">
          <div className="mb-6 flex items-center gap-3 px-2">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white shadow-sm">
              <span className="material-symbols-outlined text-blue-600">person</span>
            </div>
            <div>
              <p className="text-sm font-bold text-slate-800">{displayName}</p>
              <p className="text-xs font-medium text-blue-600">Estudante</p>
            </div>
          </div>

          {/* SOURCES */}
          <div className="flex-1 overflow-y-auto">
            <div className="flex items-center justify-between px-2 mb-3">
              <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400">
                Fontes ({sources.length})
              </p>
              <button
                onClick={() => setShowAddSource(v => !v)}
                className="w-6 h-6 rounded-full bg-blue-600/10 flex items-center justify-center hover:bg-blue-600/20 transition-colors"
              >
                <span className="material-symbols-outlined text-bg-blue-600 text-[14px]">
                  {showAddSource ? 'close' : 'add'}
                </span>
              </button>
            </div>

            {/* Add source form */}
            {showAddSource && (
              <div className="mb-4 rounded-2xl border border-slate-200/60 bg-white/80 p-3 space-y-2">
                {/* Mode toggle */}
                <div className="flex gap-1 p-1 bg-slate-100 rounded-xl">
                  <button
                    onClick={() => setAddMode('url')}
                    className={`flex-1 text-[11px] font-bold py-1.5 rounded-lg transition-all ${addMode === 'url' ? 'bg-white text-[#006e2a] shadow-sm' : 'text-slate-500'}`}
                  >
                    URL
                  </button>
                  <button
                    onClick={() => setAddMode('file')}
                    className={`flex-1 text-[11px] font-bold py-1.5 rounded-lg transition-all ${addMode === 'file' ? 'bg-white text-[#006e2a] shadow-sm' : 'text-slate-500'}`}
                  >
                    Arquivo
                  </button>
                </div>

                {addMode === 'url' ? (
                  <input
                    type="text"
                    value={urlInput}
                    onChange={e => setUrlInput(e.target.value)}
                    placeholder="Cole uma URL ou link do YouTube..."
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs outline-none focus:border-[#006e2a] transition-colors"
                  />
                ) : (
                  <button
                    onClick={() => fileRef.current?.click()}
                    className="w-full rounded-xl border border-dashed border-slate-300 bg-slate-50 py-3 text-xs text-slate-500 hover:border-[#006e2a] hover:text-[#006e2a] transition-colors"
                  >
                    {fileInput ? fileInput.name : 'Selecionar PDF, DOCX ou imagem'}
                  </button>
                )}
                <input ref={fileRef} type="file" accept=".pdf,.docx,image/*" className="hidden" onChange={e => setFileInput(e.target.files?.[0] ?? null)} />

                <button
                  onClick={handleAddSource}
                  disabled={addingSource || (addMode === 'url' ? !urlInput.trim() : !fileInput)}
                  className="w-full py-2 rounded-xl bg-[#006e2a] text-white text-[11px] font-bold disabled:opacity-40 transition-all hover:bg-[#006e2a]/90"
                >
                  {addingSource ? 'Adicionando...' : 'Adicionar fonte'}
                </button>
              </div>
            )}

            {sources.length === 0 && !showAddSource ? (
              <p className="text-xs text-slate-400 px-2 leading-relaxed">
                Clique em + para adicionar uma fonte.
              </p>
            ) : (
              <div className="space-y-2">
                {sources.map(s => (
                  <div key={s.id} className="flex items-center gap-2 px-2 py-2 rounded-xl hover:bg-white transition-colors">
                    <span className="material-symbols-outlined text-slate-400 text-[18px]">
                      {s.tipo === 'youtube' ? 'play_circle' : s.tipo === 'link' ? 'link' : 'description'}
                    </span>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-slate-700 truncate">{s.titulo}</p>
                      <p className="text-[10px] text-slate-400 uppercase">{s.tipo}</p>
                    </div>
                    {s.status === 'indexing' && (
                      <span className="ml-auto w-2 h-2 rounded-full bg-yellow-400 animate-pulse shrink-0" title="Indexando..." />
                    )}
                    {s.status === 'ready' && (
                      <span className="ml-auto w-2 h-2 rounded-full bg-blue-600 shrink-0" title="Pronto" />
                    )}
                    {s.status === 'error' && (
                      <span className="ml-auto w-2 h-2 rounded-full bg-red-400 shrink-0" title="Erro" />
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-auto border-t border-slate-200/60 pt-4">
            <p className="text-[10px] text-slate-400 px-2">
              Sessão ID: <span className="font-mono">{id?.slice(0, 8)}…</span>
            </p>
          </div>
        </aside>

        {/* MAIN CHAT */}
        <section className="flex flex-1 flex-col bg-[#f7f9fc]">
          <div className="flex-1 overflow-y-auto px-12 py-10 space-y-8">
            {messages.map((msg) =>
              msg.role === 'ai' ? (
                <div key={msg.id} className="flex max-w-[90%] flex-col gap-2">
                  <div className="mb-1 flex items-center gap-2 opacity-60">
                    <span className="material-symbols-outlined text-[16px] text-blue-600">auto_awesome</span>
                    <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-blue-600">IA DO LABORATÓRIO</span>
                  </div>
                  <div className="rounded-[2rem] rounded-tl-sm border border-white/40 bg-white/70 p-6 backdrop-blur-xl shadow-[0_4px_24px_rgba(0,0,0,0.02)]">
                    <p className="text-[15px] leading-relaxed text-slate-800 whitespace-pre-wrap">{msg.content}</p>
                  </div>
                </div>
              ) : (
                <div key={msg.id} className="ml-auto flex max-w-[85%] flex-col gap-2 items-end">
                  <div className="rounded-[2rem] rounded-tr-sm bg-slate-800 p-6 shadow-xl">
                    <p className="text-[15px] font-medium leading-relaxed text-white">{msg.content}</p>
                  </div>
                </div>
              )
            )}
            {sending && (
              <div className="flex max-w-[90%] flex-col gap-2">
                <div className="rounded-[2rem] rounded-tl-sm border border-white/40 bg-white/70 p-6">
                  <div className="flex gap-2 items-center">
                    <div className="w-2 h-2 rounded-full bg-[#006e2a] animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 rounded-full bg-[#006e2a] animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 rounded-full bg-[#006e2a] animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* INPUT CHAT */}
          <div className="p-8">
            <div className="mx-auto flex max-w-3xl items-center rounded-[2rem] border border-white/60 bg-white/70 px-4 py-3 backdrop-blur-xl shadow-[0_20px_60px_rgba(0,0,0,0.06)]">
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
                placeholder="Pergunte sobre suas fontes..."
                className="flex-1 bg-transparent px-4 text-[15px] outline-none placeholder:text-slate-400"
              />
              <button
                onClick={handleSend}
                disabled={!message.trim() || sending}
                className="ml-1 flex h-11 w-11 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg shadow-[#006e2a]/25 transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="material-symbols-outlined">send</span>
              </button>
            </div>
          </div>
        </section>

        {/* RIGHT PANEL (AÇÕES RÁPIDAS) */}
        <aside className="w-[280px] overflow-hidden border-l border-slate-200/60 bg-slate-50/50 flex flex-col">
          <div className="flex items-center justify-between p-6">
            <h2 className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500">
              Ações Rápidas
            </h2>
            <span className="material-symbols-outlined text-blue-600/60">auto_fix_high</span>
          </div>

          <div className="flex-1 overflow-y-auto px-5 pb-6 space-y-2">
            {QUICK_ACTIONS.map((action) => (
              <button
                key={action.id}
                onClick={() => setActiveAction(action)}
                className="group flex w-full items-center gap-4 rounded-2xl border border-slate-100 bg-white p-4 text-left transition-all hover:border-bg-blue-600 hover:bg-blue-600"
              >
                <span className="material-symbols-outlined text-blue-600 transition-colors group-hover:text-white">
                  {action.icon}
                </span>
                <span className="text-[13px] font-semibold text-slate-700 transition-colors group-hover:text-white">
                  {action.label}
                </span>
              </button>
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
}