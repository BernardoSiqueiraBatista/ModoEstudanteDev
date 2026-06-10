import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import SetupPlanoModal from './SetupPlanoModal';

const STUDENT_ID = 'e1925b44-9694-477c-a496-5e638e4a9e25';
const API = 'http://localhost:3333';

interface StudyPlan {
  id: string;
  titulo: string;
  categoria: string;
  status: 'ativo' | 'pausado' | 'concluido';
  duracao: string;
  areas_foco: string[];
}

interface PlanSummary {
  plan_id: string;
  areas_foco: string[];
  duracao: string;
  horas_dia: number;
  dias_disponiveis: string[];
  compromissos_fixos: { dia: string; inicio: string; fim: string; label?: string }[];
  briefing_preview: string;
}

const CATEGORIA_LABEL: Record<string, string> = {
  especializacao: 'Especialização',
  urgencia: 'Urgência',
  atualizacao: 'Atualização',
  certificacao: 'Certificação',
  geral: 'Geral',
};

const STATUS_LABEL: Record<string, string> = {
  ativo: 'Ativo',
  pausado: 'Em Pausa',
  concluido: 'Concluído',
};

const DURACAO_OPTIONS = ['semanal', 'mensal', 'trimestral', 'anual'];
const HORAS_OPTIONS = [1, 2, 3, 4, 6, 8];

export default function StudyPlansPage() {
  const navigate = useNavigate();
  const [openModal, setOpenModal] = React.useState(false);
  const [plans, setPlans] = useState<StudyPlan[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);

  // feedback messages per card
  const [regenerating, setRegenerating] = useState<string | null>(null);
  const [regenerateMsg, setRegenerateMsg] = useState<Record<string, string>>({});
  const [copied, setCopied] = useState<string | null>(null);

  // edit modal
  const [editPlan, setEditPlan] = useState<StudyPlan | null>(null);
  const [editTitulo, setEditTitulo] = useState('');
  const [editAreas, setEditAreas] = useState<string[]>([]);
  const [editAreaInput, setEditAreaInput] = useState('');
  const [editDuracao, setEditDuracao] = useState('mensal');
  const [editInstrucoes, setEditInstrucoes] = useState('');
  const [editHoras, setEditHoras] = useState(2);
  const [editSaving, setEditSaving] = useState(false);

  // summary popup
  const [summaryPlanId, setSummaryPlanId] = useState<string | null>(null);
  const [summaryData, setSummaryData] = useState<PlanSummary | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);

  useEffect(() => {
    fetch(`${API}/student/v1/study-plans?student_id=${STUDENT_ID}`)
      .then(r => r.json())
      .then(json => setPlans(json.planos ?? []))
      .catch(() => {});
  }, [refreshKey]);

  function handleModalClose() {
    setOpenModal(false);
    setRefreshKey(k => k + 1);
  }

  async function handleDeletePlan(planId: string) {
    await fetch(`${API}/student/v1/study-plans/${planId}?student_id=${STUDENT_ID}`, {
      method: 'DELETE',
    }).catch(() => {});
    setRefreshKey(k => k + 1);
  }

  async function handleRegenerate(planId: string) {
    setRegenerating(planId);
    setRegenerateMsg(prev => ({ ...prev, [planId]: '' }));
    try {
      const res = await fetch(`${API}/student/v1/study-plans/${planId}/regenerate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ student_id: STUDENT_ID }),
      });
      if (res.status === 429) {
        const data = await res.json();
        const when = data.proxima_execucao_permitida_em
          ? new Date(data.proxima_execucao_permitida_em).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
          : null;
        setRegenerateMsg(prev => ({ ...prev, [planId]: when ? `Disponível às ${when}` : 'Aguarde 6h' }));
        return;
      }
      if (!res.ok) throw new Error();
      setRegenerateMsg(prev => ({ ...prev, [planId]: 'Regenerado!' }));
      setTimeout(() => setRegenerateMsg(prev => ({ ...prev, [planId]: '' })), 3000);
    } catch {
      setRegenerateMsg(prev => ({ ...prev, [planId]: 'Erro ao regenerar' }));
    } finally {
      setRegenerating(null);
    }
  }

  async function handleShare(planId: string) {
    try {
      const res = await fetch(`${API}/student/v1/study-plans/${planId}/share`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ student_id: STUDENT_ID }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      await navigator.clipboard.writeText(data.share_token);
      setCopied(planId);
      setTimeout(() => setCopied(null), 2500);
    } catch {
      // silent
    }
  }

  function openEdit(plan: StudyPlan) {
    setEditPlan(plan);
    setEditTitulo(plan.titulo);
    setEditAreas([...plan.areas_foco]);
    setEditDuracao(plan.duracao);
    setEditInstrucoes('');
    setEditHoras(2);
    setEditAreaInput('');
  }

  function addEditArea() {
    const nome = editAreaInput.trim();
    if (!nome || editAreas.includes(nome)) return;
    setEditAreas(prev => [...prev, nome]);
    setEditAreaInput('');
  }

  async function handleEditSave() {
    if (!editPlan) return;
    setEditSaving(true);
    try {
      const res = await fetch(`${API}/student/v1/study-plans/${editPlan.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_id: STUDENT_ID,
          titulo: editTitulo || undefined,
          areas_foco: editAreas.length > 0 ? editAreas : undefined,
          duracao: editDuracao,
          instrucoes: editInstrucoes.trim().length >= 3 ? editInstrucoes.trim() : undefined,
          horas_dia: editHoras,
        }),
      });
      if (!res.ok) throw new Error();
      setEditPlan(null);
      setRefreshKey(k => k + 1);
    } catch {
      // keep modal open
    } finally {
      setEditSaving(false);
    }
  }

  async function openSummary(planId: string) {
    setSummaryPlanId(planId);
    setSummaryData(null);
    setSummaryLoading(true);
    try {
      const res = await fetch(`${API}/student/v1/study-plans/${planId}/summary`);
      if (res.ok) setSummaryData(await res.json());
    } catch {
      // silent
    } finally {
      setSummaryLoading(false);
    }
  }

  const editAreaInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="min-h-screen bg-[#f9f9ff] text-[#191c21] font-['Inter'] pb-16">
      <main className="max-w-7xl mx-auto px-5 pt-6">
        {/* HEADER */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 rounded-full bg-[#005aa8] shadow-[0_0_10px_rgba(0,90,168,0.7)]" />
            <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-[#005aa8]">
              Clinical Learning Lab
            </span>
          </div>
          <h1 className="text-4xl font-bold tracking-tight mb-2">Meus Planos de Estudo</h1>
          <p className="text-[#414752] max-w-2xl leading-relaxed text-sm">
            Gerencie seus cronogramas de especialização e revisão clínica com precisão algorítmica.
          </p>
        </div>

        {/* GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* NOVO PLANO */}
          <button
            onClick={() => setOpenModal(true)}
            className="min-h-[240px] rounded-[2rem] border border-dashed border-[#c1c6d4] hover:border-[#005aa8] hover:bg-white/50 transition-all duration-300 flex flex-col items-center justify-center group"
          >
            <div className="w-14 h-14 rounded-full bg-[#ecedf6] flex items-center justify-center mb-3 group-hover:bg-[#005aa8]/10 transition-colors">
              <span className="material-symbols-outlined text-[#005aa8] text-3xl">add</span>
            </div>
            <span className="text-lg font-bold text-[#005aa8]">Novo Plano</span>
            <span className="text-sm text-[#414752] mt-1">Definir novos objetivos clínicos</span>
          </button>

          {/* CARDS */}
          {plans.map((plan) => {
            const isActive = plan.status === 'ativo';
            const isConcluido = plan.status === 'concluido';
            const tag = CATEGORIA_LABEL[plan.categoria] ?? plan.categoria;
            const statusLabel = STATUS_LABEL[plan.status] ?? plan.status;

            return (
              <div
                key={plan.id}
                className="rounded-[2rem] border border-white/40 bg-white/60 backdrop-blur-[40px] p-6 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.04)] hover:-translate-y-1 transition-all duration-500 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between mb-5">
                    <span className="px-3 py-1 rounded-full bg-[#005aa8]/5 text-[#005aa8] text-[10px] uppercase tracking-[0.15em] font-bold">
                      {tag}
                    </span>
                    {isActive ? (
                      <div className="flex items-center gap-2 px-3 py-1 rounded-full border border-green-100 bg-green-50">
                        <div className="w-2 h-2 rounded-full bg-green-500" />
                        <span className="text-[10px] font-bold uppercase text-green-700">{statusLabel}</span>
                      </div>
                    ) : isConcluido ? (
                      <div className="flex items-center gap-2 px-3 py-1 rounded-full border border-blue-100 bg-blue-50">
                        <div className="w-2 h-2 rounded-full bg-blue-500" />
                        <span className="text-[10px] font-bold uppercase text-blue-700">{statusLabel}</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 px-3 py-1 rounded-full border border-[#e0e2ea] bg-[#e0e2ea]/20">
                        <div className="w-2 h-2 rounded-full bg-[#717783]" />
                        <span className="text-[10px] font-bold uppercase text-[#414752]">{statusLabel}</span>
                      </div>
                    )}
                  </div>

                  <h3 className="text-xl font-bold mb-3">{plan.titulo}</h3>
                  {plan.areas_foco.length > 0 && (
                    <p className="text-xs text-[#414752] mb-4 line-clamp-1">{plan.areas_foco.join(' · ')}</p>
                  )}
                  <p className="text-xs text-[#717783]">
                    Ciclo: {plan.duracao.charAt(0).toUpperCase() + plan.duracao.slice(1)}
                  </p>
                </div>

                {(regenerateMsg[plan.id] || copied === plan.id) && (
                  <p className={`text-[10px] font-bold mt-3 ${copied === plan.id || regenerateMsg[plan.id] === 'Regenerado!' ? 'text-green-600' : 'text-amber-600'}`}>
                    {copied === plan.id ? 'Token copiado!' : regenerateMsg[plan.id]}
                  </p>
                )}

                <div className="mt-3 pt-4 border-t border-[#e0e2ea]/40 flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <button title="Ver calendário" onClick={() => navigate('/plan/calendario', { state: { planId: plan.id } })}
                      className="w-9 h-9 rounded-full hover:bg-white transition-all flex items-center justify-center outline-none border-none focus:outline-none">
                      <span className="material-symbols-outlined text-[#414752] hover:text-[#005aa8] text-[20px]">calendar_month</span>
                    </button>

                    <button title="Ver resumo" onClick={() => openSummary(plan.id)}
                      className="w-9 h-9 rounded-full hover:bg-white transition-all flex items-center justify-center outline-none border-none focus:outline-none">
                      <span className="material-symbols-outlined text-[#414752] hover:text-[#005aa8] text-[20px]">info</span>
                    </button>

                    <button title="Editar plano" onClick={() => openEdit(plan)}
                      className="w-9 h-9 rounded-full hover:bg-white transition-all flex items-center justify-center outline-none border-none focus:outline-none">
                      <span className="material-symbols-outlined text-[#414752] hover:text-[#005aa8] text-[20px]">edit</span>
                    </button>

                    <button title="Regenerar cronograma" onClick={() => handleRegenerate(plan.id)} disabled={regenerating === plan.id}
                      className="w-9 h-9 rounded-full hover:bg-white transition-all flex items-center justify-center outline-none border-none focus:outline-none disabled:opacity-40">
                      <span className={`material-symbols-outlined text-[#414752] hover:text-[#005aa8] text-[20px] ${regenerating === plan.id ? 'animate-spin' : ''}`}>refresh</span>
                    </button>

                    <button title="Compartilhar" onClick={() => handleShare(plan.id)}
                      className="w-9 h-9 rounded-full hover:bg-white transition-all flex items-center justify-center outline-none border-none focus:outline-none">
                      <span className="material-symbols-outlined text-[#414752] hover:text-[#005aa8] text-[20px]">share</span>
                    </button>
                  </div>

                  <button title="Excluir plano" onClick={() => handleDeletePlan(plan.id)}
                    className="w-9 h-9 rounded-full hover:bg-white transition-all flex items-center justify-center outline-none border-none focus:outline-none">
                    <span className="material-symbols-outlined text-[#414752] hover:text-red-500 text-[20px]">delete</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </main>

      {/* ── EDIT MODAL ── */}
      {editPlan && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-[#001c3b]/20 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-white rounded-[2rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-8 py-6 border-b border-slate-100">
              <div>
                <h2 className="text-xl font-bold text-[#191c21]">Editar Plano</h2>
                <p className="text-xs text-[#717783] mt-0.5">Apenas os campos alterados serão atualizados</p>
              </div>
              <button onClick={() => setEditPlan(null)} className="w-9 h-9 rounded-full hover:bg-slate-100 flex items-center justify-center transition-colors">
                <span className="material-symbols-outlined text-[#717783]">close</span>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-8 py-6 space-y-5">
              {/* Título */}
              <div>
                <label className="block text-[10px] uppercase tracking-[0.18em] font-bold text-[#717783] mb-2">Título</label>
                <input
                  value={editTitulo}
                  onChange={e => setEditTitulo(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-[#005aa8] focus:ring-2 focus:ring-[#005aa8]/10 transition-all"
                />
              </div>

              {/* Áreas de foco */}
              <div>
                <label className="block text-[10px] uppercase tracking-[0.18em] font-bold text-[#717783] mb-2">Áreas de Foco</label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {editAreas.map(area => (
                    <span key={area} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#005aa8]/10 text-[#005aa8] text-xs font-semibold">
                      {area}
                      <button onClick={() => setEditAreas(prev => prev.filter(a => a !== area))} className="hover:text-red-500 transition-colors">
                        <span className="material-symbols-outlined text-[14px]">close</span>
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    ref={editAreaInputRef}
                    value={editAreaInput}
                    onChange={e => setEditAreaInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && addEditArea()}
                    placeholder="Adicionar área..."
                    className="flex-1 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:border-[#005aa8] transition-all"
                  />
                  <button onClick={addEditArea} disabled={!editAreaInput.trim()}
                    className="px-4 py-2.5 rounded-2xl bg-[#005aa8] text-white text-sm font-bold disabled:opacity-40 hover:bg-[#005aa8]/90 transition-all">
                    <span className="material-symbols-outlined text-[18px]">add</span>
                  </button>
                </div>
              </div>

              {/* Duração */}
              <div>
                <label className="block text-[10px] uppercase tracking-[0.18em] font-bold text-[#717783] mb-2">Ciclo</label>
                <div className="grid grid-cols-4 gap-2">
                  {DURACAO_OPTIONS.map(d => (
                    <button key={d} onClick={() => setEditDuracao(d)}
                      className={`py-2 rounded-xl text-xs font-bold transition-all ${editDuracao === d ? 'bg-[#005aa8] text-white' : 'bg-slate-100 text-[#414752] hover:bg-slate-200'}`}>
                      {d.charAt(0).toUpperCase() + d.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Horas/dia */}
              <div>
                <label className="block text-[10px] uppercase tracking-[0.18em] font-bold text-[#717783] mb-2">Horas por dia</label>
                <div className="flex gap-2">
                  {HORAS_OPTIONS.map(h => (
                    <button key={h} onClick={() => setEditHoras(h)}
                      className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${editHoras === h ? 'bg-[#005aa8] text-white' : 'bg-slate-100 text-[#414752] hover:bg-slate-200'}`}>
                      {h}h
                    </button>
                  ))}
                </div>
              </div>

              {/* Instruções */}
              <div>
                <label className="block text-[10px] uppercase tracking-[0.18em] font-bold text-[#717783] mb-2">Novas Instruções (opcional)</label>
                <textarea
                  value={editInstrucoes}
                  onChange={e => setEditInstrucoes(e.target.value)}
                  rows={3}
                  placeholder="Adicione instruções ou ajuste o foco do plano..."
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-[#005aa8] resize-none transition-all"
                />
              </div>
            </div>

            <div className="px-8 py-5 border-t border-slate-100 flex gap-3">
              <button onClick={() => setEditPlan(null)}
                className="flex-1 py-3 rounded-full border border-slate-200 text-sm font-semibold text-[#414752] hover:bg-slate-50 transition-all">
                Cancelar
              </button>
              <button onClick={handleEditSave} disabled={editSaving}
                className="flex-1 py-3 rounded-full bg-[#005aa8] text-white text-sm font-bold disabled:opacity-60 hover:-translate-y-0.5 active:scale-95 transition-all shadow-[0_4px_14px_rgba(0,90,168,0.3)]">
                {editSaving ? 'Salvando...' : 'Salvar alterações'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── SUMMARY POPUP ── */}
      {summaryPlanId && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-[#001c3b]/20 backdrop-blur-sm" onClick={() => setSummaryPlanId(null)}>
          <div className="w-full max-w-md bg-white rounded-[2rem] shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-8 py-6 border-b border-slate-100">
              <h2 className="text-xl font-bold text-[#191c21]">Resumo do Plano</h2>
              <button onClick={() => setSummaryPlanId(null)} className="w-9 h-9 rounded-full hover:bg-slate-100 flex items-center justify-center transition-colors">
                <span className="material-symbols-outlined text-[#717783]">close</span>
              </button>
            </div>

            <div className="px-8 py-6">
              {summaryLoading ? (
                <div className="flex items-center justify-center py-10">
                  <span className="material-symbols-outlined animate-spin text-[#005aa8] text-3xl">progress_activity</span>
                </div>
              ) : summaryData ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-2xl bg-slate-50 p-4">
                      <p className="text-[10px] uppercase tracking-[0.15em] font-bold text-[#717783] mb-1">Ciclo</p>
                      <p className="text-sm font-bold text-[#191c21] capitalize">{summaryData.duracao}</p>
                    </div>
                    <div className="rounded-2xl bg-slate-50 p-4">
                      <p className="text-[10px] uppercase tracking-[0.15em] font-bold text-[#717783] mb-1">Dedicação</p>
                      <p className="text-sm font-bold text-[#191c21]">{summaryData.horas_dia}h por dia</p>
                    </div>
                  </div>

                  {summaryData.areas_foco.length > 0 && (
                    <div className="rounded-2xl bg-slate-50 p-4">
                      <p className="text-[10px] uppercase tracking-[0.15em] font-bold text-[#717783] mb-2">Áreas de Foco</p>
                      <div className="flex flex-wrap gap-2">
                        {summaryData.areas_foco.map(a => (
                          <span key={a} className="px-2.5 py-1 rounded-full bg-[#005aa8]/10 text-[#005aa8] text-xs font-semibold">{a}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {summaryData.dias_disponiveis.length > 0 && (
                    <div className="rounded-2xl bg-slate-50 p-4">
                      <p className="text-[10px] uppercase tracking-[0.15em] font-bold text-[#717783] mb-2">Dias Disponíveis</p>
                      <div className="flex flex-wrap gap-2">
                        {summaryData.dias_disponiveis.map(d => (
                          <span key={d} className="px-2.5 py-1 rounded-full bg-slate-200 text-[#414752] text-xs font-semibold">{d}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {summaryData.compromissos_fixos.length > 0 && (
                    <div className="rounded-2xl bg-slate-50 p-4">
                      <p className="text-[10px] uppercase tracking-[0.15em] font-bold text-[#717783] mb-2">Compromissos Fixos</p>
                      <ul className="space-y-1.5">
                        {summaryData.compromissos_fixos.map((c, i) => (
                          <li key={i} className="text-xs text-[#414752] flex gap-2">
                            <span className="font-bold capitalize">{c.dia}</span>
                            <span>{c.inicio}–{c.fim}</span>
                            {c.label && <span className="text-[#717783]">({c.label})</span>}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {summaryData.briefing_preview && (
                    <div className="rounded-2xl bg-[#005aa8]/5 border border-[#005aa8]/10 p-4">
                      <p className="text-[10px] uppercase tracking-[0.15em] font-bold text-[#005aa8] mb-1">Briefing</p>
                      <p className="text-xs text-[#414752] leading-relaxed">{summaryData.briefing_preview}</p>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm text-[#717783] text-center py-8">Não foi possível carregar o resumo.</p>
              )}
            </div>
          </div>
        </div>
      )}

      <SetupPlanoModal open={openModal} onClose={handleModalClose} />
    </div>
  );
}
