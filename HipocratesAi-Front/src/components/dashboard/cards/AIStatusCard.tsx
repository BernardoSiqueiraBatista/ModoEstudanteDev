import React from 'react';

export default function AIStatusCard() {
  return (
    <div className="p-5 rounded-xl bg-blue-900/10 dark:bg-ai-active-core text-white shadow-lg relative overflow-hidden border border-blue-200/30 dark:border-electric-cyan/30">
      <div className="absolute top-0 right-0 p-4">
        <span className="text-[7px] font-bold text-white/30 dark:text-white/20 tracking-widest uppercase">
          Encrypted
        </span>
      </div>
      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-3">
          <div className="size-1.5 bg-emerald-400 rounded-full animate-pulse"></div>
          <span className="text-[9px] font-bold text-gray-500 dark:text-slate-500 uppercase tracking-[0.2em]">
            AI Active Core
          </span>
        </div>
        <h4 className="text-sm font-semibold mb-2 text-gray-800 dark:text-white">
          Monitoramento de Risco
        </h4>
        <p className="text-gray-500 dark:text-slate-400 text-[10px] font-light leading-relaxed mb-4">
          Analisando 1.2k pontos de dados para predição de eventos cardiovasculares.
        </p>
        <div className="w-full bg-gray-200 dark:bg-white/10 h-1 rounded-full overflow-hidden">
          <div className="bg-emerald-500 h-full w-[72%] rounded-full"></div>
        </div>
      </div>
    </div>
  );
}
