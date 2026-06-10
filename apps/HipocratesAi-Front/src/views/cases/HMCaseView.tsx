import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const STUDENT_ID = 'e1925b44-9694-477c-a496-5e638e4a9e25';
const API = 'http://localhost:3333';

interface Message {
  role: 'user' | 'assistant' | 'hint';
  content: string;
}

export default function HMCaseView() {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [hintLoading, setHintLoading] = useState(false);
  const [attemptId] = useState(() => sessionStorage.getItem('hm-attempt-id') ?? '');
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function sendMessage() {
    const text = input.trim();
    if (!text || loading || !attemptId) return;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: text }]);
    setLoading(true);
    try {
      const res = await fetch(`${API}/student/v1/cases/attempts/${attemptId}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ student_id: STUDENT_ID, mensagem: text }),
      });
      const data = await res.json();
      setMessages(prev => [...prev, { role: 'assistant', content: data.resposta }]);
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: '(Erro de comunicação — tente novamente.)' }]);
    } finally {
      setLoading(false);
    }
  }

  async function requestHint() {
    if (hintLoading || !attemptId) return;
    setHintLoading(true);
    try {
      const res = await fetch(`${API}/student/v1/cases/attempts/${attemptId}/hint`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ student_id: STUDENT_ID }),
      });
      const data = await res.json();
      setMessages(prev => [...prev, { role: 'hint', content: data.dica }]);
    } catch {/* silent */} finally {
      setHintLoading(false);
    }
  }

  async function finishSession() {
    if (!attemptId) { navigate('/cases'); return; }
    try {
      await fetch(`${API}/student/v1/cases/attempts/${attemptId}/finish-hm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ student_id: STUDENT_ID }),
      });
    } finally {
      sessionStorage.removeItem('hm-attempt-id');
      navigate('/cases');
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans pb-10">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">

        {/* Header */}
        <header className="flex flex-col sm:flex-row sm:items-end justify-between mb-5 gap-3">
          <div>
            <div className="flex items-center gap-1.5 mb-1.5">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-600" />
              </span>
              <span className="text-[9px] font-bold tracking-widest text-slate-500 uppercase">Simulação HM — Aprendizado Livre</span>
            </div>
            <h1 className="text-xl md:text-2xl font-bold tracking-tight text-slate-900">
              Simulação Convencional
            </h1>
            <p className="text-xs text-slate-500 mt-1">Converse com o paciente simulado. Solicite dicas quando precisar.</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={requestHint}
              disabled={hintLoading || !attemptId}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-amber-50 border border-amber-200 text-amber-700 text-xs font-bold rounded-lg hover:bg-amber-100 transition-colors disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-[16px]">lightbulb</span>
              {hintLoading ? 'Carregando...' : 'Pedir Dica'}
            </button>
            <button
              onClick={finishSession}
              className="flex items-center gap-1.5 px-5 py-2.5 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors shadow-sm"
            >
              <span className="material-symbols-outlined text-[16px]">flag</span>
              <span className="text-xs font-bold uppercase tracking-wider">Finalizar</span>
            </button>
          </div>
        </header>

        {/* Chat */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col h-[600px]">

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4 scrollbar-thin scrollbar-thumb-slate-200">
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-center text-slate-400">
                <span className="material-symbols-outlined text-5xl mb-3 text-slate-300">chat_bubble_outline</span>
                <p className="text-sm font-medium">Inicie a consulta falando com o paciente.</p>
                <p className="text-xs mt-1">Ex.: "Bom dia, pode me contar o que está sentindo?"</p>
              </div>
            )}
            {messages.map((m, i) => (
              m.role === 'hint' ? (
                <div key={i} className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl p-3">
                  <span className="material-symbols-outlined text-amber-500 text-[18px] shrink-0 mt-0.5">lightbulb</span>
                  <p className="text-sm text-amber-800 leading-relaxed">{m.content}</p>
                </div>
              ) : m.role === 'user' ? (
                <div key={i} className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center font-bold text-xs shrink-0 border border-slate-200">MD</div>
                  <div className="max-w-[85%]">
                    <p className="text-sm leading-relaxed text-slate-700 bg-white border border-slate-200 p-3.5 rounded-xl rounded-tl-none shadow-sm">{m.content}</p>
                  </div>
                </div>
              ) : (
                <div key={i} className="flex gap-3 flex-row-reverse">
                  <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs shrink-0 border border-blue-200">PT</div>
                  <div className="max-w-[85%]">
                    <p className="text-sm leading-relaxed text-slate-800 bg-blue-50 border border-blue-100 p-3.5 rounded-xl rounded-tr-none shadow-sm">{m.content}</p>
                  </div>
                </div>
              )
            ))}
            {loading && (
              <div className="flex gap-3 flex-row-reverse">
                <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs shrink-0 border border-blue-200">PT</div>
                <div className="bg-blue-50 border border-blue-100 p-3.5 rounded-xl rounded-tr-none shadow-sm">
                  <div className="flex gap-1 items-center">
                    {[0,1,2].map(j => <span key={j} className={`w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce`} style={{ animationDelay: `${j * 0.15}s` }} />)}
                  </div>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="bg-slate-50 border-t border-slate-200 p-3">
            <div className="flex items-center gap-2.5">
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                  placeholder="Faça uma pergunta ou fale com o paciente..."
                  disabled={loading || !attemptId}
                  className="w-full bg-white border border-slate-300 rounded-xl pl-4 pr-10 py-2.5 text-[13px] outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all shadow-inner disabled:opacity-60"
                />
                <button
                  onClick={sendMessage}
                  disabled={loading || !input.trim() || !attemptId}
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-lg flex items-center justify-center bg-blue-600 text-white hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-50"
                >
                  <span className="material-symbols-outlined text-[16px]">send</span>
                </button>
              </div>
            </div>
            {!attemptId && (
              <p className="text-xs text-red-500 mt-2 text-center">Tentativa não iniciada. Volte e inicie um caso.</p>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
