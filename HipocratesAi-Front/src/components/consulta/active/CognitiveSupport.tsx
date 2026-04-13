import React, { useState } from 'react';
import AlertsSection from './AlertsSection';
import ChecklistSection from './CheckListSection';
import MedicalInsightCard from './MedicalInsightCard';
import type {
  Hypothesis,
  ExamRequest,
  Referral,
  Orientation,
  ClinicalNote,
  ChecklistItem,
  Alert,
  MedicalInsight,
} from '../../../data/ConsultationData';

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
}

export default function CognitiveSupport({ data }: CognitiveSupportProps) {
  const [activeTab, setActiveTab] = useState<TabType>('diagnostico');

  const tabs = [
    { id: 'diagnostico' as const, label: 'Diagnóstico' },
    { id: 'conduta' as const, label: 'Conduta' },
    { id: 'nota' as const, label: 'Nota Clínica' },
  ];

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
                {data.hypotheses.map(hyp => (
                  <div key={hyp.id} className="liquid-glass p-6 rounded-[2rem]">
                    <div className="flex items-center justify-between mb-6">
                      <div className="space-y-1.5">
                        <h4 className="text-sm font-medium text-slate-900 dark:text-white">
                          {hyp.title}
                        </h4>
                        <span
                          className={`text-[9px] font-semibold text-${hyp.color}-500/80 uppercase tracking-widest`}
                        >
                          {hyp.confidence} Confidence
                        </span>
                      </div>
                    </div>
                    <div className="w-full bg-slate-100/50 dark:bg-white/5 h-[2px] rounded-full overflow-hidden">
                      <div
                        className={`bg-${hyp.color}-400 h-full w-[${hyp.percentage}%] rounded-full shadow-[0_0_8px_rgba(52,211,153,0.4)]`}
                      ></div>
                    </div>
                  </div>
                ))}
              </>
            )}

            {activeTab === 'conduta' && (
              <>
                {/* Exames Solicitados */}
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

                {/* Encaminhamentos */}
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

                {/* Orientações */}
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
