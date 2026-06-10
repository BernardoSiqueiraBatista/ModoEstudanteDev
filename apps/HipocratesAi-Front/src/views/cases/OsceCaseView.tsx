import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

const STUDENT_ID = 'e1925b44-9694-477c-a496-5e638e4a9e25';
const API = 'http://localhost:3333';

interface Message { role: 'user' | 'assistant'; content: string; }
interface Toast { texto: string; tipo: 'correto' | 'erro'; }
interface ChecklistItem { ref: string; descricao: string; pontos: number; }
interface ChecklistGroup { criterio: string; itens: ChecklistItem[]; }
interface CaseIntro {
  titulo: string;
  especialidade: string;
  descricao: string;
  checklist_osce: { criterio: string; itens: string[] }[];
}

export default function OsceCaseView() {
  const navigate = useNavigate();
  const attemptId = sessionStorage.getItem('osce-attempt-id') ?? '';
  const caseId    = sessionStorage.getItem('osce-case-id') ?? '';

  const [caseData, setCaseData] = useState<CaseIntro | null>(null);
  const [paciente, setPaciente] = useState<Record<string, unknown>>({});
  const [queixa, setQueixa] = useState('');
  const [checklist, setChecklist] = useState<ChecklistGroup[]>([]);

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);

  const [toast, setToast] = useState<Toast | null>(null);
  const [acumulado, setAcumulado] = useState(0);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [seconds, setSeconds] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [finishing, setFinishing] = useState(false);
  const [actionPanel, setActionPanel] = useState<string | null>(null);

  const bottomRef = useRef<HTMLDivElement>(null);

  // ── Load case intro ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!caseId) return;
    fetch(`${API}/student/v1/cases/${caseId}/intro`)
      .then(r => r.json())
      .then((d: any) => {
        setCaseData(d);
        setPaciente(d.paciente ?? {});
        setQueixa((d.paciente?.queixa_principal as string) ?? d.descricao ?? '');
        // Rebuild checklist with pontos from payload_mock if available
        setChecklist(
          (d.checklist_osce ?? []).map((g: any, gi: number) => ({
            criterio: g.criterio,
            itens: (g.itens ?? []).map((item: any, ii: number) => ({
              ref: typeof item === 'string' ? `acao_${gi}_${ii}` : item.ref ?? `acao_${gi}_${ii}`,
              descricao: typeof item === 'string' ? item : item.descricao ?? item,
              pontos: typeof item === 'object' ? (item.pontos ?? 10) : 10,
            })),
          }))
        );
      })
      .catch(() => {});
  }, [caseId]);

  // ── Timer ────────────────────────────────────────────────────────────────
  useEffect(() => {
    intervalRef.current = setInterval(() => setSeconds(s => s + 1), 1000);
    return () => clearInterval(intervalRef.current!);
  }, []);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  };

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  // ── Toast helper ─────────────────────────────────────────────────────────
  const showToast = useCallback((texto: string, tipo: 'correto' | 'erro', ttl = 2500) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ texto, tipo });
    toastTimer.current = setTimeout(() => setToast(null), ttl);
  }, []);

  // ── Chat com paciente ────────────────────────────────────────────────────
  async function sendMessage() {
    const text = input.trim();
    if (!text || sending || !attemptId) return;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: text }]);
    setSending(true);
    try {
      const res = await fetch(`${API}/student/v1/cases/attempts/${attemptId}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ student_id: STUDENT_ID, mensagem: text }),
      });
      const data = await res.json();
      setMessages(prev => [...prev, { role: 'assistant', content: data.resposta }]);
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: '(Erro de comunicação)' }]);
    } finally {
      setSending(false);
    }
  }

  // ── Registrar evento OSCE ────────────────────────────────────────────────
  async function registerEvent(item: ChecklistItem) {
    if (!attemptId) return;
    setActionPanel(null);
    try {
      const res = await fetch(`${API}/student/v1/cases/attempts/${attemptId}/events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tipo: 'procedimento_correto',
          ref: item.ref,
          pontos: item.pontos,
        }),
      });
      const data = await res.json();
      setAcumulado(data.acumulado ?? 0);
      showToast(data.notificacao?.texto ?? `+${item.pontos} pts`, 'correto', data.notificacao?.ttl_ms ?? 2500);
      // Adiciona log de ação no chat
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `[Ação: ${item.descricao}]`,
      }]);
    } catch {
      showToast('Erro ao registrar ação', 'erro');
    }
  }

  // ── Finalizar sessão OSCE ────────────────────────────────────────────────
  async function finishSession() {
    if (!attemptId) { navigate('/cases'); return; }
    setFinishing(true);
    clearInterval(intervalRef.current!);
    try {
      const res = await fetch(`${API}/student/v1/cases/attempts/${attemptId}/finish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ student_id: STUDENT_ID }),
      });
      const data = await res.json();
      sessionStorage.removeItem('osce-attempt-id');
      sessionStorage.removeItem('osce-case-id');
      navigate('/summary', {
        state: {
          osce: true,
          pontuacao_final: data.pontuacao_final,
          acertos: data.acertos,
          erros: data.erros,
          tempo_segundos: data.tempo_segundos,
          feedback_llm: data.feedback_llm,
          case_titulo: caseData?.titulo ?? 'Caso Clínico',
        },
      });
    } catch {
      showToast('Erro ao finalizar sessão', 'erro');
      setFinishing(false);
    }
  }

  const pacienteNome = (paciente.nome as string) ?? caseData?.titulo ?? 'Paciente';
  const pacienteIdade = paciente.idade ? `${paciente.idade} Anos` : '';

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans pb-24 selection:bg-blue-100 relative overflow-hidden">

      {/* Toast */}
      {toast && (
        <div className={`fixed top-24 right-4 z-50 transition-all duration-500 transform translate-x-0 opacity-100`}>
          <div className={`px-3 py-2.5 rounded-xl shadow-lg flex items-center gap-2.5 border ${
            toast.tipo === 'correto'
              ? 'bg-emerald-600 border-emerald-500 text-white'
              : 'bg-red-600 border-red-500 text-white'
          }`}>
            <div className="bg-white/20 p-1 rounded-md flex items-center justify-center">
              <span className="material-symbols-outlined text-[16px]">
                {toast.tipo === 'correto' ? 'check_circle' : 'cancel'}
              </span>
            </div>
            <div>
              <p className="text-xs font-bold tracking-wide">{toast.texto}</p>
              <p className="text-[9px] text-white/80 font-medium">
                {toast.tipo === 'correto' ? 'Procedimento correto registrado' : 'Atenção'}
              </p>
            </div>
          </div>
        </div>
      )}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">

        {/* Header */}
        <header className="flex flex-col sm:flex-row sm:items-end justify-between mb-5 gap-3">
          <div>
            <div className="flex items-center gap-1.5 mb-1.5">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-blue-600" />
              </span>
              <span className="text-[9px] font-bold tracking-widest text-slate-500 uppercase">
                Simulação OSCE — Pontuação: {acumulado} pts
              </span>
            </div>
            <h1 className="text-xl md:text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
              {pacienteNome}
              {pacienteIdade && (
                <span className="px-2 py-0.5 bg-slate-200 text-slate-700 text-[10px] font-bold rounded-md uppercase tracking-wider">
                  {pacienteIdade}
                </span>
              )}
            </h1>
            <p className="text-xs font-semibold text-rose-600 uppercase tracking-wide mt-1">
              {queixa || 'Carregando...'}
            </p>
          </div>

          <button
            onClick={finishSession}
            disabled={finishing}
            className="flex items-center gap-1.5 px-5 py-2.5 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors shadow-sm disabled:opacity-60"
          >
            <span className="material-symbols-outlined text-[16px]">flag</span>
            <span className="text-xs font-bold uppercase tracking-wider">
              {finishing ? 'Finalizando...' : 'Finalizar Sessão'}
            </span>
          </button>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

          {/* Chat */}
          <div className="lg:col-span-8 bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col h-[580px]">

            <div className="flex-1 overflow-y-auto p-5 space-y-4 scrollbar-thin scrollbar-thumb-slate-200">
              {messages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-center text-slate-400">
                  <span className="material-symbols-outlined text-5xl mb-3 text-slate-300">chat_bubble_outline</span>
                  <p className="text-sm font-medium">Inicie o atendimento com o paciente.</p>
                </div>
              )}
              {messages.map((m, i) =>
                m.content.startsWith('[Ação:') ? (
                  <div key={i} className="flex items-center justify-center">
                    <div className="bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-full flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[14px] text-slate-400">stethoscope</span>
                      <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">
                        {m.content.replace('[Ação: ', '').replace(']', '')}
                      </span>
                    </div>
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
              )}
              {sending && (
                <div className="flex gap-3 flex-row-reverse">
                  <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs shrink-0 border border-blue-200">PT</div>
                  <div className="bg-blue-50 border border-blue-100 p-3.5 rounded-xl rounded-tr-none shadow-sm">
                    <div className="flex gap-1">
                      {[0,1,2].map(j => <span key={j} className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: `${j*0.15}s` }} />)}
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
                    placeholder="Faça uma pergunta ou prescreva..."
                    disabled={sending || !attemptId}
                    className="w-full bg-white border border-slate-300 rounded-xl pl-4 pr-10 py-2.5 text-[13px] outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all shadow-inner disabled:opacity-60"
                  />
                  <button
                    onClick={sendMessage}
                    disabled={sending || !input.trim() || !attemptId}
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-lg flex items-center justify-center bg-blue-600 text-white hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-50"
                  >
                    <span className="material-symbols-outlined text-[16px]">send</span>
                  </button>
                </div>
              </div>
              {!attemptId && <p className="text-xs text-red-500 mt-2 text-center">Tentativa não iniciada. Volte e inicie um caso.</p>}
            </div>
          </div>

          {/* Painel direito */}
          <div className="lg:col-span-4 space-y-5">

            {/* Sinais Vitais */}
            <div className="bg-slate-900 rounded-2xl p-5 shadow-lg border border-slate-800 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-3 opacity-10 pointer-events-none">
                <span className="material-symbols-outlined text-6xl text-white">monitor_heart</span>
              </div>
              <h3 className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-3">Sinais Vitais</h3>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'FC (bpm)', value: '84', color: 'text-emerald-400', pulse: true },
                  { label: 'SpO2 (%)', value: '98', color: 'text-blue-400', pulse: false },
                  { label: 'PA (mmHg)', value: '140x90', color: 'text-rose-400', pulse: false },
                  { label: 'Temp (°C)', value: '36.8', color: 'text-amber-400', pulse: false },
                ].map(v => (
                  <div key={v.label} className="bg-black/40 rounded-lg p-2.5 border border-white/5">
                    <span className={`text-[8px] font-bold uppercase tracking-widest ${v.color}`}>{v.label}</span>
                    <p className={`text-2xl font-light mt-0.5 tabular-nums ${v.color} ${v.pulse ? 'animate-pulse' : ''}`}>{v.value}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Ações Clínicas */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-1.5 text-slate-500">
                  <span className="material-symbols-outlined text-[18px]">timer</span>
                  <span className="text-xs font-semibold uppercase tracking-wider">Tempo</span>
                </div>
                <span className="text-2xl font-bold text-slate-800 tabular-nums tracking-tight">{formatTime(seconds)}</span>
              </div>

              <div className="space-y-2">
                <h3 className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Ações OSCE</h3>

                {checklist.length > 0 ? checklist.map(group => (
                  <div key={group.criterio}>
                    <button
                      onClick={() => setActionPanel(actionPanel === group.criterio ? null : group.criterio)}
                      className="w-full flex items-center justify-between p-3 bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-200 rounded-lg transition-all group"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-md bg-white shadow-sm flex items-center justify-center text-slate-500 group-hover:text-blue-600 transition-colors">
                          <span className="material-symbols-outlined text-[16px]">
                            {group.criterio === 'Anamnese' ? 'person' : group.criterio === 'Exame Físico' ? 'front_hand' : group.criterio === 'Conduta' ? 'prescriptions' : 'biotech'}
                          </span>
                        </div>
                        <span className="text-xs font-bold text-slate-700 group-hover:text-blue-700">{group.criterio}</span>
                      </div>
                      <span className="material-symbols-outlined text-[16px] text-slate-400 group-hover:text-blue-500">
                        {actionPanel === group.criterio ? 'expand_less' : 'chevron_right'}
                      </span>
                    </button>

                    {actionPanel === group.criterio && (
                      <div className="ml-2 mt-1 space-y-1">
                        {group.itens.map(item => (
                          <button
                            key={item.ref}
                            onClick={() => registerEvent(item)}
                            className="w-full text-left px-3 py-2 rounded-lg bg-blue-50 border border-blue-100 hover:bg-blue-100 transition-colors flex items-center justify-between"
                          >
                            <span className="text-xs text-blue-800 font-medium">{item.descricao}</span>
                            <span className="text-[10px] font-bold text-blue-600 ml-2 shrink-0">+{item.pontos}pts</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )) : (
                  // Fallback quando não tem checklist do banco
                  [
                    { label: 'Exame Físico', icon: 'front_hand', ref: 'exame_fisico', pontos: 10 },
                    { label: 'Solicitar Exames', icon: 'biotech', ref: 'solicitar_exames', pontos: 15 },
                    { label: 'Conduta / Prescrição', icon: 'prescriptions', ref: 'conduta', pontos: 20 },
                  ].map(a => (
                    <button
                      key={a.ref}
                      onClick={() => registerEvent({ ref: a.ref, descricao: a.label, pontos: a.pontos })}
                      className="w-full flex items-center justify-between p-3 bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-200 rounded-lg transition-all group"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-md bg-white shadow-sm flex items-center justify-center text-slate-500 group-hover:text-blue-600 transition-colors">
                          <span className="material-symbols-outlined text-[16px]">{a.icon}</span>
                        </div>
                        <span className="text-xs font-bold text-slate-700 group-hover:text-blue-700">{a.label}</span>
                      </div>
                      <span className="text-[10px] font-bold text-blue-500">+{a.pontos}pts</span>
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
