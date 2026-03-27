import React from 'react';

interface InsightCardProps {
  description: string;
  onViewMore?: () => void;
}

export default function InsightCard({ description, onViewMore }: InsightCardProps) {
  return (
    <div className="insight-panel p-10 flex flex-col bg-white/95 dark:bg-insight-panel backdrop-blur-xl rounded-[2.5rem] border border-white dark:border-white/10 shadow-sm">
      <div className="flex items-center gap-2 mb-8">
        <span className="text-[10px] font-bold text-[var(--medical-navy)] dark:text-slate-400 uppercase tracking-[0.2em]">
          Weekly Insights
        </span>
      </div>
      <p className="text-slate-600 dark:text-slate-400 text-[15px] leading-relaxed font-light mb-12">
        {description}
      </p>
      <div className="mt-auto">
        <button
          onClick={onViewMore}
          className="w-full py-4 border border-slate-100 dark:border-white/10 bg-slate-50/50 dark:bg-white/5 hover:bg-white dark:hover:bg-white/10 hover:border-slate-200 dark:hover:border-white/20 transition-all duration-300 rounded-2xl text-[10px] font-bold text-[var(--medical-navy)] dark:text-slate-300 tracking-[0.15em] uppercase shadow-sm hover:shadow-md hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
        >
          Abrir Relatório Completo
        </button>
      </div>
    </div>
  );
}