import React from 'react';

interface InsightCardProps {
  description: string;
  onViewMore?: () => void;
}

export default function InsightCard({ description, onViewMore }: InsightCardProps) {
  return (
    <div className="bg-white/95 dark:bg-insight-panel backdrop-blur-xl rounded-xl border border-gray-100 dark:border-white/10 shadow-sm p-5 flex flex-col">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-[9px] font-bold text-gray-500 uppercase tracking-[0.2em]">
          Weekly Insights
        </span>
      </div>
      <p className="text-gray-600 dark:text-slate-400 text-xs leading-relaxed font-light mb-4">
        {description}
      </p>
      <button
        onClick={onViewMore}
        className="w-full py-2 border border-gray-200 dark:border-white/10 bg-gray-50/50 dark:bg-white/5 hover:bg-white dark:hover:bg-white/10 rounded-lg text-[9px] font-bold text-gray-700 dark:text-slate-300 uppercase tracking-wider transition-all"
      >
        Abrir Relatório
      </button>
    </div>
  );
}
