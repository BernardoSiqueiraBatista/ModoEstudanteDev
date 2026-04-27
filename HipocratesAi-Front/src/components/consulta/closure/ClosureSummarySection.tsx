import React from 'react';
import type { ClosureSummary } from '../../../data/ClosureData';

interface ClosureSummarySectionProps {
  summary: ClosureSummary;
}

export default function ClosureSummarySection({ summary }: ClosureSummarySectionProps) {
  return (
    <section className="liquid-glass p-10 space-y-8">
      <div className="flex items-center gap-3">
        <span className="material-symbols-outlined text-medical-navy">description</span>
        <h2 className="text-xs font-bold text-medical-navy uppercase tracking-[0.2em]">Resumo da Consulta</h2>
      </div>
      <div className="grid grid-cols-1 gap-8">
        <div className="space-y-3">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">
            Queixa Principal
          </label>
          <textarea
            className="w-full elite-input rounded-2xl p-5 text-medical-navy focus:ring-0 min-h-[100px] resize-none leading-relaxed border-none text-[15px] placeholder-slate-300 bg-gray-50/50"
            value={summary.mainComplaint}
            readOnly
          />
        </div>
        <div className="grid grid-cols-2 gap-8">
          <div className="space-y-3">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">
              Achados Chave
            </label>
            <textarea
              className="w-full elite-input rounded-2xl p-5 text-medical-navy focus:ring-0 min-h-[140px] resize-none leading-relaxed border-none text-[15px] bg-gray-50/50"
              value={summary.keyFindings}
              readOnly
            />
          </div>
          <div className="space-y-3">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">
              Plano Terapêutico
            </label>
            <textarea
              className="w-full elite-input rounded-2xl p-5 text-medical-navy focus:ring-0 min-h-[140px] resize-none leading-relaxed border-none text-[15px] bg-gray-50/50"
              value={summary.therapeuticPlan}
              readOnly
            />
          </div>
        </div>
      </div>
    </section>
  );
}