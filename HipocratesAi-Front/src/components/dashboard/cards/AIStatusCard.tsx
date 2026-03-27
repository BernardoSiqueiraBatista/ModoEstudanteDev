import React from 'react';

export default function AIStatusCard() {
  return (
    <div className="p-8 rounded-[2.5rem] bg-[var(--medical-navy)] dark:bg-ai-active-core text-white shadow-2xl relative overflow-hidden border border-white/10 dark:border-electric-cyan/30">
      <div className="absolute top-0 right-0 p-8">
        <span className="text-[8px] font-bold text-white/30 dark:text-white/20 tracking-widest uppercase">
          Encrypted
        </span>
      </div>
      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-6">
          <div className="size-2 bg-[var(--electric-cyan)] rounded-full animate-pulse shadow-[0_0_8px_rgba(0,209,255,0.5)]"></div>
          <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">
            AI Active Core
          </span>
        </div>
        <h4 className="text-base font-semibold mb-4">Monitoramento de Risco</h4>
        <p className="text-white/50 dark:text-slate-400 text-[11px] font-light leading-relaxed mb-8">
          Analisando 1.2k pontos de dados para predição de eventos cardiovasculares.
        </p>
        <div className="w-full bg-white/10 dark:bg-white/5 h-1 rounded-full overflow-hidden">
          <div className="bg-[var(--electric-cyan)] h-full w-[72%] rounded-full shadow-[0_0_10px_rgba(0,209,255,0.5)]"></div>
        </div>
      </div>
    </div>
  );
}
