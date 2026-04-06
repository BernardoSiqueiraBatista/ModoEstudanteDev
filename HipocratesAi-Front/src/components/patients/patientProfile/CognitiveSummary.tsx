import React from 'react';
import type { CognitiveSummary } from '../../../types/PatientTypes';

interface CognitiveSummaryProps {
  summary: CognitiveSummary | undefined;
}

export default function CognitiveSummary({ summary }: CognitiveSummaryProps) {
  if (!summary) {
    return (
      <aside className="w-[380px] bg-[#fcfcfc] border-l border-[#e5e5e5] p-6 hidden xl:block overflow-y-auto">
        <div className="flex flex-col items-center justify-center h-full">
          <span className="material-symbols-outlined text-4xl text-gray-400 mb-4">psychology</span>
          <p className="text-sm text-gray-500 text-center">
            Nenhum sumário cognitivo disponível para este paciente.
          </p>
        </div>
      </aside>
    );
  }

  return (
    <aside className="w-[380px] bg-[#fcfcfc] border-l border-[#e5e5e5] p-6 hidden xl:flex xl:flex-col overflow-y-auto max-h-screen">
      <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
        <h2 className="text-[11px] font-bold text-gray-500 uppercase tracking-[0.25em] mb-6 sticky top-0 bg-[#fcfcfc] py-2">
          Sumário Cognitivo
        </h2>

        <div className="space-y-8">
          <div className="space-y-4">
            <h3 className="text-sm font-medium flex items-center gap-2 text-gray-700">
              <span className="material-symbols-outlined text-lg">psychology</span>
              Evolução do Raciocínio
            </h3>
            <div className="space-y-5 pl-1">
              <div className="relative pl-4">
                <div className="absolute left-0 top-1 bottom-1 w-px bg-gray-300 rounded-full" />
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">
                  Foco Principal
                </p>
                <p className="text-sm leading-relaxed font-light text-gray-600">
                  {summary.primaryFocus}
                </p>
              </div>
              <div className="relative pl-4 opacity-70">
                <div className="absolute left-0 top-1 bottom-1 w-px bg-gray-200 rounded-full" />
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">
                  Fase Resolvida
                </p>
                <p className="text-sm leading-relaxed font-light text-gray-500">
                  {summary.resolvedPhase}
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-medium flex items-center gap-2 text-gray-700">
              <span className="material-symbols-outlined text-lg">block</span>
              Descartados
            </h3>
            <div className="flex flex-wrap gap-2">
              {summary.ruledOut.map((item, idx) => (
                <span
                  key={idx}
                  className="px-3 py-1.5 rounded-full bg-gray-50 text-[11px] text-gray-500 border border-gray-200"
                >
                  {item}
                </span>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-gray-100">
            <div className="flex gap-4">
              <span className="material-symbols-outlined text-gray-600 text-2xl font-light">
                tips_and_updates
              </span>
              <div className="space-y-2">
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                  Insight Longitudinal
                </p>
                <p className="text-[13px] text-gray-600 leading-relaxed font-light">
                  {summary.longitudinalInsight}
                  {summary.correlationPercentage && (
                    <span className="font-medium"> {summary.correlationPercentage}%</span>
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>

        <button className="mt-8 w-full py-3 border border-gray-200 rounded-xl text-[10px] font-bold uppercase tracking-widest text-gray-600 hover:bg-gray-50 transition-colors sticky bottom-0 bg-[#fcfcfc]">
          Exportar Relatório
        </button>
      </div>
    </aside>
  );
}