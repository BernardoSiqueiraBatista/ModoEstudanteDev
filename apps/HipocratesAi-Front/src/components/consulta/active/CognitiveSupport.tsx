import { useMemo, useState } from 'react';
import AlertsSection from './AlertsSection';
import ChecklistSection from './CheckListSection';
import MedicalInsightCard from './MedicalInsightCard';

export interface Hypothesis {
  id: string;
  title: string;
  confidence: 'High' | 'Moderate' | 'Low';
  percentage: number;
  color: string;
}
export interface ExamRequest {
  id: string;
  name: string;
  status: 'pending' | 'completed' | 'cancelled';
}
export interface Referral {
  id: string;
  name: string;
}
export interface Orientation {
  id: string;
  text: string;
}
export interface ClinicalNote {
  hda: string;
  clinicalImpression: string[];
}
export interface ChecklistItem {
  id: string;
  label: string;
  checked: boolean;
}
export interface Alert {
  id: string;
  title: string;
  description: string;
  type: 'warning' | 'info' | 'critical';
}
export interface MedicalInsight {
  text: string;
}

type TabType = 'diagnostico' | 'conduta' | 'nota';

interface CognitiveSupportProps {
  data: {
    hypotheses: Hypothesis[];
    examRequests: ExamRequest[];
    referrals: Referral[];
    orientations: Orientation[];
    clinicalNote: ClinicalNote;
    checklistItems: ChecklistItem[];
    alerts: Alert[];
    medicalInsight: MedicalInsight;
  };
  onConfirmHypothesis?: (id: string) => void;
  onDismissHypothesis?: (id: string) => void;
}

const MAX_VISIBLE_HYPOTHESES = 3;

const CONFIDENCE_TONES: Record<
  'High' | 'Moderate' | 'Low',
  { bar: string; halo: string; badge: string; dot: string }
> = {
  High: {
    bar: 'bg-emerald-400',
    halo: 'shadow-[0_0_10px_rgba(52,211,153,0.45)]',
    badge: 'text-emerald-500/90',
    dot: 'bg-emerald-400',
  },
  Moderate: {
    bar: 'bg-amber-400',
    halo: 'shadow-[0_0_10px_rgba(251,191,36,0.4)]',
    badge: 'text-amber-500/90',
    dot: 'bg-amber-400',
  },
  Low: {
    bar: 'bg-rose-400',
    halo: 'shadow-[0_0_10px_rgba(251,113,133,0.4)]',
    badge: 'text-rose-500/90',
    dot: 'bg-rose-400',
  },
};

export default function CognitiveSupport({
  data,
  onConfirmHypothesis,
  onDismissHypothesis,
}: CognitiveSupportProps) {
  const [activeTab, setActiveTab] = useState<TabType>('diagnostico');

  const tabs = [
    { id: 'diagnostico' as const, label: 'Diagnóstico' },
    { id: 'conduta' as const, label: 'Conduta' },
    { id: 'nota' as const, label: 'Nota Clínica' },
  ];

  // Foco no acerto: mostramos só as N hipóteses mais confiantes,
  // ordenadas por percentage desc. As demais ficam ocultas atrás de
  // um "+N investigando" (afastando ruído cognitivo).
  const rankedHypotheses = useMemo(() => {
    return [...data.hypotheses].sort((a, b) => b.percentage - a.percentage);
  }, [data.hypotheses]);

  const visibleHypotheses = rankedHypotheses.slice(0, MAX_VISIBLE_HYPOTHESES);
  const hiddenCount = Math.max(0, rankedHypotheses.length - visibleHypotheses.length);

  // Confiança ranqueada — diferença entre top1 e top2 ajuda a decidir se
  // já há "uma vencedora" ou ainda há ambiguidade clínica.
  const topGap = useMemo(() => {
    if (visibleHypotheses.length < 2) return null;
    const top1 = visibleHypotheses[0]!.percentage;
    const top2 = visibleHypotheses[1]!.percentage;
    return Math.max(0, top1 - top2);
  }, [visibleHypotheses]);

  return (
    <aside className="w-[440px] border-l border-slate-100/50 dark:border-white/5 bg-white/10 dark:bg-black/10 backdrop-blur-3xl p-10 overflow-y-auto custom-scrollbar">
      <div className="space-y-12">
        {/* Tabs */}
        <div>
          <div className="flex flex-col mb-10">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-[10px] font-bold text-slate-400/60 uppercase tracking-ultra">
                Cognitive Support
              </h2>
              <span className="size-1.5 bg-accent-blue rounded-full"></span>
            </div>
            <div className="flex items-end gap-10 border-b border-slate-100 dark:border-white/5 pb-0.5">
              {tabs.map(tab => (
                <div key={tab.id} className="relative pb-3 flex flex-col items-center">
                  <button
                    onClick={() => setActiveTab(tab.id)}
                    className={`text-[10px] font-bold uppercase tracking-ultra transition-colors ${
                      activeTab === tab.id
                        ? 'text-slate-900 dark:text-white'
                        : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
                    }`}
                  >
                    {tab.label}
                  </button>
                  {activeTab === tab.id && (
                    <div className="absolute bottom-0 w-full h-[2px] bg-amber-400 rounded-full"></div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Tab Content */}
          <div className="space-y-6">
            {activeTab === 'diagnostico' && (
              <>
                {visibleHypotheses.length === 0 ? (
                  <div className="liquid-glass p-6 rounded-[2rem] text-center">
                    <p className="text-[11px] text-slate-400 italic font-light">
                      Aguardando dados clínicos suficientes para hipóteses.
                    </p>
                  </div>
                ) : (
                  <>
                    {/* Header com ranqueamento — ajuda o médico a saber se já
                        há uma hipótese "vencedora" ou se ainda há ambiguidade. */}
                    {topGap !== null && (
                      <div className="flex items-center justify-between px-2">
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.18em]">
                          Hipóteses Ranqueadas
                        </span>
                        <span
                          className={`text-[9px] font-bold uppercase tracking-[0.18em] ${
                            topGap >= 25
                              ? 'text-emerald-500/80'
                              : topGap >= 10
                                ? 'text-amber-500/80'
                                : 'text-rose-500/80'
                          }`}
                          title="Diferença de confiança entre Top 1 e Top 2"
                        >
                          Δ {topGap}% • {topGap >= 25 ? 'Foco' : topGap >= 10 ? 'Provável' : 'Ambíguo'}
                        </span>
                      </div>
                    )}

                    {visibleHypotheses.map((hyp, idx) => {
                      const tone = CONFIDENCE_TONES[hyp.confidence];
                      const isTop = idx === 0;
                      return (
                        <div
                          key={hyp.id}
                          className={`liquid-glass p-6 rounded-[2rem] relative ${
                            isTop ? 'ring-1 ring-emerald-200/60 dark:ring-emerald-500/20' : ''
                          }`}
                        >
                          {isTop && (
                            <span className="absolute -top-2 left-6 px-2.5 py-0.5 rounded-full bg-emerald-50/90 border border-emerald-100 text-[8.5px] font-bold tracking-[0.18em] uppercase text-emerald-600/80">
                              Hipótese Líder
                            </span>
                          )}
                          <div className="flex items-start justify-between mb-4">
                            <div className="space-y-1.5">
                              <div className="flex items-center gap-2">
                                <span
                                  className={`size-1.5 rounded-full ${tone.dot} ${tone.halo}`}
                                />
                                <h4 className="text-sm font-medium text-slate-900 dark:text-white">
                                  {hyp.title}
                                </h4>
                              </div>
                              <span
                                className={`text-[9px] font-semibold uppercase tracking-widest ${tone.badge}`}
                              >
                                {hyp.confidence} Confidence · {hyp.percentage}%
                              </span>
                            </div>
                            <div className="flex gap-1">
                              <button
                                type="button"
                                onClick={() => onConfirmHypothesis?.(hyp.id)}
                                aria-label="Confirmar hipótese"
                                title="Confirmar"
                                className="size-8 rounded-full flex items-center justify-center hover:bg-emerald-50/70 dark:hover:bg-emerald-500/10 text-slate-400 hover:text-emerald-600 transition-colors"
                              >
                                <span className="material-symbols-outlined !text-[18px]">
                                  verified
                                </span>
                              </button>
                              <button
                                type="button"
                                onClick={() => onDismissHypothesis?.(hyp.id)}
                                aria-label="Descartar hipótese"
                                title="Descartar"
                                className="size-8 rounded-full flex items-center justify-center hover:bg-rose-50/70 dark:hover:bg-rose-500/10 text-slate-400 hover:text-rose-600 transition-colors"
                              >
                                <span className="material-symbols-outlined !text-[18px]">
                                  close
                                </span>
                              </button>
                            </div>
                          </div>
                          <div className="w-full bg-slate-100/50 dark:bg-white/5 h-[3px] rounded-full overflow-hidden">
                            <div
                              className={`${tone.bar} h-full rounded-full ${tone.halo} transition-[width] duration-700`}
                              style={{ width: `${hyp.percentage}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}

                    {hiddenCount > 0 && (
                      <p className="text-[10px] text-slate-400 italic font-light text-center px-1">
                        + {hiddenCount} hipótese{hiddenCount > 1 ? 's' : ''} de menor confiança ocultada
                        {hiddenCount > 1 ? 's' : ''} para reduzir ruído cognitivo.
                      </p>
                    )}
                  </>
                )}
              </>
            )}

            {activeTab === 'conduta' && (
              <>
                <div className="liquid-glass p-6 rounded-[2rem] space-y-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="material-symbols-outlined text-accent-blue !text-[18px]">
                      biotech
                    </span>
                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-ultra">
                      Exames Solicitados
                    </h4>
                  </div>
                  <div className="space-y-2">
                    {data.examRequests.map(exam => (
                      <div
                        key={exam.id}
                        className="flex items-center justify-between p-3 bg-white/40 dark:bg-white/5 rounded-xl border border-white/20"
                      >
                        <span className="text-xs text-slate-700 dark:text-slate-300">
                          {exam.name}
                        </span>
                        <span className="text-[9px] font-bold text-amber-500 uppercase">
                          {exam.status === 'pending' ? 'Pendente' : 'Concluído'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="liquid-glass p-6 rounded-[2rem] space-y-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="material-symbols-outlined text-accent-blue !text-[18px]">
                      hail
                    </span>
                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-ultra">
                      Encaminhamentos
                    </h4>
                  </div>
                  {data.referrals.map(ref => (
                    <div
                      key={ref.id}
                      className="p-3 bg-white/40 dark:bg-white/5 rounded-xl border border-white/20"
                    >
                      <p className="text-xs text-slate-700 dark:text-slate-300">{ref.name}</p>
                    </div>
                  ))}
                </div>

                <div className="liquid-glass p-6 rounded-[2rem] space-y-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="material-symbols-outlined text-accent-blue !text-[18px]">
                      assignment_turned_in
                    </span>
                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-ultra">
                      Orientações
                    </h4>
                  </div>
                  <ul className="space-y-2">
                    {data.orientations.map(ori => (
                      <li
                        key={ori.id}
                        className="flex items-start gap-2 text-xs text-slate-600 dark:text-slate-400"
                      >
                        <span className="size-1.5 bg-accent-blue rounded-full mt-1.5 shrink-0"></span>
                        <span>{ori.text}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </>
            )}

            {activeTab === 'nota' && (
              <div className="liquid-glass p-8 rounded-[2rem] space-y-8">
                <div className="flex items-center justify-between border-b border-slate-100/50 dark:border-white/5 pb-4">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined !text-[16px] text-slate-400">
                      drafts
                    </span>
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                      Rascunho Estruturado
                    </span>
                  </div>
                  <button className="text-[9px] font-bold text-accent-blue uppercase tracking-widest flex items-center gap-1">
                    <span className="material-symbols-outlined !text-[14px]">edit_note</span>
                    Editar
                  </button>
                </div>

                <section className="space-y-4">
                  <h5 className="text-[10px] font-bold text-slate-900 dark:text-white uppercase tracking-widest">
                    HDA (História da Doença Atual)
                  </h5>
                  <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-400 font-light">
                    {data.clinicalNote.hda}
                  </p>
                </section>

                <section className="space-y-4">
                  <h5 className="text-[10px] font-bold text-slate-900 dark:text-white uppercase tracking-widest">
                    Impressão Clínica
                  </h5>
                  <div className="bg-slate-50/50 dark:bg-white/5 p-4 rounded-2xl border border-slate-100/50 dark:border-white/5">
                    <ul className="space-y-3">
                      {data.clinicalNote.clinicalImpression.map((item, idx) => (
                        <li key={idx} className="flex gap-3">
                          <span className="text-accent-blue font-bold">•</span>
                          <span className="text-xs text-slate-600 dark:text-slate-400 font-light">
                            {item}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </section>
              </div>
            )}
          </div>
        </div>

        <AlertsSection alerts={data.alerts} />
        <ChecklistSection items={data.checklistItems} />
        <MedicalInsightCard insight={data.medicalInsight} />
      </div>
    </aside>
  );
}
